import { Banknote, ReceiptText, PackageX, DatabaseBackup, BarChart3, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

function Kpi({ icon: Icon, label, value, tone }) {
  return (
    <div className="card kpi">
      <div className={`kpi__icon${tone ? ` kpi__icon--${tone}` : ''}`}>
        <Icon size={20} />
      </div>
      <div className="kpi__meta">
        <span className="label">{label}</span>
        <span className="kpi__value num">{value}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="dashboard__kpis">
        <Kpi icon={Banknote} label="Today's Sales" value="Rs 0" />
        <Kpi icon={ReceiptText} label="Orders" value="0" />
        <Kpi icon={PackageX} label="Low Stock" value="0" />
        <Kpi icon={DatabaseBackup} label="Last Backup" value="Never" tone="warning" />
      </div>

      <div className="card dashboard__panel">
        <h3>Last 7 Days</h3>
        <div className="empty-state">
          <BarChart3 size={40} />
          <p>No sales yet — the 7-day sales chart will appear here after your first order.</p>
        </div>
      </div>

      <div className="card dashboard__panel">
        <h3>Recent Orders</h3>
        <div className="empty-state">
          <History size={40} />
          <p>No orders yet. Take your first order from the POS screen.</p>
        </div>
      </div>

      {user?.role === 'owner' && (
        <p className="dashboard__note">
          The profit card (owner only) will appear here once Reports are built.
        </p>
      )}
    </div>
  );
}
