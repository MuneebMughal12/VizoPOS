import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Package,
  BarChart3,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoLight from '../assets/vizo-logo-light.png';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/pos', label: 'POS', icon: ShoppingCart },
  { to: '/items', label: 'Items', icon: UtensilsCrossed },
  { to: '/stock', label: 'Stock', icon: Package },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/staff', label: 'Staff', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <img className="sidebar__logo" src={logoLight} alt="Vizo Tech" draggable="false" />
        <span className="sidebar__byline">Point of Sale</span>
      </div>

      <nav className="sidebar__nav">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__user">
        <div className="sidebar__avatar">{user?.fullName?.[0]?.toUpperCase() || '?'}</div>
        <div className="sidebar__user-meta">
          <span className="sidebar__user-name">{user?.fullName}</span>
          <span className="sidebar__user-role">{user?.role}</span>
        </div>
        <button className="sidebar__logout" onClick={logout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
