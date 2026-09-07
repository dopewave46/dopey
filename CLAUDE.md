# DopeOrca OS

Private internal operating system for **DopeOrca Technologies** (solo web-design agency, Mumbai). Single admin user · INR ₹ · Asia/Kolkata · desktop-first, fully responsive.

## Stack

- **Vite + React 18 + TypeScript**, React Router 6 (`createBrowserRouter`)
- Plain **CSS Modules** + design tokens in `src/styles/tokens.css`. No CSS framework, no component library.
- No backend / database / auth yet — `src/services/api.ts` is the single seam for later wiring.

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
  services/      types.ts (domain models, mirror the spec), api.ts, session.ts
  config/        navigation.ts (locked nav order)
  data/          sample* — clearly-labelled preview data, replaced by real modules
  utils/         cn, format (INR currency, IST dates, relative time)
```

### Conventions

- Routes are registered in `src/routes.tsx`; every page renders inside `AppShell`.
- Nav order is locked in `src/config/navigation.ts` (Prompt 03 §1).
- The live clock is `Asia/Kolkata`, updates every second — `useClock()` / `<Clock>`.
- Actions whose behaviour lands later use `<StubActionButton>` (toasts, never fakes data).
- All money via `formatCurrency()`, all dates via `formatDate()` — never inline `Intl`.
- New shared UI goes in `components/ui` and must use only design tokens.

## Status

- ✅ P01 spec · P02 design system · P03 shell · P04 Dashboard · P05 CRM + Leads · **P06 Projects**
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
