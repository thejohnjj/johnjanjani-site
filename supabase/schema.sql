-- johnjanjani.com database setup
-- Paste this whole file into Supabase → SQL Editor → New query, then press Run.
-- Safe to run more than once.

create extension if not exists "pgcrypto";

-- Members: people who sign up to see prices and addresses (your leads)
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text not null,
  lang text not null default 'en',
  consent boolean not null default false,
  consent_at timestamptz,
  first_listing text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

-- Listings you add from the admin page
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  mls_number text,
  status text not null default 'sale' check (status in ('sale', 'rent')),
  kind text not null default 'house' check (kind in ('house', 'townhouse', 'condo')),
  city_en text not null,
  city_fa text not null default '',
  type_en text not null,
  type_fa text not null default '',
  price integer not null,
  address text not null,
  beds numeric not null default 0,
  baths numeric not null default 0,
  parking integer not null default 0,
  sqft text not null default '',
  description_en text not null default '',
  description_fa text not null default '',
  features_en text[] not null default '{}',
  features_fa text[] not null default '{}',
  photos text[] not null default '{}',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Which member looked at which listing
create table if not exists public.listing_views (
  id bigserial primary key,
  member_id uuid not null references public.members(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

-- "Book a private showing" requests
create table if not exists public.showing_requests (
  id bigserial primary key,
  member_id uuid not null references public.members(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists listing_views_member_idx on public.listing_views(member_id);
create index if not exists listings_active_idx on public.listings(active, sort_order);

-- Lock every table: only the website's server (service role key) can read or write.
alter table public.members enable row level security;
alter table public.listings enable row level security;
alter table public.listing_views enable row level security;
alter table public.showing_requests enable row level security;

-- Public bucket for listing photos (anyone can view a photo; only the server can create upload links)
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

-- Added October 2026: listing brokerage (shown on every listing) and Instagram home tour link.
alter table listings add column if not exists listing_brokerage text not null default '';
alter table listings add column if not exists tour_url text;

-- Added October 2026: listing code that matches the Instagram home tour post (e.g. 12).
alter table listings add column if not exists code text;
create unique index if not exists listings_code_key on listings (lower(code)) where code is not null and code <> '';

-- Added October 2026: home value requests, guide downloads and client reviews.
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('valuation', 'guide')),
  name text not null,
  email text not null,
  phone text,
  lang text not null default 'en',
  details jsonb not null default '{}'::jsonb,
  consent boolean not null default false,
  created_at timestamptz not null default now()
);
alter table leads enable row level security;

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  text_en text,
  text_fa text,
  rating int not null default 5 check (rating between 1 and 5),
  source text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table reviews enable row level security;

-- Daily picks: listings you like in different areas (no home tour)
alter table listings add column if not exists section text not null default 'tour';
alter table listings add column if not exists pick_note_en text not null default '';
alter table listings add column if not exists pick_note_fa text not null default '';
alter table listings add column if not exists expires_at timestamptz;

-- Contact form messages
alter table leads drop constraint if exists leads_kind_check;
alter table leads add constraint leads_kind_check check (kind in ('valuation', 'guide', 'message'));

-- Sold homes
alter table listings drop constraint if exists listings_status_check;
alter table listings add constraint listings_status_check check (status in ('sale', 'rent', 'sold'));

-- Off market (terminated) homes
alter table listings drop constraint if exists listings_status_check;
alter table listings add constraint listings_status_check check (status in ('sale', 'rent', 'sold', 'off'));

-- MLS feed (PropTx IDX/VOW): audit trail of visitor activity, also used to block scrapers
create table if not exists feed_audit (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  ip_hash text not null,
  kind text not null default 'idx',
  action text not null,
  listing_key text,
  member_id uuid,
  user_agent text
);
create index if not exists feed_audit_ip_at on feed_audit (ip_hash, at desc);
create index if not exists feed_audit_at on feed_audit (at desc);
alter table feed_audit enable row level security;
