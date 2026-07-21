// Client-side mirror of the server's money math (orders.js computeTotals) for
// live display in the cart. The main process stays authoritative on save.
const round2 = (n) => Math.round(n * 100) / 100;

export function lineBase(line) {
  return Number(line.qty) * Number(line.unit_price);
}

export function lineAddonsTotal(line) {
  return (line.addons || []).reduce((s, a) => s + Number(a.qty || 1) * Number(a.price), 0);
}

export function lineTotal(line) {
  return lineBase(line) + lineAddonsTotal(line);
}

function roundOff(value, rule) {
  switch (rule) {
    case 'nearest_5':
      return Math.round(value / 5) * 5;
    case 'nearest_10':
      return Math.round(value / 10) * 10;
    case 'nearest_1':
      return Math.round(value);
    default:
      return round2(value);
  }
}

export function computeTotals(cart, settings, { orderType, discountPercent }) {
  const taxPct = Number(settings['billing.tax_percent']) || 0;
  const service = Number(settings['billing.service_charge']) || 0;
  const delivery = Number(settings['billing.delivery_charge']) || 0;
  const rule = settings['billing.round_off'] || 'nearest_1';

  const subtotal = round2(cart.reduce((s, l) => s + lineTotal(l), 0));
  const pct = Math.max(0, Math.min(100, Number(discountPercent) || 0));
  const discount = round2(subtotal * (pct / 100));
  const taxable = subtotal - discount;
  const tax = round2(taxable * (taxPct / 100));
  const svc = orderType === 'dine_in' ? service : 0;
  const del = orderType === 'delivery' ? delivery : 0;
  const grand = roundOff(taxable + tax + svc + del, rule);

  return { subtotal, discount, tax, service: svc, delivery: del, grand };
}

// "Chicken · Single" when grouped, else just the variant name.
export function variantLabel(v) {
  if (!v) return null;
  return v.group ? `${v.group} · ${v.name}` : v.name;
}

// Per-tile price label honouring sold_by and variants.
export function tilePrice(item, currency) {
  const suffix = item.sold_by === 'weight' ? ' / kg' : item.sold_by === 'piece' ? ' / pc' : '';
  if (item.has_variants) {
    const min =
      item.variants && item.variants.length
        ? Math.min(...item.variants.map((v) => Number(v.price)))
        : null;
    return min != null ? `from ${currency} ${min}${suffix}` : '—';
  }
  return `${currency} ${item.price ?? 0}${suffix}`;
}
