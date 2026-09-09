# DopeOrca OS — Backend (Prompt 09)

The API + auth + business-logic layer that Prompt 11 will connect the frontend to.
**The frontend still runs on its own mock data** — this server exists and works on its own.

## Stack — and why

| Choice | Why it fits a solo-agency tool |
|---|---|
| **Node.js + TypeScript** | Same language as the frontend; shared entity shapes in spirit. |
| **Express 4** | The most widely-understood Node web framework. Nothing exotic to maintain long-term. |
| **Zod** | One schema per endpoint enforces required fields, types and enums, and produces the field-level error envelope. |
| **bcryptjs** | Slow KDF, pure-JS (no native build step). |
| **pino** | Structured, leveled logs — pretty in dev, JSON in prod. |
| **helmet / express-rate-limit / cookie-parser** | Small, boring, well-supported security middleware. |

**Database (Prompt 10): PostgreSQL via Drizzle ORM.** Data lives behind the same **repository
interface** (`src/repositories/`); the in-memory stub was replaced by `DbRepository` (`src/db/`)
with no change to services, controllers or the API contract. See `## Database` below.

## Run

```bash
cd server
cp .env.example .env          # then set SESSION_SECRET + ADMIN_PASSWORD
npm install
npm run dev                   # tsx watch, http://localhost:4000
# or
npm run build && npm start    # start = production; needs an external DATABASE_URL
```

`npm run dev` boots a local **embedded Postgres** automatically (no install, no Docker — data in
`server/.pgdata`), applies migrations, then starts the API. On first start with no admin, the account
from `ADMIN_EMAIL` / `ADMIN_PASSWORD` is seeded (spec Section L — no public sign-up).

**Before the first `npm run dev`, load the sample data once** so every endpoint returns realistic
content: `npm run db:seed`.

## Database

PostgreSQL + **Drizzle ORM / drizzle-kit** — SQL-first, plain version-controlled `.sql` migrations,
no generated client or runtime query engine, cleanest fit for this ESM + Express backend.

| Command | What it does |
|---|---|
| `npm run db:up` | Start the embedded Postgres and keep it running (Ctrl+C to stop). Optional — only if you want one long-lived DB shared by several terminals. |
| `npm run db:generate` | Regenerate SQL migrations from `src/db/schema.ts` after a schema change. |
| `npm run db:migrate` | Apply pending migrations (`src/db/migrations/`). |
| `npm run db:seed` | Migrate, then load the sample dataset (truncates sample tables first; keeps the admin user). |
| `npm run db:reset` | Drop everything, re-migrate, re-seed. Dev only. |
| `npm run db:studio` | Drizzle Studio — browse the DB in the browser. |

Local dev uses the embedded server against `DATABASE_URL`. **Production:** point `DATABASE_URL` at a
managed Postgres, set `USE_EMBEDDED_PG=false`, run `npm run db:migrate` on deploy, then `npm start`.

Schema notes: `text` primary keys (ids like `lead-01`, `inv_<uuid>`); money is `numeric(12,2)`,
single currency INR (a `currency` column defaulted to `'INR'` rides along on money tables for
future-proofing); all timestamps `timestamptz` (UTC); enums are `text` + `CHECK` constraints.
Foreign keys: `RESTRICT` on financially-linked rows (client→project/invoice/payment, payment→invoice),
`CASCADE` on child checklists (project_stages, amc_tasks), `SET NULL` on soft links
(lead↔client, project→invoice/payment/amc, task→client). Derived values (invoice balance/overdue,
AMC status, client balance, analytics aggregates) are **not** stored — the service layer computes
them; `projects.progress_percent` is the one stored rollup, maintained by `project.service` exactly
as in Prompt 09.

## API

Every response uses one envelope:

```jsonc
// success
{ "data": <payload>, "meta"?: { ... } }
// error
{ "error": { "message": "human-readable", "code": "validation_error" | "unauthorized" | ... } }
```

Auth is a session cookie (`orca_session`, httpOnly, SameSite=Lax, sliding renewal). State-changing
requests from an authenticated client must echo the readable `orca_csrf` cookie in an `X-CSRF-Token`
header (double-submit CSRF). All routes except `/api/health` and `/api/auth/(login|status)` require a session.

