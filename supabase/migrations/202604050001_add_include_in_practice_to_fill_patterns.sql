alter table public.fill_patterns
add column if not exists include_in_practice boolean not null default false;
