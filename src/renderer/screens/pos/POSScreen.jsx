import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../components/ui/Toast';
import Segmented from '../../components/ui/Segmented';
import Numpad from './Numpad';
import CategoryPills from './CategoryPills';
import DishGrid from './DishGrid';
import Cart from './Cart';
import VariantPickerModal from './VariantPickerModal';
import PiecePickerModal from './PiecePickerModal';
import WeightPickerModal from './WeightPickerModal';
import AddonPickerModal from './AddonPickerModal';
import { computeTotals, variantLabel } from './posTotals';
import './pos.css';

const ORDER_TYPES = [
  { value: 'dine_in', label: 'Dine-in' },
  { value: 'takeaway', label: 'Takeaway' },
  { value: 'delivery', label: 'Delivery' },
];

let uidSeq = 1;

export default function POSScreen() {
  const { can, user } = useAuth();
  const { settings } = useSettings();
  const toast = useToast();
  const currency = settings['business.currency'] || 'Rs';

  const [menu, setMenu] = useState({ categories: [], items: [] });
  const [activeCat, setActiveCat] = useState(null);
  const [search, setSearch] = useState('');
  const [qty, setQty] = useState('');
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('dine_in');
  const [fields, setFields] = useState({ tableNo: '', customerName: '', customerPhone: '' });
  const [discountPercent, setDiscountPercent] = useState(0);
  const [pending, setPending] = useState(null); // add-flow state
  const [savedOrder, setSavedOrder] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadMenu = useCallback(async () => {
    const res = await window.vizo.pos.menu();
    if (res.ok) setMenu({ categories: res.categories, items: res.items });
  }, []);

  useEffect(() => {
    if (can('take_order')) loadMenu();
  }, [can, loadMenu]);

  const discountEnabled = settings['billing.discount_enabled'] === '1';
  const discountLimit = Number(settings['billing.discount_limit_percent']) || 0;
  const canDiscount = user?.role === 'owner' || (discountEnabled && can('give_discount'));

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return menu.items.filter((i) => {
      if (activeCat !== null && i.category_id !== activeCat) return false;
      if (q && !i.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [menu.items, activeCat, search]);

  const totals = useMemo(
    () => computeTotals(cart, settings, { orderType, discountPercent: canDiscount ? discountPercent : 0 }),
    [cart, settings, orderType, discountPercent, canDiscount]
  );

  // ---- add-item flow: dish → variant → qty(piece/weight) → add-ons → cart --
  function chooseDish(item) {
    const base = { item, variant_id: null, variant_name: null, unit_price: item.price, qty: null, addons: [] };
    if (item.has_variants) {
      setPending({ ...base, step: 'variant' });
    } else {
      toQuantity(base);
    }
  }

  function onVariantPicked(v) {
    toQuantity({ ...pending, variant_id: v.id, variant_name: variantLabel(v), unit_price: v.price });
  }

  function toQuantity(p) {
    if (p.item.sold_by === 'piece') return setPending({ ...p, step: 'piece' });
    if (p.item.sold_by === 'weight') return setPending({ ...p, step: 'weight' });
    toAddons({ ...p, qty: Number(qty) || 1 });
  }

  function onQtyPicked(q) {
    toAddons({ ...pending, qty: q });
  }

  function toAddons(p) {
    if (p.item.addons && p.item.addons.length) setPending({ ...p, step: 'addons' });
    else commitLine(p);
  }

  function commitLine(p) {
    setCart((c) => [
      ...c,
      {
        uid: uidSeq++,
        item_id: p.item.id,
        item_name: p.item.name,
        variant_id: p.variant_id,
        variant_name: p.variant_name,
        sold_by: p.item.sold_by,
        qty: p.qty,
        unit_price: p.unit_price,
        addons: p.addons,
      },
    ]);
    setPending(null);
    setQty('');
    if (savedOrder) setSavedOrder(null); // starting a fresh order after a completed one
  }

  // ---- cart line operations ----------------------------------------
  function changeQty(uid, dir) {
    setCart((c) =>
      c
        .map((l) => {
          if (l.uid !== uid) return l;
          const step = l.sold_by === 'weight' ? 0.25 : 1;
          const next = Math.round((Number(l.qty) + dir * step) * 1000) / 1000;
          return { ...l, qty: next };
        })
        .filter((l) => Number(l.qty) > 0)
    );
  }
  function removeLine(uid) {
    setCart((c) => c.filter((l) => l.uid !== uid));
  }
  function clearOrder() {
    setCart([]);
    setDiscountPercent(0);
    setFields({ tableNo: '', customerName: '', customerPhone: '' });
    setSavedOrder(null);
  }

  // ---- save / hold -------------------------------------------------
  function buildPayload() {
    return {
      order_type: orderType,
      table_no: fields.tableNo,
      customer_name: fields.customerName,
      customer_phone: fields.customerPhone,
      discount_percent: canDiscount ? Number(discountPercent) || 0 : 0,
      lines: cart.map((l) => ({
        item_id: l.item_id,
        variant_id: l.variant_id,
        item_name: l.item_name,
        variant_name: l.variant_name,
        sold_by: l.sold_by,
        qty: l.qty,
        unit_price: l.unit_price,
        addons: l.addons,
      })),
    };
  }

  async function doSave() {
    setBusy(true);
    const res = await window.vizo.pos.saveOrder(buildPayload());
    setBusy(false);
    if (!res.ok) {
      toast(res.error, 'danger');
      return;
    }
    // Printing hook (Phase 4) would fire here. For now, confirm + reset.
    toast(`Saved ${res.order.order_no}${res.order.token_no ? ` · Token ${res.order.token_no}` : ''}`, 'success');
    setCart([]);
    setDiscountPercent(0);
    setFields({ tableNo: '', customerName: '', customerPhone: '' });
    setSavedOrder(res.order);
  }

  async function doHold() {
    setBusy(true);
    const res = await window.vizo.pos.holdOrder(buildPayload());
    setBusy(false);
    if (!res.ok) {
      toast(res.error, 'danger');
      return;
    }
    toast(`Order held (${res.order.order_no})`, 'warning');
    clearOrder();
  }

  if (!can('take_order')) {
    return (
      <div className="pos-denied">
        <div className="card">
          <div className="empty-state" style={{ padding: 'var(--sp-7)' }}>
            <Lock size={48} />
            <h3>No access</h3>
            <p>Taking orders needs the "take order" permission.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pos">
      <div className="pos__left">
        <Numpad value={qty} onChange={setQty} />
      </div>

      <div className="pos__center">
        <div className="pos__topbar">
          <div className="pos__search">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes…"
            />
          </div>
          <Segmented options={ORDER_TYPES} value={orderType} onChange={setOrderType} />
        </div>

        <CategoryPills
          categories={menu.categories}
          items={menu.items}
          active={activeCat}
          onSelect={setActiveCat}
        />

        <div className="pos__grid-scroll">
          <DishGrid items={filteredItems} currency={currency} onSelect={chooseDish} />
        </div>
      </div>

      <Cart
        cart={cart}
        currency={currency}
        totals={totals}
        discountPercent={discountPercent}
        onDiscountChange={setDiscountPercent}
        canDiscount={canDiscount}
        discountLimit={discountLimit}
        tableNo={fields.tableNo}
        customerName={fields.customerName}
        customerPhone={fields.customerPhone}
        orderType={orderType}
        onField={(k, v) => setFields((f) => ({ ...f, [k]: v }))}
        savedOrder={savedOrder}
        onQty={changeQty}
        onRemove={removeLine}
        onHold={doHold}
        onSave={doSave}
        onClear={clearOrder}
        busy={busy}
      />

      {pending?.step === 'variant' && (
        <VariantPickerModal
          item={pending.item}
          currency={currency}
          onPick={onVariantPicked}
          onClose={() => setPending(null)}
        />
      )}
      {pending?.step === 'piece' && (
        <PiecePickerModal
          name={pending.item.name}
          unitPrice={pending.unit_price}
          currency={currency}
          onConfirm={onQtyPicked}
          onClose={() => setPending(null)}
        />
      )}
      {pending?.step === 'weight' && (
        <WeightPickerModal
          name={pending.item.name}
          rate={pending.unit_price}
          quickWeights={pending.item.quick_weights || []}
          currency={currency}
          onConfirm={onQtyPicked}
          onClose={() => setPending(null)}
        />
      )}
      {pending?.step === 'addons' && (
        <AddonPickerModal
          item={pending.item}
          currency={currency}
          onConfirm={(addons) => commitLine({ ...pending, addons })}
          onClose={() => setPending(null)}
        />
      )}
    </div>
  );
}
