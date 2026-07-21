import { useEffect, useMemo, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { buildCombos, mergeVariants, variantKey } from './variantCombos';

// Two lists → all combinations as ready variant rows (prices left blank).
// See variantCombos.js for the logic. onApply(variants, focusIndex) hands
// the merged list back to the item form.
export default function GenerateCombinationsModal({ open, existing, onClose, onApply }) {
  const [groupText, setGroupText] = useState('');
  const [sizeText, setSizeText] = useState('');

  useEffect(() => {
    if (open) {
      setGroupText('');
      setSizeText('');
    }
  }, [open]);

  const generated = useMemo(() => buildCombos(groupText, sizeText), [groupText, sizeText]);

  const addCount = useMemo(() => {
    const have = new Set(existing.map((v) => variantKey(v.group, v.name)));
    return generated.filter((r) => !have.has(variantKey(r.group, r.name))).length;
  }, [generated, existing]);

  function apply(mode) {
    const { variants, focusIndex } = mergeVariants(existing, generated, mode);
    onApply(variants, focusIndex);
  }

  const hasExisting = existing.length > 0;
  const preview = generated.slice(0, 12);

  return (
    <Modal
      open={open}
      title="Generate Variant Combinations"
      maxWidth={560}
      onClose={onClose}
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          {hasExisting ? (
            <>
              <Button onClick={() => apply('add')} disabled={addCount === 0}>
                Add to Existing{addCount ? ` (${addCount})` : ''}
              </Button>
              <Button variant="primary" onClick={() => apply('replace')} disabled={generated.length === 0}>
                Replace All ({generated.length})
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={() => apply('replace')} disabled={generated.length === 0}>
              Generate {generated.length ? `(${generated.length})` : ''}
            </Button>
          )}
        </>
      }
    >
      <div className="gencombo">
        <p className="settings__hint">
          Fill either or both lists — one value per line. With both filled you get every
          group × size combination, ready to price.
        </p>
        <div className="gencombo__lists">
          <div className="field">
            <label className="label field__label">Group / Type (optional)</label>
            <textarea
              className="textarea gencombo__area"
              rows={5}
              value={groupText}
              placeholder={'Simple\nChicken\nBeef'}
              onChange={(e) => setGroupText(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label field__label">Size / Portion (optional)</label>
            <textarea
              className="textarea gencombo__area"
              rows={5}
              value={sizeText}
              placeholder={'Single\nDouble\nFamily'}
              onChange={(e) => setSizeText(e.target.value)}
            />
          </div>
        </div>

        <div className="gencombo__preview">
          {generated.length === 0 ? (
            <span className="settings__hint">Nothing to generate yet.</span>
          ) : (
            <>
              <span className="label">
                Preview — {generated.length} variant{generated.length === 1 ? '' : 's'}
              </span>
              <div className="gencombo__chips">
                {preview.map((r) => (
                  <span key={variantKey(r.group, r.name)} className="chip">
                    {r.group ? `${r.group} · ${r.name}` : r.name}
                  </span>
                ))}
                {generated.length > preview.length && (
                  <span className="chip">+{generated.length - preview.length} more</span>
                )}
              </div>
              {hasExisting && (
                <span className="settings__hint">
                  You already have {existing.length} variant{existing.length === 1 ? '' : 's'}.
                  "Add to Existing" skips duplicates; "Replace All" starts fresh.
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
