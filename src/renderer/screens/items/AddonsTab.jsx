import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, PackagePlus } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Toggle from '../../components/ui/Toggle';
import Modal from '../../components/ui/Modal';
import Segmented from '../../components/ui/Segmented';
import { useToast } from '../../components/ui/Toast';
import { useSettings } from '../../context/SettingsContext';

const EMPTY = { id: null, name: '', price: '', is_active: 1 };

const FILTERS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'all', label: 'All' },
];

export default function AddonsTab() {
  const toast = useToast();
  const { settings } = useSettings();
  const currency = settings['business.currency'] || 'Rs';
  const [addons, setAddons] = useState([]);
  const [draft, setDraft] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [filter, setFilter] = useState('active');
  const nameRef = useRef(null);

  useEffect(() => {
    window.vizo.menu.listAddons().then((res) => {
      if (res.ok) setAddons(res.addons);
    });
  }, []);

  const shown = useMemo(() => {
    if (filter === 'active') return addons.filter((a) => a.is_active);
    if (filter === 'inactive') return addons.filter((a) => !a.is_active);
    return addons;
  }, [addons, filter]);

  function startNew() {
    setDraft(EMPTY);
    setTimeout(() => nameRef.current?.focus(), 0);
  }

  async function onSave() {
    const wasNew = !draft.id;
    setBusy(true);
    const res = await window.vizo.menu.saveAddon(draft);
    setBusy(false);
    if (!res.ok) {
      toast(res.error, 'danger');
      return;
    }
    setAddons(res.addons);
    toast('Add-on saved.', 'success');
    if (wasNew) {
      setDraft(EMPTY);
      setTimeout(() => nameRef.current?.focus(), 0);
    } else {
      setDraft({ ...res.addon });
    }
  }

  async function onDelete() {
    setConfirmDelete(false);
    const res = await window.vizo.menu.deleteAddon(draft.id);
    if (!res.ok) {
      toast(res.error, 'danger');
      return;
    }
    setAddons(res.addons);
    setDraft(EMPTY);
    toast('Add-on deleted.', 'success');
  }

  return (
    <div className="manage">
      <div className="manage__list card">
        <div className="manage__list-head manage__list-head--stack">
          <div className="manage__list-top">
            <span className="label">Add-ons</span>
            <Button onClick={startNew}>
              <Plus size={16} /> New
            </Button>
          </div>
          <Segmented size="sm" options={FILTERS} value={filter} onChange={setFilter} />
        </div>
        {shown.length === 0 ? (
          <div className="empty-state">
            <PackagePlus size={36} />
            <p>
              {addons.length === 0
                ? 'No add-ons yet — add Raita, Salad, Extra Chicken…'
                : `No ${filter} add-ons.`}
            </p>
          </div>
        ) : (
          <div className="manage__rows">
            {shown.map((a) => (
              <button
                key={a.id}
                className={`manage__row${draft.id === a.id ? ' is-active' : ''}${
                  a.is_active ? '' : ' manage__row--off'
                }`}
                onClick={() => setDraft({ ...a })}
              >
                <span className="manage__row-name">{a.name}</span>
                <span className="manage__row-meta num">
                  {currency} {a.price}
                </span>
                {!a.is_active && <span className="pill pill--danger">Inactive</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="manage__detail card">
        <h3>{draft.id ? 'Edit Add-on' : 'New Add-on'}</h3>
        <Input
          label="Name"
          ref={nameRef}
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          placeholder="e.g. Raita"
        />
        <Input
          label={`Price (${currency})`}
          type="number"
          min="0"
          value={draft.price}
          onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
        />
        <Toggle
          label="Active"
          hint="Inactive add-ons are hidden on the POS screen."
          checked={!!draft.is_active}
          onChange={(on) => setDraft((d) => ({ ...d, is_active: on ? 1 : 0 }))}
        />
        <div className="manage__actions">
          {draft.id && (
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          )}
          <Button
            variant="primary"
            onClick={onSave}
            disabled={busy || !draft.name.trim() || draft.price === ''}
          >
            {busy ? 'Saving…' : 'Save Add-on'}
          </Button>
        </div>
      </div>

      <Modal
        open={confirmDelete}
        title="Delete Add-on"
        maxWidth={440}
        onClose={() => setConfirmDelete(false)}
        actions={
          <>
            <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="danger" onClick={onDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Delete "{draft.name}"? Items mapped to it will simply stop offering it.
        </p>
      </Modal>
    </div>
  );
}
