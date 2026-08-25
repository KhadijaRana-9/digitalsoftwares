-- ============================================================================
-- Super Admin role/permission system, audit logging, and supporting tables.
-- Run after 0001_init.sql and 0002_product_catalog_fields.sql.
--
-- Role model: profiles.role now has three values — 'partner', 'admin',
-- 'super_admin'. Super Admin has unconditional full access. Admin/Staff
-- access is gated by a role from `roles` and that role's `role_permissions`.
-- is_admin() is intentionally broad ("any internal staff") so every existing
-- policy written against it keeps working for super_admin for free; new
-- write-side policies additionally require has_permission('specific.key')
-- so a Partner Manager, say, cannot approve payouts.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Role model
-- ----------------------------------------------------------------------------

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('partner', 'admin', 'super_admin'));

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null default '',
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  group_name text not null default 'general',
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

alter table public.profiles add column if not exists admin_role_id uuid references public.roles(id);
alter table public.partner_profiles add column if not exists status_reason text;
alter table public.partner_tiers add column if not exists is_active boolean not null default true;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'super_admin'
  );
$$;

-- Broad "is internal staff" check — deliberately includes super_admin so
-- every pre-existing is_admin() policy keeps super admins fully covered.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

create or replace function public.has_permission(p_key text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    public.is_super_admin()
    or exists (
      select 1
      from public.profiles p
      join public.role_permissions rp on rp.role_id = p.admin_role_id
      join public.permissions perm on perm.id = rp.permission_id
      where p.id = auth.uid() and p.role = 'admin' and perm.key = p_key
    );
$$;

-- Defense in depth: even though the admins.manage permission is never
-- granted to any role (see seed.sql), enforce at the row level that only
-- Super Admin can ever change role/admin_role_id — including on their own
-- profile — so a compromised or misconfigured admin session can't
-- self-escalate to super_admin via a direct profiles update.
create or replace function public.protect_profile_privilege_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.admin_role_id is distinct from old.admin_role_id)
     and not public.is_super_admin() then
    raise exception 'Only Super Admin can change role or admin_role_id';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_privileges on public.profiles;
create trigger trg_protect_profile_privileges before update on public.profiles
  for each row execute function public.protect_profile_privilege_fields();

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;

create policy "roles_select_admin" on public.roles for select using (public.is_admin());
create policy "roles_super_admin_write" on public.roles for all
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy "permissions_select_admin" on public.permissions for select using (public.is_admin());
create policy "permissions_super_admin_write" on public.permissions for all
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy "role_permissions_select_admin" on public.role_permissions for select using (public.is_admin());
create policy "role_permissions_super_admin_write" on public.role_permissions for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- ----------------------------------------------------------------------------
-- Audit logs — populated automatically by a generic trigger, never by the
-- client directly, so staff can't quietly skip logging a sensitive change.
-- ----------------------------------------------------------------------------

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;
create policy "audit_logs_select" on public.audit_logs for select
  using (public.has_permission('audit.view'));
-- Rows only ever arrive via the SECURITY DEFINER trigger below (which runs
-- as the function owner and bypasses RLS) — block direct client inserts.
create policy "audit_logs_no_direct_insert" on public.audit_logs for insert with check (false);

create or replace function public.audit_trigger_fn()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_role text;
  v_reason text;
