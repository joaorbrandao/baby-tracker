# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — production build to `dist/` (deployed to GitHub Pages by `.github/workflows/deploy.yml` on push to `main`)
- `npm run preview` — serve the built bundle

There is no test runner, linter, or formatter configured. The `test/` directory contains sample CSV/MD input files (fixtures for manual testing), not automated tests.

## Architecture

A client-only PWA (no backend) that visualizes a CSV of baby-kick and contraction timestamps. Data never leaves the browser.

### Data flow

1. **Capture** — `scripts/scriptable/*.js` are iOS Scriptable scripts that append rows (`type,date_time`) to a CSV in iCloud Drive. The three event types are `baby-kick`, `contraction-start`, `contraction-end`.
2. **Upload** — `src/components/CsvUpload.jsx` accepts `.csv`/`.txt`/`.md` via drag-drop or file picker and hands the file to `parseCsv`.
3. **Parse** — `src/utils/csvParser.js` (PapaParse) requires `type` and `date_time` columns, validates each row's type against the allowlist, parses `date_time` as **local time** (replaces space with `T` to avoid UTC interpretation), sorts ascending, and returns `{ events, warnings }`.
4. **Process** — `src/utils/dataProcessors.js` derives all metrics:
   - `processKicks`: daily counts, by-hour, by-period (Night/Morning/Afternoon/Evening), inter-kick intervals (drops gaps >24h as separate sessions).
   - `processContractions`: pairs each `contraction-start` with the *next* `contraction-end` (one-pass with an end-index pointer), computes durations and start-to-start intervals, and runs `detect511` (5-1-1 rule: ≥5 contractions in any 60-min window, each ≥45s, intervals ≤5 min).
5. **Render** — `Dashboard` switches between `KicksDashboard` and `ContractionsDashboard` (Recharts). `FiveOneOneAlert` surfaces 5-1-1 detection.

State lives entirely in `App.jsx` (`events` set once after upload). No router, no global store.

### i18n

`src/i18n.js` initializes i18next with `en` and `pt` (`nonExplicitSupportedLngs: true` so `pt-PT`/`pt-BR` map to `pt`); language preference persists in `localStorage` under `babytracker-lang`. Translations live in `src/locales/{en,pt}.json`. Date-fns locales are exported as `DATE_FNS_LOCALES` and passed into `processKicks`/`processContractions` so chart labels match the UI language — when adding new date-formatted strings in processors, thread the `locale` argument through.

### Build / deploy specifics

- `vite.config.js` sets `base: '/baby-tracker/'` and configures `vite-plugin-pwa` (autoUpdate, scope `/baby-tracker/`). Any path/asset assumptions must respect this base.
- Styling is Tailwind (`tailwind.config.js`) with CSS variables `--bg`/`--text` for theme colors and a violet/mauve palette; dark mode via the `dark:` variant.
