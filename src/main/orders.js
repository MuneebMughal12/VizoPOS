// Order transaction — the heart of the app (§4.4). Everything in saveOrder
// runs inside one better-sqlite3 transaction so a half-saved order can never
// exist. Stock deduction (Phase 5) and printing (Phase 4) are left as hooks.
const { getSetting } = require('./settings');
const { logAudit } = require('./audit');

// ---- numbering -------------------------------------------------------
// Order number from billing.order_no_format, e.g. 'KK-{0000}' -> 'KK-0451'.
// A running counter lives in app_meta so numbers never collide even if old
// orders are deleted.
function nextOrderNo(db) {
  const fmt = getSetting(db, 'billing.order_no_format') || 'ORD-{0000}';
  const row = db.prepare("SELECT value FROM app_meta WHERE key='order_seq'").get();
  const seq = (row ? parseInt(row.value, 10) : 0) + 1;
  db.prepare(
    "INSERT INTO app_meta (key, value) VALUES ('order_seq', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
  ).run(String(seq));
  const m = fmt.match(/\{(0+)\}/);
  if (m) return fmt.replace(m[0], String(seq).padStart(m[1].length, '0'));
  return `${fmt}${seq}`;
}

// The trading day for token reset. Restaurants trade past midnight, so the day
// rolls over at billing.token_reset_time (default 05:00), not midnight.
function businessDate(db, now = new Date()) {
  const resetDaily = getSetting(db, 'billing.token_reset_daily') !== '0';
  if (!resetDaily) return null;
  const reset = getSetting(db, 'billing.token_reset_time') || '05:00';
  const [rh, rm] = reset.split(':').map((n) => parseInt(n, 10));
  const d = new Date(now);
  if (d.getHours() < rh || (d.getHours() === rh && d.getMinutes() < rm)) {
    d.setDate(d.getDate() - 1);
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nextToken(db, bDate) {
  const row = db
    .prepare('SELECT MAX(token_no) AS mx FROM orders WHERE business_date IS ? AND token_no IS NOT NULL')
    .get(bDate);
  return (row && row.mx ? row.mx : 0) + 1;
}

// ---- money -----------------------------------------------------------
function roundOff(value, rule) {
  switch (rule) {
    case 'nearest_5':
      return Math.round(value / 5) * 5;
    case 'nearest_10':
      return Math.round(value / 10) * 10;
    case 'nearest_1':
      return Math.round(value);
    default:
      return Math.round(value * 100) / 100;
  }
}

// Recompute all money server-side from settings — never trust the renderer.
function computeTotals(db, lines, { orderType, discountPercent }) {
  const taxPct = Number(getSetting(db, 'billing.tax_percent')) || 0;
  const serviceCharge = Number(getSetting(db, 'billing.service_charge')) || 0;
  const deliveryCharge = Number(getSetting(db, 'billing.delivery_charge')) || 0;
  const roundRule = getSetting(db, 'billing.round_off') || 'nearest_1';

  let subtotal = 0;
  for (const l of lines) {
    const lineTotal = Number(l.qty) * Number(l.unit_price);
    let addonTotal = 0;
    for (const a of l.addons || []) addonTotal += Number(a.qty || 1) * Number(a.price);
    subtotal += lineTotal + addonTotal;
  }
  subtotal = Math.round(subtotal * 100) / 100;

  const pct = Math.max(0, Math.min(100, Number(discountPercent) || 0));
  const discountAmount = Math.round(subtotal * (pct / 100) * 100) / 100;
  const taxable = subtotal - discountAmount;
  const taxAmount = Math.round(taxable * (taxPct / 100) * 100) / 100;
  const service = orderType === 'dine_in' ? serviceCharge : 0;
  const delivery = orderType === 'delivery' ? deliveryCharge : 0;
  const grandRaw = taxable + taxAmount + service + delivery;
  const grandTotal = roundOff(grandRaw, roundRule);

  return {
    subtotal,
    discount_percent: pct,
    discount_amount: discountAmount,
    tax_amount: taxAmount,
    service_charge: service,
    delivery_charge: delivery,
    grand_total: grandTotal,
  };
}

// Placeholder for Phase 5. Sale movements + ingredient_cost land here; keeping
// the call site so the transaction shape is already correct.
function applyStockForSale(/* db, orderId, lines */) {
  return 0; // ingredient_cost — computed for real in Phase 5
}

// ---- save (§4.4) -----------------------------------------------------
// payload: { id?, order_type, table_no, customer_name, customer_phone,
//   discount_percent, note, status ('paid'|'pending'), lines: [{ item_id,
//   variant_id, item_name, variant_name, sold_by, qty, unit_price,
//   addons:[{ addon_id, addon_name, qty, price }] }] }
function saveOrder(db, user, payload) {
  const lines = payload.lines || [];
  if (lines.length === 0) throw new Error('Cannot save an empty order.');

  const orderType = ['dine_in', 'takeaway', 'delivery'].includes(payload.order_type)
    ? payload.order_type
    : 'dine_in';
  const status = payload.status === 'pending' ? 'pending' : 'paid';

  // Discount authorisation (§4.3): master switch on + permission, within limit.
  let discountPercent = Number(payload.discount_percent) || 0;
  if (discountPercent > 0) {
    const enabled = getSetting(db, 'billing.discount_enabled') === '1';
    const limit = Number(getSetting(db, 'billing.discount_limit_percent')) || 0;
    const isOwner = user.role === 'owner';
    const mayDiscount = isOwner || (enabled && user.permissions.includes('give_discount'));
    if (!enabled && !isOwner) discountPercent = 0;
    else if (!mayDiscount) discountPercent = 0;
    else if (!isOwner && discountPercent > limit) discountPercent = limit;
  }

  const totals = computeTotals(db, lines, { orderType, discountPercent });

  return db.transaction(() => {
    let orderId = payload.id || null;
    let orderNo;
    let tokenNo = null;
    let bDate = null;

    if (orderId) {
      const existing = db.prepare('SELECT * FROM orders WHERE id=?').get(orderId);
      if (!existing) throw new Error('Order not found.');
      if (existing.status === 'void') throw new Error('A voided order cannot be edited.');
      orderNo = existing.order_no;
      bDate = existing.business_date;
      tokenNo = existing.token_no;
      // clear old lines so we can re-insert the current cart
      db.prepare('DELETE FROM order_items WHERE order_id=?').run(orderId);
    } else {
      orderNo = nextOrderNo(db);
    }

    // Token: assigned when the order is finalised (paid), once, if enabled.
    if (status === 'paid' && !tokenNo && getSetting(db, 'billing.token_enabled') === '1') {
      bDate = businessDate(db);
      tokenNo = nextToken(db, bDate);
    }

    const orderFields = {
      order_no: orderNo,
      token_no: tokenNo,
      business_date: bDate,
      order_type: orderType,
      table_no: payload.table_no || null,
      customer_name: payload.customer_name || null,
      customer_phone: payload.customer_phone || null,
      ...totals,
      ingredient_cost: 0,
      status,
      created_by: user.id,
    };

    if (orderId) {
      db.prepare(
        `UPDATE orders SET token_no=@token_no, business_date=@business_date,
         order_type=@order_type, table_no=@table_no, customer_name=@customer_name,
         customer_phone=@customer_phone, subtotal=@subtotal, discount_percent=@discount_percent,
         discount_amount=@discount_amount, tax_amount=@tax_amount, service_charge=@service_charge,
         delivery_charge=@delivery_charge, grand_total=@grand_total, status=@status
         WHERE id=${orderId}`
      ).run(orderFields);
    } else {
      const info = db
        .prepare(
          `INSERT INTO orders (order_no, token_no, business_date, order_type, table_no,
           customer_name, customer_phone, subtotal, discount_percent, discount_amount,
           tax_amount, service_charge, delivery_charge, grand_total, ingredient_cost,
           status, created_by)
           VALUES (@order_no, @token_no, @business_date, @order_type, @table_no,
           @customer_name, @customer_phone, @subtotal, @discount_percent, @discount_amount,
           @tax_amount, @service_charge, @delivery_charge, @grand_total, @ingredient_cost,
           @status, @created_by)`
        )
        .run(orderFields);
      orderId = info.lastInsertRowid;
    }

    const insItem = db.prepare(
      `INSERT INTO order_items (order_id, item_id, variant_id, item_name, variant_name,
       sold_by, qty, unit_price, line_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insAddon = db.prepare(
      `INSERT INTO order_item_addons (order_item_id, addon_id, addon_name, qty, price)
       VALUES (?, ?, ?, ?, ?)`
    );
    for (const l of lines) {
      const lineTotal = Math.round(Number(l.qty) * Number(l.unit_price) * 100) / 100;
      const info = insItem.run(
        orderId,
        l.item_id || null,
        l.variant_id || null,
        l.item_name,
        l.variant_name || null,
        ['unit', 'piece', 'weight'].includes(l.sold_by) ? l.sold_by : 'unit',
        Number(l.qty),
        Number(l.unit_price),
        lineTotal
      );
      for (const a of l.addons || []) {
        insAddon.run(info.lastInsertRowid, a.addon_id || null, a.addon_name, Number(a.qty || 1), Number(a.price));
      }
    }

    // Phase 5 hook — sale stock movements + real ingredient_cost.
    applyStockForSale(db, orderId, lines);

    if (discountPercent > 0) {
      logAudit(db, user.id, 'discount_given', 'order', orderId, `Discount ${discountPercent}% on ${orderNo}`);
    }

    return getOrder(db, orderId);
  })();
}

// ---- read ------------------------------------------------------------
function getOrder(db, id) {
  const order = db
    .prepare(
      `SELECT o.*, u.full_name AS cashier_name FROM orders o
       LEFT JOIN users u ON u.id = o.created_by WHERE o.id=?`
    )
    .get(id);
  if (!order) throw new Error('Order not found.');
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id=? ORDER BY id').all(id);
  for (const it of order.items) {
    it.addons = db
      .prepare('SELECT * FROM order_item_addons WHERE order_item_id=? ORDER BY id')
      .all(it.id);
  }
  return order;
}

// filters: { from, to, q, status }  (q matches order_no or token_no)
function listOrders(db, filters = {}) {
  const where = [];
  const args = [];
  if (filters.from) {
    where.push('date(o.created_at) >= date(?)');
    args.push(filters.from);
  }
  if (filters.to) {
    where.push('date(o.created_at) <= date(?)');
    args.push(filters.to);
  }
  if (filters.status && filters.status !== 'all') {
    where.push('o.status = ?');
    args.push(filters.status);
  }
  if (filters.q) {
    where.push('(o.order_no LIKE ? OR CAST(o.token_no AS TEXT) = ?)');
    args.push(`%${filters.q}%`, String(filters.q).trim());
  }
  const sql = `SELECT o.id, o.order_no, o.token_no, o.order_type, o.table_no, o.customer_name,
      o.grand_total, o.status, o.created_at, u.full_name AS cashier_name,
      (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id=o.id) AS item_count
    FROM orders o LEFT JOIN users u ON u.id=o.created_by
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY o.created_at DESC, o.id DESC LIMIT 500`;
  return db.prepare(sql).all(...args);
}

function voidOrder(db, user, id, reason) {
  reason = String(reason || '').trim();
  if (!reason) throw new Error('A reason is required to void an order.');
  return db.transaction(() => {
    const order = db.prepare('SELECT * FROM orders WHERE id=?').get(id);
    if (!order) throw new Error('Order not found.');
    if (order.status === 'void') throw new Error('This order is already void.');
    db.prepare('UPDATE orders SET status=?, void_reason=?, void_by=? WHERE id=?').run(
      'void',
      reason,
      user.id,
      id
    );
    // Phase 5 hook — reverse this order's stock movements.
    logAudit(db, user.id, 'order_void', 'order', id, `Void ${order.order_no}: ${reason}`);
    return getOrder(db, id);
  })();
}

module.exports = { saveOrder, getOrder, listOrders, voidOrder, computeTotals, businessDate };
