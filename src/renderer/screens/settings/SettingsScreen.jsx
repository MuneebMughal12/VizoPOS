import { useState } from 'react';
import { Store, Receipt, Printer, Users, DatabaseBackup, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BusinessSection from './BusinessSection';
import BillingSection from './BillingSection';
import ComingSection from './ComingSection';
import './settings.css';

const SECTIONS = [
  { id: 'business', label: 'Business', icon: Store },
  { id: 'billing', label: 'Billing', icon: Receipt },
  { id: 'printer', label: 'Printer', icon: Printer },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'backup', label: 'Backup', icon: DatabaseBackup },
];

export default function SettingsScreen() {
  const { user } = useAuth();
  const [active, setActive] = useState('business');

  // Settings are owner-only (Part 2.3) — hidden in the sidebar for staff
  // later (Phase 7); this guard covers direct navigation meanwhile.
  if (user?.role !== 'owner') {
    return (
      <div className="settings">
        <h1>Settings</h1>
        <div className="card">
          <div className="empty-state" style={{ padding: 'var(--sp-7)' }}>
            <Lock size={48} />
            <h3>Owner access only</h3>
            <p>Settings can only be changed by the owner account.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings">
      <h1>Settings</h1>
      <div className="settings__layout">
        <nav className="settings__nav card">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`settings__nav-item${active === id ? ' is-active' : ''}`}
              onClick={() => setActive(id)}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="settings__content">
          {active === 'business' && <BusinessSection />}
          {active === 'billing' && <BillingSection />}
          {active === 'printer' && (
            <ComingSection
              icon={Printer}
              title="Printer"
              phase="Phase 4"
              description="Counter & kitchen printer selection, paper width, copies, auto-cut, logo on bill, and test print buttons."
            />
          )}
          {active === 'staff' && (
            <ComingSection
              icon={Users}
              title="Staff"
              phase="Phase 7"
              description="Create staff accounts, set passwords, and control exactly what each person can do with permission checkboxes."
            />
          )}
          {active === 'backup' && (
            <ComingSection
              icon={DatabaseBackup}
              title="Backup"
              phase="Phase 8"
              description="Automatic daily backups, backup folder, USB backup, and protected restore."
            />
          )}
        </div>
      </div>
    </div>
  );
}
