create extension if not exists "pgcrypto";

create table if not exists public.queue_items (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  department text not null,
  token_number text not null unique,
  status text not null check (status in ('waiting', 'called', 'done')) default 'waiting',
  created_at timestamptz not null default now(),
  called_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.medicines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  generic_name text not null,
  brand_names text[] not null default '{}',
  stock_qty integer not null default 0,
  location text not null,
  alternatives text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.beds (
  id uuid primary key default gen_random_uuid(),
  ward text not null,
  bed_number text not null,
  status text not null check (status in ('available', 'occupied', 'cleaning')) default 'available',
  patient_name text,
  updated_at timestamptz not null default now()
);

alter publication supabase_realtime add table public.queue_items;
alter publication supabase_realtime add table public.medicines;
alter publication supabase_realtime add table public.beds;
