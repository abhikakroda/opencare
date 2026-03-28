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

create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department text not null,
  specialization text not null,
  status text not null check (status in ('available', 'busy', 'off_duty')) default 'available',
  room text not null,
  next_slot text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.machines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  location text not null,
  quantity integer not null default 0,
  status text not null check (status in ('available', 'in_use', 'maintenance')) default 'available',
  notes text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  phone text,
  department text not null,
  subject text not null,
  message text not null,
  status text not null check (status in ('open', 'in_review', 'resolved')) default 'open',
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medical_histories (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  phone text not null,
  visit_date date not null,
  department text not null,
  diagnosis text not null,
  medicines text[] not null default '{}',
  allergies text[] not null default '{}',
  notes text not null default '',
  recorded_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password text not null,
  full_name text not null,
  role text not null check (role in ('admin', 'staff')) default 'admin',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter publication supabase_realtime add table public.queue_items;
alter publication supabase_realtime add table public.medicines;
alter publication supabase_realtime add table public.beds;
alter publication supabase_realtime add table public.doctors;
alter publication supabase_realtime add table public.machines;
alter publication supabase_realtime add table public.complaints;
alter publication supabase_realtime add table public.medical_histories;
