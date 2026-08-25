# Digitalsofts Partner Network

A production-track partner/reseller management platform for Digitalsofts: a
public marketing site, an authenticated Partner Portal, a minimal Customer
Portal, and a Super Admin / Admin console with role-based permissions —
backed entirely by Supabase (Postgres + Auth + RLS).

## Stack

- React 19 + Vite + React Router
- Tailwind CSS v4 (white/orange design system) + Framer Motion
- Supabase (`@supabase/supabase-js`) — auth, database, row-level security, storage
- TanStack Query for data fetching/caching
- Recharts for dashboard charts (lazy-loaded, not shipped to the public site)

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the migrations **in order**:
   - **`supabase/migrations/0001_init.sql`** — every core table, RLS policy,
     trigger and business-logic function (deal approval, commission
     calculation, payouts, certifications).
   - **`supabase/migrations/0002_product_catalog_fields.sql`** — adds
     `currency`, `source_url` and `pricing_confirmed` to `products`.
   - **`supabase/migrations/0003_super_admin_rbac.sql`** — the Super Admin /
     Admin / Partner role model (`roles`, `permissions`, `role_permissions`),
     automatic audit logging, commission reversal, deal-conflict detection,
     MDF requests, discount-authority requests, MAP rules, the commission
     rule engine, SLA terms, the public partner marketplace view, and the
     `assets` storage bucket.
   - **`supabase/migrations/0004_customer_portal.sql`** — adds the
     `customer` role, links `customers` rows to real logins, lets customers
     open support tickets, and fixes a bug the previous migration would
     otherwise have caused: the privilege-escalation guard only special-cased
     `is_super_admin()`, which would have blocked the service-role seed
     script below from ever setting a role.
