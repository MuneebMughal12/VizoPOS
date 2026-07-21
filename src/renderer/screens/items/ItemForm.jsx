import { useEffect, useState } from 'react';
import { ImagePlus, Plus, Check } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Toggle from '../../components/ui/Toggle';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import DishImage from '../../components/DishImage';
import VariantsEditor from './VariantsEditor';
import ImagePickerModal from './ImagePickerModal';
import GenerateCombinationsModal from './GenerateCombinationsModal';

const EMPTY = {
  id: null,
  name: '',
  category_id: '',
  image: null,
  price: '',
  has_variants: 0,
  variants: [],
  track_stock: 0,
  stock_qty: '',
  low_stock_level: '',
  sort_order: 0,
  is_active: 1,
  addon_ids: [],
};

export default function ItemForm({ itemId, categories, addons, currency, onChanged }) {
  const toast = useToast();
  const [draft, setDraft] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [focusReq, setFocusReq] = useState(null); // { index, token } for price focus
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newCat, setNewCat] = useState(null); // null = hidden, '' = open+empty

  useEffect(() => {
    if (itemId) {
      window.vizo.menu.getItem(itemId).then((res) => {
        if (res.ok) {
          setDraft({ ...res.item, price: res.item.price ?? '', category_id: res.item.category_id ?? '' });
        }
      });
    } else {
      setDraft(EMPTY);
    }
  }, [itemId]);

  const set = (key) => (e) => {
    const value = typeof e === 'string' ? e : e.target.value;
    setDraft((d) => ({ ...d, [key]: value }));
  };
  const setBool = (key) => (on) => setDraft((d) => ({ ...d, [key]: on ? 1 : 0 }));

  function toggleAddon(id) {
    setDraft((d) => ({
      ...d,
      addon_ids: d.addon_ids.includes(id)
        ? d.addon_ids.filter((a) => a !== id)
        : [...d.addon_ids, id],
    }));
  }

  async function addCategoryInline() {
    const res = await window.vizo.menu.saveCategory({ name: newCat });
    if (!res.ok) {
      toast(res.error, 'danger');
      return;
    }
    setNewCat(null);
    setDraft((d) => ({ ...d, category_id: res.category.id }));
    onChanged(draft.id ?? undefined);
    toast(`Category "${res.category.name}" added.`, 'success');
  }

  async function onSave() {
    const wasNew = !draft.id;
    setBusy(true);
    const res = await window.vizo.menu.saveItem({
      ...draft,
      category_id: draft.category_id || null,
    });
    setBusy(false);
    if (!res.ok) {
      toast(res.error, 'danger');
      return;
    }
    // Reset to a blank New Item so the owner can enter the next dish
    // straight away (fast menu entry). Editing an item remounts this form
    // via a key change; a brand-new item keeps the same "new" key, so
    // clear the fields here too.
    toast('Item saved.', 'success');
    if (wasNew) {
      setDraft(EMPTY);
      setFocusReq(null);
      setNewCat(null);
    }
    onChanged(null);
  }

  async function onDelete() {
    setConfirmDelete(false);
    const res = await window.vizo.menu.deleteItem(draft.id);
    if (!res.ok) {
      toast(res.error, 'danger');
      return;
    }
    toast('Item deleted.', 'success');
    onChanged(null);
  }

  const activeAddons = addons.filter((a) => a.is_active);

  return (
    <div className="manage__detail card">
      <h3>{draft.id ? `Edit: ${draft.name || 'Item'}` : 'New Item'}</h3>

      <div className="item-form__image-row">
        <button className="item-form__image-btn" onClick={() => setPickerOpen(true)} type="button">
          {draft.image ? (
            <DishImage imgRef={draft.image} className="item-form__image" />
          ) : (
            <span className="item-form__image-empty">
              <ImagePlus size={22} />
              <span>Choose Image</span>
            </span>
          )}
        </button>
        <div className="item-form__image-meta">
          <span className="label">Dish Photo</span>
          <p className="settings__hint">
            Search the photo library by name, or upload your own. Photos show on the POS
            buttons only — bills always print text.
          </p>
          {draft.image && (
            <Button onClick={() => setDraft((d) => ({ ...d, image: null }))}>Remove</Button>
          )}
        </div>
      </div>

      <Input label="Item Name" value={draft.name} onChange={set('name')} placeholder="e.g. Biryani" />

      <div className="item-form__cat-row">
        <Select
          label="Category"
          value={String(draft.category_id ?? '')}
          onChange={(v) => setDraft((d) => ({ ...d, category_id: v ? Number(v) : '' }))}
          options={[
            { value: '', label: 'No category' },
            ...categories.map((c) => ({ value: String(c.id), label: c.name })),
          ]}
        />
        {newCat === null ? (
          <Button onClick={() => setNewCat('')}>
            <Plus size={16} /> New
          </Button>
        ) : (
          <div className="item-form__newcat">
            <input
              className="input"
              value={newCat}
              autoFocus
              placeholder="New category name"
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && newCat.trim() && addCategoryInline()}
            />
            <Button onClick={addCategoryInline} disabled={!newCat.trim()}>
              <Check size={16} />
            </Button>
          </div>
        )}
      </div>

      <Toggle
        label="Has Variants"
        hint="e.g. Single / Double / Chicken / Beef — each with its own price."
        checked={!!draft.has_variants}
        onChange={setBool('has_variants')}
      />

      {draft.has_variants ? (
        <VariantsEditor
          variants={draft.variants}
          currency={currency}
          onChange={(variants) => setDraft((d) => ({ ...d, variants }))}
          onGenerate={() => setGenOpen(true)}
          focusReq={focusReq}
        />
      ) : (
        <Input
          label={`Price (${currency})`}
          type="number"
          min="0"
          value={draft.price}
          onChange={set('price')}
        />
      )}

      <Toggle
        label="Track stock (countable)"
        hint="For bottles, cans, packs — every sale reduces the count."
        checked={!!draft.track_stock}
        onChange={setBool('track_stock')}
      />
      {!!draft.track_stock && (
        <div className="item-form__grid">
          <Input label="Opening Qty" type="number" value={draft.stock_qty} onChange={set('stock_qty')} />
          <Input label="Low-stock Alert Level" type="number" value={draft.low_stock_level} onChange={set('low_stock_level')} />
        </div>
      )}

      {activeAddons.length > 0 && (
        <div>
          <span className="label">Add-ons offered with this item</span>
          <div className="item-form__chips">
            {activeAddons.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`chip${draft.addon_ids.includes(a.id) ? ' is-on' : ''}`}
                onClick={() => toggleAddon(a.id)}
              >
                {a.name} · {a.price}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="item-form__grid">
        <Input label="Sort Order" type="number" value={draft.sort_order} onChange={set('sort_order')} />
        <div style={{ alignSelf: 'end' }}>
          <Toggle label="Active" checked={!!draft.is_active} onChange={setBool('is_active')} />
        </div>
      </div>

      <div className="manage__actions">
        {draft.id && (
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        )}
        <Button variant="primary" onClick={onSave} disabled={busy || !draft.name.trim()}>
          {busy ? 'Saving…' : 'Save Item'}
        </Button>
      </div>

      <ImagePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(ref) => {
          setDraft((d) => ({ ...d, image: ref }));
          setPickerOpen(false);
        }}
      />

      <GenerateCombinationsModal
        open={genOpen}
        existing={draft.variants}
        onClose={() => setGenOpen(false)}
        onApply={(variants, focusIndex) => {
          setDraft((d) => ({ ...d, variants }));
          setFocusReq({ index: focusIndex, token: Date.now() });
          setGenOpen(false);
        }}
      />

      <Modal
        open={confirmDelete}
        title="Delete Item"
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
          Delete "{draft.name}" and its variants? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
