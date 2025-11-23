-- Profiles table mirrors auth.users role for convenient public access
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('papa', 'mama')),
  created_at timestamptz default now()
);

create unique index if not exists profiles_role_key on public.profiles (role);

alter table public.profiles enable row level security;

do $$
begin
  create policy "profiles select authenticated"
    on public.profiles
    for select
    using (auth.uid() is not null);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "profiles insert self"
    on public.profiles
    for insert
    with check (auth.uid() = id);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "profiles update self"
    on public.profiles
    for update
    using (auth.uid() = id)
    with check (auth.uid() = id);
exception
  when duplicate_object then null;
end $$;

-- Decisions table migration: add user_id and backfill
alter table public.decisions
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists decisions_user_id_idx on public.decisions (user_id);

-- Backfill from legacy 'user' column (values 'me'/'her')
update public.decisions d
set user_id = p.id
from public.profiles p
where d.user = 'me'
  and p.role = 'papa';

update public.decisions d
set user_id = p.id
from public.profiles p
where d.user = 'her'
  and p.role = 'mama';

alter table public.decisions
  alter column user_id set not null;

alter table public.decisions
  drop column if exists user;

alter table public.decisions enable row level security;

-- Decisions policies: authenticated users may read all rows (for matches + stats),
-- writes are limited to own rows.
do $$
begin
  create policy "decisions select authenticated"
    on public.decisions
    for select
    using (auth.uid() is not null);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "decisions insert own"
    on public.decisions
    for insert
    with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "decisions delete own"
    on public.decisions
    for delete
    using (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "decisions update own"
    on public.decisions
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

-- Keep auth.users metadata in sync with profiles.role
update auth.users au
set raw_user_meta_data = jsonb_set(
  coalesce(au.raw_user_meta_data, '{}'::jsonb),
  '{role}',
  to_jsonb(p.role)
)
from public.profiles p
where au.id = p.id;
