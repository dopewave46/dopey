# DopeOrca OS — Deployment

A deliberately simple setup for one person to run and maintain. Three pieces,
all with a usable free/cheap tier, all HTTPS by default:

| Piece | Recommended host | Alternatives |
|---|---|---|
| **Database** (Postgres) | **Neon** | Supabase, Railway, Render Postgres |
| **Backend** (`server/`) | **Render** (Web Service) | Railway, Fly.io |
| **Frontend** (Vite build) | **Vercel** | Netlify, Cloudflare Pages |

No CI/CD pipeline, no containers. Each host redeploys on `git push` (or with one
click / one CLI command). That is enough for v1.

---

## 1. Database — Neon (managed Postgres)

1. Create a project at <https://neon.tech> → you get a connection string like
   `postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`.
2. Nothing else to do here — the backend runs migrations on deploy (step 2.4).
   Neon starts empty; the admin account is seeded from env on first boot.
3. Keep `?sslmode=require` in the URL. `pg` picks it up automatically.

> Migrations are in **`server/migrations/`** (plain SQL + a drizzle journal).
> They run cleanly against a fresh, empty database — verified in this repo.

## 2. Backend — Render

### 2.1 Create the service
- New → **Web Service** → connect this repo.
- **Root Directory:** `server`
- **Build Command:** `npm install && npm run build`
- **Pre-Deploy Command:** `npm run db:migrate:prod`  *(applies migrations before the new version goes live)*
- **Start Command:** `npm start`
- **Health Check Path:** `/api/health`

`server/render.yaml` in this repo captures the same settings as a Blueprint if
you prefer "New → Blueprint".

> The build needs `typescript` and the `@types/*` packages, so they live in
> `dependencies` (not `devDependencies`) — `npm install` with `NODE_ENV=production`
> still installs them. Truly dev-only tools (`tsx`, `drizzle-kit`, `pino-pretty`,
> `embedded-postgres`) stay in `devDependencies` and are not shipped to prod.

### 2.2 Environment variables (Render dashboard → Environment)

| Var | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | turns on the prod safety checks below |
| `PORT` | `4000` | Render also injects its own; the app reads `PORT` |
| `LOG_LEVEL` | `info` | JSON logs, no pretty printer in prod |
| `SESSION_SECRET` | *(generate)* | `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` — **≥32 chars, never reuse the dev value** |
| `SESSION_TTL_HOURS` | `168` | 7-day sliding session |
| `ADMIN_EMAIL` | Shahid's real email | seeds the single admin on first boot |
| `ADMIN_PASSWORD` | a strong password | used only for the initial seed; change it in-app after first login |
| `ADMIN_NAME` | `Shahid Khan` | |
| `DATABASE_URL` | the Neon string | must **not** be localhost |
| `USE_EMBEDDED_PG` | `false` | **required** — no embedded Postgres in prod |
| `CORS_ORIGIN` | `https://<your-frontend-domain>` | **exact** deployed frontend origin, no trailing slash, no localhost |
| `NOTIFICATIONS_INTERVAL_MINUTES` | `60` | |
| `RENEWAL_LEAD_DAYS` | `30` | |
| `DEADLINE_LEAD_DAYS` | `5` | |

> **Production refuses to start** if `SESSION_SECRET` is a known dev value or <32
> chars, `ADMIN_PASSWORD` is the placeholder, `CORS_ORIGIN` contains `localhost`,
> `USE_EMBEDDED_PG` is not `false`, or `DATABASE_URL` points at localhost
> (`server/src/config/env.ts`). The log line tells you exactly which.

### 2.3 First deploy
Render builds, runs `db:migrate:prod` against Neon, starts the server, seeds the
admin. Confirm `https://<backend>/api/health` returns `{"data":{"status":"ok",...}}`.

### 2.4 Optional: sample data
The production DB starts empty (correct for a real agency). If you want the demo
dataset to explore first, run once from your machine with the prod URL:
```bash
cd server
DATABASE_URL="<neon-url>" USE_EMBEDDED_PG=false npm run db:seed
```

## 3. Frontend — Vercel

- New Project → import this repo.
- **Framework Preset:** Vite. **Root Directory:** repo root (leave blank).
- **Build Command:** `npm run build` → **Output Directory:** `dist`
- **Environment variable:** `VITE_API_URL = https://<your-backend-domain>/api`
- `vercel.json` in this repo rewrites all paths to `index.html` so deep links
  (`/projects/proj-02`, a hard refresh on any route) work on the static host.

Deploy. Then open the frontend URL — it should show the login screen.

## 4. Lock CORS to the real frontend

Once the frontend domain is known, set the backend's `CORS_ORIGIN` to exactly
that origin (e.g. `https://orca.dopeorca.tech`) and redeploy the backend. The
permissive "any localhost port" matching only applies when `NODE_ENV !==
production`, so a production deploy is already strict — this step just points it
at the right domain.

For a custom domain: add it in Vercel (frontend) and/or Render (backend), then
update `CORS_ORIGIN` and `VITE_API_URL` to match and redeploy both.

## 5. Verify live (repeat the core flows against production URLs)

- [ ] `GET https://<backend>/api/health` → 200
- [ ] Open the frontend → login screen, HTTPS padlock
- [ ] Log in with the seeded admin → Dashboard loads
- [ ] Add a lead → appears in Leads + Pipeline
- [ ] Convert a Won lead → Client + Project created
- [ ] Record a payment → invoice / project / Finance / Dashboard all update
- [ ] Add an AMC with a near-term renewal → shows "Expiring Soon" + a notification
- [ ] Global search finds records and links to them
- [ ] Hard-refresh a deep URL (`/projects/<id>`) → loads correctly, not a blank page
- [ ] Log out → protected routes redirect to `/login`
- [ ] Change the admin password in Settings → log out → log back in with the new one

## 6. Day-to-day

- **Redeploy:** `git push` (both hosts auto-build) or click "Redeploy" in the dashboard.
- **Schema change:** add a migration (`cd server && npm run db:generate`), commit,
  push — Render's pre-deploy command applies it.
- **Logs:** Render's "Logs" tab. Structured JSON (pino); credentials are redacted.
- **Backups:** Neon keeps automatic point-in-time backups on its free tier.
- **Rotate the admin password** from Settings, not by re-seeding.
