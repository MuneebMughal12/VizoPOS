# Vizo POS — Project Rules

Full spec: `C:\Users\munee\Downloads\VIZO-POS-BRIEF-FULL.md` (decisions marked FINAL are locked).
Build phase-by-phase per Part 14 of the brief. Phase 0 (foundation) and
Phase 1 (Settings: Business + Billing live; Printer/Staff/Backup placeholders)
are complete. Next: Phase 2 (menu management).

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