begin
  select role into v_actor_role from public.profiles where id = auth.uid();

  -- Read via the jsonb representation, not `new.field_name` — this trigger
  -- is generic across tables with very different columns, and direct record
  -- field access raises "record new has no field X" for any table missing
  -- that column even inside a CASE branch that should never be reached for
  -- it; the ->> operator degrades to NULL for a missing key instead.
  if tg_op = 'UPDATE' then
    v_reason := coalesce(
      to_jsonb(new)->>'review_notes',
      to_jsonb(new)->>'status_reason',
      to_jsonb(new)->>'reversed_reason'
    );
  else
    v_reason := null;
  end if;

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, before, after, reason)
  values (
    auth.uid(),
    coalesce(v_actor_role, 'system'),
    lower(tg_op) || '_' || tg_table_name,
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('UPDATE', 'INSERT') then to_jsonb(new) else null end,
    v_reason
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_audit_partner_profiles on public.partner_profiles;
create trigger trg_audit_partner_profiles after insert or update on public.partner_profiles
  for each row execute function public.audit_trigger_fn();

drop trigger if exists trg_audit_partner_tiers on public.partner_tiers;
create trigger trg_audit_partner_tiers after insert or update on public.partner_tiers
  for each row execute function public.audit_trigger_fn();

drop trigger if exists trg_audit_products on public.products;
create trigger trg_audit_products after insert or update on public.products
  for each row execute function public.audit_trigger_fn();

drop trigger if exists trg_audit_product_pricing on public.product_pricing;
create trigger trg_audit_product_pricing after insert or update on public.product_pricing
  for each row execute function public.audit_trigger_fn();

drop trigger if exists trg_audit_commissions on public.commissions;
create trigger trg_audit_commissions after update on public.commissions
  for each row execute function public.audit_trigger_fn();

drop trigger if exists trg_audit_payouts on public.payouts;
create trigger trg_audit_payouts after insert or update on public.payouts
  for each row execute function public.audit_trigger_fn();

drop trigger if exists trg_audit_deal_registrations on public.deal_registrations;
create trigger trg_audit_deal_registrations after update on public.deal_registrations
  for each row execute function public.audit_trigger_fn();

drop trigger if exists trg_audit_partner_applications on public.partner_applications;
create trigger trg_audit_partner_applications after update on public.partner_applications
  for each row execute function public.audit_trigger_fn();

drop trigger if exists trg_audit_territories on public.territories;
create trigger trg_audit_territories after insert or update on public.territories
  for each row execute function public.audit_trigger_fn();

drop trigger if exists trg_audit_partner_territories on public.partner_territories;
create trigger trg_audit_partner_territories after insert or update on public.partner_territories
  for each row execute function public.audit_trigger_fn();

drop trigger if exists trg_audit_system_settings on public.system_settings;
create trigger trg_audit_system_settings after update on public.system_settings
  for each row execute function public.audit_trigger_fn();

drop trigger if exists trg_audit_profiles on public.profiles;
create trigger trg_audit_profiles after update on public.profiles
  for each row when (old.role is distinct from new.role or old.admin_role_id is distinct from new.admin_role_id)
  execute function public.audit_trigger_fn();

-- ----------------------------------------------------------------------------
-- Commission reversal support
-- ----------------------------------------------------------------------------

alter table public.commissions add column if not exists reversed_reason text;
alter table public.commissions add column if not exists reversed_by uuid references public.profiles(id);
alter table public.commissions add column if not exists reversed_at timestamptz;

create or replace function public.reverse_commission(p_commission_id uuid, p_reason text)
returns public.commissions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_commission public.commissions;
begin
  if not public.has_permission('commissions.approve') then
    raise exception 'Not authorized to reverse commissions';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'A reason is required to reverse a commission';
  end if;

  update public.commissions
  set status = 'reversed', reversed_reason = p_reason, reversed_by = auth.uid(), reversed_at = now()
  where id = p_commission_id
  returning * into v_commission;

  if not found then
    raise exception 'Commission not found';
  end if;

  insert into public.notifications (partner_id, type, title, message, link)
  values (v_commission.partner_id, 'commission_reversed', 'Commission reversed',
    'A commission of ' || v_commission.amount || ' was reversed: ' || p_reason, '/partner/commissions');

  return v_commission;
end;
$$;

-- ----------------------------------------------------------------------------
-- Deal conflict detection — "first approved registration wins"
-- ----------------------------------------------------------------------------

alter table public.deal_registrations add column if not exists is_override boolean not null default false;
alter table public.deal_registrations add column if not exists override_reason text;

-- SECURITY DEFINER bypasses the normal deals_select_own_or_admin RLS policy,
-- so without an explicit check here any authenticated partner could call
-- this RPC directly and see other partners' deal registrations. Only staff
-- with deals.approve (who review conflicts) get real rows back.
create or replace function public.find_conflicting_deals(p_customer_company text, p_product_id uuid, p_exclude_deal_id uuid default null)
returns setof public.deal_registrations
language sql
security definer
stable
set search_path = public
as $$
  select * from public.deal_registrations
  where public.has_permission('deals.approve')
    and lower(customer_company) = lower(p_customer_company)
    and (p_product_id is null or product_id = p_product_id)
    and status in ('submitted', 'approved')
    and (p_exclude_deal_id is null or id <> p_exclude_deal_id);
$$;

-- ----------------------------------------------------------------------------
-- MDF requests
-- ----------------------------------------------------------------------------

create table if not exists public.mdf_requests (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  activity_type text not null default 'other',
  requested_amount numeric(14,2) not null,
  approved_amount numeric(14,2),
  status text not null default 'submitted' check (status in ('submitted','approved','rejected','completed')),
  proof_url text,
  notes text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_mdf_requests_updated_at before update on public.mdf_requests
  for each row execute function public.set_updated_at();
drop trigger if exists trg_audit_mdf_requests on public.mdf_requests;
create trigger trg_audit_mdf_requests after update on public.mdf_requests
  for each row execute function public.audit_trigger_fn();

alter table public.mdf_requests enable row level security;
create policy "mdf_select_own_or_staff" on public.mdf_requests for select
  using (partner_id = auth.uid() or public.has_permission('mdf.manage'));
create policy "mdf_insert_own" on public.mdf_requests for insert with check (partner_id = auth.uid());
create policy "mdf_staff_update" on public.mdf_requests for update using (public.has_permission('mdf.manage'));

-- ----------------------------------------------------------------------------
-- Discount authority requests (beyond a tier's automatic authority)
-- ----------------------------------------------------------------------------

create table if not exists public.discount_requests (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles(id) on delete cascade,
  deal_id uuid references public.deal_registrations(id),
  requested_percent numeric(5,2) not null,
  reason text,
  status text not null default 'submitted' check (status in ('submitted','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now()
);

drop trigger if exists trg_audit_discount_requests on public.discount_requests;
create trigger trg_audit_discount_requests after update on public.discount_requests
  for each row execute function public.audit_trigger_fn();

alter table public.discount_requests enable row level security;
create policy "discount_requests_select_own_or_staff" on public.discount_requests for select
  using (partner_id = auth.uid() or public.has_permission('pricing.manage'));
create policy "discount_requests_insert_own" on public.discount_requests for insert with check (partner_id = auth.uid());
create policy "discount_requests_staff_update" on public.discount_requests for update using (public.has_permission('pricing.manage'));

-- ----------------------------------------------------------------------------
-- Minimum Advertised Price (MAP) rules
-- ----------------------------------------------------------------------------

create table if not exists public.map_rules (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  territory_id uuid references public.territories(id),
  map_price numeric(14,2) not null,
  currency text not null default 'USD',
  requires_approval_below boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.map_rules enable row level security;
create policy "map_rules_select_authenticated" on public.map_rules for select using (auth.role() = 'authenticated');
create policy "map_rules_staff_write" on public.map_rules for all
  using (public.has_permission('pricing.manage')) with check (public.has_permission('pricing.manage'));

-- ----------------------------------------------------------------------------
-- Fraud / compliance flags
-- ----------------------------------------------------------------------------

create table if not exists public.fraud_flags (
  id uuid primary key default gen_random_uuid(),
  flag_type text not null,
  entity_type text not null,
  entity_id uuid,
  partner_id uuid references public.profiles(id),
  description text not null,
  status text not null default 'open' check (status in ('open','investigating','warned','suspended','commission_cancelled','terminated','dismissed')),
  flagged_by uuid references public.profiles(id),
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_fraud_flags_updated_at before update on public.fraud_flags
  for each row execute function public.set_updated_at();
drop trigger if exists trg_audit_fraud_flags on public.fraud_flags;
create trigger trg_audit_fraud_flags after insert or update on public.fraud_flags
  for each row execute function public.audit_trigger_fn();

alter table public.fraud_flags enable row level security;
create policy "fraud_flags_select_staff" on public.fraud_flags for select using (public.has_permission('compliance.manage'));
create policy "fraud_flags_insert_admin" on public.fraud_flags for insert with check (public.is_admin());
create policy "fraud_flags_update_staff" on public.fraud_flags for update using (public.has_permission('compliance.manage'));

-- ----------------------------------------------------------------------------
-- Commission rule engine — exceptions/overrides layered on top of the base
-- tier x product commission matrix already in product_pricing.
-- ----------------------------------------------------------------------------

create table if not exists public.commission_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scope_type text not null check (scope_type in ('tier','product','partner')),
  tier_id uuid references public.partner_tiers(id),
  product_id uuid references public.products(id),
  partner_id uuid references public.profiles(id),
  commission_percent numeric(5,2) not null,
  recurring boolean not null default false,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_commission_rules_updated_at before update on public.commission_rules
  for each row execute function public.set_updated_at();

alter table public.commission_rules enable row level security;
create policy "commission_rules_select_authenticated" on public.commission_rules for select using (auth.role() = 'authenticated');
create policy "commission_rules_staff_write" on public.commission_rules for all
  using (public.has_permission('pricing.manage')) with check (public.has_permission('pricing.manage'));

-- ----------------------------------------------------------------------------
-- SLA terms (Digitalsofts obligations vs partner obligations, per tier)
-- ----------------------------------------------------------------------------

create table if not exists public.sla_terms (
  id uuid primary key default gen_random_uuid(),
  party text not null check (party in ('digitalsofts','partner')),
  tier_id uuid references public.partner_tiers(id),
  category text not null default 'general',
  term text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (party, category, term)
);

alter table public.sla_terms enable row level security;
create policy "sla_terms_select_authenticated" on public.sla_terms for select using (auth.role() = 'authenticated');
create policy "sla_terms_staff_write" on public.sla_terms for all
  using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));

-- ----------------------------------------------------------------------------
-- Partner marketplace (public "Find a Partner" directory) + industries sort
-- ----------------------------------------------------------------------------

alter table public.partner_profiles add column if not exists is_public boolean not null default false;
alter table public.partner_profiles add column if not exists is_featured boolean not null default false;
alter table public.partner_profiles add column if not exists is_verified boolean not null default false;
alter table public.partner_profiles add column if not exists public_bio text;
alter table public.partner_profiles add column if not exists public_languages text[];

-- Deliberately NOT a row-level policy on partner_profiles itself — RLS is
-- row-level only, so a policy like `using (is_public = true)` would still
-- let anyone query every column via the REST API (annual_sales_ytd,
-- referral_code, discount_authority_override…), not just the safe ones the
-- UI happens to ask for. A column-restricted view keeps sensitive fields
-- out of the public surface entirely, regardless of what a client requests.
create or replace view public.partner_directory
with (security_invoker = false)
as
  select
    pp.id, pp.company, pp.country, pp.city, pp.industry, pp.public_bio, pp.public_languages,
    pp.is_featured, pp.is_verified, t.name as tier_name
  from public.partner_profiles pp
  join public.partner_tiers t on t.id = pp.tier_id
  where pp.is_public = true and pp.status = 'active';

grant select on public.partner_directory to anon, authenticated;

alter table public.product_categories add column if not exists sort_order int not null default 0;

-- ----------------------------------------------------------------------------
-- Storage bucket for sales & marketing assets (brochures, decks, videos…)
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do nothing;

drop policy if exists "assets_bucket_read_public" on storage.objects;
create policy "assets_bucket_read_public" on storage.objects for select
  using (bucket_id = 'assets');

drop policy if exists "assets_bucket_staff_write" on storage.objects;
create policy "assets_bucket_staff_write" on storage.objects for insert
  with check (bucket_id = 'assets' and public.has_permission('content.manage'));

drop policy if exists "assets_bucket_staff_update" on storage.objects;
create policy "assets_bucket_staff_update" on storage.objects for update
  using (bucket_id = 'assets' and public.has_permission('content.manage'));

drop policy if exists "assets_bucket_staff_delete" on storage.objects;
create policy "assets_bucket_staff_delete" on storage.objects for delete
  using (bucket_id = 'assets' and public.has_permission('content.manage'));

-- ----------------------------------------------------------------------------
-- Permission-gated write policies (upgrading blanket is_admin() checks to
-- has_permission() for the resources called out explicitly in the spec)
-- ----------------------------------------------------------------------------

drop policy if exists "partner_tiers_admin_write" on public.partner_tiers;
create policy "partner_tiers_staff_write" on public.partner_tiers for all
  using (public.has_permission('tiers.manage')) with check (public.has_permission('tiers.manage'));

drop policy if exists "categories_admin_write" on public.product_categories;
create policy "categories_staff_write" on public.product_categories for all
  using (public.has_permission('products.edit')) with check (public.has_permission('products.edit'));

drop policy if exists "products_admin_write" on public.products;
create policy "products_staff_write" on public.products for all
  using (public.has_permission('products.create') or public.has_permission('products.edit'))
  with check (public.has_permission('products.create') or public.has_permission('products.edit'));

drop policy if exists "pricing_admin_write" on public.product_pricing;
create policy "pricing_staff_write" on public.product_pricing for all
  using (public.has_permission('pricing.manage')) with check (public.has_permission('pricing.manage'));

drop policy if exists "commissions_admin_write" on public.commissions;
create policy "commissions_staff_write" on public.commissions for all
  using (public.has_permission('commissions.approve')) with check (public.has_permission('commissions.approve'));

drop policy if exists "payouts_admin_write" on public.payouts;
create policy "payouts_staff_write" on public.payouts for all
  using (public.has_permission('payouts.process')) with check (public.has_permission('payouts.process'));

drop policy if exists "courses_admin_write" on public.courses;
create policy "courses_staff_write" on public.courses for all
  using (public.has_permission('training.manage')) with check (public.has_permission('training.manage'));

drop policy if exists "lessons_admin_write" on public.lessons;
create policy "lessons_staff_write" on public.lessons for all
  using (public.has_permission('training.manage')) with check (public.has_permission('training.manage'));

drop policy if exists "certifications_admin_write" on public.certifications;
create policy "certifications_staff_write" on public.certifications for all
  using (public.has_permission('certifications.manage')) with check (public.has_permission('certifications.manage'));

drop policy if exists "assets_admin_write" on public.assets;
create policy "assets_staff_write" on public.assets for all
  using (public.has_permission('content.manage')) with check (public.has_permission('content.manage'));

drop policy if exists "territories_admin_write" on public.territories;
create policy "territories_staff_write" on public.territories for all
  using (public.has_permission('territories.manage')) with check (public.has_permission('territories.manage'));

drop policy if exists "partner_territories_admin_write" on public.partner_territories;
create policy "partner_territories_staff_write" on public.partner_territories for all
  using (public.has_permission('territories.manage')) with check (public.has_permission('territories.manage'));

drop policy if exists "settings_admin_write" on public.system_settings;
create policy "settings_staff_write" on public.system_settings for all
  using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));

drop policy if exists "applications_admin_update" on public.partner_applications;
create policy "applications_staff_update" on public.partner_applications for update
  using (public.has_permission('applications.review')) with check (public.has_permission('applications.review'));

drop policy if exists "deals_admin_update" on public.deal_registrations;
create policy "deals_staff_update" on public.deal_registrations for update
  using (public.has_permission('deals.approve')) with check (public.has_permission('deals.approve'));

drop policy if exists "partner_profiles_update_own_or_admin" on public.partner_profiles;
create policy "partner_profiles_update_own_or_staff" on public.partner_profiles for update
  using (id = auth.uid() or public.has_permission('partners.edit') or public.has_permission('partners.suspend'));

drop policy if exists "partner_profiles_admin_insert" on public.partner_profiles;
create policy "partner_profiles_staff_insert" on public.partner_profiles for insert
  with check (public.is_admin());

drop policy if exists "tickets_update_own_or_admin" on public.support_tickets;
create policy "tickets_update_own_or_staff" on public.support_tickets for update
  using (partner_id = auth.uid() or public.has_permission('support.manage'));

-- review_partner_application / review_deal_registration / close_deal_won /
-- record_payout already gate on is_admin(); tighten to the specific
-- permission so a non-authorized staff member can't call the RPC directly.
create or replace function public.review_partner_application(
  p_application_id uuid, p_decision text, p_notes text default null
) returns public.partner_applications
language plpgsql security definer set search_path = public as $$
declare
  v_app public.partner_applications;
  v_tier public.partner_tiers;
  v_code text;
begin
  if not public.has_permission('applications.review') then
    raise exception 'Not authorized to review partner applications';
  end if;
  if p_decision not in ('approved', 'rejected', 'more_info_required') then
    raise exception 'Invalid decision: %', p_decision;
  end if;

  select * into v_app from public.partner_applications where id = p_application_id;
  if not found then raise exception 'Application not found'; end if;

  update public.partner_applications
  set status = p_decision, reviewed_by = auth.uid(), reviewed_at = now(), review_notes = p_notes
  where id = p_application_id
  returning * into v_app;

  if p_decision = 'approved' then
    select * into v_tier from public.partner_tiers where key = v_app.partner_type;
    v_code := 'DS-' || upper(substr(md5(random()::text), 1, 5));
    while exists (select 1 from public.partner_profiles where referral_code = v_code) loop
      v_code := 'DS-' || upper(substr(md5(random()::text), 1, 5));
    end loop;

    insert into public.partner_profiles (id, tier_id, referral_code, company, country, city, industry, website, territory)
    values (v_app.user_id, v_tier.id, v_code, v_app.company, v_app.country, v_app.city, v_app.industry, v_app.website, v_app.territory)
    on conflict (id) do update set tier_id = excluded.tier_id, status = 'active';

    insert into public.referral_links (partner_id, code, target_url)
    values (v_app.user_id, v_code, '/')
    on conflict (partner_id) do nothing;

    insert into public.notifications (partner_id, type, title, message, link)
    values (v_app.user_id, 'application_approved', 'Application approved',
      'Welcome to the Digitalsofts Partner Network as a ' || v_tier.name || '.', '/partner/dashboard');
  else
    insert into public.notifications (partner_id, type, title, message, link)
    values (v_app.user_id, 'application_' || p_decision, 'Application update',
      coalesce(p_notes, 'Your partner application status changed to ' || p_decision || '.'), '/partner/profile');
  end if;

  return v_app;
end;
$$;

create or replace function public.review_deal_registration(
  p_deal_id uuid, p_decision text, p_notes text default null,
  p_override boolean default false
) returns public.deal_registrations
language plpgsql security definer set search_path = public as $$
declare
  v_deal public.deal_registrations;
  v_protection_days int;
  v_conflict_count int;
begin
  if not public.has_permission('deals.approve') then
    raise exception 'Not authorized to review deal registrations';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid decision: %', p_decision;
  end if;

  select * into v_deal from public.deal_registrations where id = p_deal_id;
  if not found then raise exception 'Deal not found'; end if;

  if p_decision = 'approved' then
    select count(*) into v_conflict_count from public.find_conflicting_deals(v_deal.customer_company, v_deal.product_id, v_deal.id);
    if v_conflict_count > 0 and not p_override then
      raise exception 'CONFLICTING_DEAL_EXISTS';
    end if;
  end if;

  select coalesce((value->>'days')::int, 90) into v_protection_days
  from public.system_settings where key = 'deal_protection_days';
  v_protection_days := coalesce(v_protection_days, 90);

  if p_decision = 'approved' then
    update public.deal_registrations
    set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), review_notes = p_notes,
        protection_start = current_date, protection_end = current_date + v_protection_days,
        is_override = p_override, override_reason = case when p_override then p_notes else null end
    where id = p_deal_id
    returning * into v_deal;
  else
    update public.deal_registrations
    set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), review_notes = p_notes
    where id = p_deal_id
    returning * into v_deal;
  end if;

  insert into public.notifications (partner_id, type, title, message, link)
  values (v_deal.partner_id, 'deal_' || p_decision, 'Deal registration ' || p_decision,
    v_deal.customer_company || ' — ' || coalesce(p_notes, p_decision), '/partner/deals');

  return v_deal;
end;
$$;

create or replace function public.close_deal_won(p_deal_id uuid)
returns public.commissions
language plpgsql security definer set search_path = public as $$
declare
  v_deal public.deal_registrations;
  v_tier_id uuid;
  v_pricing public.product_pricing;
  v_customer_id uuid;
  v_commission public.commissions;
begin
  if not public.has_permission('deals.approve') then
    raise exception 'Not authorized to close a deal';
  end if;

  select * into v_deal from public.deal_registrations where id = p_deal_id;
  if not found then raise exception 'Deal not found'; end if;
  if v_deal.status <> 'approved' then raise exception 'Deal must be approved before it can be closed'; end if;

  select tier_id into v_tier_id from public.partner_profiles where id = v_deal.partner_id;
  select * into v_pricing from public.product_pricing where product_id = v_deal.product_id and tier_id = v_tier_id;

  insert into public.customers (partner_id, deal_id, company_name, contact_name, contact_email, industry, country)
  values (v_deal.partner_id, v_deal.id, v_deal.customer_company, v_deal.contact_name, v_deal.contact_email, v_deal.industry, v_deal.country)
  returning id into v_customer_id;

  insert into public.commissions (partner_id, customer_id, product_id, deal_id, amount, commission_percent, commission_type, status, earned_date, payable_date)
  values (
    v_deal.partner_id, v_customer_id, v_deal.product_id, v_deal.id,
    round(coalesce(v_deal.estimated_value, 0) * coalesce(v_pricing.commission_percent, 20) / 100, 2),
    coalesce(v_pricing.commission_percent, 20), 'one_time', 'pending', current_date, current_date + 30
  )
  returning * into v_commission;

  update public.deal_registrations set status = 'closed' where id = p_deal_id;
  update public.partner_profiles set annual_sales_ytd = annual_sales_ytd + coalesce(v_deal.estimated_value, 0) where id = v_deal.partner_id;

  insert into public.notifications (partner_id, type, title, message, link)
  values (v_deal.partner_id, 'deal_won', 'Deal closed — commission created',
    v_deal.customer_company || ' generated a commission of PKR ' || v_commission.amount, '/partner/commissions');

  return v_commission;
end;
$$;

create or replace function public.record_payout(
  p_partner_id uuid, p_commission_ids uuid[], p_method text default 'bank_transfer'
) returns public.payouts
language plpgsql security definer set search_path = public as $$
declare
  v_total numeric(14,2);
  v_payout public.payouts;
begin
  if not public.has_permission('payouts.process') then
    raise exception 'Not authorized to record payouts';
  end if;

  select coalesce(sum(amount), 0) into v_total
  from public.commissions where id = any(p_commission_ids) and partner_id = p_partner_id and status = 'payable';

  if v_total <= 0 then raise exception 'No payable commissions found for this partner/selection'; end if;

  insert into public.payouts (partner_id, amount, method, status, processed_at)
  values (p_partner_id, v_total, p_method, 'paid', now())
  returning * into v_payout;

  insert into public.payout_commissions (payout_id, commission_id)
  select v_payout.id, c.id from public.commissions c
  where c.id = any(p_commission_ids) and c.partner_id = p_partner_id and c.status = 'payable';

  update public.commissions set status = 'paid', paid_date = current_date
  where id = any(p_commission_ids) and partner_id = p_partner_id and status = 'payable';

  insert into public.notifications (partner_id, type, title, message, link)
  values (p_partner_id, 'payout_processed', 'Payout processed', 'A payout of PKR ' || v_total || ' has been processed.', '/partner/payouts');

  return v_payout;
end;
$$;
