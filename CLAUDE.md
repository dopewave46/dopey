# DopeOrca OS

Private internal operating system for **DopeOrca Technologies** (solo web-design agency, Mumbai). Single admin user · INR ₹ · Asia/Kolkata · desktop-first, fully responsive.

Two packages: the frontend at the repo root, the backend in **`server/`** (its own package.json / tsconfig / README).

## Frontend stack

- **Vite + React 18 + TypeScript**, React Router 6 (`createBrowserRouter`)
- Plain **CSS Modules** + design tokens in `src/styles/tokens.css`. No CSS framework, no component library.
- **P11: fully wired to the backend.** No mock data. `src/services/api.ts` is the one HTTP client (credentials + CSRF + envelope + 401 → login). Each `src/services/*Store.ts` still uses `useSyncExternalStore` but now `hydrate()`s from the API on boot and mutates through it. `src/services/auth.tsx` (`AuthProvider`) guards the shell via `GET /auth/me`; `/login` is the sign-in screen.
- Run both: `cd server && npm run db:seed && npm run dev` (once), then `npm run dev` at the root. Login: `admin@dopeorca.local` / `OrcaAdmin123` (or whatever `server/.env` seeds).

## Backend (`server/` — Prompt 09 + 10)

- **Node + TypeScript + Express 4 + Zod**. `cd server && npm i && cp .env.example .env && npm run db:seed && npm run dev` (port 4000). See `server/README.md`.
- Layers: `routes/` (thin) → `services/` (all business logic) → `repositories/` (`Repository<T>` interface).
- **P10: PostgreSQL via Drizzle ORM** (`server/src/db/`). `DbRepository` replaced the in-memory stub — services/controllers/API contracts unchanged. Migrations in `server/migrations/`; `npm run db:migrate` / `db:seed` / `db:reset`. Local dev auto-starts an embedded Postgres (no install); prod uses `DATABASE_URL` + `USE_EMBEDDED_PG=false`.
- Auth: httpOnly session cookie + CSRF double-submit; single seeded admin. One response envelope `{data}` / `{error:{message,code}}`.

## Commands

| | |
|---|---|
| `npm run dev` | Vite dev server (port 5173) |
| `npm run build` | `tsc --noEmit` then `vite build` |
| `npm run typecheck` | types only |

## Locked references — do not deviate

- **`docs/master-product-spec.html`** — approved scope (Prompt 01). No GST/tax anywhere. Light theme only.
- **`docs/design-system.html`** — locked visual language (Prompt 02). Inter; crimson `#C1121F`; tokens, spacing (base 4), radius, shadow, components. No page may introduce a colour/font/spacing/radius/shadow/component outside this.

## Architecture

```
src/
  components/
    icons/       Icon.tsx — single inline-SVG icon set (IconName union)
    ui/          design-system primitives: Button, Card, StatCard, StatusBadge,
                 Menu, Modal, Drawer, ConfirmDialog, Field, PageHeader,
                 Breadcrumbs, EmptyState, Skeleton, ErrorState, StubActionButton
    feedback/    ToastProvider + useToast
    shell/       Sidebar, Header, Clock, GlobalSearch/SearchPalette,
                 NotificationBell, ProfileMenu, MobileNav, BottomTabBar,
                 GlobalActions, RouteError
  layouts/       AppShell.tsx — sidebar + header + <Outlet> + mobile nav
  pages/         one file per route; PlaceholderModule for not-yet-built modules
  hooks/         useClock, useMediaQuery, useOnClickOutside, useDisclosure
  services/      api.ts (HTTP client), auth.tsx (AuthProvider/guard), *Store.ts
                 (API-backed useSyncExternalStore modules), *Selectors.ts,
                 hydration.ts (boot load), notificationStore.ts, dashboardData.ts
  config/        navigation.ts (locked nav order)
  utils/         cn, format (INR currency, IST dates, relative time), apiError, runAction
```

