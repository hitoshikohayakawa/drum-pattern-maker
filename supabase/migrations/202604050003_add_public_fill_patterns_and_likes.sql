create table if not exists public.fill_pattern_likes (
  fill_pattern_id uuid not null references public.fill_patterns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (fill_pattern_id, user_id)
);

create index if not exists fill_pattern_likes_fill_pattern_id_idx
  on public.fill_pattern_likes(fill_pattern_id);

alter table public.fill_pattern_likes enable row level security;

grant select on public.profiles to anon, authenticated;
grant select on public.fill_patterns to anon, authenticated;
grant select on public.fill_pattern_likes to anon, authenticated;
grant insert, delete on public.fill_pattern_likes to authenticated;

drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
on public.profiles
for select
to anon, authenticated
using (true);

drop policy if exists "fill_patterns_select_public" on public.fill_patterns;
create policy "fill_patterns_select_public"
on public.fill_patterns
for select
to anon, authenticated
using (visibility = 'public');

drop policy if exists "fill_pattern_likes_select_public" on public.fill_pattern_likes;
create policy "fill_pattern_likes_select_public"
on public.fill_pattern_likes
for select
to anon, authenticated
using (true);

drop policy if exists "fill_pattern_likes_insert_own" on public.fill_pattern_likes;
create policy "fill_pattern_likes_insert_own"
on public.fill_pattern_likes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "fill_pattern_likes_delete_own" on public.fill_pattern_likes;
create policy "fill_pattern_likes_delete_own"
on public.fill_pattern_likes
for delete
to authenticated
using (auth.uid() = user_id);
