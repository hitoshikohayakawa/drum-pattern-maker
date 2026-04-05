create extension if not exists pgcrypto;

create table if not exists public.fill_patterns (
  id uuid primary key default gen_random_uuid(),
  owner_user_id text not null,
  title text not null,
  description text not null default '',
  category text not null default 'fill_in',
  fill_length_type text not null default 'full_bar',
  time_signature text not null default '4/4',
  resolution text not null default '16th',
  notation_rule_set text not null default 'dpm_jp_v1',
  visibility text not null default 'private',
  steps_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fill_patterns_owner_user_id_idx
  on public.fill_patterns(owner_user_id);

create index if not exists fill_patterns_updated_at_idx
  on public.fill_patterns(updated_at desc);

create or replace function public.set_fill_patterns_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_fill_patterns_updated_at on public.fill_patterns;

create trigger trg_fill_patterns_updated_at
before update on public.fill_patterns
for each row
execute function public.set_fill_patterns_updated_at();
