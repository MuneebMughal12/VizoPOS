import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import Button from '../../components/ui/Button';
import { lineBase } from './posTotals';

function qtyDisplay(line) {
  if (line.sold_by === 'weight') return `${line.qty} kg`;
  if (line.sold_by === 'piece') return `${line.qty} pcs`;
  return `${line.qty}`;
}

export default function Cart({
  cart,
  currency,
  totals,
  discountPercent,
  onDiscountChange,
  canDiscount,
  discountLimit,
  tableNo,
  customerName,
  customerPhone,
  orderType,
  onField,
  savedOrder,
  onQty,
  onRemove,
  onHold,
  onSave,
  onClear,
  busy,
}) {
  const money = (n) => `${currency} ${Number(n).toLocaleString()}`;

  return (
    <aside className="cart">
      <div className="cart__head">
        <div className="cart__order-no">{savedOrder ? savedOrder.order_no : 'New Order'}</div>
        {savedOrder && savedOrder.token_no != null && (
          <div className="cart__token">TOKEN {savedOrder.token_no}</div>
        )}
      </div>

      <div className="cart__fields">
        {orderType === 'dine_in' && (
          <input
            className="input"
            placeholder="Table no."
            value={tableNo}
            onChange={(e) => onField('tableNo', e.target.value)}
          />
        )}
        {orderType !== 'dine_in' && (
          <>
            <input
              className="input"
              placeholder="Customer name"
              value={customerName}
              onChange={(e) => onField('customerName', e.target.value)}
            />
            <input
              className="input"
              placeholder="Phone"
              value={customerPhone}
              onChange={(e) => onField('customerPhone', e.target.value)}
            />
          </>
        )}
      </div>

      <div className="cart__lines">
        {cart.length === 0 ? (
          <div className="cart__empty">
            <ShoppingCart size={34} />
            <p>Tap a dish to start the order.</p>
          </div>
        ) : (
          cart.map((line) => (
            <div className="cart-line" key={line.uid}>
              <div className="cart-line__main">
                <div className="cart-line__text">
                  <div className="cart-line__name">
                    {line.item_name}
                    {line.variant_name && <span className="cart-line__variant"> ({line.variant_name})</span>}
                  </div>
                  <div className="cart-line__sub num">
                    {qtyDisplay(line)} × {money(line.unit_price)}
                  </div>
                  {line.addons.map((a, i) => (
                    <div className="cart-line__addon" key={i}>
                      + {a.addon_name} <span className="num">{money(a.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="cart-line__right">
                  <div className="cart-line__total num">{money(lineBase(line))}</div>
                  <button className="cart-line__del" onClick={() => onRemove(line.uid)} title="Remove">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="cart-line__stepper">
                <button onClick={() => onQty(line.uid, -1)}>
                  <Minus size={16} />
                </button>
                <span className="num">{qtyDisplay(line)}</span>
                <button onClick={() => onQty(line.uid, 1)}>
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="cart__totals">
        <div className="cart__total-row">
          <span>Subtotal</span>
          <span className="num">{money(totals.subtotal)}</span>
        </div>
        {canDiscount && (
          <div className="cart__total-row cart__discount">
            <span>
              Discount
              <input
                className="cart__discount-input num"
                type="number"
                min="0"
                max={discountLimit}
                value={discountPercent}
                onChange={(e) => onDiscountChange(e.target.value)}
              />
              %
            </span>
            <span className="num">− {money(totals.discount)}</span>
          </div>
        )}
        {totals.tax > 0 && (
          <div className="cart__total-row">
            <span>Tax</span>
            <span className="num">{money(totals.tax)}</span>
          </div>
        )}
        {totals.service > 0 && (
          <div className="cart__total-row">
            <span>Service</span>
            <span className="num">{money(totals.service)}</span>
          </div>
        )}
        {totals.delivery > 0 && (
          <div className="cart__total-row">
            <span>Delivery</span>
            <span className="num">{money(totals.delivery)}</span>
          </div>
        )}
        <div className="cart__divider" />
        <div className="cart__grand">
          <span>TOTAL</span>
          <span className="num">{money(totals.grand)}</span>
        </div>
      </div>

      <div className="cart__actions">
        <Button onClick={onHold} disabled={busy || cart.length === 0}>
          Hold
        </Button>
        <Button variant="primary" onClick={onSave} disabled={busy || cart.length === 0} fullWidth>
          {busy ? 'Saving…' : 'Save & Print'}
        </Button>
      </div>
      {cart.length > 0 && (
        <button className="cart__clear" onClick={onClear} disabled={busy}>
          Clear order
        </button>
      )}
    </aside>
  );
}
