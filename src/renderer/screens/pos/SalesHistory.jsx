import { useCallback, useEffect, useState } from 'react';
import { Search, Printer, Ban, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Segmented from '../../components/ui/Segmented';
import { lineBase } from './posTotals';
import './pos.css';

const STATUS = [
  { value: 'all', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Held' },
  { value: 'void', label: 'Void' },
];

const TYPE_LABEL = { dine_in: 'Dine-in', takeaway: 'Takeaway', delivery: 'Delivery' };

export default function SalesHistory() {
  const { can } = useAuth();
  const { settings } = useSettings();
  const toast = useToast();
  const currency = settings['business.currency'] || 'Rs';

  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('all');
  const [detail, setDetail] = useState(null);
  const [voidFor, setVoidFor] = useState(null);
  const [voidReason, setVoidReason] = useState('');

  const load = useCallback(async () => {
    const res = await window.vizo.pos.listOrders({ q, from, to, status });
    if (res.ok) setRows(res.orders);
  }, [q, from, to, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function openDetail(id) {
    const res = await window.vizo.pos.getOrder(id);
    if (res.ok) setDetail(res.order);
    else toast(res.error, 'danger');
  }

  async function confirmVoid() {
    const res = await window.vizo.pos.voidOrder(voidFor.id, voidReason);
    if (!res.ok) {
      toast(res.error, 'danger');
      return;
    }
    toast(`Order ${voidFor.order_no} voided.`, 'success');
    setVoidFor(null);
    setVoidReason('');
    load();
  }

  const money = (n) => `${currency} ${Number(n).toLocaleString()}`;
  const when = (s) => {
    if (!s) return '—';
    const d = new Date(String(s).replace(' ', 'T'));
    return Number.isNaN(d.getTime())
      ? '—'
      : d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="history">
      <h1>Sales History</h1>

      <div className="history__filters card">
        <div className="manage__search history__search">
          <Search size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order no. or token" />
        </div>
        <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <Segmented size="sm" options={STATUS} value={status} onChange={setStatus} />
      </div>

      <div className="card history__table">
        {rows.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--sp-7)' }}>
            <p>No orders match.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Token</th>
                <th>Type</th>
                <th>Cashier</th>
                <th>Time</th>
                <th className="ta-r">Total</th>
                <th>Status</th>
                <th className="ta-r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td>{o.order_no}</td>
                  <td className="num">{o.token_no ?? '—'}</td>
                  <td>{TYPE_LABEL[o.order_type]}</td>
                  <td>{o.cashier_name}</td>
                  <td>{when(o.created_at)}</td>
                  <td className="ta-r num">{money(o.grand_total)}</td>
                  <td>
                    <span
                      className={`pill pill--${
                        o.status === 'paid' ? 'success' : o.status === 'void' ? 'danger' : 'warning'
                      }`}
                    >
                      {o.status === 'pending' ? 'Held' : o.status}
                    </span>
                  </td>
                  <td className="ta-r">
                    <div className="history__row-actions">
                      <button className="icon-btn" title="View" onClick={() => openDetail(o.id)}>
                        <Eye size={16} />
                      </button>
                      {can('reprint_bill') && (
                        <button
                          className="icon-btn"
                          title="Reprint"
                          onClick={() => toast('Printing arrives in Phase 4.', 'warning')}
                        >
                          <Printer size={16} />
                        </button>
                      )}
                      {can('void_order') && o.status !== 'void' && (
                        <button
                          className="icon-btn icon-btn--danger"
                          title="Void"
                          onClick={() => setVoidFor(o)}
                        >
                          <Ban size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* order detail */}
      <Modal open={!!detail} title={detail?.order_no} maxWidth={520} onClose={() => setDetail(null)}>
        {detail && (
          <div className="order-detail">
            <div className="order-detail__meta">
              <span>{TYPE_LABEL[detail.order_type]}</span>
              {detail.token_no != null && <span className="cart__token">TOKEN {detail.token_no}</span>}
            </div>
            <div className="order-detail__lines">
              {detail.items.map((it) => (
                <div key={it.id} className="order-detail__line">
                  <div>
                    <div className="cart-line__name">
                      {it.item_name}
                      {it.variant_name && <span className="cart-line__variant"> ({it.variant_name})</span>}
                    </div>
                    <div className="cart-line__sub num">
                      {it.sold_by === 'weight' ? `${it.qty} kg` : it.sold_by === 'piece' ? `${it.qty} pcs` : it.qty} ×{' '}
                      {money(it.unit_price)}
                    </div>
                    {it.addons.map((a) => (
                      <div className="cart-line__addon" key={a.id}>
                        + {a.addon_name} <span className="num">{money(a.price)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="num">{money(lineBase(it))}</div>
                </div>
              ))}
            </div>
            <div className="cart__divider" />
            <div className="cart__total-row">
              <span>Subtotal</span>
              <span className="num">{money(detail.subtotal)}</span>
            </div>
            {detail.discount_amount > 0 && (
              <div className="cart__total-row">
                <span>Discount ({detail.discount_percent}%)</span>
                <span className="num">− {money(detail.discount_amount)}</span>
              </div>
            )}
            {detail.tax_amount > 0 && (
              <div className="cart__total-row">
                <span>Tax</span>
                <span className="num">{money(detail.tax_amount)}</span>
              </div>
            )}
            <div className="cart__grand">
              <span>TOTAL</span>
              <span className="num">{money(detail.grand_total)}</span>
            </div>
            {detail.status === 'void' && (
              <p className="order-detail__void">Voided — {detail.void_reason}</p>
            )}
          </div>
        )}
      </Modal>

      {/* void reason */}
      <Modal
        open={!!voidFor}
        title="Void Order"
        maxWidth={440}
        onClose={() => setVoidFor(null)}
        actions={
          <>
            <Button onClick={() => setVoidFor(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmVoid} disabled={!voidReason.trim()}>
              Void Order
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--sp-3)' }}>
          Voiding {voidFor?.order_no} keeps it on record as cancelled. Give a reason.
        </p>
        <Input
          label="Reason"
          value={voidReason}
          autoFocus
          onChange={(e) => setVoidReason(e.target.value)}
          placeholder="e.g. Customer left, wrong order"
        />
      </Modal>
    </div>
  );
}
