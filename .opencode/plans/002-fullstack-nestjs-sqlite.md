# Plan 002: Fullstack Conversion — Nest.js + SQLite + Docker

## Goal

Turn the pure client-side PWA into a fullstack app:

- **Backend:** Nest.js framework
- **Database:** SQLite (via Prisma)
- **Auth:** users managed manually in the DB (CLI script); only a login UI in the app
- **Frontend:** UI stays as-is, connected to the backend; CSV upload area replaced by tracking buttons
- **Packaging:** Dockerfile + docker-compose, built as a single all-in-one image for later k8s-style deployment

## Decisions (locked with user)

| Topic | Decision |
|---|---|
| Repo structure | Monorepo: `client/` + `server/` (npm workspaces) |
| Data sharing | Per-user data (each user sees only their own events) |
| Auth mechanism | JWT stored in localStorage, `Authorization: Bearer` |
| ORM | Prisma |
| Tracking buttons | One "Track" section above the dashboard |
| Existing CSV data | No migration — start fresh |
| Deployment | Local/self-hosted for now (Docker), k8s later |

## Target architecture

```
baby-tracker/
├── package.json              # npm workspaces + orchestration scripts (concurrently)
├── Dockerfile                # multi-stage, all-in-one image
├── docker-compose.yml
├── .dockerignore
├── .env.example              # JWT_SECRET
├── docker-entrypoint.sh      # prisma migrate deploy → node server
├── client/                   # existing Vite/React app, moved as-is
│   ├── src/                  # dashboards, processors, i18n stay unchanged
│   └── vite.config.js        # base '/', dev proxy /api → localhost:3000
├── server/                   # new NestJS + Prisma app
│   ├── prisma/schema.prisma
│   ├── src/{auth,users,events,prisma}/…
│   └── scripts/create-user.ts
└── .github/workflows/        # Pages deploy replaced with build+test CI
```

Single-process serving: Nest serves the built `client/dist` via `@nestjs/serve-static` and the API under `/api` — one `npm start` (or one container) runs everything. In dev, Vite proxies `/api` to Nest — no CORS anywhere.

## Backend (server/)

**Stack:** NestJS, Prisma + SQLite, `@nestjs/jwt` + passport-jwt, `bcryptjs` (pure JS — no native builds), class-validator DTOs, `@nestjs/config`, `@nestjs/serve-static`. Jest for server tests.

**Prisma schema:**

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String?
  createdAt    DateTime @default(now())
  events       Event[]
}

model Event {
  id        String   @id @default(cuid())
  type      String                 // validated against the existing 15 event types
  datetime  DateTime               // stored UTC (ISO 8601), rendered local on client
  sides     String?                // only for pump-start: left|right|both
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  @@index([userId, datetime])
}
```

**API** (global prefix `/api`; all but login/health behind JWT guard):

| Endpoint | Description |
|---|---|
| `POST /api/auth/login` | `{email, password}` → `{accessToken, user}` |
| `GET /api/events` | caller's events, ascending — `{id, type, datetime(ISO), sides?}` (mirrors today's parser output) |
| `POST /api/events` | `{type, datetime?, sides?}` — datetime optional (server = now); type/sides validated |
| `DELETE /api/events/:id` | delete own event (for mis-taps) |
| `GET /api/health` | public, `{status:'ok'}` — Docker HEALTHCHECK + k8s probes |

**User management:** `npm run create-user -w server -- you@mail.com 'password' [name]` CLI script (bcrypt hash → insert). No registration endpoint.

**Timestamps:** client sends `new Date().toISOString()`; client rehydrates fetched ISO strings with `new Date(...)`. All existing `dataProcessors` logic works untouched — local-time display semantics preserved. (The old "space-separated datetime → local" CSV parsing rule becomes irrelevant.)

## Frontend (client/)

1. **`src/api/client.js`** — fetch wrapper: `VITE_API_URL` (default `/api`), attaches Bearer token from `localStorage('babytracker-token')`, auto-logout on 401.
2. **`Login.jsx`** — email/password form styled in the existing violet/Tailwind idiom, i18n'd (en+pt).
3. **`TrackPanel.jsx`** — replaces `CsvUpload`, same card aesthetic, one section above the dashboard:
   - 👶 Kick — one tap
   - 🤰 Contraction — smart toggle (Start/End based on last contraction event)
   - 🍼 Feed — 4 buttons (breastfeed / bottle / solids / combo)
   - ⚡ Pump — start with side picker (left/right/both), then End
   - 🧷 Diaper — 3 buttons (wet / dirty / dry)
   - 😴 Sleep — start/end toggle
   - Taps POST then append the returned event to state (instant chart update); small "undo last event" affordance using `DELETE`.
4. **`App.jsx`** — token state → on load, `GET /api/events` → `setEvents` → existing `Dashboard` renders unchanged. Logout button beside `LanguageSwitcher`. Loading + error states.
5. **Removals:** `CsvUpload.jsx`, `csvParser.js` + tests, `papaparse` dep, CSV fixtures. `dataProcessors.js` and all dashboard components stay byte-identical.
6. **i18n:** add `login.*` and `track.*` keys to both `en.json` and `pt.json`.
7. **vite.config.js** — `base: '/'`, dev proxy `/api → http://localhost:3000`; PWA manifest scope updated (app stays installable; data now requires network).

