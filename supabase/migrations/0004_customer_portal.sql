-- ============================================================================
-- Customer portal — a real login role for end-customers, plus a fix to the
-- privilege-escalation guard from 0003 that would otherwise block legitimate
-- service-role seeding scripts.
-- Run after 0001, 0002, 0003.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Fix: protect_profile_privilege_fields only special-cased is_super_admin(),
-- which reads auth.uid() — but a service-role request (used by the seed
-- script to create/promote demo accounts) has no end-user JWT, so auth.uid()
-- is null and is_super_admin() is false. That would make the trigger block
-- the *legitimate* admin tool from ever setting roles. auth.role() reads the
-- JWT's role claim directly and correctly reports 'service_role' for those
-- requests regardless of auth.uid().
-- ----------------------------------------------------------------------------

create or replace function public.protect_profile_privilege_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.admin_role_id is distinct from old.admin_role_id)
     and not public.is_super_admin()
     and auth.role() <> 'service_role' then
    raise exception 'Only Super Admin can change role or admin_role_id';
  end if;
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Customer role
-- ----------------------------------------------------------------------------

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('partner', 'admin', 'super_admin', 'customer'));

-- Links a customer business record (created by a partner/admin closing a
-- deal) to an actual login account, when the customer is given portal access.
alter table public.customers add column if not exists user_id uuid unique references auth.users(id);

create index if not exists idx_customers_user on public.customers(user_id);

-- Additive SELECT policies — Postgres RLS combines multiple permissive
-- policies for the same command with OR, so this only *adds* visibility for
-- the customer's own row on top of the existing partner/admin policies.
create policy "customers_select_own_login" on public.customers for select
  using (user_id = auth.uid());

create policy "customer_products_select_own_login" on public.customer_products for select
  using (exists (select 1 from public.customers c where c.id = customer_id and c.user_id = auth.uid()));

-- ----------------------------------------------------------------------------
-- Customer support tickets — a ticket belongs to a partner OR a customer,
-- never neither.
-- ----------------------------------------------------------------------------

alter table public.support_tickets alter column partner_id drop not null;
alter table public.support_messages drop constraint if exists support_messages_sender_role_check;
alter table public.support_messages add constraint support_messages_sender_role_check
  check (sender_role in ('partner', 'admin', 'customer'));
alter table public.support_tickets add column if not exists customer_id uuid references public.customers(id) on delete cascade;
alter table public.support_tickets add constraint support_tickets_owner_check
  check (partner_id is not null or customer_id is not null);

create policy "tickets_select_own_customer" on public.support_tickets for select
  using (exists (select 1 from public.customers c where c.id = customer_id and c.user_id = auth.uid()));
create policy "tickets_insert_own_customer" on public.support_tickets for insert
  with check (customer_id in (select id from public.customers where user_id = auth.uid()));

create policy "support_messages_select_customer" on public.support_messages for select
  using (
    exists (
      select 1 from public.support_tickets t
      join public.customers c on c.id = t.customer_id
      where t.id = ticket_id and c.user_id = auth.uid()
    )
  );
create policy "support_messages_insert_customer" on public.support_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.support_tickets t
      join public.customers c on c.id = t.customer_id
      where t.id = ticket_id and c.user_id = auth.uid()
    )
  );