### Conventions

- Routes are registered in `src/routes.tsx`; every page renders inside `AppShell`.
- Nav order is locked in `src/config/navigation.ts` (Prompt 03 §1).
- The live clock is `Asia/Kolkata`, updates every second — `useClock()` / `<Clock>`.
- Every "Add X" action opens the module's ONE shared modal (TaskFormModal, LeadFormModal,
  NewProjectModal, InvoiceFormModal, RecordPaymentModal, AmcFormModal) — never a duplicate form.
- All money via `formatCurrency()`, all dates via `formatDate()` — never inline `Intl`.
- New shared UI goes in `components/ui` and must use only design tokens.

## Status — full stack wired (P01–P11)

- ✅ P01 spec · P02 design system · P03 shell · P04 Dashboard · P05 CRM · P06 Projects · P07 Finance/Analytics · P08 Tasks/AMC · P09 backend · P10 Postgres · **P11 full integration**
- **P11 — frontend ↔ backend ↔ DB, end to end.** `src/data/sample*` DELETED. `src/services/api.ts` is
  the one HTTP client: `credentials:'include'`, auto `X-CSRF-Token` from the `orca_csrf` cookie on
  unsafe methods, unwraps `{data}`/`{error}`, 401 → registered handler → `/login`. `src/services/auth.tsx`
  (`AuthProvider` + `useAuth`) probes `GET /auth/me` on boot; `AppShell` shows a splash while probing,
  redirects to `/login` if unauthed, then `hydrateAll()` loads every store. `src/pages/LoginPage.tsx`
  (email+password, existing Input/Button). Each `*Store.ts` kept its `useSyncExternalStore` surface but
  now `hydrate()`s from list endpoints and every mutation is `async` → API → refetch affected slice
  (cross-entity cascades like convert / payment re-hydrate the touched stores). `useSimulatedLoad()` now
  returns the real combined hydration flag. Dashboard: `src/services/dashboardData.ts` adapts
  `GET /dashboard` → the existing `DashboardData` view-model; "Preview data" banner removed. Notifications:
  `src/services/notificationStore.ts` polls `GET /notifications` every 60s + refetches after lead/payment;
  `useLiveNotifications`/`notificationSelectors` deleted. Search palette → debounced `GET /search`, grouped.
  Settings page → `GET/PATCH /settings`. Logout → `useAuth().logout()`. Invoice detail uses the backend's
  derived `displayStatus`/`balance`. AMC status comes from the server (`amcSelectors.amcStatus` prefers
  `amc.status`). Helpers: `src/utils/apiError.ts`, `src/utils/runAction.ts` (`run()` toasts failures).
  Verified via headless-Chrome CDP: login→dashboard real numbers, add-lead persists, lead→client
  conversion, refresh keeps session, logout redirects, protected routes redirect, 0 console exceptions.
- P08: `taskStore` (`useTasks`) owns ALL tasks — moved out of projectStore.
  selectors `src/services/taskSelectors.ts` (buckets today/upcoming/overdue/completed, grouping).
  `amcStore` (`useAmc`) + `amcSelectors.ts`.
- P08: `taskStore` (`useTasks`) owns ALL tasks — moved out of projectStore. Seed `src/data/sampleTasks.ts`,
  selectors `src/services/taskSelectors.ts` (buckets today/upcoming/overdue/completed, grouping).
  `amcStore` (`useAmc`) + `src/data/sampleAmc.ts` + `amcSelectors.ts` (status derived from renewalDate).
  Routes `/tasks`, `/amc`, `/amc/:id` (nav item now `to:/amc`, `/maintenance` redirects). Shared
  `tasks/TaskFormModal` used by /tasks, Dashboard QuickActions, Project + Client Tasks tabs.
  `tasks/TaskDrawer` (lightweight edit/delete). `amc/AmcFormModal`.
  Notifications now LIVE: `useLiveNotifications` + `notificationSelectors.deriveNotifications()`
  merges sample events with derived AMC-renewal / overdue-invoice / overdue-task notices; bell +
  `/notifications` page navigate on click.
  Dashboard QuickActions (Add Lead/Task/Payment) + TodayTasksCard now all use real shared stores —
  no `StubActionButton`/`PlaceholderModule` left (both deleted). Deleted `pages/MaintenancePage.tsx`,
  `components/projects/AddProjectTaskModal.tsx`. Added `AmcTask` interface to types.ts.
