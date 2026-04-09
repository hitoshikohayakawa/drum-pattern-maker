alter table public.fill_patterns
add column if not exists pattern_json jsonb;

comment on column public.fill_patterns.pattern_json is
'Canonical rhythm document for phase 1 migration. PPQ=192, events+notes based.';

create index if not exists fill_patterns_pattern_json_idx
on public.fill_patterns
using gin (pattern_json);
