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
// v1 is the base schema created from schema.sql; future releases append
// { version: 2, up(db) { db.exec('ALTER TABLE ...'); } } entries here.
const MIGRATIONS = [];

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
