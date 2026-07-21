// Menu management: categories, items, variants, add-on mapping.
// All functions take the db handle; callers (ipc.js) handle permissions.

// ---- categories ------------------------------------------------------
function listCategories(db) {
  return db.prepare('SELECT * FROM categories ORDER BY sort_order, name').all();
}

function saveCategory(db, { id, name, sort_order = 0, is_active = 1 }) {
  name = String(name || '').trim();
  if (!name) throw new Error('Category name is required.');
  if (id) {
    db.prepare('UPDATE categories SET name=?, sort_order=?, is_active=? WHERE id=?').run(
      name, Number(sort_order) || 0, is_active ? 1 : 0, id
    );
    return db.prepare('SELECT * FROM categories WHERE id=?').get(id);
  }
  const info = db
    .prepare('INSERT INTO categories (name, sort_order, is_active) VALUES (?, ?, ?)')
    .run(name, Number(sort_order) || 0, is_active ? 1 : 0);
  return db.prepare('SELECT * FROM categories WHERE id=?').get(info.lastInsertRowid);
}

// ---- add-ons ---------------------------------------------------------
function listAddons(db) {
  return db.prepare('SELECT * FROM addons ORDER BY name').all();
}

function saveAddon(db, { id, name, price, is_active = 1 }) {
  name = String(name || '').trim();
  const p = Number(price);
  if (!name) throw new Error('Add-on name is required.');
  if (Number.isNaN(p) || p < 0) throw new Error('Add-on price must be 0 or more.');
  if (id) {
    db.prepare('UPDATE addons SET name=?, price=?, is_active=? WHERE id=?').run(
      name, p, is_active ? 1 : 0, id
    );
    return db.prepare('SELECT * FROM addons WHERE id=?').get(id);
  }
  const info = db.prepare('INSERT INTO addons (name, price, is_active) VALUES (?, ?, ?)').run(
    name, p, is_active ? 1 : 0
  );
  return db.prepare('SELECT * FROM addons WHERE id=?').get(info.lastInsertRowid);
}

function deleteAddon(db, id) {
  const used = db
    .prepare('SELECT COUNT(*) AS n FROM order_item_addons WHERE addon_id=?')
    .get(id).n;
  if (used > 0) {
    throw new Error('This add-on appears on past orders — deactivate it instead of deleting.');
  }
  db.prepare('DELETE FROM addons WHERE id=?').run(id); // item_addons rows cascade
}

// ---- items -----------------------------------------------------------
function listItems(db) {
  return db
    .prepare(
      `SELECT i.*, c.name AS category_name,
        (SELECT COUNT(*) FROM item_variants v WHERE v.item_id=i.id AND v.is_active=1) AS variant_count,
        (SELECT MIN(v.price) FROM item_variants v WHERE v.item_id=i.id AND v.is_active=1) AS min_variant_price
       FROM items i LEFT JOIN categories c ON c.id = i.category_id
       ORDER BY i.sort_order, i.name`
    )
    .all();
}

function getItem(db, id) {
  const item = db.prepare('SELECT * FROM items WHERE id=?').get(id);
  if (!item) throw new Error('Item not found.');
  item.variants = db
    .prepare('SELECT * FROM item_variants WHERE item_id=? ORDER BY sort_order, id')
    .all(id)
    .map((v) => ({ ...v, group: v.variant_group ?? '' }));
  item.addon_ids = db
    .prepare('SELECT addon_id FROM item_addons WHERE item_id=?')
    .all(id)
    .map((r) => r.addon_id);
  return item;
}

