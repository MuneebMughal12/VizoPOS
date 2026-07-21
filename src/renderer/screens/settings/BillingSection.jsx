import { useEffect, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Toggle from '../../components/ui/Toggle';

const KEYS = [
  'billing.tax_percent',
  'billing.service_charge',
  'billing.delivery_charge',
  'billing.discount_enabled',
  'billing.discount_limit_percent',
  'billing.receipt_no_format',
  'billing.order_no_format',
  'billing.round_off',
  'billing.token_enabled',
  'billing.token_reset_daily',
  'billing.token_reset_time',
];

const clampPct = (v) => {
  const n = Number(v);
  if (Number.isNaN(n) || n < 0) return '0';
  if (n > 100) return '100';
  return String(n);
};

export default function BillingSection() {
  const { settings, save, loaded } = useSettings();
  const toast = useToast();
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loaded) {
      const d = {};
      for (const k of KEYS) d[k] = settings[k] ?? '';
      setDraft(d);
    }
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key, transform) => (e) => {
    const raw = typeof e === 'string' ? e : e.target.value;
    setDraft((d) => ({ ...d, [key]: raw }));
    if (transform) {
      setDraft((d) => ({ ...d, [key]: transform(raw) }));
    }
  };
  const setBool = (key) => (on) => setDraft((d) => ({ ...d, [key]: on ? '1' : '0' }));

  async function onSave() {
    const entries = {
      ...draft,
      'billing.tax_percent': clampPct(draft['billing.tax_percent']),
      'billing.discount_limit_percent': clampPct(draft['billing.discount_limit_percent']),
    };
    setBusy(true);
    const res = await save(entries);
    setBusy(false);
    if (res.ok) toast('Billing settings saved.', 'success');
    else toast(res.error || 'Could not save settings.', 'danger');
  }

  const discountOn = draft['billing.discount_enabled'] === '1';
  const tokenOn = draft['billing.token_enabled'] === '1';

  return (
    <div className="card settings__panel">
      <h2>Billing</h2>
      <p className="settings__sub">Charges, discounts, numbering and the token system.</p>

      <h3 className="settings__group">Charges</h3>
      <div className="settings__grid">
        <Input label="Tax %" type="number" min="0" max="100" value={draft['billing.tax_percent'] ?? ''} onChange={set('billing.tax_percent')} />
        <Input label="Service Charges" type="number" min="0" value={draft['billing.service_charge'] ?? ''} onChange={set('billing.service_charge')} />
        <Input label="Delivery Charges" type="number" min="0" value={draft['billing.delivery_charge'] ?? ''} onChange={set('billing.delivery_charge')} />
        <Select
          label="Round Off"
          value={draft['billing.round_off'] ?? 'nearest_1'}
          onChange={set('billing.round_off')}
          options={[
            { value: 'none', label: 'No rounding' },
            { value: 'nearest_1', label: 'Nearest rupee' },
            { value: 'nearest_5', label: 'Nearest 5' },
            { value: 'nearest_10', label: 'Nearest 10' },
          ]}
        />
      </div>

      <h3 className="settings__group">Discounts</h3>
      <Toggle
        label="Allow discounts"
        hint="Master switch — when off, nobody except you can apply a discount."
        checked={discountOn}
        onChange={setBool('billing.discount_enabled')}
      />
      {discountOn && (
        <div className="settings__grid">
          <Input
            label="Discount Limit %"
            type="number"
            min="0"
            max="100"
            value={draft['billing.discount_limit_percent'] ?? ''}
            onChange={set('billing.discount_limit_percent')}
          />
        </div>
      )}

      <h3 className="settings__group">Numbering</h3>
      <div className="settings__grid">
        <Input label="Order No. Format" value={draft['billing.order_no_format'] ?? ''} onChange={set('billing.order_no_format')} placeholder="e.g. KK-{0000}" />
        <Input label="Receipt No. Format" value={draft['billing.receipt_no_format'] ?? ''} onChange={set('billing.receipt_no_format')} placeholder="e.g. RCP-{0000}" />
      </div>
      <p className="settings__hint">{'{0000}'} becomes the running number, e.g. KK-{'{0000}'} → KK-0451.</p>

      <h3 className="settings__group">Token Numbers</h3>
      <Toggle
        label="Token system"
        hint="Prints a large daily token number on the KOT and the bill (Savour style)."
        checked={tokenOn}
        onChange={setBool('billing.token_enabled')}
      />
      {tokenOn && (
        <>
          <Toggle
            label="Reset daily"
            checked={draft['billing.token_reset_daily'] === '1'}
            onChange={setBool('billing.token_reset_daily')}
          />
          <div className="settings__grid">
            <Input
              label="Reset Time"
              type="time"
              value={draft['billing.token_reset_time'] ?? '05:00'}
              onChange={set('billing.token_reset_time')}
            />
          </div>
          <p className="settings__hint">
            Default 05:00, not midnight — restaurants trading past midnight would otherwise get
            two live orders with the same token.
          </p>
        </>
      )}

      <div className="settings__actions">
        <Button variant="primary" onClick={onSave} disabled={busy || !loaded}>
          {busy ? 'Saving…' : 'Save Billing Settings'}
        </Button>
      </div>
    </div>
  );
}
