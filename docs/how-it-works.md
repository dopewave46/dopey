# DopeOrca OS — How It Works

*A complete, plain-language map of the system as it exists today. Written 2026-09-22 as a documentation snapshot — no code was changed to produce this.*

---

## 1. What This System Is

DopeOrca OS is a **private, internal operating system for DopeOrca Technologies** — a one-person (solo-admin) web-design agency based in Mumbai. It is not a product sold to anyone; it's the single tool the agency owner uses to run their entire business day to day.

It replaces what would otherwise be a scattered mix of spreadsheets, WhatsApp notes, and a invoicing app. In one place it tracks:

- Who's interested in hiring the agency (**leads**) and turns the promising ones into paying **clients**.
- The actual web-design work being done for each client (**projects**, their stages, and the tasks inside them).
- The money — **invoices**, **payments** received, and **expenses** the agency incurs.
- Ongoing maintenance retainers sold after a project ships (**AMC — Annual Maintenance Contracts**).
- A day-to-day to-do list (**tasks**) and reminders to follow up with people (**follow-ups**).
- A dashboard and analytics view summarizing all of the above.

There is exactly one user: the admin (owner). There are no client logins, no team members, no multi-tenancy. Currency is always INR (₹), timezone is always Asia/Kolkata, and there is deliberately **no GST/tax handling** — that was explicitly ruled out of scope from the start (see `docs/master-product-spec.html`).

---

## 2. Full Feature Map

### Dashboard — `/dashboard`
**What it does:** A single-screen morning-briefing view — pulls a summary from every other module into one page.
**Actions:** No CRUD here directly; "Quick Actions" shortcuts jump into Add Lead / Add Task / Record Payment flows (opening the same shared modals other pages use).
**Looks like:** A greeting header, stat cards (active projects, leads, revenue), a money card, a sales-pipeline snapshot, today's tasks, recent activity feed, and a project-flow list — all read-only summaries with links deeper into the app.

### CRM Hub — `/crm`
**What it does:** A CRM landing page — recent leads, recent clients, upcoming follow-ups, and clients who need attention (overdue invoice, gone quiet, inactive).
**Actions:** "Add Lead" opens `LeadFormModal`; "Follow-ups" jumps to `/follow-ups`; clicking any row navigates to that lead/client/follow-up's detail page.
**Looks like:** A dashboard-style hub of small cards feeding into the deeper CRM pages.

### Leads — `/leads`, `/leads/:id`
**What it does:** The sales pipeline — every prospect who has inquired, from first contact through won/lost.
**Actions:** List view (sortable table) or Pipeline view (Kanban board, drag cards between pipeline stages); filter by search text, stage, source, or service requested; add a lead; edit a lead; change its pipeline stage (dragging into "Won" prompts conversion); log a call note; mark/complete follow-ups; archive a lead (soft-delete); convert a won lead into a client.
**Looks like:** A table or Kanban board of prospect cards; the detail page is a single prospect's full history with an editable stage dropdown and a call-log box.

### Clients — `/clients`, `/clients/:id`
**What it does:** Every active or past paying client — profile, and everything tied to them (projects, invoices, payments, tasks, notes).
**Actions:** List is filterable (status, location, "has active project" / "has overdue invoice") but **read-only** — there is no "Add Client" button anywhere; clients are only created by converting a lead. On the detail page: edit client info; add a project for this client; add a task; schedule a follow-up; add a note; create an invoice; record a payment; toggle tasks done.
**Looks like:** A table of client cards, or on the detail page, a tabbed profile (Overview / Projects / Invoices / Payments / Tasks / Notes / Activity).

### Follow-ups — `/follow-ups`
**What it does:** A unified reminder list of every scheduled follow-up across leads and clients, bucketed by urgency.
**Actions:** Mark a follow-up done; reschedule it to a new date.
**Looks like:** Four grouped lists — Overdue / Today / This week / Later.

