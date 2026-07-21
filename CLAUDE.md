# Vizo POS — Project Rules

Full spec: `C:\Users\munee\Downloads\VIZO-POS-BRIEF-FULL.md` (decisions marked FINAL are locked).
Build phase-by-phase per Part 14 of the brief. Phases 0–2 are complete:
foundation, Settings (Business + Billing live), and menu management
(categories / items / variants / add-ons / image library). Next: Phase 3
(POS screen & order transaction).

## Dish image library
- Bundled photos: `resources/dish-images/` — lowercase-hyphenated filenames
  (`chicken-biryani.jpg`); search derives names from filenames. See the
  README in that folder. Owner uploads land in `%APPDATA%\VizoPOS\images\dishes`.
- `items.image` stores a prefixed ref: `lib/<file>` or `user/<file>`.
- Renderer loads images as data URLs over IPC with a session cache
  (`src/renderer/lib/imageCache.js`) — no custom protocol.

## Variants
- `item_variants.variant_group` (added by migration v2) holds an optional
  group label, e.g. group 'Chicken' + name 'Single'. Empty = plain variant.
- Combination generator (`GenerateCombinationsModal` + pure logic in
  `variantCombos.js`): two lists → group × size rows, prices left blank;
  add-vs-replace when variants exist; skips duplicate group+name.

## How an item is sold (migration v3)
- `items.sold_by`: 'unit' (fixed price, default) | 'piece' (fixed price, pcs
  label + POS piece picker) | 'weight' (price / variant price is the RATE PER
  KG). `items.quick_weights` = JSON `[{label,kg}]` for weight items' POS buttons.
- Owner-facing config (Sold By selector, rate label, quick-weight editor) is
  built in the item form. The POS-side pickers (piece 1/2/4/6/12+custom,
  weight quick buttons + custom + live price) and printing land with the POS
  screen (Phase 3) and printing (Phase 4). Recipes for weight items are
  defined per 1 kg and scale with sold weight — wired in Phase 5.

## Management list conventions
- Items / Categories / Add-ons lists have an All / Active / Inactive filter
  (default Active). Inactive rows are dimmed with an 'Inactive' pill; the POS
  must show only active rows. Saving a NEW record clears the form back to
  'New …' and refocuses the first field; saving an EDIT keeps it open.

## Schema migrations
- Real migrations exist (v2 variant_group, v3 sold_by + quick_weights) — do
  NOT edit `resources/schema.sql` to add columns to existing tables; append a
  `{ version, up(db) }` entry to MIGRATIONS in `src/main/db.js` (idempotent,
  guarded with PRAGMA table_info). schema.sql stays the v1 baseline.

## UI language rule (FINAL)
**All user-facing UI text must be in English** — labels, buttons, empty states, toasts,
error messages, modals, print previews. No Roman Urdu anywhere in the app UI, in any phase.
Restaurant staff and clients expect English; it reads as more professional and premium.
(Talking to the developer in Roman Urdu in chat/reports is fine — this rule is only about
strings shipped inside the app.)

## Native module constraint
This PC has no Visual Studio C++ build tools. Electron is pinned exactly (42.7.0 = ABI 146)
and `.npmrc` targets the Electron runtime so better-sqlite3 installs from a prebuilt binary.
Never bump `electron` or `better-sqlite3` without confirming a matching
`electron-vXXX-win32-x64` prebuild exists on the better-sqlite3 GitHub release.
Stay on better-sqlite3 v12.x (v13 dropped prebuild-install).

## Architecture
- Electron main process = the backend: all SQLite, printing, backups, license checks.
- Renderer (React + Vite) never touches the DB — IPC via `src/preload/index.js` only.
- Data lives in `%APPDATA%\VizoPOS\` (pos.db, images/, logs/) — never touched by updates.
- Migrations: additive entries in `MIGRATIONS` in `src/main/db.js`, keyed on
  `app_meta.schema_version`.
- Design system: exact tokens in `src/renderer/styles/tokens.css` (Part 13 of the brief).

## Brand assets (Vizo Tech logo — NOT the client's restaurant logo)
- `src/renderer/assets/vizo-logo-light.png` — off-white wordmark, transparent bg: use in
  all in-app UI on the dark theme (sidebar, login, splash).
- `src/renderer/assets/vizo-logo-dark.png` — dark navy wordmark, transparent bg: for
  print output / light backgrounds later.
- `resources/brand/*-original.png` — untouched source files from the owner (opaque grey
  backgrounds; the transparent versions above were extracted from them). Keep them.
- The client's restaurant logo is separate — it comes from Settings (Phase 1) and is
  stored per-installation in `%APPDATA%\VizoPOS\images\`.