- **Every page now shares one cross-linked mock dataset. Next: backend (P09–P11).**
- P07: **`src/services/financeStore.ts`** (`useFinance`) is the ONE money source — invoices,
  payments, expenses. Seed `src/data/sampleFinance.ts`, selectors `src/services/financeSelectors.ts`
  (invoiceDisplayStatus derives overdue/pending; revenueSummary; clientFinance; projectFinance;
  moneyByMonth). `src/layouts/FinanceLayout.tsx` + tabbed pages `src/pages/finance/*`
  (Revenue/Invoices/Payments/Expenses) + standalone `/finance/invoices/:id`. `AnalyticsPage`
  rewritten with `src/components/charts/*` (hand-rolled SVG BarChart/LineChart/ChartCard, no lib).
  Shared `finance/RecordPaymentModal` + `finance/InvoiceFormModal` used by Payments page, Dashboard
  GlobalActions, Project + Client detail. `SAMPLE_PROJECT_FINANCE` and `SAMPLE_CLIENT_CONTEXT`
  deleted — Project Finance tab, ProjectCard payment chip, Client Invoices/Payments tabs, Dashboard
  Money + Revenue/Pending metrics all read from `financeStore`. Deleted `pages/FinancePage.tsx`,
  `components/projects/RecordPaymentModal.tsx`.
- P06: `src/services/projectStore.ts` (in-memory, `useProjects`), seed `src/data/sampleProjects.ts`,
  selectors `src/services/projectSelectors.ts`. Routes `/projects` (card grid + status board toggle)
  and `/projects/:id` (tabs: Overview/Tasks/Timeline/Finance/Links/Notes). `NewProjectModal` is the
  ONE "Start New Project" form — used by `GlobalActions` (Dashboard/header), ProjectsPage,
  ConvertLeadModal (prefilled) and ClientDetailPage. `financeFor()` payment status is placeholder
  (Prompt 07). Client profile Projects tab now shows real linked projects.
- P04: `src/pages/DashboardPage.tsx` + `src/components/dashboard/*`, binds `getDashboardData()`.
- P05: CRM module —
  - Routes: `/crm` `/leads` `/leads/:id` `/clients` `/clients/:id` `/follow-ups`. "Clients" added to sidebar nav.
  - **`src/services/crmStore.ts`** — in-memory store (leads/clients/followUps/activities) with
    `useSyncExternalStore` via `src/hooks/useCrm.ts`. Every view stays in sync. Async-shaped for a
    later real API. Seed data: `src/data/sampleCrm.ts`. Selectors: `src/services/crmSelectors.ts`.
  - `src/components/crm/*` — LeadFormModal, ConvertLeadModal (lead→client→project entry point),
    LeadKanban (native HTML5 DnD + per-card stage menu), ClientFormModal, ScheduleFollowUpModal,
    RescheduleModal, badges.
  - New shared primitives: `DataTable`, `SearchInput`, `InlineSelect`, `SegmentedControl`, `Tabs`,
    `ActivityTimeline`, `Toolbar`, `ProgressBar`, `ViewAllLink`. `useSimulatedLoad` for skeletons.
  - Lead stage badge tones locked per Prompt 05 §12 (in `StatusBadge.tsx`).
- ⬜ Projects (P06), Finance/Analytics (P07), Tasks/AMC (P08) real pages
- ⬜ Backend, database, authentication (P09+)
