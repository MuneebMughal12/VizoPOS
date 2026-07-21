import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Toggle from '../../components/ui/Toggle';
import Segmented from '../../components/ui/Segmented';
import { useToast } from '../../components/ui/Toast';

const EMPTY = { id: null, name: '', sort_order: 0, is_active: 1 };

const FILTERS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'all', label: 'All' },
];

export default function CategoriesTab() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [draft, setDraft] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('active');
  const nameRef = useRef(null);

  useEffect(() => {
    window.vizo.menu.listCategories().then((res) => {
      if (res.ok) setCategories(res.categories);
    });
  }, []);

  const shown = useMemo(() => {
    if (filter === 'active') return categories.filter((c) => c.is_active);
    if (filter === 'inactive') return categories.filter((c) => !c.is_active);
    return categories;
  }, [categories, filter]);

  function startNew() {
    setDraft(EMPTY);
    setTimeout(() => nameRef.current?.focus(), 0);
  }

  async function onSave() {
    const wasNew = !draft.id;
    setBusy(true);
    const res = await window.vizo.menu.saveCategory(draft);
    setBusy(false);
    if (!res.ok) {
      toast(res.error, 'danger');
      return;
    }
    setCategories(res.categories);
    toast('Category saved.', 'success');
    if (wasNew) {
      // New record → clear the form and return focus so the owner can keep
      // adding. An edit stays open on the saved values.
      setDraft(EMPTY);
      setTimeout(() => nameRef.current?.focus(), 0);
    } else {
      setDraft({ ...res.category });
    }
  }

  return (
    <div className="manage">
      <div className="manage__list card">
        <div className="manage__list-head manage__list-head--stack">
          <div className="manage__list-top">
            <span className="label">Categories</span>
            <Button onClick={startNew}>
              <Plus size={16} /> New
            </Button>
          </div>
          <Segmented size="sm" options={FILTERS} value={filter} onChange={setFilter} />
        </div>
        {shown.length === 0 ? (
          <div className="empty-state">
            <FolderOpen size={36} />
            <p>
              {categories.length === 0
                ? 'No categories yet — add Rice, BBQ, Karahi, Cold Drinks…'
                : `No ${filter} categories.`}
            </p>
          </div>
        ) : (
          <div className="manage__rows">
            {shown.map((c) => (
              <button
                key={c.id}
                className={`manage__row${draft.id === c.id ? ' is-active' : ''}${
                  c.is_active ? '' : ' manage__row--off'
                }`}
                onClick={() => setDraft({ ...c })}
              >
                <span className="manage__row-name">{c.name}</span>
                {!c.is_active && <span className="pill pill--danger">Inactive</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="manage__detail card">
        <h3>{draft.id ? 'Edit Category' : 'New Category'}</h3>
        <Input
          label="Name"
          ref={nameRef}
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
