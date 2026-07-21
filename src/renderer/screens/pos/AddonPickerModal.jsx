import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

// Offered after an item is added (when it has mapped add-ons). Optional —
// the cashier can skip. Each add-on toggles on/off (qty 1).
export default function AddonPickerModal({ item, currency, onConfirm, onClose }) {
  const [selected, setSelected] = useState({});

  const toggle = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  function confirm() {
    const addons = item.addons
      .filter((a) => selected[a.id])
      .map((a) => ({ addon_id: a.id, addon_name: a.name, qty: 1, price: a.price }));
    onConfirm(addons);
  }

  const count = Object.values(selected).filter(Boolean).length;

  return (
    <Modal
      open
      title={`Add-ons for ${item.name}`}
      maxWidth={480}
      onClose={onClose}
      actions={
        <>
          <Button onClick={() => onConfirm([])}>Skip</Button>
          <Button variant="primary" onClick={confirm}>
            Add{count ? ` (${count})` : ''}
          </Button>
        </>
      }
    >
      <div className="addon-list">
        {item.addons.map((a) => (
          <button
            key={a.id}
            className={`addon-row${selected[a.id] ? ' is-on' : ''}`}
            onClick={() => toggle(a.id)}
          >
            <span className="addon-row__check" />
            <span className="addon-row__name">{a.name}</span>
            <span className="addon-row__price num">
              +{currency} {a.price}
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
