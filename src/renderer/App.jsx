import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { ToastProvider } from './components/ui/Toast';
import AppShell from './shell/AppShell';
import Login from './screens/Login';
import ChangePasswordModal from './screens/ChangePasswordModal';
import Dashboard from './screens/Dashboard';
import Placeholder from './screens/Placeholder';
import SettingsScreen from './screens/settings/SettingsScreen';
import ItemsScreen from './screens/items/ItemsScreen';
import POSScreen from './screens/pos/POSScreen';
import SalesHistory from './screens/pos/SalesHistory';
import { canSeeDashboard } from './lib/access';
import './screens/settings/settings.css';
import './screens/items/items.css';

// A plain cashier lands straight on the POS; only richer roles see a dashboard.
function Home() {
  const auth = useAuth();
  return canSeeDashboard(auth) ? <Dashboard /> : <Navigate to="/pos" replace />;
}

function Routed() {
  const { user, mustChangePassword, setMustChangePassword } = useAuth();

  if (!user) return <Login />;

  return (
    <>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Home />} />
            <Route path="/pos" element={<POSScreen />} />
            <Route path="/history" element={<SalesHistory />} />
            <Route path="/items" element={<ItemsScreen />} />
            <Route
              path="/stock"
              element={
                <Placeholder
                  kind="stock"
                  title="Stock"
                  phase="Phase 5"
                  description="Ingredients, purchases, recipes and wastage — full control of your raw material."
                />
              }
            />
            <Route
              path="/reports"
              element={
                <Placeholder
                  kind="reports"
                  title="Reports"
                  phase="Phase 6"
                  description="Sales, item-wise, ingredient consumption and profit reports."
                />
              }
            />
            <Route
              path="/staff"
              element={
                <Placeholder
                  kind="staff"
                  title="Staff"
                  phase="Phase 7"
                  description="Staff accounts, roles and permission checkboxes."
                />
              }
            />
            <Route path="/settings" element={<SettingsScreen />} />
          </Route>
        </Routes>
      </HashRouter>
      <ChangePasswordModal
        open={mustChangePassword}
        onDone={() => setMustChangePassword(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SettingsProvider>
          <Routed />
        </SettingsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