### Projects — `/projects`, `/projects/:id`
**What it does:** Every web-design project being built, tracked through a fixed production pipeline.
**Actions:** Grid or Board (drag-by-status) view; filter/search/sort; start a new project; on the detail page — edit project details, delete it, change status, click through a visual stage timeline (each stage cycles not-started → in-progress → done), add/toggle tasks, create an invoice, record a payment, edit staging/live/repo links, add notes.
**Looks like:** A grid of project cards with progress bars, or a status board (columns = planning/UI-UX/development/…/completed/on-hold); the detail page is a tabbed workspace (Overview / Tasks / Timeline / Finance / Links / Notes).

### Tasks — `/tasks`
**What it does:** The agency-wide to-do list — every task across all projects and clients in one place.
**Actions:** Add a task (optionally tied to a project/client); toggle done/not-done; view/group by bucket (today/upcoming/overdue/completed) or by project/priority; open a task in a lightweight detail drawer.
**Looks like:** A stat row plus a filterable, groupable checklist.

### Finance — `/finance` (Revenue / Invoices / Payments / Expenses tabs), `/finance/invoices/:id`
**What it does:** All money in and out of the business.
- **Revenue tab:** earned/received/pending/overdue/expenses/profit for a chosen period, broken down by client and by month.
- **Invoices tab:** every invoice, its status, and a "Create Invoice" action.
- **Invoice detail page:** one invoice's amount, status, linked payments; can edit while still a draft, record a payment against it, or change its status.
- **Payments tab:** every payment received; "Record Payment" action.
- **Expenses tab:** agency running costs (hosting, domains, software, ads, equipment, ops); add/edit/delete.
**Actions:** Create/edit invoices, record payments, add/edit/delete expenses, manually transition invoice status (draft → sent → paid/cancelled).
**Looks like:** Four tabbed sub-pages under a shared Finance header; tables with filters, one bar chart on Revenue.

### Analytics — `/analytics`
**What it does:** Read-only business reporting — trends over a chosen period.
**Actions:** None (period selector only). No add/edit/delete anywhere on this page.
**Looks like:** Stat cards (revenue received, leads created, conversion rate, projects completed, active projects, avg. project value) plus five charts (revenue over time, lead conversion, project throughput, revenue-vs-expenses/profit, client acquisition).

### Maintenance / AMC — `/amc`, `/amc/:id`
**What it does:** Ongoing annual maintenance contracts sold to clients after their project ships (hosting renewals, upkeep retainers).
**Actions:** Add an AMC/maintenance plan (optionally tied to a client + project); filter by status/payment status; on the detail page — edit, delete, and manage an inline maintenance checklist (add/toggle/delete checklist items).
**Looks like:** A stat row (active AMCs, expiring soon, hosting renewals due, AMC revenue), an "upcoming renewals" widget (30/60/90-day window), and a filterable table; the detail page shows the contract plus a renewal countdown and checklist.