3. Then run **`supabase/seed.sql`** — reference/catalog data only (partner
   tiers, product categories, products, pricing, Academy courses, incentives,
   territories, system settings, staff roles/permissions, SLA terms). No user
   accounts or sample leads/deals are seeded here — see the demo-accounts
   script below for those.
   - The 32 products are imported from `digitalsofts_product_catalog.xlsx`
     (Digitalsofts' actual published product lineup) — real names, real
     categories, real source URLs. Pricing is the sheet's own **draft
     estimate** (USD/yr); every product is seeded with `pricing_confirmed =
     false` until someone with `pricing.manage` reviews and confirms real
     numbers via **Admin → Products**.
4. Copy your project's URL and anon key from **Project Settings → API**.

## 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Without these, the app still runs — every Supabase call resolves to a
graceful "Supabase is not configured" error state instead of crashing, so you
can review the UI before wiring up a backend.

## 3. Run locally

```
npm install
npm run dev
```

## 4. Seed the demo accounts (recommended)

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret \
node supabase/seed-demo-users.mjs
```

This creates **real Supabase Auth accounts** (not just table rows) for every
role, sets their profile role/tier, and seeds realistic related data (leads,
deals, customers, commissions, payouts, training progress, referral
activity) so no dashboard is empty on first login. It's idempotent — re-run
it any time without creating duplicates. The service-role key is used only
by this local script; it is never written to `.env`, never committed, and
never reaches the browser bundle.

### Demo credentials

| Role | Email | Password | Notes |
|---|---|---|---|
| Super Admin | `superadmin@digitalsofts.com` | `SuperAdmin@123` | Full system access |
| Admin (Partner Manager) | `admin@digitalsofts.com` | `Admin@123` | Access per assigned role's permissions |
| Partner — Reseller | `partner@digitalsofts.com` | `Partner@123` | Seeded leads, deals, customers, commissions, payouts, training |
| Partner — Certified | `certified.partner@digitalsofts.com` | `Partner@123` | Seeded customers, commissions, and both Sales + Implementation certifications |
| Partner — Affiliate | `affiliate@digitalsofts.com` | `Affiliate@123` | Seeded referral clicks/leads/conversions and a commission |
| Customer | `customer@digitalsofts.com` | `Customer@123` | Linked customer record with an active subscription |

Each redirects to the correct dashboard on login (`/admin/dashboard`,
`/partner/dashboard`, or `/customer/dashboard`) and RLS prevents every
account from reading another's private data — a partner can't see another
partner's leads, and a customer can only ever see their own record.

## 5. Promote a Super Admin manually (alternative to the seed script)

Have the person sign up normally (e.g. via **Apply**, or any signup flow),
then run this once in the Supabase SQL editor:

```sql
update public.profiles set role = 'super_admin' where email = 'you@digitalsofts.com';
```

To add operational staff afterwards, sign in as Super Admin and use
**Admin → Admin Users** to promote an already-registered account and assign
it one of the seeded roles (Partner Manager, Sales Manager, Finance Manager,
Product Manager, Training Manager, Support Manager) or a custom role you
define under **Admin → Roles & Permissions**. There's no way to create a
brand-new auth account from the panel itself — Supabase account creation
requires service-role credentials this client-only app intentionally doesn't
hold, so the person must sign up first (or be created via the seed script).

## Role model

```
SUPER ADMIN  →  full, unconditional access to every route and table
ADMIN/STAFF  →  access gated by an assigned role's permissions
                (roles → role_permissions → permissions, all DB-driven)
PARTNER      →  only their own leads/deals/customers/commissions/etc.
CUSTOMER     →  only their own linked customer record, subscriptions,
                and support tickets — no access to partner/admin data
```

`is_admin()` in SQL means "any internal staff" (admin or super_admin) and
backs broad read access; `has_permission('x.y')` backs every sensitive write
policy and RPC, so e.g. a Sales Manager can approve deals but cannot process
payouts or edit pricing. See `supabase/migrations/0003_super_admin_rbac.sql`
for the full policy set and `supabase/seed.sql` for the permission catalog
and default role assignments.

## Project structure

```
src/
  components/
    ui/         reusable primitives (Button, Modal, Drawer, ConfirmDialog, states)
    layout/     PublicNavbar/Footer, partner+admin+customer sidebar/topbar, notifications, global search
    auth/       route guards (role + permission gated), auth shell
    marketing/  the public landing page sections
  context/      AuthContext (session/profile/role/permissions/homePath), ToastContext
  hooks/        useSupaQuery/useSupaMutation (thin Supabase+react-query glue), notifications
  lib/          supabase client, constants, nav config, formatting utils, screening.js, roleHome.js
  pages/
    public/     Home, Products, Partner Directory, Login, Apply, password reset, 404
    partner/    dashboard, leads, opportunities, deals, customers, products,
                commissions, payouts, referrals, assets, academy,
                certifications, support, performance, profile
    customer/   dashboard (subscriptions), support, profile
    admin/      dashboard, applications, partners, partner tiers, deals, products,
                pricing & commission rules, discount requests, commissions, payouts,
                MDF, incentives, assets, academy, territories, renewals, support,
                marketplace, compliance (fraud), reports, settings, admin users,
                roles & permissions, audit logs
supabase/
  migrations/          0001 core schema · 0002 product catalog fields ·
                        0003 RBAC/audit/etc. · 0004 customer portal
  seed.sql              reference/catalog data (tiers, products, roles, permissions, SLA terms…)
  seed-demo-users.mjs   creates real Auth accounts + realistic per-role business data
```

## Notes

- Commission math for a closed deal, deal-protection windows (with duplicate/
  conflict detection and mandatory-reason override), application approval,
  commission reversal, and payout batching all run as `SECURITY DEFINER`
  Postgres functions gated by `has_permission()` — never trusted from the
  client. See the bottom of `0003_super_admin_rbac.sql`.
- Every sensitive table (partner profiles, tiers, products, pricing,
  commissions, payouts, deals, applications, territories, settings) is
  audited automatically by a generic trigger — nothing relies on a page
  remembering to log an action. View it at **Admin → Audit Logs**.
- A trigger blocks any non-Super-Admin, non-service-role caller from ever
  changing `role` or `admin_role_id` on a profile — including their own —
  closing a privilege-escalation path even if a write policy were ever
  loosened, while still letting the service-role seed script set roles.
- The public "Find a Partner" directory reads from a column-restricted view
  (`partner_directory`), not the `partner_profiles` table directly, so
  opting into public visibility never exposes financial fields.
- Certifications are awarded automatically by a trigger once every lesson in
  a matching Academy track is marked complete.
- The automated partner-tier screening recommendation (`src/lib/screening.js`)
  is a transparent, deterministic scoring function — no external calls — and
  is always advisory; only an authorized admin action actually approves an
  application.
- A suspended partner (`partner_profiles.status = 'suspended'`) is actually
  redirected away from the portal with the suspension reason shown — it's
  not just a cosmetic status badge.