// payload: { id?, name, category_id, image, price, has_variants,
//   variants: [{id?, name, price, sort_order?, is_active?}],
//   track_stock, stock_qty, low_stock_level, sort_order, is_active,
//   addon_ids: [] }
function saveItem(db, payload) {
  const name = String(payload.name || '').trim();
  if (!name) throw new Error('Item name is required.');
  const hasVariants = payload.has_variants ? 1 : 0;

  let price = null;
  let variants = [];
  if (hasVariants) {
    variants = (payload.variants || []).filter((v) => String(v.name || '').trim());
    if (variants.length === 0) {
      throw new Error('Add at least one variant, or turn off "Has Variants".');
    }
    for (const v of variants) {
      const p = Number(v.price);
      if (Number.isNaN(p) || p < 0) {
        throw new Error(`Variant "${v.name}" needs a price of 0 or more.`);
      }
    }
  } else {
    price = Number(payload.price);
    if (Number.isNaN(price) || price < 0) throw new Error('Price must be 0 or more.');
  }

  const fields = {
    category_id: payload.category_id || null,
    name,
    price,
    image: payload.image || null,
    has_variants: hasVariants,
    track_stock: payload.track_stock ? 1 : 0,
    stock_qty: Number(payload.stock_qty) || 0,
    low_stock_level: Number(payload.low_stock_level) || 0,
    sort_order: Number(payload.sort_order) || 0,
    is_active: payload.is_active === 0 || payload.is_active === false ? 0 : 1,
  };

  return db.transaction(() => {
    let itemId = payload.id;
    let priceChange = null;

    if (itemId) {
      const before = getItem(db, itemId);
      db.prepare(
        `UPDATE items SET category_id=@category_id, name=@name, price=@price, image=@image,
         has_variants=@has_variants, track_stock=@track_stock, stock_qty=@stock_qty,
         low_stock_level=@low_stock_level, sort_order=@sort_order, is_active=@is_active
         WHERE id=${itemId}`
      ).run(fields);
      if (String(before.price) !== String(price)) {
        priceChange = `${before.name}: ${before.price ?? 'variants'} -> ${price ?? 'variants'}`;
      }
    } else {
      const info = db
        .prepare(
          `INSERT INTO items (category_id, name, price, image, has_variants, track_stock,
           stock_qty, low_stock_level, sort_order, is_active)
           VALUES (@category_id, @name, @price, @image, @has_variants, @track_stock,
           @stock_qty, @low_stock_level, @sort_order, @is_active)`
        )
        .run(fields);
      itemId = info.lastInsertRowid;
    }

    // variants: update kept rows, delete removed, insert new
    const existingIds = db
      .prepare('SELECT id FROM item_variants WHERE item_id=?')
      .all(itemId)
      .map((r) => r.id);
    const keptIds = variants.filter((v) => v.id).map((v) => v.id);
    for (const gone of existingIds.filter((eid) => !keptIds.includes(eid))) {
      db.prepare('DELETE FROM item_variants WHERE id=?').run(gone);
    }
    variants.forEach((v, idx) => {
      const vname = String(v.name).trim();
      const vprice = Number(v.price);
      const vgroup = String(v.group || '').trim() || null;
      const vactive = v.is_active === 0 || v.is_active === false ? 0 : 1;
      if (v.id && existingIds.includes(v.id)) {
        const before = db.prepare('SELECT price, name FROM item_variants WHERE id=?').get(v.id);
        db.prepare(
          'UPDATE item_variants SET name=?, price=?, sort_order=?, is_active=?, variant_group=? WHERE id=?'
        ).run(vname, vprice, idx, vactive, vgroup, v.id);
        if (before && Number(before.price) !== vprice) {
          priceChange =
            (priceChange ? priceChange + '; ' : '') +
            `${name} (${vname}): ${before.price} -> ${vprice}`;
        }
      } else {
        db.prepare(
          'INSERT INTO item_variants (item_id, name, price, sort_order, is_active, variant_group) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(itemId, vname, vprice, idx, vactive, vgroup);
      }
    });

    // add-on mapping: replace
    db.prepare('DELETE FROM item_addons WHERE item_id=?').run(itemId);
    const insMap = db.prepare('INSERT INTO item_addons (item_id, addon_id) VALUES (?, ?)');
    for (const aid of [...new Set(payload.addon_ids || [])]) insMap.run(itemId, aid);

    return { item: getItem(db, itemId), priceChange };
  })();
}

function deleteItem(db, id) {
  const used = db.prepare('SELECT COUNT(*) AS n FROM order_items WHERE item_id=?').get(id).n;
  if (used > 0) {
    throw new Error('This item appears on past orders — deactivate it instead of deleting.');
  }
  const item = db.prepare('SELECT name FROM items WHERE id=?').get(id);
  db.prepare('DELETE FROM items WHERE id=?').run(id); // variants + item_addons cascade
  return item ? item.name : '';
}

module.exports = {
  listCategories,
  saveCategory,
  listAddons,
  saveAddon,
  deleteAddon,
  listItems,
  getItem,
  saveItem,
  deleteItem,
};
