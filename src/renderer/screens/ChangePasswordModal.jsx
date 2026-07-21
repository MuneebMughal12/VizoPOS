import { useState } from 'react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

// Shown when the seeded admin/admin123 is still in use. The owner may
// postpone, but is prompted every login until the password changes.
export default function ChangePasswordModal({ open, onDone }) {
  const toast = useToast();
  const [current, setCurrent] = useState('admin123');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    if (next !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    const res = await window.vizo.changePassword(current, next);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast('Password changed successfully.', 'success');
    onDone();
  }

  return (
    <Modal
      open={open}
      title="Change Your Password"
      maxWidth={480}
      actions={
        <>
          <Button onClick={onDone}>Later</Button>
          <Button variant="primary" onClick={submit} disabled={busy || !next}>
            {busy ? 'Saving…' : 'Change Password'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          You are still using the default password (admin123). Change it now to keep your
          business secure.
        </p>
        <Input
          label="New Password"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoFocus
        />
        <Input
          label="Confirm New Password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={error || undefined}
        />
      </div>
    </Modal>
  );
}
