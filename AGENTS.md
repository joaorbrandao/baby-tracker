# AGENTS.md — Baby Tracker

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — prod build to `dist/`
- `npm run preview` — serve production build

No test runner, linter, or formatter. `test/` has sample CSV/MD fixtures for manual testing only.

## Architecture

Pure client-side PWA (no backend, no router, no global store). State lives in `App.jsx` as a single `useState` for parsed events.

**Entry:** `src/main.jsx` → `App.jsx` → `Dashboard` → `KicksDashboard` / `ContractionsDashboard`

**Data flow:** Upload file → `parseCsv` (PapaParse, validates types, parses as local time) → `processKicks` / `processContractions` → Recharts

## Key behaviors (hard-earned)

- **Datetime parsing:** CSV format is `yyyy-MM-dd HH:mm:ss` (space separator). Parser replaces space with `T` before `new Date(...)` to avoid UTC interpretation. For the agent: never change this parsing or datetime will shift.
- **3 event types only:** `baby-kick`, `contraction-start`, `contraction-end` — others are dropped with warnings
- **Contraction pairing:** one-pass end-index pointer matches each start to the next end; unmatched starts/ends are silently dropped
- **5-1-1 detection:** ≥2 contractions with duration ≥60s, intervals ≤5min, span ≥60min
- **Inter-kick intervals >24h** treated as separate sessions (dropped from calculation)

## i18n

- `en` and `pt`; `nonExplicitSupportedLngs: true` so `pt-PT`/`pt-BR` map to `pt`
- Language in `localStorage` key `babytracker-lang`
- Date-fns locales exported as `DATE_FNS_LOCALES`; thread `locale` into `processKicks`/`processContractions` when adding date-formatted strings

## Build / Deploy

- Vite `base: '/baby-tracker/'` — all asset paths must include this prefix
- PWA scope `/baby-tracker/` with `autoUpdate`
- Tailwind, `dark:` variant, violet/mauve palette, CSS vars `--bg`/`--text`
- GitHub Pages deploy on push to `main` via `.github/workflows/deploy.yml` (runs `npm ci && npm run build`, publishes `dist/`)
