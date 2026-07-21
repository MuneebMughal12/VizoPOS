import { Trash2, Plus, RotateCcw } from 'lucide-react';
import Button from '../../components/ui/Button';

// The default quick-pick weight buttons a new weight item starts with.
export const DEFAULT_QUICK_WEIGHTS = [
  { label: 'Pao', kg: '0.25' },
  { label: 'Half', kg: '0.5' },
  { label: '750g', kg: '0.75' },
  { label: '1 kg', kg: '1' },
  { label: '1.5 kg', kg: '1.5' },
  { label: '2 kg', kg: '2' },
];

// Rows of { label, kg } — the POS weight picker shows these plus a custom
// input, so any weight can still be typed there.
export default function QuickWeightsEditor({ weights, onChange }) {
  function update(idx, key, value) {
    onChange(weights.map((w, i) => (i === idx ? { ...w, [key]: value } : w)));
  }
  function remove(idx) {
    onChange(weights.filter((_, i) => i !== idx));
  }
  function add() {
    onChange([...weights, { label: '', kg: '' }]);
  }

  return (
    <div className="qweights">
      <div className="variants__head">
        <div>
          <span className="label">Quick Weight Buttons</span>
          <p className="settings__hint">
            Shown on the POS. The cashier can still type any custom weight (e.g. 15 kg).
          </p>
        </div>
        <Button onClick={() => onChange(DEFAULT_QUICK_WEIGHTS.map((w) => ({ ...w })))}>
          <RotateCcw size={15} /> Defaults
        </Button>
      </div>

      {weights.length === 0 && (
        <p className="settings__hint">No quick buttons — the POS will still allow a custom weight.</p>
      )}

      {weights.map((w, idx) => (
        <div className="qweights__row" key={idx}>
          <input
            className="input qweights__label"
            value={w.label}
            placeholder="Label (e.g. Half)"
            onChange={(e) => update(idx, 'label', e.target.value)}
          />
          <input
            className="input qweights__kg num"
            type="number"
            min="0"
            step="0.05"
            value={w.kg}
            placeholder="kg"
            onChange={(e) => update(idx, 'kg', e.target.value)}
          />
          <span className="qweights__unit">kg</span>
          <button
            type="button"
            className="variants__remove"
            onClick={() => remove(idx)}
            title="Remove"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}

      <div>
        <Button onClick={add}>
          <Plus size={16} /> Add Button
        </Button>
      </div>
    </div>
  );
}