## Docker & containerization

**One image, everything inside:** multi-stage build produces a single image with the compiled Nest server, the built React client (served by Nest), Prisma engines, and migrations. SQLite lives on a mounted volume.

**Dockerfile** (repo root, `node:20-alpine`):

```
stage 1 (build):  npm ci (workspaces) → build client → build server → prisma generate → npm prune --omit=dev
stage 2 (runtime): non-root `node` user; copy node_modules + client/dist + server/dist + prisma/
                   ENTRYPOINT: prisma migrate deploy → node server/dist/main.js
                   EXPOSE 3000; HEALTHCHECK on /api/health
```

`prisma` CLI ships as a runtime dependency so the entrypoint can apply migrations on container start.

**docker-compose.yml:**

```yaml
services:
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      JWT_SECRET: ${JWT_SECRET}        # from .env, required
      DATABASE_URL: file:/data/baby-tracker.db
      PORT: 3000
    volumes:
      - app-data:/data                 # SQLite file lives here
    restart: unless-stopped
volumes:
  app-data:
```

**Supporting files:** `.dockerignore` (node_modules, dist, .git, data), `.env.example` (`JWT_SECRET=change-me`), `docker-entrypoint.sh`. User management inside container: `docker exec -it <container> npm run create-user -w server -- you@mail.com 'pass'`.

**K8s-readiness (for later):**

- **Single replica only** — SQLite is a file on a PVC (RWO); `replicas: 1`, strategy `Recreate`. Horizontal scaling would require swapping SQLite for a client-server DB (Prisma: connection-string + provider change).
- Probes → `/api/health`; `JWT_SECRET` via k8s Secret; PVC mounted at `/data`.
- Example manifests under `k8s/` deferred until actual deployment.

## Execution phases

1. **Restructure** — `git mv` frontend into `client/`, root workspace `package.json` with `dev` (concurrently), `build`, `start` scripts; verify client tests/build pass from new location.
2. **Backend** — scaffold Nest, Prisma migrate, auth + events modules + `/api/health`, create-user script, serve-static, unit tests (auth login, events validation/scoping).
3. **Frontend wiring** — api client, Login, TrackPanel, App integration, i18n, removals, vite config.
4. **Docker** — Dockerfile, entrypoint, compose, `.dockerignore`, `.env.example`; verify `docker compose up --build` end-to-end (login → track → restart container → data persists).
5. **Docs & CI** — README/AGENTS.md rewrite (incl. Docker usage), GH workflow → build+test CI for both workspaces (+ optionally build the image in CI).

## Notes / tradeoffs

- Per-user data: no sharing between accounts — each login sees only its own events.
- JWT in localStorage is XSS-exposed; acceptable for self-hosted personal use. Secret via env (`JWT_SECRET`).
- GitHub Pages deploy removed — the app can no longer run as pure static hosting.
- PWA kept for installability, but data now requires network.
