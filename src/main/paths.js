// Data lives in %APPDATA%\VizoPOS — never touched by app updates.
const { app } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

function dataDir() {
  return path.join(app.getPath('appData'), 'VizoPOS');
}

function ensureDataDirs() {
  const root = dataDir();
  for (const dir of [root, path.join(root, 'images'), path.join(root, 'logs')]) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return root;
}

function dbPath() {
  return path.join(dataDir(), 'pos.db');
}

function schemaPath() {
  // In dev: <project>/resources/schema.sql. In production build the
  // resources folder ships via electron-builder extraResources (Phase 9).
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'schema.sql');
  }
  return path.join(app.getAppPath(), 'resources', 'schema.sql');
}

module.exports = { dataDir, ensureDataDirs, dbPath, schemaPath };
