# AGENTS.md — Baby Tracker

## Commands

### Development

- `npm run dev` — start Vite dev server + NestJS dev server concurrently
- `npm run dev:client` — start only the Vite dev server
- `npm run dev:server` — start only the NestJS dev server
- `npm run build` — production build of client, server, and utility scripts
- `npm run start` — start the compiled NestJS server (`server/dist/main.js`)
- `npm run preview` — preview the built client bundle via Vite (does not start the API)
- `npm test` — run all client (Vitest) and server (Jest) tests
- `npx vitest run <path>` — run a single client test file
- `npx prisma migrate dev --schema server/prisma/schema.prisma` — run dev migrations
- `npm run create-user -w server -- <email> <password> [name]` — create a user locally

### Docker

- `docker compose up -d --wait` — build and start the app
- `docker compose down -v` — stop and remove volumes
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
1. User taps a button in `TrackPanel`
2. Frontend posts to `POST /api/events`
3. Backend stores the event in SQLite (user-scoped)
4. Frontend refreshes / appends events and passes them to `processKicks` / `processContractions` / `processFeed` / `processPump` / `processDiaper` / `processSleep`
5. Dashboards render charts with Recharts

**State:**
- Auth state (JWT + user) lives in `client/src/auth/AuthContext.jsx` and persists in `localStorage` (`babytracker-token`, `babytracker-user`)
- Event state lives in `client/src/App.jsx` as a single `useState`
- No global store, no router

## Valid event types

These are the only event types accepted by the backend and processed by the dashboards:

| Type | Extra column |
|---|---|
| `baby-kick` | — |
| `contraction-start`, `contraction-end` | — |
| `feed-breastfeed`, `feed-bottle`, `feed-solids`, `feed-combo` | — |
| `pump-start`, `pump-end` | `sides` (`left`, `right`, `both`) on `pump-start` |
| `diaper-wet`, `diaper-dirty`, `diaper-dry` | — |
| `sleep-start`, `sleep-end` | — |

If you add a new type, update:
- `server/src/events/constants.ts`
- `server/src/events/dto/create-event.dto.ts`
- `client/src/components/TrackPanel.jsx`
- both `client/src/locales/{en,pt}.json` (`track.<type>` key)

## Key behaviors (hard-earned)

- **Datetime handling:** the UI sends ISO 8601 UTC (`new Date().toISOString()`) to the API. The API stores UTC and returns UTC. The frontend rehydrates with `new Date(isoString)` so all existing processor logic and local-time rendering continue to work unchanged.
- **Contraction pairing:** one-pass end-index pointer matches each `contraction-start` to the next `contraction-end`; unmatched starts/ends are silently dropped.
- **5-1-1 detection:** ≥2 contractions with duration ≥60s, intervals ≤5min, span ≥60min.
- **Inter-kick intervals >24h** are treated as separate sessions and dropped from interval calculation.
- **Pump pairing:** same one-pass end-index pointer as contractions; `sides` is read from the `pump-start` row.
- **Sleep daily totals:** total hours per day are rounded to one decimal place.

## Auth

- `POST /api/auth/login` accepts `{ email, password }` and returns `{ accessToken, user }`
- The frontend stores the token and sends `Authorization: Bearer <token>` on every API call
- `401` responses clear auth state and reload the page
- Users are created via `npm run create-user` or the compiled `server/dist/scripts/create-user.js` inside the Docker container — there is no registration UI

## i18n

- `en` and `pt`; `nonExplicitSupportedLngs: true` so `pt-PT`/`pt-BR` map to `pt`
- Language persists in `localStorage` key `babytracker-lang`
- Date-fns locales exported as `DATE_FNS_LOCALES`; thread `locale` into processor functions when adding new date-formatted strings
- Translations live in `client/src/locales/{en,pt}.json`. Keep both files in sync.

## Build / Deploy

- Vite `base: '/'` in `client/vite.config.js`
- PWA scope `/` with `autoUpdate`
- Tailwind, `dark:` variant, violet/mauve palette, CSS vars `--bg`/`--text`
- NestJS serves the built client from `client/dist` via `@nestjs/serve-static`; API is mounted under `/api`
- The Docker image is a single all-in-one container. SQLite requires a single instance; do not horizontally scale without switching to a client-server database.
- GitHub Pages deploy has been removed. CI runs build + test on every push/PR via `.github/workflows/ci.yml`.

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `JWT_SECRET` | Yes | Long random string for signing JWTs |
| `DATABASE_URL` | Yes | SQLite file path, e.g. `file:./dev.db` or `file:/data/baby-tracker.db` |
| `PORT` | No | Defaults to `3000` |

## Testing

- Client tests use Vitest and live next to the code they cover (e.g., `client/src/utils/dataProcessors.test.js`)
- Server tests use Jest and live next to the code they cover (e.g., `server/src/events/events.service.spec.ts`)
- Shared fixtures are in `client/test/`

## Also see

- `CLAUDE.md` — additional repo context
- `README.md` — user-facing setup and deployment guide
