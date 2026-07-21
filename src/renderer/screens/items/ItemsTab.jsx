import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, UtensilsCrossed, Search } from 'lucide-react';
import Button from '../../components/ui/Button';
import DishImage from '../../components/DishImage';
import ItemForm from './ItemForm';
import { useSettings } from '../../context/SettingsContext';

export default function ItemsTab() {
  const { settings } = useSettings();
  const currency = settings['business.currency'] || 'Rs';
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [addons, setAddons] = useState([]);
  const [selectedId, setSelectedId] = useState(null); // null = new item
  const [query, setQuery] = useState('');

  const reload = useCallback(async () => {
    const [it, cat, ad] = await Promise.all([
      window.vizo.menu.listItems(),
      window.vizo.menu.listCategories(),
      window.vizo.menu.listAddons(),
    ]);
    if (it.ok) setItems(it.items);
    if (cat.ok) setCategories(cat.categories);
    if (ad.ok) setAddons(ad.addons);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.category_name || '').toLowerCase().includes(q)
    );
  }, [items, query]);

  function priceLabel(i) {
    if (i.has_variants) {
      return i.min_variant_price != null ? `from ${currency} ${i.min_variant_price}` : '—';
    }
    return `${currency} ${i.price ?? 0}`;
  }

  return (
    <div className="manage">
      <div className="manage__list card">
        <div className="manage__list-head">
          <div className="manage__search">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items…"
            />
          </div>
          <Button onClick={() => setSelectedId(null)}>
            <Plus size={16} /> New
          </Button>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <UtensilsCrossed size={36} />
            <p>
              {items.length === 0
                ? 'No items yet — add your first dish.'
                : 'Nothing matches your search.'}
            </p>
          </div>
        ) : (
          <div className="manage__rows manage__rows--items">
            {filtered.map((i) => (
              <button
                key={i.id}
                className={`manage__row${selectedId === i.id ? ' is-active' : ''}`}
                onClick={() => setSelectedId(i.id)}
              >
                <DishImage imgRef={i.image} className="manage__thumb" />
                <span className="manage__row-text">
                  <span className="manage__row-name">{i.name}</span>
                  <span className="manage__row-sub">{i.category_name || 'No category'}</span>
                </span>
                <span className="manage__row-meta num">{priceLabel(i)}</span>
                {!i.is_active && <span className="pill pill--danger">off</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <ItemForm
        key={selectedId ?? 'new'}
        itemId={selectedId}
        categories={categories}
        addons={addons}
        currency={currency}
        onChanged={(newId) => {
          reload();
          if (newId !== undefined) setSelectedId(newId);
        }}
      />
    </div>
  );
}
