import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ItemsTab from './ItemsTab';
import CategoriesTab from './CategoriesTab';
import AddonsTab from './AddonsTab';
import './items.css';

const TABS = [
  { id: 'items', label: 'Items' },
  { id: 'categories', label: 'Categories' },
  { id: 'addons', label: 'Add-ons' },
];

export default function ItemsScreen() {
  const { can } = useAuth();
  const [tab, setTab] = useState('items');

  if (!can('manage_items')) {
    return (
      <div className="items-screen">
        <h1>Items</h1>
        <div className="card">
          <div className="empty-state" style={{ padding: 'var(--sp-7)' }}>
            <Lock size={48} />
            <h3>No access</h3>
            <p>Managing the menu needs the "manage items" permission.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="items-screen">
      <div className="items-screen__head">
        <h1>Items</h1>
        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tabs__tab${tab === t.id ? ' is-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'items' && <ItemsTab />}
      {tab === 'categories' && <CategoriesTab />}
      {tab === 'addons' && <AddonsTab />}
    </div>
  );
}
