import { Delete } from 'lucide-react';

// Quantity numpad — type a quantity, then tap a dish. Big touch keys.
const KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3'];

export default function Numpad({ value, onChange }) {
  function press(k) {
    const next = (value + k).replace(/^0+(?=\d)/, '').slice(0, 4);
    onChange(next);
  }
  return (
    <div className="numpad">
      <div className="numpad__display num">{value || '1'}</div>
      <div className="numpad__grid">
        {KEYS.map((k) => (
          <button key={k} className="numpad__key" onClick={() => press(k)}>
            {k}
          </button>
        ))}
        <button className="numpad__key" onClick={() => press('0')}>
          0
        </button>
        <button className="numpad__key numpad__key--back" onClick={() => onChange(value.slice(0, -1))}>
          <Delete size={20} />
        </button>
        <button className="numpad__key numpad__key--clr" onClick={() => onChange('')}>
          CLR
        </button>
      </div>
    </div>
  );
}
