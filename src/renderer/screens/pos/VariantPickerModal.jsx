import Modal from '../../components/ui/Modal';
import { variantLabel } from './posTotals';

// Tap a dish with variants → this popup lists them (grouped when a group
// label is set). Per-kg items show the rate as "Rs X / kg".
export default function VariantPickerModal({ item, currency, onPick, onClose }) {
  if (!item) return null;
  const perKg = item.sold_by === 'weight';

  // group variants: { groupName: [variants] }, '' bucket for ungrouped
  const groups = {};
  for (const v of item.variants) {
    const key = v.group || '';
    (groups[key] = groups[key] || []).push(v);
  }
  const groupKeys = Object.keys(groups);

  return (
    <Modal open title={item.name} maxWidth={520} onClose={onClose}>
      <div className="vpick">
        {groupKeys.map((g) => (
          <div key={g || 'plain'} className="vpick__group">
            {g && <div className="vpick__group-label label">{g}</div>}
            <div className="vpick__grid">
              {groups[g].map((v) => (
                <button key={v.id} className="vpick__tile" onClick={() => onPick(v)}>
                  <span className="vpick__name">{g ? v.name : variantLabel(v)}</span>
                  <span className="vpick__price num">
                    {currency} {v.price}
                    {perKg ? ' / kg' : ''}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
