import { useEffect, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';

const KEYS = [
  'business.name',
  'business.address',
  'business.phone',
  'business.ntn',
  'business.receipt_footer',
  'business.thank_you_msg',
  'business.currency',
];

export default function BusinessSection() {
  const { settings, logoDataUrl, save, chooseLogo, loaded } = useSettings();
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

  const set = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }));

  async function onSave() {
    setBusy(true);
    const res = await save(draft);
    setBusy(false);
    if (res.ok) toast('Business settings saved.', 'success');
    else toast(res.error || 'Could not save settings.', 'danger');
  }

  async function onLogo() {
    const res = await chooseLogo();
    if (!res.ok) toast(res.error || 'Could not upload logo.', 'danger');
    else if (!res.canceled) toast('Logo updated.', 'success');
  }

  return (
    <div className="card settings__panel">
      <h2>Business</h2>
      <p className="settings__sub">
        This information appears on the customer bill header and across the app.
      </p>

      <div className="settings__logo-row">
        <div className="settings__logo-box">
          {logoDataUrl ? (
            <img src={logoDataUrl} alt="Restaurant logo" />
          ) : (
            <ImagePlus size={28} />
          )}
        </div>
        <div className="settings__logo-meta">
          <span className="label">Restaurant Logo</span>
          <p className="settings__hint">
            PNG or JPG. Simple, solid logos print best on thermal paper — printing on the
            bill stays off until you enable it in Printer settings (Phase 4).
          </p>
          <Button onClick={onLogo}>Upload Logo</Button>
        </div>
      </div>

      <div className="settings__grid">
        <Input label="Restaurant Name" value={draft['business.name'] ?? ''} onChange={set('business.name')} placeholder="e.g. Karachi Khas Restaurant" />
        <Input label="Phone" value={draft['business.phone'] ?? ''} onChange={set('business.phone')} placeholder="e.g. 0300-1234567" />
        <Input label="NTN (optional)" value={draft['business.ntn'] ?? ''} onChange={set('business.ntn')} />
        <Input label="Currency" value={draft['business.currency'] ?? ''} onChange={set('business.currency')} placeholder="Rs" />
      </div>
      <TextArea label="Address" value={draft['business.address'] ?? ''} onChange={set('business.address')} placeholder="Shop address printed on the bill" />
      <TextArea label="Receipt Footer" value={draft['business.receipt_footer'] ?? ''} onChange={set('business.receipt_footer')} placeholder="Optional line printed at the bottom of every bill" />
      <TextArea label="Thank You Message" value={draft['business.thank_you_msg'] ?? ''} onChange={set('business.thank_you_msg')} />

      <div className="settings__actions">
        <Button variant="primary" onClick={onSave} disabled={busy || !loaded}>
          {busy ? 'Saving…' : 'Save Business Settings'}
        </Button>
      </div>
    </div>
  );
}
