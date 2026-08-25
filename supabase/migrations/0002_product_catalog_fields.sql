-- ============================================================================
-- Adds fields needed to faithfully represent the authoritative Digitalsofts
-- product catalog (source: digitalsofts_product_catalog.xlsx):
--   - currency: catalog pricing is USD/yr, not PKR
--   - source_url: link back to the live product page on digitalsofts.com
--   - pricing_confirmed: the catalog's own legend notes that retail/partner
--     prices are DRAFT ESTIMATES until Digitalsofts leadership confirms them
--     (PRD Section 9, Open Item #1) — this flag lets the UI say so honestly
--     and lets admins flip it once real numbers are signed off.
-- Run after 0001_init.sql.
-- ============================================================================

alter table public.products
  add column if not exists currency text not null default 'PKR',
  add column if not exists source_url text,
  add column if not exists pricing_confirmed boolean not null default false;
