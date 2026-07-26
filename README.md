# 👶 Baby Tracker

A privacy-first, self-hosted fullstack PWA for tracking baby kicks, contractions, feeds, pumps, diapers, and sleep.

> **🔒 Self-hosted** — your data lives in your own SQLite database. No third-party services, no telemetry.

## Features

- 🦶 **Baby kick analytics** — daily count, by-hour breakdown, time-of-day periods, peak hour detection
- 🤰 **Contraction tracking** — duration, intervals, daily counts with drill-down by hour
- 🚨 **5-1-1 rule alert** — automatic detection of labor patterns
- 🍼 **Feed tracking** — breastfeed, bottle, solids, combo
- ⚡ **Pump tracking** — sessions with side (left/right/both), durations, intervals
- 🧷 **Diaper tracking** — wet, dirty, dry
- 😴 **Sleep tracking** — sessions, durations, total hours per day
- 🔐 **Simple auth** — JWT-based login; users are managed via a CLI script
- 🐳 **Docker ready** — single container with the API and the built client
- 🌐 **Bilingual** — English and Portuguese

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React 18 + Tailwind CSS + Recharts + i18next |
| Backend | NestJS + Prisma + SQLite |
| Auth | Passport/JWT, bcryptjs |
| Container | Docker + docker-compose |

## Quick start (Docker — recommended)

```bash
# 1. Set your secrets
cp .env.example .env
# Edit .env and set JWT_SECRET to a strong random string

# 2. Build and start
docker compose up -d --wait

# 3. Create your first user
docker exec -it baby-tracker-app-1 \
  node server/dist/scripts/create-user.js you@example.com 'your-password' 'Your Name'

# 4. Open http://localhost:3000 and sign in
```

To stop:

```bash
docker compose down -v
```

The SQLite database is persisted on the `app-data` Docker volume mounted at `/data`.

## Local development

Requirements: Node.js 20+, npm

```bash
npm install

# Set up the dev database
cp .env.example server/.env
# Edit server/.env and set JWT_SECRET
npx prisma migrate dev --schema server/prisma/schema.prisma

# Create a user
npm run create-user -w server -- you@example.com 'your-password' 'Your Name'

# Start both client (Vite) and server (NestJS dev)
npm run dev
```

The Vite dev server proxies `/api` to the backend on `http://localhost:3000`, so there is no CORS to configure.

## Production / self-hosting

The Docker image is a single all-in-one container:

- Builds the React client into `client/dist`
- Serves the client via NestJS `@nestjs/serve-static`
- API lives under `/api`
- SQLite file should be placed on a persistent volume

### Important: SQLite limits

SQLite works best with **a single container instance**. Do not scale this image horizontally unless you replace SQLite with a client-server database (Prisma makes that a connection-string change). For Kubernetes, use a single-replica `Deployment` with a `Recreate` strategy and a `PersistentVolumeClaim` mounted at `/data`.

## User management

There is no registration UI. Users are created with the CLI script:

```bash
# Local dev
npm run create-user -w server -- email@example.com 'password' 'Display Name'

# Inside a running Docker container
docker exec -it baby-tracker-app-1 \
  node server/dist/scripts/create-user.js email@example.com 'password' 'Display Name'
```

Passwords are hashed with bcrypt.

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start client + server in dev mode (concurrently) |
| `npm run dev:client` | Start only the Vite dev server |
| `npm run dev:server` | Start only the NestJS dev server |
| `npm run build` | Production build of client, server, and utility scripts |
| `npm run start` | Start the compiled server (`server/dist/main.js`) |
| `npm test` | Run client (Vitest) and server (Jest) tests |
| `npm run create-user -w server -- <email> <password> [name]` | Create a user locally |

## Environment variables

| Variable | Description | Example |
|---|---|---|
| `JWT_SECRET` | **Required.** Secret used to sign JWTs. Generate a long random string. | `openssl rand -hex 32` |
| `DATABASE_URL` | SQLite database file path | `file:./dev.db` (dev), `file:/data/baby-tracker.db` (Docker) |
| `PORT` | Port the API listens on | `3000` |

## Tests

```bash
npm test
```

Client tests use Vitest and live next to the code they cover. Server tests use Jest and live in `server/src/**/*.spec.ts`.

## i18n

Supported languages: `en` and `pt` (`pt-PT`/`pt-BR` map to `pt`). Translations are in `client/src/locales/{en,pt}.json`. Language preference is stored in `localStorage` under `babytracker-lang`.

## Data model

Events are stored in SQLite with the following shape:

| Field | Notes |
|---|---|
| `type` | One of: `baby-kick`, `contraction-start`, `contraction-end`, `feed-breastfeed`, `feed-bottle`, `feed-solids`, `feed-combo`, `pump-start`, `pump-end`, `diaper-wet`, `diaper-dirty`, `diaper-dry`, `sleep-start`, `sleep-end` |
| `datetime` | ISO 8601 UTC, rendered in the user's local timezone in the UI |
| `sides` | Only used for `pump-start`: `left`, `right`, or `both` |

## License

MIT
