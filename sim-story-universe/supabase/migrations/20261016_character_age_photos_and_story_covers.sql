-- Sim Story Universe: add character age-stage gallery and story cover selection.
-- Safe to run on an existing database; does not remove or rewrite existing records.
alter table public.characters add column if not exists age_photos jsonb not null default '[]'::jsonb;
alter table public.stories add column if not exists cover_url text default '';
