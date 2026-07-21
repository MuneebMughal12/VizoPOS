import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

// Per-kg items: the item's quick weight buttons plus a custom weight (any
// value, incl. large catering orders), with the calculated price shown live.
export default function WeightPickerModal({ name, rate, quickWeights, currency, onConfirm, onClose }) {
  const [custom, setCustom] = useState('');

  const fmt = (n) => (Math.round(n * 100) / 100).toLocaleString();
  const confirm = (kg) => {
    const w = Number(kg);
    if (!w || w <= 0) return;
    onConfirm(Math.round(w * 1000) / 1000);
  };
  const customPrice = custom ? Number(custom) * rate : 0;

  return (
    <Modal
      open
      title={`${name} — weight`}
      maxWidth={480}
      onClose={onClose}
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => confirm(custom)} disabled={!custom || Number(custom) <= 0}>
            Add {custom ? `${custom} kg · ${currency} ${fmt(customPrice)}` : ''}
          </Button>
        </>
      }
    >
      <p className="settings__hint">
        {currency} {rate} / kg
      </p>
      {quickWeights.length > 0 && (
        <div className="pick-quick">
          {quickWeights.map((w, i) => (
            <button key={i} className="pick-quick__btn" onClick={() => confirm(w.kg)}>
              <span className="pick-quick__main">{w.label}</span>
              <span className="pick-quick__sub num">
                {currency} {fmt(Number(w.kg) * rate)}
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="pick-custom">
        <label className="label">Custom weight (kg)</label>
        <input
          className="input"
          type="number"
          min="0"
          step="0.05"
          autoFocus
          value={custom}
          placeholder="e.g. 15"
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && confirm(custom)}
        />
        {custom > 0 && (
          <div className="pick-live num">
            {custom} kg × {currency} {rate} = <strong>{currency} {fmt(customPrice)}</strong>
          </div>
        )}
      </div>
    </Modal>
  );
}
