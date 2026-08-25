-- ============================================================================
-- Digitalsofts Partner Network — initial schema
-- Run this in the Supabase SQL editor (or `supabase db push`) on a fresh
-- project. Idempotent-ish: safe to re-run via IF NOT EXISTS guards, but a
-- true second run after edits should go through a new migration file.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Helper functions (created early — referenced by policies below)
-- ----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- profiles — one row per auth user, created automatically on signup
-- ----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text,
  role text not null default 'partner' check (role in ('partner', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- SECURITY DEFINER so it can read profiles.role without recursing through
-- the RLS policy that itself calls is_admin(). Must come after the
-- profiles table exists — this is a `language sql` function, and Postgres
-- validates its body against the catalog at CREATE FUNCTION time (unlike
-- plpgsql, which only checks syntax until first call).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- partner_tiers — configurable tier ladder (admin-editable)
-- ----------------------------------------------------------------------------

create table if not exists public.partner_tiers (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null default '',
  tagline text not null default '',
  sort_order int not null default 0,
  min_commission numeric(5,2) not null default 0,
  max_commission numeric(5,2) not null default 0,
  saas_commission numeric(5,2) not null default 0,
  service_commission numeric(5,2) not null default 0,
  discount_authority numeric(5,2) not null default 0,
  annual_sales_target numeric(14,2),
  requirements text not null default '',
  benefits text not null default '',
  certification_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_partner_tiers_updated_at before update on public.partner_tiers
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- partner_applications
-- ----------------------------------------------------------------------------

create table if not exists public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reference_code text not null unique default ('APP-' || upper(substr(md5(random()::text), 1, 8))),
  full_name text not null,
  email text not null,
  phone text,
  company text,
  country text,
  city text,
  industry text,
  partner_type text not null references public.partner_tiers(key),
  website text,
  experience text,
  customer_base text,
  preferred_products text[],
  territory text,
  status text not null default 'submitted'
    check (status in ('submitted','under_review','more_info_required','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_partner_applications_user on public.partner_applications(user_id);
create index if not exists idx_partner_applications_status on public.partner_applications(status);

create trigger trg_partner_applications_updated_at before update on public.partner_applications
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- partner_profiles — the "live" partner record once approved
-- ----------------------------------------------------------------------------

create table if not exists public.partner_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  tier_id uuid not null references public.partner_tiers(id),
  referral_code text not null unique,
  company text,
  country text,
  city text,
  industry text,
  website text,
  territory text,
  discount_authority_override numeric(5,2),
  annual_sales_ytd numeric(14,2) not null default 0,
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_partner_profiles_updated_at before update on public.partner_profiles
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- product catalog
-- ----------------------------------------------------------------------------

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  vertical text,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.product_categories(id),
  name text not null,
  slug text not null unique,
  description text not null default '',
  features text[] not null default '{}',
  image_url text,
  product_type text not null default 'one_time' check (product_type in ('one_time','saas','service')),
  retail_price numeric(14,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_active on public.products(is_active);

create trigger trg_products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table if not exists public.product_pricing (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  tier_id uuid not null references public.partner_tiers(id) on delete cascade,
  partner_price numeric(14,2) not null,
  commission_percent numeric(5,2) not null default 0,
  recurring_commission_percent numeric(5,2),
  created_at timestamptz not null default now(),
  unique (product_id, tier_id)
);

-- ----------------------------------------------------------------------------
-- leads
-- ----------------------------------------------------------------------------

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles(id) on delete cascade,
  company_name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  product_id uuid references public.products(id),
  industry text,
  country text,
  estimated_value numeric(14,2),
  status text not null default 'new'
    check (status in ('new','contacted','qualified','demo','proposal','won','lost')),
  expected_close_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_leads_partner on public.leads(partner_id);
create index if not exists idx_leads_status on public.leads(status);

create trigger trg_leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  partner_id uuid not null references public.profiles(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_lead_activities_lead on public.lead_activities(lead_id);

-- ----------------------------------------------------------------------------
-- deal_registrations
-- ----------------------------------------------------------------------------

create table if not exists public.deal_registrations (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles(id) on delete cascade,
  customer_company text not null,
  contact_name text,
  contact_email text,
  industry text,
  country text,
  product_id uuid references public.products(id),
  estimated_value numeric(14,2),
  expected_close_date date,
  notes text,
  status text not null default 'submitted'
    check (status in ('submitted','approved','rejected','expired','closed')),
  protection_start date,
  protection_end date,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_deals_partner on public.deal_registrations(partner_id);
create index if not exists idx_deals_status on public.deal_registrations(status);

create trigger trg_deals_updated_at before update on public.deal_registrations
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- customers
-- ----------------------------------------------------------------------------

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles(id) on delete cascade,
  deal_id uuid references public.deal_registrations(id),
  company_name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  industry text,
  country text,
  account_status text not null default 'active' check (account_status in ('active','inactive','churned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customers_partner on public.customers(partner_id);

create trigger trg_customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

create table if not exists public.customer_products (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  product_id uuid references public.products(id),
  subscription_type text,
  revenue numeric(14,2) not null default 0,
  renewal_date date,
  status text not null default 'active' check (status in ('active','cancelled','expired')),
  created_at timestamptz not null default now()
);

create index if not exists idx_customer_products_customer on public.customer_products(customer_id);

-- ----------------------------------------------------------------------------
-- opportunities (pipeline)
-- ----------------------------------------------------------------------------

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid references public.customers(id),
  lead_id uuid references public.leads(id),
  name text not null,
  product_id uuid references public.products(id),
  value numeric(14,2) not null default 0,
  probability int not null default 20 check (probability between 0 and 100),
  stage text not null default 'qualified'
    check (stage in ('qualified','demo','proposal','negotiation','won','lost')),
  expected_close_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_opportunities_partner on public.opportunities(partner_id);
create index if not exists idx_opportunities_stage on public.opportunities(stage);

create trigger trg_opportunities_updated_at before update on public.opportunities
  for each row execute function public.set_updated_at();

create table if not exists public.opportunity_activities (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  partner_id uuid not null references public.profiles(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_opp_activities_opp on public.opportunity_activities(opportunity_id);

-- ----------------------------------------------------------------------------
-- commissions & payouts
-- ----------------------------------------------------------------------------

create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid references public.customers(id),
  product_id uuid references public.products(id),
  deal_id uuid references public.deal_registrations(id),
  opportunity_id uuid references public.opportunities(id),
  amount numeric(14,2) not null,
  commission_percent numeric(5,2) not null,
  commission_type text not null default 'one_time'
    check (commission_type in ('one_time','recurring','margin','service')),
  status text not null default 'pending'
    check (status in ('pending','approved','payable','paid','reversed')),
  earned_date date not null default current_date,
  payable_date date,
  paid_date date,
  period text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_commissions_partner on public.commissions(partner_id);
create index if not exists idx_commissions_status on public.commissions(status);

create trigger trg_commissions_updated_at before update on public.commissions
  for each row execute function public.set_updated_at();

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(14,2) not null,
  method text not null default 'bank_transfer',
  status text not null default 'pending' check (status in ('pending','processing','paid','failed')),
  reference_code text not null unique default ('PO-' || upper(substr(md5(random()::text), 1, 8))),
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_payouts_partner on public.payouts(partner_id);

create table if not exists public.payout_commissions (
  id uuid primary key default gen_random_uuid(),
  payout_id uuid not null references public.payouts(id) on delete cascade,
  commission_id uuid not null references public.commissions(id) on delete cascade,
  unique (commission_id)
);

-- ----------------------------------------------------------------------------
-- referrals
-- ----------------------------------------------------------------------------

create table if not exists public.referral_links (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null unique references public.profiles(id) on delete cascade,
  code text not null unique,
  target_url text not null default '/',
  created_at timestamptz not null default now()
);

create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  referral_code text not null,
  event_type text not null check (event_type in ('click','lead','demo','quotation','conversion','renewal','refund')),
  value numeric(14,2),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_referral_events_code on public.referral_events(referral_code);

-- ----------------------------------------------------------------------------
-- assets (sales & marketing library)
-- ----------------------------------------------------------------------------

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'general',
  file_url text not null,
  file_type text,
  thumbnail_url text,
  tier_restriction text[],
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- academy: courses, lessons, progress, certifications
-- ----------------------------------------------------------------------------

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  track text not null default 'general',
  certification_type text check (certification_type in ('sales','implementation','technical')),
  order_index int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  content text not null default '',
  video_url text,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_lessons_course on public.lessons(course_id);

create table if not exists public.course_progress (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (partner_id, lesson_id)
);

create index if not exists idx_course_progress_partner on public.course_progress(partner_id);

create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('sales','implementation','technical')),
  status text not null default 'in_progress' check (status in ('in_progress','completed','expired')),
  completed_at timestamptz,
  expires_at timestamptz,
  certificate_url text,
  created_at timestamptz not null default now(),
  unique (partner_id, type)
);

-- Auto-award a certification once every lesson in its track is completed.
create or replace function public.refresh_certification_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partner uuid;
  v_cert_type text;
  v_total int;
  v_done int;
begin
  v_partner := new.partner_id;

  select c.certification_type into v_cert_type
  from public.lessons l
  join public.courses c on c.id = l.course_id
  where l.id = new.lesson_id;

  if v_cert_type is null then
    return new;
  end if;

  select count(*) into v_total
  from public.lessons l
  join public.courses c on c.id = l.course_id
  where c.certification_type = v_cert_type and c.is_active;

  select count(*) into v_done
  from public.course_progress cp
  join public.lessons l on l.id = cp.lesson_id
  join public.courses c on c.id = l.course_id
  where cp.partner_id = v_partner and cp.completed = true and c.certification_type = v_cert_type and c.is_active;

  if v_total > 0 and v_done >= v_total then
    insert into public.certifications (partner_id, type, status, completed_at)
    values (v_partner, v_cert_type, 'completed', now())
    on conflict (partner_id, type)
    do update set status = 'completed', completed_at = now()
    where public.certifications.status <> 'completed';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_course_progress_certify on public.course_progress;
create trigger trg_course_progress_certify after insert or update on public.course_progress
  for each row when (new.completed = true) execute function public.refresh_certification_progress();

-- ----------------------------------------------------------------------------
-- incentives, territories
-- ----------------------------------------------------------------------------

create table if not exists public.incentives (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  target_amount numeric(14,2) not null,
  bonus_amount numeric(14,2),
  bonus_type text not null default 'cash',
  period text not null default 'quarterly',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.territories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  region text,
  vertical text,
  model text not null default 'non_exclusive' check (model in ('non_exclusive','preferred','exclusive')),
  min_annual_sales numeric(14,2),
  created_at timestamptz not null default now()
);

create table if not exists public.partner_territories (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles(id) on delete cascade,
  territory_id uuid not null references public.territories(id) on delete cascade,
  model text not null default 'non_exclusive' check (model in ('non_exclusive','preferred','exclusive')),
  status text not null default 'active' check (status in ('active','expired')),
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (partner_id, territory_id)
);

-- ----------------------------------------------------------------------------
-- support
-- ----------------------------------------------------------------------------

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  category text not null default 'general',
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'open' check (status in ('open','in_progress','waiting','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tickets_partner on public.support_tickets(partner_id);

create trigger trg_tickets_updated_at before update on public.support_tickets
  for each row execute function public.set_updated_at();

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  sender_role text not null default 'partner' check (sender_role in ('partner','admin')),
  message text not null,
  attachment_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_support_messages_ticket on public.support_messages(ticket_id);

-- ----------------------------------------------------------------------------
-- notifications & activities
-- ----------------------------------------------------------------------------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'general',
  title text not null,
  message text not null default '',
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_partner on public.notifications(partner_id, is_read);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_activities_partner on public.activities(partner_id);

-- ----------------------------------------------------------------------------
-- system_settings
-- ----------------------------------------------------------------------------

create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

create trigger trg_settings_updated_at before update on public.system_settings
  for each row execute function public.set_updated_at();

-- ============================================================================
-- BUSINESS LOGIC FUNCTIONS (server-side, SECURITY DEFINER, admin-gated)
-- ============================================================================

-- Approve or reject a partner application. On approval, provisions the
-- partner_profiles row (tier, referral code) atomically and notifies them.
create or replace function public.review_partner_application(
  p_application_id uuid,
  p_decision text,
  p_notes text default null
)
returns public.partner_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app public.partner_applications;
  v_tier public.partner_tiers;
  v_code text;
begin
  if not public.is_admin() then
    raise exception 'Only admins can review partner applications';
  end if;
  if p_decision not in ('approved', 'rejected', 'more_info_required') then
    raise exception 'Invalid decision: %', p_decision;
  end if;

  select * into v_app from public.partner_applications where id = p_application_id;
  if not found then
    raise exception 'Application not found';
  end if;

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

-- Approve/reject a deal registration and open the protection window.
create or replace function public.review_deal_registration(
  p_deal_id uuid,
  p_decision text,
  p_notes text default null
)
returns public.deal_registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deal public.deal_registrations;
  v_protection_days int;
begin
  if not public.is_admin() then
    raise exception 'Only admins can review deal registrations';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid decision: %', p_decision;
  end if;

  select coalesce((value->>'days')::int, 90) into v_protection_days
  from public.system_settings where key = 'deal_protection_days';
  v_protection_days := coalesce(v_protection_days, 90);

  if p_decision = 'approved' then
    update public.deal_registrations
    set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), review_notes = p_notes,
        protection_start = current_date, protection_end = current_date + v_protection_days
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

-- Close an approved deal as WON: creates/links the customer, computes the
-- commission from tier + product pricing server-side, and notifies the partner.
create or replace function public.close_deal_won(p_deal_id uuid)
returns public.commissions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deal public.deal_registrations;
  v_tier_id uuid;
  v_pricing public.product_pricing;
  v_customer_id uuid;
  v_commission public.commissions;
begin
  if not public.is_admin() then
    raise exception 'Only admins can close a deal';
  end if;

  select * into v_deal from public.deal_registrations where id = p_deal_id;
  if not found then
    raise exception 'Deal not found';
  end if;
  if v_deal.status <> 'approved' then
    raise exception 'Deal must be approved before it can be closed';
  end if;

  select tier_id into v_tier_id from public.partner_profiles where id = v_deal.partner_id;

  select * into v_pricing from public.product_pricing
  where product_id = v_deal.product_id and tier_id = v_tier_id;

  insert into public.customers (partner_id, deal_id, company_name, contact_name, contact_email, industry, country)
  values (v_deal.partner_id, v_deal.id, v_deal.customer_company, v_deal.contact_name, v_deal.contact_email, v_deal.industry, v_deal.country)
  returning id into v_customer_id;

  insert into public.commissions (partner_id, customer_id, product_id, deal_id, amount, commission_percent, commission_type, status, earned_date, payable_date)
  values (
    v_deal.partner_id,
    v_customer_id,
    v_deal.product_id,
    v_deal.id,
    round(coalesce(v_deal.estimated_value, 0) * coalesce(v_pricing.commission_percent, 20) / 100, 2),
    coalesce(v_pricing.commission_percent, 20),
    'one_time',
    'pending',
    current_date,
    current_date + 30
  )
  returning * into v_commission;

  update public.deal_registrations set status = 'closed' where id = p_deal_id;

  update public.partner_profiles
  set annual_sales_ytd = annual_sales_ytd + coalesce(v_deal.estimated_value, 0)
  where id = v_deal.partner_id;

  insert into public.notifications (partner_id, type, title, message, link)
  values (v_deal.partner_id, 'deal_won', 'Deal closed — commission created',
    v_deal.customer_company || ' generated a commission of PKR ' || v_commission.amount, '/partner/commissions');

  return v_commission;
end;
$$;

-- Record a payout: marks the given commissions payable→paid and creates the
-- payout + link rows atomically so totals can never drift apart.
create or replace function public.record_payout(
  p_partner_id uuid,
  p_commission_ids uuid[],
  p_method text default 'bank_transfer'
)
returns public.payouts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total numeric(14,2);
  v_payout public.payouts;
begin
  if not public.is_admin() then
    raise exception 'Only admins can record payouts';
  end if;

  select coalesce(sum(amount), 0) into v_total
  from public.commissions
  where id = any(p_commission_ids) and partner_id = p_partner_id and status = 'payable';

  if v_total <= 0 then
    raise exception 'No payable commissions found for this partner/selection';
  end if;

  insert into public.payouts (partner_id, amount, method, status, processed_at)
  values (p_partner_id, v_total, p_method, 'paid', now())
  returning * into v_payout;

  insert into public.payout_commissions (payout_id, commission_id)
  select v_payout.id, c.id from public.commissions c
  where c.id = any(p_commission_ids) and c.partner_id = p_partner_id and c.status = 'payable';

  update public.commissions
  set status = 'paid', paid_date = current_date
  where id = any(p_commission_ids) and partner_id = p_partner_id and status = 'payable';

  insert into public.notifications (partner_id, type, title, message, link)
  values (p_partner_id, 'payout_processed', 'Payout processed',
    'A payout of PKR ' || v_total || ' has been processed.', '/partner/payouts');

  return v_payout;
end;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.partner_tiers enable row level security;
alter table public.partner_applications enable row level security;
alter table public.partner_profiles enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.product_pricing enable row level security;
alter table public.leads enable row level security;
alter table public.lead_activities enable row level security;
alter table public.deal_registrations enable row level security;
alter table public.customers enable row level security;
alter table public.customer_products enable row level security;
alter table public.opportunities enable row level security;
alter table public.opportunity_activities enable row level security;
alter table public.commissions enable row level security;
alter table public.payouts enable row level security;
alter table public.payout_commissions enable row level security;
alter table public.referral_links enable row level security;
alter table public.referral_events enable row level security;
alter table public.assets enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.course_progress enable row level security;
alter table public.certifications enable row level security;
alter table public.incentives enable row level security;
alter table public.territories enable row level security;
alter table public.partner_territories enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.activities enable row level security;
alter table public.system_settings enable row level security;

-- profiles
create policy "profiles_select_own_or_admin" on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles for update
  using (id = auth.uid() or public.is_admin());

-- partner_tiers — readable by everyone (used on the public marketing page too)
create policy "partner_tiers_select_all" on public.partner_tiers for select using (true);
create policy "partner_tiers_admin_write" on public.partner_tiers for all
  using (public.is_admin()) with check (public.is_admin());

-- partner_applications
create policy "applications_select_own_or_admin" on public.partner_applications for select
  using (user_id = auth.uid() or public.is_admin());
create policy "applications_insert_own" on public.partner_applications for insert
  with check (user_id = auth.uid());
create policy "applications_admin_update" on public.partner_applications for update
  using (public.is_admin()) with check (public.is_admin());

-- partner_profiles
create policy "partner_profiles_select_own_or_admin" on public.partner_profiles for select
  using (id = auth.uid() or public.is_admin());
create policy "partner_profiles_update_own_or_admin" on public.partner_profiles for update
  using (id = auth.uid() or public.is_admin());
create policy "partner_profiles_admin_insert" on public.partner_profiles for insert
  with check (public.is_admin());

-- product catalog — public read of active items, admin write
create policy "categories_select_all" on public.product_categories for select using (true);
create policy "categories_admin_write" on public.product_categories for all
  using (public.is_admin()) with check (public.is_admin());

create policy "products_select_active_or_admin" on public.products for select
  using (is_active = true or public.is_admin());
create policy "products_admin_write" on public.products for all
  using (public.is_admin()) with check (public.is_admin());

create policy "pricing_select_authenticated" on public.product_pricing for select
  using (auth.role() = 'authenticated');
create policy "pricing_admin_write" on public.product_pricing for all
  using (public.is_admin()) with check (public.is_admin());

-- leads
create policy "leads_select_own_or_admin" on public.leads for select
  using (partner_id = auth.uid() or public.is_admin());
create policy "leads_insert_own" on public.leads for insert
  with check (partner_id = auth.uid());
create policy "leads_update_own_or_admin" on public.leads for update
  using (partner_id = auth.uid() or public.is_admin());
create policy "leads_delete_own_or_admin" on public.leads for delete
  using (partner_id = auth.uid() or public.is_admin());

create policy "lead_activities_select_own_or_admin" on public.lead_activities for select
  using (partner_id = auth.uid() or public.is_admin());
create policy "lead_activities_insert_own" on public.lead_activities for insert
  with check (partner_id = auth.uid());

-- deal_registrations — partners can insert/select own; only non-status
-- fields may be edited by the partner (status flips happen via the
-- SECURITY DEFINER review_deal_registration function only).
create policy "deals_select_own_or_admin" on public.deal_registrations for select
  using (partner_id = auth.uid() or public.is_admin());
create policy "deals_insert_own" on public.deal_registrations for insert
  with check (partner_id = auth.uid() and status = 'submitted');
create policy "deals_update_own_while_submitted" on public.deal_registrations for update
  using (partner_id = auth.uid() and status = 'submitted')
  with check (partner_id = auth.uid() and status = 'submitted');
create policy "deals_admin_update" on public.deal_registrations for update
  using (public.is_admin()) with check (public.is_admin());

-- customers — read only for the owning partner; writes go through
-- close_deal_won() or admin
create policy "customers_select_own_or_admin" on public.customers for select
  using (partner_id = auth.uid() or public.is_admin());
create policy "customers_admin_write" on public.customers for all
  using (public.is_admin()) with check (public.is_admin());

create policy "customer_products_select" on public.customer_products for select
  using (
    public.is_admin() or
    exists (select 1 from public.customers c where c.id = customer_id and c.partner_id = auth.uid())
  );
create policy "customer_products_admin_write" on public.customer_products for all
  using (public.is_admin()) with check (public.is_admin());

-- opportunities
create policy "opportunities_select_own_or_admin" on public.opportunities for select
  using (partner_id = auth.uid() or public.is_admin());
create policy "opportunities_insert_own" on public.opportunities for insert
  with check (partner_id = auth.uid());
create policy "opportunities_update_own_or_admin" on public.opportunities for update
  using (partner_id = auth.uid() or public.is_admin());
create policy "opportunities_delete_own_or_admin" on public.opportunities for delete
  using (partner_id = auth.uid() or public.is_admin());

create policy "opp_activities_select_own_or_admin" on public.opportunity_activities for select
  using (partner_id = auth.uid() or public.is_admin());
create policy "opp_activities_insert_own" on public.opportunity_activities for insert
  with check (partner_id = auth.uid());

-- commissions — read only for the owner; all writes are admin/RPC only
create policy "commissions_select_own_or_admin" on public.commissions for select
  using (partner_id = auth.uid() or public.is_admin());
create policy "commissions_admin_write" on public.commissions for all
  using (public.is_admin()) with check (public.is_admin());

-- payouts — read only for the owner; writes are admin/RPC only
create policy "payouts_select_own_or_admin" on public.payouts for select
  using (partner_id = auth.uid() or public.is_admin());
create policy "payouts_admin_write" on public.payouts for all
  using (public.is_admin()) with check (public.is_admin());

create policy "payout_commissions_select" on public.payout_commissions for select
  using (
    public.is_admin() or
    exists (select 1 from public.payouts p where p.id = payout_id and p.partner_id = auth.uid())
  );

-- referrals
create policy "referral_links_select_own_or_admin" on public.referral_links for select
  using (partner_id = auth.uid() or public.is_admin());
create policy "referral_links_admin_write" on public.referral_links for all
  using (public.is_admin()) with check (public.is_admin());

create policy "referral_events_insert_public" on public.referral_events for insert
  with check (true);
create policy "referral_events_select_own_or_admin" on public.referral_events for select
  using (
    public.is_admin() or
    referral_code in (select code from public.referral_links where partner_id = auth.uid())
  );

-- assets — visible to authenticated partners (tier filtering happens in the
-- app layer for now), admin manages the library
create policy "assets_select_authenticated" on public.assets for select
  using (auth.role() = 'authenticated');
create policy "assets_admin_write" on public.assets for all
  using (public.is_admin()) with check (public.is_admin());

-- academy
create policy "courses_select_active_or_admin" on public.courses for select
  using (is_active = true or public.is_admin());
create policy "courses_admin_write" on public.courses for all
  using (public.is_admin()) with check (public.is_admin());

create policy "lessons_select_authenticated" on public.lessons for select
  using (auth.role() = 'authenticated');
create policy "lessons_admin_write" on public.lessons for all
  using (public.is_admin()) with check (public.is_admin());

create policy "course_progress_select_own_or_admin" on public.course_progress for select
  using (partner_id = auth.uid() or public.is_admin());
create policy "course_progress_upsert_own" on public.course_progress for insert
  with check (partner_id = auth.uid());
create policy "course_progress_update_own" on public.course_progress for update
  using (partner_id = auth.uid());

create policy "certifications_select_own_or_admin" on public.certifications for select
  using (partner_id = auth.uid() or public.is_admin());
create policy "certifications_admin_write" on public.certifications for all
  using (public.is_admin()) with check (public.is_admin());

-- incentives, territories
create policy "incentives_select_authenticated" on public.incentives for select
  using (auth.role() = 'authenticated');
create policy "incentives_admin_write" on public.incentives for all
  using (public.is_admin()) with check (public.is_admin());

create policy "territories_select_authenticated" on public.territories for select
  using (auth.role() = 'authenticated');
create policy "territories_admin_write" on public.territories for all
  using (public.is_admin()) with check (public.is_admin());

create policy "partner_territories_select_own_or_admin" on public.partner_territories for select
  using (partner_id = auth.uid() or public.is_admin());
create policy "partner_territories_admin_write" on public.partner_territories for all
  using (public.is_admin()) with check (public.is_admin());

-- support
create policy "tickets_select_own_or_admin" on public.support_tickets for select
  using (partner_id = auth.uid() or public.is_admin());
create policy "tickets_insert_own" on public.support_tickets for insert
  with check (partner_id = auth.uid());
create policy "tickets_update_own_or_admin" on public.support_tickets for update
  using (partner_id = auth.uid() or public.is_admin());

create policy "support_messages_select" on public.support_messages for select
  using (
    public.is_admin() or
    exists (select 1 from public.support_tickets t where t.id = ticket_id and t.partner_id = auth.uid())
  );
create policy "support_messages_insert" on public.support_messages for insert
  with check (
    sender_id = auth.uid() and (
      public.is_admin() or
      exists (select 1 from public.support_tickets t where t.id = ticket_id and t.partner_id = auth.uid())
    )
  );

-- notifications — partner can read/mark-read own; inserts happen via
-- SECURITY DEFINER functions or admin
create policy "notifications_select_own_or_admin" on public.notifications for select
  using (partner_id = auth.uid() or public.is_admin());
create policy "notifications_update_own_or_admin" on public.notifications for update
  using (partner_id = auth.uid() or public.is_admin());
create policy "notifications_admin_insert" on public.notifications for insert
  with check (public.is_admin());

-- activities
create policy "activities_select_own_or_admin" on public.activities for select
  using (partner_id = auth.uid() or public.is_admin());
create policy "activities_insert_own" on public.activities for insert
  with check (partner_id = auth.uid() or public.is_admin());

-- system_settings — readable by any authenticated user (needed for payout
-- thresholds, protection windows etc. rendered in the UI), admin writes
create policy "settings_select_authenticated" on public.system_settings for select
  using (auth.role() = 'authenticated');
create policy "settings_admin_write" on public.system_settings for all
  using (public.is_admin()) with check (public.is_admin());
