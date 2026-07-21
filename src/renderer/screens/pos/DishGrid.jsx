import DishImage from '../../components/DishImage';
import { tilePrice } from './posTotals';

// The signature element — premium dish tiles: photo fills the top, a scrim
// fades into the name + gold price. A gold corner dot marks variant items.
function DishTile({ item, currency, onSelect }) {
  return (
    <button className="dish-tile" onClick={() => onSelect(item)}>
      <div className="dish-tile__photo">
        <DishImage imgRef={item.image} className="dish-tile__img" alt={item.name} />
        <div className="dish-tile__scrim" />
        {item.has_variants && <span className="dish-tile__dot" />}
      </div>
      <div className="dish-tile__meta">
        <span className="dish-tile__name">{item.name}</span>
        <span className="dish-tile__price num">{tilePrice(item, currency)}</span>
      </div>
    </button>
  );
}

export default function DishGrid({ items, currency, onSelect }) {
  if (items.length === 0) {
    return (
      <div className="dish-grid__empty">
        <p>No items here yet.</p>
      </div>
    );
  }
  return (
    <div className="dish-grid">
      {items.map((it) => (
        <DishTile key={it.id} item={it} currency={currency} onSelect={onSelect} />
      ))}
    </div>
  );
}
