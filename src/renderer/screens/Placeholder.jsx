import {
  ShoppingCart,
  UtensilsCrossed,
  Package,
  BarChart3,
  Users,
  Settings,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

const ICONS = {
  pos: ShoppingCart,
  items: UtensilsCrossed,
  stock: Package,
  reports: BarChart3,
  staff: Users,
  settings: Settings,
};

// Placeholder for modules arriving in later phases — every screen still
// gets a proper empty state (icon + explanation + action), never a blank page.
export default function Placeholder({ kind, title, description, phase }) {
  const toast = useToast();
  const Icon = ICONS[kind];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <h1>{title}</h1>
      <div className="card">
        <div className="empty-state" style={{ padding: 'var(--sp-7)' }}>
          <Icon size={48} />
          <h3>The {title} module is coming soon</h3>
          <p style={{ maxWidth: 420 }}>{description}</p>
          <Button onClick={() => toast(`${title} arrives in ${phase}.`, 'warning')}>
            Coming in {phase}
          </Button>
        </div>
      </div>
    </div>
  );
}
