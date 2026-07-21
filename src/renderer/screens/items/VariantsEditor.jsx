import { useEffect, useRef } from 'react';
import { Trash2, Plus, Wand2 } from 'lucide-react';
import Button from '../../components/ui/Button';

// Repeating rows: optional group + name + price + remove. Order = display order.
// focusReq ({ index, token }) focuses that row's price input whenever the token
// changes (used right after the combination generator fills rows).
export default function VariantsEditor({ variants, currency, onChange, onGenerate, focusReq }) {
  const priceRefs = useRef([]);

  useEffect(() => {
    if (!focusReq) return;
    const el = priceRefs.current[focusReq.index];
    if (el) {
      el.focus();
      el.select?.();
    }
  }, [focusReq]);

  function update(idx, key, value) {
    onChange(variants.map((v, i) => (i === idx ? { ...v, [key]: value } : v)));
  }
  function remove(idx) {
    onChange(variants.filter((_, i) => i !== idx));
  }
  function add() {
    onChange([...variants, { group: '', name: '', price: '' }]);
  }

  // Tab / Enter between price fields so the owner can type prices in a row
  // without touching the mouse. Shift+Tab steps back.
  function onPriceKey(e, idx) {
    if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) {
      const next = priceRefs.current[idx + 1];
      if (next) {
        e.preventDefault();
        next.focus();
        next.select?.();
      } else if (e.key === 'Enter') {
        e.preventDefault();
      }
    } else if (e.key === 'Tab' && e.shiftKey) {
      const prev = priceRefs.current[idx - 1];
      if (prev) {
        e.preventDefault();
        prev.focus();
        prev.select?.();
      }
    }
  }

  return (
    <div className="variants">
      <div className="variants__head">
        <span className="label">Variants</span>
        <Button onClick={onGenerate}>
          <Wand2 size={16} /> Generate Combinations
        </Button>
      </div>

      {variants.length === 0 && (
        <p className="settings__hint">
          No variants yet — add rows manually, or use Generate Combinations for sizes × types.
        </p>
      )}

      {variants.map((v, idx) => (
        <div className="variants__row" key={v.id ?? `new-${idx}`}>
          <input
            className="input variants__group"
            value={v.group || ''}
            placeholder="Group (optional)"
            onChange={(e) => update(idx, 'group', e.target.value)}
          />
          <input
            className="input variants__name"
            value={v.name}
            placeholder="Name (e.g. Single)"
            onChange={(e) => update(idx, 'name', e.target.value)}
          />
          <input
            className="input variants__price num"
            type="number"
            min="0"
            value={v.price}
            placeholder={currency}
            ref={(el) => (priceRefs.current[idx] = el)}
            onKeyDown={(e) => onPriceKey(e, idx)}
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
