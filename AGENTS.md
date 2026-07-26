# AGENTS.md — Baby Tracker

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — prod build to `dist/`
- `npm run preview` — serve production build
- `npm test` — run all Vitest tests
- `npx vitest run <path>` — run a single test file
- `npx vitest run -t "<name>"` — run tests matching a description

## Architecture

Pure client-side PWA (no backend, no router, no global store). State lives in `App.jsx` as a single `useState` for parsed events.

**Entry:** `src/main.jsx` → `App.jsx` → `Dashboard` → `KicksDashboard` / `ContractionsDashboard` / `FeedDashboard` / `PumpDashboard` / `DiaperDashboard` / `SleepDashboard`

**Data flow:** Upload file → `parseCsv` (PapaParse) → `processKicks` / `processContractions` / `processFeed` / `processPump` / `processDiaper` / `processSleep` → Recharts

## CSV format

Required columns: `type`, `date_time`. Optional column: `sides` (only for `pump-start`).

```csv
type,date_time,sides
baby-kick,2026-04-27 14:30:00,
feed-bottle,2026-04-27 08:15:00,
pump-start,2026-04-27 09:00:00,left
pump-end,2026-04-27 09:15:00,
diaper-wet,2026-04-27 06:00:00,
sleep-start,2026-04-27 20:00:00,
sleep-end,2026-04-27 22:30:00,
```

## Valid event types

| Type | Extra column |
|---|---|
| `baby-kick` | — |
| `contraction-start`, `contraction-end` | — |
| `feed-breastfeed`, `feed-bottle`, `feed-solids`, `feed-combo` | — |
| `pump-start`, `pump-end` | `sides` (`left`, `right`, `both`) on `pump-start` |
| `diaper-wet`, `diaper-dirty`, `diaper-dry` | — |
| `sleep-start`, `sleep-end` | — |

Unknown types produce parser warnings and are dropped.

## Key behaviors (hard-earned)

- **Datetime parsing:** CSV format is `yyyy-MM-dd HH:mm:ss` (space separator). Parser replaces space with `T` before `new Date(...)` to treat it as local time. Never change this parsing or datetimes will shift.
- **Contraction pairing:** one-pass end-index pointer matches each `contraction-start` to the next `contraction-end`; unmatched starts/ends are silently dropped.
- **5-1-1 detection:** ≥2 contractions with duration ≥60s, intervals ≤5min, span ≥60min.
- **Inter-kick intervals >24h** are treated as separate sessions and dropped from interval calculation.
- **Pump pairing:** same one-pass end-index pointer as contractions; `sides` is read from the `pump-start` row.
- **Sleep daily totals:** total hours per day are rounded to one decimal place.

## i18n

- `en` and `pt`; `nonExplicitSupportedLngs: true` so `pt-PT`/`pt-BR` map to `pt`.
- Language persists in `localStorage` key `babytracker-lang`.
- Date-fns locales exported as `DATE_FNS_LOCALES`; thread `locale` into processor functions when adding date-formatted strings.
- Translations live in `src/locales/{en,pt}.json`. Keep both files in sync.

## Build / Deploy

- Vite `base: '/baby-tracker/'` — all asset paths must include this prefix.
- PWA scope `/baby-tracker/` with `autoUpdate`.
- Tailwind, `dark:` variant, violet/mauve palette, CSS vars `--bg`/`--text`.
- GitHub Pages deploy on push to `main` via `.github/workflows/deploy.yml` (runs `npm ci && npm run build`, publishes `dist/`).

## Testing

- Vitest is configured; tests live next to the code they cover (e.g., `src/utils/dataProcessors.test.js`).
- Shared fixtures are in `test/` (CSV for manual testing, JSON for test assertions).
- `parseCsv` accepts both `File` (browser) and `string` (tests/Node) input.

## Also see

- `CLAUDE.md` — additional repo context; note that its claim about no test runner is now stale.