| Group | Routes |
|---|---|
| Auth | `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` · `POST /api/auth/change-password` · `GET /api/auth/status` |
| Dashboard | `GET /api/dashboard` |
| Leads | `GET/POST /api/leads` · `GET/PATCH/DELETE /api/leads/:id` · `POST /api/leads/:id/{stage,log-call,convert,archive}` · `GET /api/leads/:id/{activity,follow-ups}` |
| Clients | `GET/POST /api/clients` · `GET/PATCH/DELETE /api/clients/:id` · `GET /api/clients/:id/{projects,tasks,finance,activity,follow-ups}` |
| Follow-ups | `GET/POST /api/follow-ups` · `POST /api/follow-ups/:id/{complete,reschedule}` · `DELETE /api/follow-ups/:id` |
| Projects | `GET/POST /api/projects` · `GET/PATCH/DELETE /api/projects/:id` · `POST /api/projects/:id/status` · `GET /api/projects/:id/stages` · `POST /api/projects/:id/stages/:stageId` · `GET /api/projects/:id/{tasks,finance,activity}` |
| Tasks | `GET/POST /api/tasks` · `GET/PATCH/DELETE /api/tasks/:id` · `POST /api/tasks/:id/toggle` |
| Finance | `GET /api/finance/overview` · `GET/POST /api/finance/invoices` · `GET/PATCH/DELETE /api/finance/invoices/:id` · `POST /api/finance/invoices/:id/status` · `GET /api/finance/invoices/:id/payments` · `GET/POST /api/finance/payments` · `DELETE /api/finance/payments/:id` · `GET/POST /api/finance/expenses` · `PATCH/DELETE /api/finance/expenses/:id` |
| Analytics | `GET /api/analytics?period=3m\|6m\|12m\|ytd` |
| AMC | `GET/POST /api/amc` · `GET/PATCH/DELETE /api/amc/:id` · `GET/POST /api/amc/:id/tasks` · `POST /api/amc/:id/tasks/:taskId/toggle` · `DELETE /api/amc/:id/tasks/:taskId` |
| Settings | `GET/PATCH /api/settings` |
| Notifications | `GET /api/notifications` · `POST /api/notifications/:id/read` · `POST /api/notifications/read-all` |
| Search | `GET /api/search?q=` |

## Business logic (`src/services/`)

Kept out of route handlers and out of the data layer. Each rule is a named, testable function:

- **conversion.service** — lead → client → project, with `sourceLeadId` / `convertedClientId` linkage + activity log; lead is never deleted.
- **invoice.service** — `displayStatus()` derives `overdue` / `pending` from due-date + payments (never stored); manual transitions draft→sent→paid/cancelled.
- **payment.service** — records a payment, reduces the (derived) invoice balance, flips the invoice to Paid when settled, fires `payment_received`.
- **finance.service** — `revenueSummary`, `breakdownByClient`, `moneyByMonth`, `projectFinance`, `clientFinance` — all derived, no denormalised totals.
- **analytics.service** — monthly revenue, conversion rate, throughput, average project value, client acquisition.
- **project.service** — `progressFromStages()` rollup; status change re-aligns the stage checklist.
- **amc.service** — `amcStatus()` derives Active / Expiring Soon / Expired from `renewalDate`.
- **activity.service** — central append-only logger.
- **notification.service** — `evaluate()` scheduled pass (follow-ups due, tasks/invoices overdue, AMC renewals, deadlines) + event-driven `onPaymentReceived` / `onNewLead`, de-duped `type:entityId:day`. **No delivery.**
- **dashboard.service** — one payload aggregating every module.

## Security (proportionate to a solo internal tool)

Passwords bcrypt-hashed (never logged) · session cookie httpOnly/Secure/SameSite · CSRF double-submit
on state-changing requests · rate limits on auth (20/15min) and search · `helmet` headers
(HSTS, CSP `default-src 'none'`, `noSniff`, `frame-ancestors 'none'`) · centralized error handling
(no stack traces to the client) · all input Zod-validated before it reaches a service.
**HTTPS is a deployment requirement** — terminate TLS at the hosting provider's proxy.

## Env

See `.env.example`. `.env` is git-ignored. `DATABASE_URL` is only used from Prompt 10.

## Layout

```
src/
  config/       env (zod-validated), defaults
  types/        entities (mirror spec §G), api envelope
  utils/        logger, ids, dates, password, errors, envelope, wrap
  middleware/   auth, validate, csrf, rate-limit, error-handler
  repositories/ Repository<T> interface, in-memory impl, db wiring, seed
  services/     all business logic — one file per domain
  schemas/      zod request schemas
  routes/       thin controllers, one file per resource group
  jobs/         notifications interval runner
```
