# Vizo POS

Restaurant Point of Sale by **Vizo Tech** — fully offline, single-PC, Windows.

Not just a billing machine: automatic ingredient/recipe inventory, real profit
reporting, and theft/wastage detection, wrapped in a premium dark UI.

## Tech stack

| Layer | Choice |
|---|---|
| Shell | Electron (main process = the entire backend) |
| UI | React + custom dark design system |
| Database | SQLite via better-sqlite3 (single local file in `%APPDATA%\VizoPOS`) |
| Printing | ESC/POS thermal via node-thermal-printer (Phase 4) |
| Packaging | electron-builder → NSIS installer (Phase 9) |

## Development

```bash
npm install     # needs no C++ toolchain — fetches Electron-runtime prebuilds
npm start       # Vite dev server + Electron
npm run build   # production renderer build
npm run smoke   # headless DB init check
```

Default login on first run: `admin` / `admin123` (the app prompts to change it).

> **Note:** `electron` is pinned exactly and `.npmrc` targets the Electron
> runtime so `better-sqlite3` installs from a prebuilt binary. Do not bump
> either without checking prebuild availability (see `CLAUDE.md`).

## Project layout

```
src/main/       Electron main process — DB, auth, IPC, splash, printing
src/preload/    the only renderer↔main bridge
src/renderer/   React app (Vite) — screens, components, design tokens
resources/      SQL schema, brand assets
```

## Build phases

Phase 0 (foundation: scaffold, DB, login, shell, splash) — **done**.
Remaining phases (settings → menu → POS → printing → inventory → reports →
staff → backup → license → auto-update) land in order per the project brief.
