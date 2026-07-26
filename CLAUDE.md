# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server + NestJS dev server concurrently
- `npm run dev:client` — start only the Vite dev server
- `npm run dev:server` — start only the NestJS dev server
- `npm run build` — production build of client, server, and utility scripts
- `npm run start` — start the compiled NestJS server (`server/dist/main.js`)
- `npm run preview` — serve the built client bundle via Vite (does not start the API)
- `npm test` — run all client (Vitest) and server (Jest) tests
- `npx vitest run <path>` — run a single client test file
- `npx prisma migrate dev --schema server/prisma/schema.prisma` — run dev migrations
- `npm run create-user -w server -- <email> <password> [name]` — create a user locally
- `docker compose up -d --wait` — build and start the Docker container
- `docker exec -it baby-tracker-app-1 node server/dist/scripts/create-user.js <email> <password> [name]` — create a user inside the container

## Architecture

Fullstack monorepo with a React PWA frontend and a NestJS + SQLite backend.

```
root/
├── client/   # Vite React app
└── server/   # NestJS API + Prisma
```

**Frontend entry:** `client/src/main.jsx` → `App.jsx` → `Dashboard` → `KicksDashboard` / `ContractionsDashboard` / `FeedDashboard` / `PumpDashboard` / `DiaperDashboard` / `SleepDashboard`

**Backend entry:** `server/src/main.ts` → `AppModule` → `/api` routes

**Data flow:**
1. User taps a button in `client/src/components/TrackPanel.jsx`
2. Frontend posts to `POST /api/events` with ISO 8601 UTC datetime
3. Backend stores the event in SQLite (user-scoped)
4. Frontend refreshes / appends events and passes them to `processKicks` / `processContractions` / `processFeed` / `processPump` / `processDiaper` / `processSleep`
5. Dashboards render charts with Recharts

**State:**
- Auth state (JWT + user) lives in `client/src/auth/AuthContext.jsx` and persists in `localStorage` (`babytracker-token`, `babytracker-user`)
- Event state lives in `client/src/App.jsx` as a single `useState`
- No global store, no router

## Data flow details

- **Capture:** the user taps a tracking button in the browser. Each button maps to a `type` from the allowlisted event types.
- **Store:** `client/src/api/client.js` sends the event to the backend with a Bearer token. `server/src/events/events.service.ts` validates the type and stores the row.
- **Process:** dashboards receive `{ type, datetime: Date, sides? }` arrays and run the same processor functions as before. Datetime is always sent as UTC ISO 8601 from the client, stored as UTC, and returned as UTC; the UI rehydrates with `new Date(...)` for local-time rendering.

## Valid event types

| Type | Extra column |
|---|---|
| `baby-kick` | — |
| `contraction-start`, `contraction-end` | — |
| `feed-breastfeed`, `feed-bottle`, `feed-solids`, `feed-combo` | — |
| `pump-start`, `pump-end` | `sides` (`left`, `right`, `both`) on `pump-start` |
| `diaper-wet`, `diaper-dirty`, `diaper-dry` | — |
| `sleep-start`, `sleep-end` | — |

When adding a new type, update:
- `server/src/events/constants.ts`
- `server/src/events/dto/create-event.dto.ts`
- `client/src/components/TrackPanel.jsx`
- both `client/src/locales/{en,pt}.json` (`track.<type>` key)

## Key behaviors (hard-earned)

- **Datetime handling:** the UI sends `new Date().toISOString()` to the API. The API stores the value in a SQLite `DateTime` column and returns UTC ISO strings. The frontend rehydrates with `new Date(isoString)` so existing processor logic and local-time rendering stay unchanged.
- **Contraction pairing:** one-pass end-index pointer matches each `contraction-start` to the next `contraction-end`; unmatched starts/ends are silently dropped.
- **5-1-1 detection:** ≥2 contractions with duration ≥60s, intervals ≤5min, span ≥60min.
- **Inter-kick intervals >24h** are treated as separate sessions and dropped from interval calculation.
- **Pump pairing:** same one-pass end-index pointer as contractions; `sides` is read from the `pump-start` row.
- **Sleep daily totals:** total hours per day are rounded to one decimal place.

## i18n

- `en` and `pt`; `nonExplicitSupportedLngs: true` so `pt-PT`/`pt-BR` map to `pt`.
- Language persists in `localStorage` key `babytracker-lang`.
- Date-fns locales exported as `DATE_FNS_LOCALES`; thread `locale` into processor functions when adding new date-formatted strings.
- Translations live in `client/src/locales/{en,pt}.json`. Keep both files in sync.

## Build / deploy specifics

- `client/vite.config.js` sets `base: '/'` and proxies `/api` to `http://localhost:3000` in dev.
- PWA scope `/` with `autoUpdate`.
- Styling is Tailwind (`client/tailwind.config.js`) with CSS variables `--bg`/`--text` for theme colors and a violet/mauve palette; dark mode via the `dark:` variant.
- NestJS serves the built client from `client/dist` via `@nestjs/serve-static`; the API is mounted under `/api`.
- The Docker image is a single all-in-one container. SQLite requires a single instance; do not horizontally scale without switching to a client-server database.
- GitHub Pages deploy has been removed; CI runs build + test via `.github/workflows/ci.yml`.

## Testing

- Vitest is configured for the client; tests live next to the code they cover (e.g., `client/src/utils/dataProcessors.test.js`).
- Jest is configured for the server; tests live next to the code they cover (e.g., `server/src/events/events.service.spec.ts`).
- Shared fixtures are in `client/test/`.

## Also see

- `AGENTS.md` — agent-focused commands, architecture, and hard-earned behaviors
- `README.md` — user-facing setup and deployment guide
