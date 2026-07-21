import { Trash2, Plus } from 'lucide-react';
import Button from '../../components/ui/Button';

// Repeating rows: variant name + price + remove. Order = display order.
export default function VariantsEditor({ variants, currency, onChange }) {
  function update(idx, key, value) {
    const next = variants.map((v, i) => (i === idx ? { ...v, [key]: value } : v));
    onChange(next);
  }
  function remove(idx) {
    onChange(variants.filter((_, i) => i !== idx));
  }
  function add() {
    onChange([...variants, { name: '', price: '' }]);
  }

  return (
    <div className="variants">
      <span className="label">Variants</span>
      {variants.length === 0 && (
        <p className="settings__hint">No variants yet — add Single, Double, Chicken, Beef…</p>
      )}
      {variants.map((v, idx) => (
        <div className="variants__row" key={v.id ?? `new-${idx}`}>
          <input
            className="input"
            value={v.name}
            placeholder="Name (e.g. Chicken)"
            onChange={(e) => update(idx, 'name', e.target.value)}
          />
          <input
            className="input variants__price num"
            type="number"
            min="0"
            value={v.price}
            placeholder={currency}
            onChange={(e) => update(idx, 'price', e.target.value)}
          />
          <button
            type="button"
            className="variants__remove"
            onClick={() => remove(idx)}
            title="Remove variant"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}
      <div>
        <Button onClick={add}>
          <Plus size={16} /> Add Variant
        </Button>
      </div>
    </div>
  );
}
