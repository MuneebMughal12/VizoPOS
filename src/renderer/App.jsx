import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import AppShell from './shell/AppShell';
import Login from './screens/Login';
import ChangePasswordModal from './screens/ChangePasswordModal';
import Dashboard from './screens/Dashboard';
import Placeholder from './screens/Placeholder';

function Routed() {
  const { user, mustChangePassword, setMustChangePassword } = useAuth();

  if (!user) return <Login />;

  return (
    <>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route
              path="/pos"
              element={
                <Placeholder
                  kind="pos"
                  title="POS"
                  phase="Phase 3"
                  description="Order screen — dish grid, variants, add-ons, cart and SAVE & PRINT."
                />
              }
            />
            <Route
              path="/items"
              element={
                <Placeholder
                  kind="items"
                  title="Items"
                  phase="Phase 2"
                  description="Manage categories, items, variants and add-ons — build your entire menu here."
                />
              }
            />
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
            <Route
              path="/settings"
              element={
                <Placeholder
                  kind="settings"
                  title="Settings"
                  phase="Phase 1"
                  description="All Business, Billing, Printer, Staff and Backup settings."
                />
              }
            />
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
        <Routed />
      </AuthProvider>
    </ToastProvider>
  );
}
