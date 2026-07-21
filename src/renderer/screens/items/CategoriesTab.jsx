import { useEffect, useState } from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Toggle from '../../components/ui/Toggle';
import { useToast } from '../../components/ui/Toast';

const EMPTY = { id: null, name: '', sort_order: 0, is_active: 1 };

export default function CategoriesTab() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [draft, setDraft] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    window.vizo.menu.listCategories().then((res) => {
      if (res.ok) setCategories(res.categories);
    });
  }, []);

  function select(cat) {
    setDraft({ ...cat });
  }

  async function onSave() {
    setBusy(true);
    const res = await window.vizo.menu.saveCategory(draft);
    setBusy(false);
    if (!res.ok) {
      toast(res.error, 'danger');
      return;
    }
    setCategories(res.categories);
    setDraft({ ...res.category });
    toast('Category saved.', 'success');
  }

  return (
    <div className="manage">
      <div className="manage__list card">
        <div className="manage__list-head">
          <span className="label">Categories</span>
          <Button onClick={() => setDraft(EMPTY)}>
            <Plus size={16} /> New
          </Button>
        </div>
        {categories.length === 0 ? (
          <div className="empty-state">
            <FolderOpen size={36} />
            <p>No categories yet — add Rice, BBQ, Karahi, Cold Drinks…</p>
          </div>
        ) : (
          <div className="manage__rows">
            {categories.map((c) => (
              <button
                key={c.id}
                className={`manage__row${draft.id === c.id ? ' is-active' : ''}`}
                onClick={() => select(c)}
              >
                <span className="manage__row-name">{c.name}</span>
                {!c.is_active && <span className="pill pill--danger">off</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="manage__detail card">
        <h3>{draft.id ? 'Edit Category' : 'New Category'}</h3>
        <Input
          label="Name"
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          placeholder="e.g. Rice"
        />
        <Input
          label="Sort Order"
          type="number"
          value={draft.sort_order}
          onChange={(e) => setDraft((d) => ({ ...d, sort_order: e.target.value }))}
        />
        <Toggle
          label="Active"
          hint="Inactive categories are hidden on the POS screen."
          checked={!!draft.is_active}
          onChange={(on) => setDraft((d) => ({ ...d, is_active: on ? 1 : 0 }))}
        />
        <div className="manage__actions">
          <Button variant="primary" onClick={onSave} disabled={busy || !draft.name.trim()}>
            {busy ? 'Saving…' : 'Save Category'}
          </Button>
        </div>
      </div>
    </div>
  );
}
