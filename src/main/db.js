// All SQLite access lives in the main process. The renderer never touches
// the DB — it goes through IPC (see ipc.js).
const Database = require('better-sqlite3');
const fs = require('node:fs');
const { dbPath, schemaPath, ensureDataDirs } = require('./paths');
const { hashPassword } = require('./auth');
const { seedDefaults } = require('./settings');

let db = null;

// ---- Migration runner ------------------------------------------------
// Keyed on app_meta.schema_version. Always additive, never destructive.
// v1 is the base schema created from schema.sql; each later release appends
// an entry here that runs once on an existing DB.
const MIGRATIONS = [
  {
    // v2: variant grouping — an optional group label per variant
    // (e.g. group 'Chicken' + name 'Single'), used by the combination
    // generator and the POS variant popup.
    version: 2,
    up(database) {
      const cols = database.prepare('PRAGMA table_info(item_variants)').all();
      if (!cols.some((c) => c.name === 'variant_group')) {
        database.exec('ALTER TABLE item_variants ADD COLUMN variant_group TEXT');
      }
    },
  },
  {
    // v3: how an item is sold.
    //   sold_by: 'unit'   — fixed price, single serving (default; existing rows)
    //            'piece'  — fixed price, quantities are pieces (pcs label)
    //            'weight' — price is the RATE PER KG (on the item, or per
    //                       variant when the item has variants)
    //   quick_weights: JSON array of { label, kg } — this item's POS weight
    //                  buttons (weight items only).
    version: 3,
    up(database) {
      const cols = database.prepare('PRAGMA table_info(items)').all().map((c) => c.name);
      if (!cols.includes('sold_by')) {
        database.exec("ALTER TABLE items ADD COLUMN sold_by TEXT NOT NULL DEFAULT 'unit'");
      }
      if (!cols.includes('quick_weights')) {
        database.exec('ALTER TABLE items ADD COLUMN quick_weights TEXT');
      }
    },
  },
];

function tableExists(name) {
  return !!db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(name);
}

function getMeta(key) {
  const row = db.prepare('SELECT value FROM app_meta WHERE key=?').get(key);
  return row ? row.value : null;
}

function setMeta(key, value) {
  db.prepare(
    'INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value'
  ).run(key, String(value));
}

function initDatabase() {
  ensureDataDirs();
  db = new Database(dbPath());
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  if (!tableExists('app_meta')) {
    const schemaSql = fs.readFileSync(schemaPath(), 'utf8');
    db.transaction(() => {
      db.exec(schemaSql);
      setMeta('schema_version', '1');
      setMeta('installed_at', new Date().toISOString());
    })();
  }

  runMigrations();
  seedAdmin();
  seedDefaults(db);
  return db;
}

function runMigrations() {
  let current = parseInt(getMeta('schema_version') || '1', 10);
  for (const m of MIGRATIONS) {
    if (m.version > current) {
      db.transaction(() => {
        m.up(db);
        setMeta('schema_version', String(m.version));
      })();
      current = m.version;
    }
  }
}

// First run: seed admin/admin123 as owner. Login screen prompts the owner
// to change this password — it must not stay default silently.
function seedAdmin() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (count === 0) {
    db.prepare(
      'INSERT INTO users (username, full_name, password_hash, role) VALUES (?, ?, ?, ?)'
    ).run('admin', 'Owner', hashPassword('admin123'), 'owner');
  }
}

function getDb() {
  if (!db) throw new Error('Database not initialised');
  return db;
}

module.exports = { initDatabase, getDb, getMeta, setMeta };
