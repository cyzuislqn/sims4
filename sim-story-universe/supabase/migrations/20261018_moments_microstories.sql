-- Sim Story Universe: add the separate micro-stories archive without modifying existing records.
create table if not exists public.moments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  content text default '',
  event_date date default current_date,
  age_stage text not null default 'Любой возраст',
  character_ids uuid[] not null default '{}',
  tags text[] not null default '{}',
  linked_story_id uuid references public.stories(id) on delete set null,
  cover_url text default '',
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists moments_event_date_idx on public.moments(event_date desc);
create index if not exists moments_character_ids_idx on public.moments using gin(character_ids);
create index if not exists moments_tags_idx on public.moments using gin(tags);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists moments_set_updated_at on public.moments;
create trigger moments_set_updated_at before update on public.moments
for each row execute function public.set_updated_at();

alter table public.moments enable row level security;
drop policy if exists "Public can read moments" on public.moments;
drop policy if exists "Owner can insert moments" on public.moments;
drop policy if exists "Owner can update moments" on public.moments;
drop policy if exists "Owner can delete moments" on public.moments;
create policy "Public can read moments" on public.moments for select to anon, authenticated using (true);
create policy "Owner can insert moments" on public.moments for insert to authenticated with check ((select auth.uid())::text = '28dccdbc-5527-42df-82e3-47ca97ab4d7f');
create policy "Owner can update moments" on public.moments for update to authenticated using ((select auth.uid())::text = '28dccdbc-5527-42df-82e3-47ca97ab4d7f') with check ((select auth.uid())::text = '28dccdbc-5527-42df-82e3-47ca97ab4d7f');
create policy "Owner can delete moments" on public.moments for delete to authenticated using ((select auth.uid())::text = '28dccdbc-5527-42df-82e3-47ca97ab4d7f');
revoke all on table public.moments from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.moments to anon, authenticated;
grant insert, update, delete on public.moments to authenticated;
