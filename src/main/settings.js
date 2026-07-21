// Key–value settings (settings table). New settings need only a new default
// here — no schema change. All values stored as strings.
const { BrowserWindow } = require('electron');

const DEFAULTS = {
  // Business
  'business.name': '',
  'business.logo': '',
  'business.address': '',
  'business.phone': '',
  'business.ntn': '',
  'business.receipt_footer': '',
  'business.thank_you_msg': 'Thank you! Please visit again.',
  'business.currency': 'Rs',
  // Billing
  'billing.tax_percent': '0',
  'billing.service_charge': '0',
  'billing.delivery_charge': '0',
  'billing.discount_enabled': '0',
  'billing.discount_limit_percent': '15',
  'billing.receipt_no_format': 'RCP-{0000}',
  'billing.order_no_format': 'ORD-{0000}',
  'billing.round_off': 'nearest_1',
  'billing.token_enabled': '1',
  'billing.token_reset_daily': '1',
  'billing.token_reset_time': '05:00',
  // Printer (configured fully in Phase 4)
  'printer.counter_name': '',
  'printer.kitchen_name': '',
  'printer.paper_width': '80',
  'printer.receipt_copies': '1',
  'printer.kot_copies': '1',
  'printer.auto_cut': '1',
  'printer.kot_show_price': '0',
  'printer.print_logo': '0',
  // Backup (configured fully in Phase 8)
  'backup.auto_enabled': '1',
  'backup.folder': '',
  'backup.keep_days': '30',
};

function seedDefaults(db) {
  const ins = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  db.transaction(() => {
    for (const [key, value] of Object.entries(DEFAULTS)) ins.run(key, value);
  })();
}

function getAllSettings(db) {
  const out = { ...DEFAULTS };
  for (const row of db.prepare('SELECT key, value FROM settings').all()) {
    out[row.key] = row.value;
  }
  return out;
}

function getSetting(db, key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : DEFAULTS[key] ?? null;
}

// Upserts entries; returns [{key, from, to}] for the audit log.
function setSettings(db, entries) {
  const up = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value'
  );
  const changes = [];
  db.transaction(() => {
    for (const [key, value] of Object.entries(entries)) {
      const before = getSetting(db, key);
      const after = String(value ?? '');
      if (before !== after) {
        up.run(key, after);
        changes.push({ key, from: before, to: after });
      }
    }
  })();
  return changes;
}

// Window title carries the client's restaurant name (Part 12).
function applyBusinessTitle(db) {
  const name = getSetting(db, 'business.name');
  const title = name ? `${name} — Vizo POS` : 'Vizo POS';
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.setTitle(title);
  }
}

module.exports = { DEFAULTS, seedDefaults, getAllSettings, getSetting, setSettings, applyBusinessTitle };