### Settings — `/settings`
**What it does:** Agency-level configuration.
**Actions:** Edit agency name, location, AMC renewal lead-days, project deadline lead-days; save (which refreshes the whole app's cached agency context). Notification-preference toggles, timezone, currency, and admin identity are shown but read-only on this page.
**Looks like:** A simple settings form.

### Notifications — `/notifications` (+ header bell)
**What it does:** A feed of system-generated alerts — new leads, payments received, AMC renewals coming up, overdue tasks/invoices, upcoming project deadlines.
**Actions:** Click a notification to mark it read and jump to the related record; "Mark all read."
**Looks like:** A dropdown from the header bell, or the full list on its own page.

### Search — global command palette (no dedicated page)
**What it does:** Instant cross-entity search (leads, clients, projects, tasks, invoices) plus fuzzy navigation to any page in the app.
**Actions:** Type to search, press Enter to jump to the top result, Esc to close.
**Looks like:** A keyboard-triggered overlay (like Spotlight/Cmd-K), not a route.

### Auth — `/login`
**What it does:** Single-admin sign-in. No self-signup, no multi-user roles.
**Actions:** Log in (email + password); log out (from the profile menu); change password.
**Looks like:** A plain email/password form. If already logged in, visiting `/login` bounces straight to the dashboard.

---

## 3. How Everything Is Connected

### The core chain: Lead → Client → Project → Task / Invoice / Payment

```
Lead  ──convert (manual)──▶  Client  ──add project (manual)──▶  Project
                                │                                   │
                                ├──add task (manual)────────▶  Task ┤ (task can link to project AND/OR client)
                                │                                   │
                                ├──create invoice (manual)──▶ Invoice ──record payment (manual)──▶ Payment
                                │                                                                     │
                                └──add AMC (manual)─────────▶  AMC (Maintenance Contract) ◀───────────┘
                                                                (optionally linked to a project too)
```

**Nothing in this chain happens automatically except the money math on invoices/payments.** Every arrow above other than "record payment updating an invoice" requires the admin to click a button and fill a form. This is intentional — it's a single-admin tool, not an automation platform.

### Lead → Client conversion — the exact steps

1. Admin opens a lead and clicks "Convert to Client" (or drags its Kanban card into "Won", which triggers the same modal).
2. The `ConvertLeadModal` shows a pre-filled client form (name, business, phone, email, etc. copied from the lead) for final review/edit.
3. On confirm, the backend (`conversion.service.ts`):
   - Creates a new **client** row, stamping `sourceLeadId` back to the original lead (so you can always trace a client back to the lead it came from).
   - Updates the **lead**: sets its stage to `won` and `convertedClientId` to the new client's id.
   - Logs a `lead_converted` activity entry on the new client.
   - **The lead row is never deleted** — it stays in the Leads list, now shown as won/converted, linking through to its client.
4. Optionally, in the same step, a **project** can be created immediately — its `value` defaults from the project field or falls back to the lead's `estimatedValue`, and `requirements` similarly falls back to the lead's stated requirements.
5. A second "Create project" button is offered right after conversion if you skipped step 4.

**Gotcha:** a lead can only be converted once — trying again throws a conflict error ("already converted"). If you need a second project for the same contact, you add it from the *client's* Projects tab, not by re-converting the lead.

### How a Project connects to a Client

Every project **must** belong to exactly one client (`projects.clientId` is `NOT NULL`, and deleting a client is blocked — `ON DELETE RESTRICT` — while it still has projects). A client can have any number of projects. There is no way to create a "clientless" project — the New Project form always requires picking (or being pre-filled with) a client.

### How Payments connect to Invoices, Projects, and Clients

- A payment can be linked to an invoice, a project, and/or a client — but it always needs a client one way or another.
- If a payment is linked to an **invoice**, the backend automatically fills in that invoice's client/project onto the payment (overriding whatever was typed), so a payment against an invoice is always correctly attributed.
- Recording a payment against an invoice **automatically updates that invoice's status**:
  - If the total of all completed payments now covers the full invoice amount → invoice becomes `paid`.
  - If it's the invoice's *first* payment and the invoice was still `draft` → it's bumped to `sent`.
  - Deleting a payment can roll a `paid` invoice back to `sent` if that removes enough money to leave a balance outstanding.
- **Invoice status has a manual half and a computed half.** The stored status is only ever `draft | sent | paid | cancelled` (set by the admin, or auto-advanced by a payment as above). The `overdue` and `pending` states you see in the UI are **never stored** — they're computed fresh every time the invoice is read: overdue if the due date has passed and it isn't fully paid; pending if it's partially paid but not yet fully covered and not yet overdue.
- Deleting an invoice is blocked if any payments are already linked to it (cancel it instead).

### How AMC/Maintenance connects to Clients and Projects

- Every AMC contract belongs to a client (required) and can optionally reference the specific project it followed on from (optional — some AMCs may be sold standalone).
- AMC "status" (`active` / `expiring_soon` / `expired`) is **computed on every read**, never stored — based on days remaining until `renewalDate` compared against the agency-wide "renewal lead days" setting (adjustable on the Settings page). `paymentStatus` (due/paid/overdue), by contrast, **is** a stored column, separate from that computed renewal status.
- Deleting an AMC contract cascades and deletes its maintenance checklist items automatically.

### Tasks — the flexible connector

A task can be linked to a project, a client, both, or neither (a pure personal to-do). If you create a task under a project without specifying a client, the backend auto-fills the client from that project. Deleting a project cascades and deletes its tasks; deleting a client (if it were allowed) would only unlink tasks (`SET NULL`), not delete them — moot in practice since clients with dependents can't be deleted anyway.

### Where things are explicitly NOT auto-connected (the gotchas)

- **Lead → Client is never automatic.** A lead sitting at "Won" stage that hasn't been through the Convert flow is *not* a client and won't show up anywhere in the Clients list.
- **Client → Project is never automatic.** Converting a lead does not force-create a project; you have to explicitly add one (the UI just makes it a one-click follow-on).
- **Invoice → "sent"/"paid" is only automatic via payments**; the admin must manually move a `draft` invoice to `sent` if no payment has been recorded yet, and must manually cancel invoices — the system never auto-cancels.
- **A converted lead is not deleted or hidden** — it remains visible in `/leads` history, which surprises people expecting the pipeline to "empty out" after wins.
- **AMC contracts don't auto-generate from a completed project.** Finishing a project does not create a maintenance contract — that's a separate manual add.
- **Notifications don't send anything externally.** They're purely in-app database rows shown in the bell/notifications page — there is no email/SMS delivery (see §6).

---

## 4. Where Things Live (File Map)

### Frontend (`src/`)
| Folder | Contents |
|---|---|
| `src/pages/` | One file per route — the top-level screen for each module (`DashboardPage.tsx`, `LeadsPage.tsx`, `ProjectDetailPage.tsx`, `finance/*`, etc.) |
| `src/components/` | Reusable UI, organized by domain: `crm/`, `projects/`, `finance/`, `tasks/`, `amc/` (modals + widgets specific to that module); `ui/` (design-system primitives — Button, Card, DataTable, Modal, etc.); `shell/` (sidebar, header, search palette, notification bell); `icons/` (single inline-SVG icon set); `feedback/` (toast system) |
| `src/layouts/` | `AppShell.tsx` (sidebar + header + page outlet + mobile nav, also runs the auth guard and boot hydration) and `FinanceLayout.tsx` (tabbed Finance sub-nav) |
| `src/services/` | All data logic: `api.ts` (the one HTTP client), `auth.tsx` (login/session state), one `*Store.ts` + `*Selectors.ts` pair per domain (crm, project, finance, task, amc, notification), `hydration.ts` (boot-time data load), `dashboardData.ts` |
| `src/config/` | `navigation.ts` — the locked sidebar/mobile-nav order |
| `src/hooks/` | Small reusable hooks (`useClock`, `useMediaQuery`, `useDisclosure`, etc.) |
| `src/utils/` | Formatting helpers (currency, dates), `apiError.ts`, `runAction.ts` |
| `src/styles/` | `tokens.css` — the design-system's locked colors/spacing/radius/shadow tokens |
| `src/routes.tsx` | The single route table (`createBrowserRouter`) |

### Backend (`server/src/`)
| Folder | Contents |
|---|---|
| `server/src/routes/` | Thin route handlers, one file per module (`leads.routes.ts`, `finance.routes.ts`, `amc.routes.ts`, etc.), all mounted under `/api` in `routes/index.ts` |
| `server/src/services/` | All business logic — one file per module, plus cross-cutting ones: `conversion.service.ts` (lead→client→project), `invoice.service.ts` (status derivation), `payment.service.ts` (payment→invoice cascade), `amc.service.ts` (renewal status derivation), `activity.service.ts` (audit log), `notification.service.ts`, `dashboard.service.ts`, `analytics.service.ts`, `search.service.ts` |
| `server/src/repositories/` | The data-access layer — `types.ts` (the `Repository<T>` interface every service codes against), `db-store.ts` (`DbRepository<T>`, the Postgres/Drizzle implementation), `index.ts` (the single `db` object wiring one repository per table) |
| `server/src/db/schema.ts` | The full Drizzle table definitions — every column, default, and CHECK-constrained enum, for every table |
| `server/migrations/` | Generated SQL migrations from the schema |
| `server/src/middleware/` | `auth.ts` (session check), `csrf.ts`, `rate-limit.ts`, `validate.ts` (Zod), `error-handler.ts` |
| `server/src/schemas/` | Zod request-validation schemas per route |
| `server/src/config/` | `env.ts` (parsed/validated environment config, with production safety refusals), `cookies.ts`, `defaults.ts` |

### Design system
`src/styles/tokens.css` (colors, spacing, radius, shadow tokens) and `src/components/ui/` (the primitives built on those tokens) are the only source of visual style — governed by the locked `docs/design-system.html` reference. No CSS framework is used anywhere.

---

## 5. How Data Flows — Two Worked Examples

### Example 1: "I add a new lead"

1. **Click:** Admin clicks "Add Lead" on `/leads` (or `/crm`). This opens the shared `LeadFormModal` component with an empty form.
2. **Submit:** Filling in name/business/phone/stage/etc. and clicking Save calls `crmStore.addLead(formData)` in `src/services/crmStore.ts`.
3. **Frontend → Backend:** `addLead` calls `api.post("/leads", formData)`. The one HTTP client (`src/services/api.ts`) attaches the session cookie, adds the CSRF header (read from the `orca_csrf` cookie), sends the request to the backend at `POST /api/leads`.
4. **Backend routing:** Express's global middleware chain runs first — CORS check, CSRF check, `requireAuth` (validates the session), rate limiter — then `leads.routes.ts`'s `POST /` handler runs, which Zod-validates the request body against the lead schema.
5. **Service layer:** `lead.service.ts`'s `createLead()` builds the full lead row (generating an id, timestamps), inserts it via the repository layer, and — if a `followUpDate` was given — also creates a follow-up row. It fires an `onNewLead` notification.
6. **Repository → Database:** `db.leads.insert(row)` runs a real `INSERT` against the Postgres `leads` table via Drizzle.
7. **Response:** The backend replies `{ data: <new lead> }` (the standard success envelope). The frontend unwraps this automatically in `api.ts`.
8. **Store update:** `crmStore` merges the new lead into its in-memory `leads` array and notifies all subscribed components — every page showing leads (the list, the CRM hub, the dashboard pipeline widget) re-renders instantly with the new lead, no full page reload or refetch needed. If a follow-up was created, the store also reloads the follow-ups slice, and the notification bell refetches to pick up the new-lead alert.

### Example 2: "I record a payment"

1. **Click:** Admin clicks "Record Payment" on the Payments page, an invoice detail page, or a client/project's Finance tab — all of these open the same shared `RecordPaymentModal`, optionally pre-filled with an invoice/project/client id.
2. **Submit:** Filling in amount/method/date and saving calls `financeStore.addPayment(formData)`.
3. **Frontend → Backend:** `POST /api/payments` (via `api.ts`, same cookie/CSRF/envelope handling as above).
4. **Backend:** `finance.routes.ts` validates the body, then `payment.service.ts`'s `recordPayment()` runs the cross-entity logic:
   - If an `invoiceId` was given, it looks up that invoice and overwrites the payment's client/project fields with the invoice's own client/project (so attribution is always correct even if the form left them blank).
   - Inserts the payment row (`status: completed` by default).
   - Sums all completed payments against that invoice. If they now cover the full invoice amount, it updates the invoice's `status` to `paid` and stamps `paidDate`. If this was the invoice's first payment and it was still `draft`, it bumps the invoice to `sent` instead.
   - Logs an activity entry ("payment received") and fires an `onPaymentReceived` notification.
5. **Database:** Two writes happen — an `INSERT` into `payments`, and potentially an `UPDATE` on the matching `invoices` row — both through the same `Repository<T>` abstraction, so the service code never touches SQL directly.
6. **Response & store update:** The frontend gets the new payment back, then `financeStore` re-fetches invoices+payments together (`reloadInvoicesAndPayments()`) so the invoice's now-current status/balance is reflected everywhere at once (invoice list, invoice detail, client Finance tab, project Finance tab, dashboard revenue numbers), and triggers a notification refresh.

Both examples show the same shape: **one HTTP client → thin route → service (all the real logic) → repository → Postgres**, and on the way back, **one store update → every subscribed component re-renders**. No page in the app fetches its own data ad hoc outside this pattern (Settings is the sole minor exception — it calls `api.get`/`api.patch` directly rather than through a store, since it has no cross-page state to share).

---

## 6. Current Limits / What's Not Built

Explicitly out of scope per the locked product spec and observed in the code:

- **No client portal.** Clients never log in or see anything — this is purely an internal admin tool.
- **No multi-user roles or team accounts.** One admin, `role` is hard-CHECK-constrained to `"admin"` only in the database.
- **No GST/tax handling anywhere** — amounts are flat INR figures, no tax line items, no tax reports.
- **No automated email/SMS/push delivery.** Notifications (new lead, payment received, AMC renewal, overdue task/invoice, upcoming deadline) are generated and stored as database rows only, surfaced in the in-app bell/notifications page. Nothing is ever emailed or texted to anyone.
- **No file attachments.** No uploads for contracts, design files, invoices-as-PDF, or client documents anywhere in the schema or UI.
- **No public sign-up / password reset flow.** Admin credentials are seeded via environment variables; there's a change-password endpoint but no "forgot password" email flow.
- **No true horizontal scaling.** Session tokens are split between the database and an in-memory `Map` inside the running Node process — restarting the server invalidates all sessions, and running multiple server instances without a shared session store or sticky sessions would break auth.
- **No real pagination on most list endpoints** — filtering happens over the full table (acceptable given expected single-admin scale of a few hundred rows per table, per an explicit code comment).
- **No native database enums** — status/category fields are `text` columns with `CHECK` constraints, not Postgres enum types (a stylistic choice, not a missing feature).
- **No referential integrity on polymorphic tables** (`follow_ups`, `activities`, `notifications`) — their `parentType`/`entityType` + id fields aren't real foreign keys, just CHECK-constrained type columns, so correctness there relies on the service layer rather than the database.
- **No automated invoice generation from projects** (e.g. no "auto-invoice on milestone complete") — every invoice is manually created.
- **No AMC auto-creation from completed projects** — a completed project does not spawn a maintenance contract automatically.
- **Deploy itself is a manual step** — the app is deploy-ready (Neon + Render + Vercel docs and configs exist), but the actual hosting accounts/deploy action is on the user, not automated by the codebase.

---

## 7. How to Safely Add Something New Later

The system follows one consistent layering everywhere, so any change tends to touch the same three places:

**To add a new field to an existing entity** (e.g. a new column on Projects):
1. **Database** — add the column in `server/src/db/schema.ts`, generate a migration (`npm run db:generate`), run it (`npm run db:migrate`).
2. **Backend** — add/extend the Zod schema in `server/src/schemas/`, thread the new field through the relevant `services/*.service.ts` (create/update functions), and through the route's validated body if needed. The route handler itself usually needs no change (it's thin — it delegates to the service).
3. **Frontend** — add the field to the relevant form (one of the shared modals, e.g. `NewProjectModal`), to the TypeScript type in wherever the entity's interface lives, and to any display views (detail page, table column) that should show it. The store's `hydrate()`/mutation methods usually don't need changes since they pass whole objects through.

