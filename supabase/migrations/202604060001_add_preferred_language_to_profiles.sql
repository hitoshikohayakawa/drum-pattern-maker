alter table public.profiles
add column if not exists preferred_language text not null default 'ja';

update public.profiles
set preferred_language = 'ja'
where preferred_language is null;
