alter table public.fill_patterns enable row level security;

grant select, insert, update, delete on public.fill_patterns to anon;
grant select, insert, update, delete on public.fill_patterns to authenticated;

drop policy if exists "fill_patterns_select_mvp" on public.fill_patterns;
create policy "fill_patterns_select_mvp"
on public.fill_patterns
for select
to anon, authenticated
using (true);

drop policy if exists "fill_patterns_insert_mvp" on public.fill_patterns;
create policy "fill_patterns_insert_mvp"
on public.fill_patterns
for insert
to anon, authenticated
with check (owner_user_id <> '');

drop policy if exists "fill_patterns_update_mvp" on public.fill_patterns;
create policy "fill_patterns_update_mvp"
on public.fill_patterns
for update
to anon, authenticated
using (true)
with check (owner_user_id <> '');

drop policy if exists "fill_patterns_delete_mvp" on public.fill_patterns;
create policy "fill_patterns_delete_mvp"
on public.fill_patterns
for delete
to anon, authenticated
using (true);
