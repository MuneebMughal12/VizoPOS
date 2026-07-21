const { ipcMain, app } = require('electron');
const { getDb } = require('./db');
const { verifyPassword, hashPassword } = require('./auth');
const { logAudit } = require('./audit');
const { dataDir } = require('./paths');

// All permissions in the system — owner implicitly has every one.
const ALL_PERMISSIONS = [
  'take_order',
  'give_discount',
  'void_order',
  'reprint_bill',
  'view_sales_reports',
  'stock_entry',
  'stock_edit',
  'manage_items',
  'day_end_closing',
];

// Session lives in the main process; later phases enforce permissions here
// again, not just in the UI.
let currentUser = null;

function publicUser(row, permissions) {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    role: row.role,
    permissions,
  };
}

function getCurrentUser() {
  return currentUser;
}

function registerIpc() {
  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    dataDir: dataDir(),
  }));

  ipcMain.handle('auth:login', (_e, { username, password }) => {
    const db = getDb();
    const row = db
      .prepare('SELECT * FROM users WHERE username = ? AND is_active = 1')
      .get(String(username || '').trim());
    if (!row || !verifyPassword(password, row.password_hash)) {
      return { ok: false, error: 'Incorrect username or password.' };
    }

    const permissions =
      row.role === 'owner'
        ? ALL_PERMISSIONS
        : db
            .prepare('SELECT permission FROM user_permissions WHERE user_id = ?')
            .all(row.id)
            .map((p) => p.permission);

    currentUser = publicUser(row, permissions);
    logAudit(db, row.id, 'login', 'user', row.id, `Login: ${row.username}`);

    // Seeded default credentials still in use → prompt a password change.
    const mustChangePassword = row.username === 'admin' && password === 'admin123';
    return { ok: true, user: currentUser, mustChangePassword };
  });

  ipcMain.handle('auth:logout', () => {
    currentUser = null;
    return { ok: true };
  });

  ipcMain.handle('auth:change-password', (_e, { currentPassword, newPassword }) => {
    const db = getDb();
    if (!currentUser) return { ok: false, error: 'Login required.' };
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(currentUser.id);
    if (!row || !verifyPassword(currentPassword, row.password_hash)) {
      return { ok: false, error: 'Current password is incorrect.' };
    }
    if (!newPassword || String(newPassword).length < 6) {
      return { ok: false, error: 'New password must be at least 6 characters.' };
    }
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
      hashPassword(newPassword),
      row.id
    );
    logAudit(db, row.id, 'password_change', 'user', row.id, `Password changed: ${row.username}`);
    return { ok: true };
  });
}

module.exports = { registerIpc, getCurrentUser, ALL_PERMISSIONS };
