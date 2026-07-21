import { LayoutGrid } from 'lucide-react';
import DishImage from '../../components/DishImage';

// Rounded pill chips with a small circular dish thumbnail inside. 'All' first,
// active pill filled gold.
export default function CategoryPills({ categories, items, active, onSelect }) {
  // A representative thumbnail per category = first item in it with an image.
  const thumbFor = (catId) => {
    const it = items.find((i) => i.category_id === catId && i.image);
    return it ? it.image : null;
  };

  return (
    <div className="cat-pills">
      <button
        className={`cat-pill${active === null ? ' is-active' : ''}`}
        onClick={() => onSelect(null)}
      >
        <span className="cat-pill__thumb cat-pill__thumb--all">
          <LayoutGrid size={14} />
        </span>
        All
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          className={`cat-pill${active === c.id ? ' is-active' : ''}`}
          onClick={() => onSelect(c.id)}
        >
          <span className="cat-pill__thumb">
            <DishImage imgRef={thumbFor(c.id)} className="cat-pill__img" />
          </span>
          {c.name}
        </button>
      ))}
    </div>
  );
}