**To add a brand-new module** (new entity type entirely):
1. **Database** — new table in `schema.ts` with appropriate FKs (`RESTRICT` if it holds financial/critical links, `CASCADE` for owned child data, `SET NULL` for soft/optional links), migrate.
2. **Backend** — new `repositories/index.ts` entry (`db.newThing = new DbRepository(...)`), new `services/newThing.service.ts` for the business logic, new `routes/newThing.routes.ts` (thin, wrapped in `wrap()`, validated via a new Zod schema), mount it in `routes/index.ts` (after the `requireAuth` line, so it's protected automatically).
3. **Frontend** — new `services/newThingStore.ts` following the existing `useSyncExternalStore` pattern (state + listeners + `hydrate()` + mutation methods calling `api.*`), add it to the `STORES` array in `hydration.ts` if it should load at boot, new page(s) in `src/pages/`, new route(s) in `src/routes.tsx`, and — if it needs a nav entry — add it to the locked list in `src/config/navigation.ts` (which requires care, since nav order is treated as a locked spec decision, not a casual edit).

**Rule of thumb:** business logic (status derivation, cross-entity cascades, validation) always belongs in a backend `services/*.ts` file, never in a route handler and never in the frontend. The frontend stores are deliberately "dumb" — they call the API and merge the response, they don't compute domain logic themselves (the one common exception is light read-only UI grouping/bucketing in `*Selectors.ts` files, which is presentation logic, not business logic).
