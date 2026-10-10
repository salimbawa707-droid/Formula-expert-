-- =========================================================
-- Detergent R&D Expert - Production Supabase Database Schema
-- Run this in Supabase SQL Editor to initialize all tables with RLS
-- =========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  company text,
  role text default 'Senior R&D Chemist',
  plan text default 'free',
  trial_activated boolean default false,
  trial_ends_at timestamptz,
  subscription_expires_at timestamptz,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- Trigger to create profile automatically on auth.users signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, company, plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'company', 'R&D Laboratory'),
    coalesce(new.raw_user_meta_data->>'plan', 'free')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. FORMULAS TABLE
create table if not exists public.formulas (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  category text not null,
  product_type text,
  target_ph numeric default 7.0,
  batch_size_kg numeric default 100,
  water_hardness_ppm numeric default 150,
  description text,
  ingredients jsonb default '[]'::jsonb,
  instructions jsonb default '[]'::jsonb,
  notes text,
  version integer default 1,
  is_favorite boolean default false,
  is_system boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.formulas enable row level security;

create policy "Users can view own formulas"
  on public.formulas for select
  using (auth.uid() = user_id);

create policy "Users can insert own formulas"
  on public.formulas for insert
  with check (auth.uid() = user_id);

create policy "Users can update own formulas"
  on public.formulas for update
  using (auth.uid() = user_id);

create policy "Users can delete own formulas"
  on public.formulas for delete
  using (auth.uid() = user_id);

-- 3. LAB NOTES TABLE
create table if not exists public.lab_notes (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  text text not null,
  date text not null,
  tags jsonb default '[]'::jsonb,
  formula_id text,
  batch_number text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.lab_notes enable row level security;

create policy "Users can view own lab notes"
  on public.lab_notes for select
  using (auth.uid() = user_id);

create policy "Users can insert own lab notes"
  on public.lab_notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own lab notes"
  on public.lab_notes for update
  using (auth.uid() = user_id);

create policy "Users can delete own lab notes"
  on public.lab_notes for delete
  using (auth.uid() = user_id);

-- 4. INVENTORY TABLE
create table if not exists public.inventory (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  category text not null,
  stock_kg numeric default 0,
  min_stock_kg numeric default 50,
  cost_per_kg numeric default 0,
  supplier text,
  cas_number text,
  active_concentration numeric,
  notes text,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.inventory enable row level security;

create policy "Users can view own inventory"
  on public.inventory for select
  using (auth.uid() = user_id);

create policy "Users can insert own inventory"
  on public.inventory for insert
  with check (auth.uid() = user_id);

create policy "Users can update own inventory"
  on public.inventory for update
  using (auth.uid() = user_id);

create policy "Users can delete own inventory"
  on public.inventory for delete
  using (auth.uid() = user_id);

-- 5. PRODUCTION RUNS TABLE
create table if not exists public.production_runs (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  batch_number text not null,
  formula_id text,
  formula_name text not null,
  batch_size_kg numeric default 100,
  date text not null,
  operator text,
  status text default 'COMPLETED',
  qc_passed boolean default true,
  density numeric,
  viscosity numeric,
  ph numeric,
  notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.production_runs enable row level security;

create policy "Users can view own production runs"
  on public.production_runs for select
  using (auth.uid() = user_id);

create policy "Users can insert own production runs"
  on public.production_runs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own production runs"
  on public.production_runs for update
  using (auth.uid() = user_id);

create policy "Users can delete own production runs"
  on public.production_runs for delete
  using (auth.uid() = user_id);
