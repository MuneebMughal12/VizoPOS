import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

const QUICK = [1, 2, 4, 6, 12];

// Per-piece items: quick counts plus a custom input. Live line price shown.
export default function PiecePickerModal({ name, unitPrice, currency, onConfirm, onClose }) {
  const [custom, setCustom] = useState('');

  const confirm = (n) => {
    const pcs = Number(n);
    if (!pcs || pcs <= 0) return;
    onConfirm(pcs);
  };

  const customPrice = custom ? Number(custom) * unitPrice : 0;

  return (
    <Modal
      open
      title={`${name} — pieces`}
      maxWidth={460}
      onClose={onClose}
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => confirm(custom)} disabled={!custom || Number(custom) <= 0}>
            Add {custom ? `${custom} pcs · ${currency} ${customPrice}` : ''}
          </Button>
        </>
      }
    >
      <p className="settings__hint">{currency} {unitPrice} / pc</p>
      <div className="pick-quick">
        {QUICK.map((n) => (
          <button key={n} className="pick-quick__btn" onClick={() => confirm(n)}>
            <span className="pick-quick__main">{n} pcs</span>
            <span className="pick-quick__sub num">
              {currency} {n * unitPrice}
            </span>
          </button>
        ))}
      </div>
      <div className="pick-custom">
        <label className="label">Custom quantity</label>
        <input
          className="input"
          type="number"
          min="1"
          autoFocus
          value={custom}
          placeholder="e.g. 20"
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && confirm(custom)}
        />
      </div>
    </Modal>
  );
}
