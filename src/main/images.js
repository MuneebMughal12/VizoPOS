// Dish image library.
// Two sources, referenced in items.image with a prefix:
//   'lib/<file>'  — bundled library: <project>/resources/dish-images in dev,
//                   <resources>/dish-images in the packaged app. The owner
//                   (or Vizo Tech) drops image files straight into it.
//   'user/<file>' — owner's own uploads: %APPDATA%\VizoPOS\images\dishes
// Naming convention for library files: lowercase-hyphenated dish name,
// e.g. chicken-biryani.jpg, seekh-kabab-2.png. The picker's search matches
// the words in the filename.
const { app, dialog } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { dataDir } = require('./paths');

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function libDir() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'dish-images')
    : path.join(app.getAppPath(), 'resources', 'dish-images');
}

function userDishDir() {
  return path.join(dataDir(), 'images', 'dishes');
}

// 'chicken-biryani-2.jpg' -> 'Chicken Biryani'
function displayName(file) {
  return path
    .basename(file, path.extname(file))
    .replace(/-\d+$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function scanDir(dir, prefix) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => IMAGE_EXTS.includes(path.extname(f).toLowerCase()))
    .sort()
    .map((f) => ({ ref: `${prefix}/${f}`, name: displayName(f) }));
}

function listLibrary() {
  return [...scanDir(libDir(), 'lib'), ...scanDir(userDishDir(), 'user')];
}

// 'lib/foo.jpg' | 'user/bar.png' -> absolute path (basename-only, no traversal)
function resolveImage(ref) {
  if (typeof ref !== 'string') return null;
  const [src, ...rest] = ref.split('/');
  const file = path.basename(rest.join('/'));
  if (!file || !IMAGE_EXTS.includes(path.extname(file).toLowerCase())) return null;
  if (src === 'lib') return path.join(libDir(), file);
  if (src === 'user') return path.join(userDishDir(), file);
  return null;
}

function imageDataUrl(ref) {
  const full = resolveImage(ref);
  if (!full || !fs.existsSync(full)) return null;
  const mime = MIME[path.extname(full).toLowerCase()];
  return `data:${mime};base64,${fs.readFileSync(full).toString('base64')}`;
}

async function uploadDishImage(win) {
  const result = await dialog.showOpenDialog(win, {
    title: 'Choose Dish Photo',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
  });
  if (result.canceled || result.filePaths.length === 0) return { canceled: true };

  const src = result.filePaths[0];
  const ext = path.extname(src).toLowerCase();
  if (!IMAGE_EXTS.includes(ext)) throw new Error('Please choose a PNG, JPG or WEBP image.');

  const dir = userDishDir();
  fs.mkdirSync(dir, { recursive: true });
  const base = path
    .basename(src, path.extname(src))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'dish';
  let file = `${base}${ext}`;
  let n = 2;
  while (fs.existsSync(path.join(dir, file))) file = `${base}-${n++}${ext}`;
  fs.copyFileSync(src, path.join(dir, file));

  const ref = `user/${file}`;
  return { ref, name: displayName(file), dataUrl: imageDataUrl(ref) };
}

module.exports = { listLibrary, imageDataUrl, uploadDishImage, libDir, userDishDir };
