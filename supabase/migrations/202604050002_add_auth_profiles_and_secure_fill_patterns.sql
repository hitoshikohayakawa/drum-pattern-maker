create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null default '',
  avatar_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;

create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

delete from public.fill_patterns
where owner_user_id is null
   or owner_user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

drop policy if exists "fill_patterns_select_mvp" on public.fill_patterns;
drop policy if exists "fill_patterns_insert_mvp" on public.fill_patterns;
drop policy if exists "fill_patterns_update_mvp" on public.fill_patterns;
drop policy if exists "fill_patterns_delete_mvp" on public.fill_patterns;
drop policy if exists "fill_patterns_select_own" on public.fill_patterns;
drop policy if exists "fill_patterns_insert_own" on public.fill_patterns;
drop policy if exists "fill_patterns_update_own" on public.fill_patterns;
drop policy if exists "fill_patterns_delete_own" on public.fill_patterns;

alter table public.fill_patterns
alter column owner_user_id type uuid
using owner_user_id::uuid;

alter table public.fill_patterns
drop constraint if exists fill_patterns_owner_user_id_fkey;

alter table public.fill_patterns
add constraint fill_patterns_owner_user_id_fkey
foreign key (owner_user_id) references auth.users(id) on delete cascade;

alter table public.profiles enable row level security;
alter table public.fill_patterns enable row level security;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.fill_patterns to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "fill_patterns_select_own" on public.fill_patterns;
create policy "fill_patterns_select_own"
on public.fill_patterns
for select
to authenticated
using (auth.uid() = owner_user_id);

drop policy if exists "fill_patterns_insert_own" on public.fill_patterns;
create policy "fill_patterns_insert_own"
on public.fill_patterns
for insert
to authenticated
with check (auth.uid() = owner_user_id);

drop policy if exists "fill_patterns_update_own" on public.fill_patterns;
create policy "fill_patterns_update_own"
on public.fill_patterns
for update
to authenticated
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

drop policy if exists "fill_patterns_delete_own" on public.fill_patterns;
create policy "fill_patterns_delete_own"
on public.fill_patterns
for delete
to authenticated
using (auth.uid() = owner_user_id);
