-- Sim Story Universe — run this file in Supabase → SQL Editor.
-- Public read; only signed-in users can create, edit, and delete records.
-- Important: disable public sign-ups in Authentication → Settings. Create your owner account manually.

create extension if not exists pgcrypto;

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  portrait_url text,
  age text default '',
  appearance text default '',
  personality text default '',
  traits text[] not null default '{}',
  career text default '',
  hobbies text default '',
  fears text default '',
  dreams text default '',
  biography text default '',
  secrets text default '',
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text default '',
  content text default '',
  blocks jsonb not null default '[]'::jsonb,
  mood text default 'Нежность',
  quote text default '',
  tags text[] not null default '{}',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.relationships (
  id uuid primary key default gen_random_uuid(),
  from_character uuid references public.characters(id) on delete cascade,
  to_character uuid references public.characters(id) on delete cascade,
  type text not null default 'друг',
  description text default '',
  tags text[] not null default '{}',
  status text default 'Активна',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint relationships_different_characters check (from_character is null or to_character is null or from_character <> to_character)
);

alter table public.relationships add column if not exists tags text[] not null default '{}';

create table if not exists public.family_tree (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null unique references public.characters(id) on delete cascade,
  x numeric not null default 220,
  y numeric not null default 180,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text default '',
  category text not null default 'Сцена',
  status text not null default 'В планах',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per tag assignment. entity_type is one of character, story, relationship, idea.
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#d58eaa',
  entity_type text not null,
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  constraint tags_entity_type_check check (entity_type in ('character', 'story', 'relationship', 'idea'))
);
create index if not exists tags_name_idx on public.tags (lower(name));
create index if not exists relationships_from_idx on public.relationships(from_character);
create index if not exists relationships_to_idx on public.relationships(to_character);
create index if not exists family_tree_character_idx on public.family_tree(character_id);

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare t text;
begin
  foreach t in array array['characters','stories','relationships','family_tree','ideas'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
  end loop;
end $$;

alter table public.characters enable row level security;
alter table public.stories enable row level security;
alter table public.relationships enable row level security;
alter table public.family_tree enable row level security;
alter table public.ideas enable row level security;
alter table public.tags enable row level security;


-- Owner-only write access; public read access.
-- Replace 28dccdbc-5527-42df-82e3-47ca97ab4d7f with the owner's Auth UID.

do $$
declare
  owner_uid text := '28dccdbc-5527-42df-82e3-47ca97ab4d7f';
  t text;
begin
  foreach t in array array[
    'characters', 'stories', 'relationships',
    'family_tree', 'ideas', 'tags'
  ] loop
    -- Remove policies from the previous schema version.
    execute format(
      'drop policy if exists %I on public.%I',
      'Public can read ' || t, t
    );
    execute format(
      'drop policy if exists %I on public.%I',
      'Signed-in users can insert ' || t, t
    );
    execute format(
      'drop policy if exists %I on public.%I',
      'Signed-in users can update ' || t, t
    );
    execute format(
      'drop policy if exists %I on public.%I',
      'Signed-in users can delete ' || t, t
    );
    execute format(
      'drop policy if exists %I on public.%I',
      'Owner can insert ' || t, t
    );
    execute format(
      'drop policy if exists %I on public.%I',
      'Owner can update ' || t, t
    );
    execute format(
      'drop policy if exists %I on public.%I',
      'Owner can delete ' || t, t
    );

    if t = 'stories' then
      execute 'drop policy if exists "Public can read published stories" on public.stories';
      execute 'drop policy if exists "Signed-in users can read all stories" on public.stories';
      execute 'drop policy if exists "Owner can read all stories" on public.stories';

     execute 'create policy "Public can read published stories"
  on public.stories for select to anon, authenticated
  using (published = true)';

      execute format(
        'create policy "Owner can read all stories"
         on public.stories for select to authenticated
         using ((select auth.uid())::text = %L)',
        owner_uid
      );
    else
      execute format(
        'create policy %I on public.%I
         for select to anon, authenticated using (true)',
        'Public can read ' || t, t
      );
    end if;

    execute format(
      'create policy %I on public.%I
       for insert to authenticated
       with check ((select auth.uid())::text = %L)',
      'Owner can insert ' || t, t, owner_uid
    );

    execute format(
      'create policy %I on public.%I
       for update to authenticated
       using ((select auth.uid())::text = %L)
       with check ((select auth.uid())::text = %L)',
      'Owner can update ' || t, t, owner_uid, owner_uid
    );

    execute format(
      'create policy %I on public.%I
       for delete to authenticated
       using ((select auth.uid())::text = %L)',
      'Owner can delete ' || t, t, owner_uid
    );
  end loop;
end $$;

-- Grant only the SQL operations the app needs.
revoke all on table
  public.characters, public.stories, public.relationships,
  public.family_tree, public.ideas, public.tags
from anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select on
  public.characters, public.stories, public.relationships,
  public.family_tree, public.ideas, public.tags
to anon, authenticated;

grant insert, update, delete on
  public.characters, public.stories, public.relationships,
  public.family_tree, public.ideas, public.tags
to authenticated;

-- Public images: anyone with an image URL can view it.
-- Only the owner account may upload, replace, or delete images.
insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'photos', 'photos', true, 15728640,
  array['image/jpeg','image/png','image/webp','image/gif','image/avif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 15728640,
  allowed_mime_types =
    array['image/jpeg','image/png','image/webp','image/gif','image/avif'];

drop policy if exists "Public can view photos" on storage.objects;
drop policy if exists "Signed-in users can upload photos" on storage.objects;
drop policy if exists "Signed-in users can update photos" on storage.objects;
drop policy if exists "Signed-in users can delete photos" on storage.objects;
drop policy if exists "Owner can list photos" on storage.objects;
drop policy if exists "Owner can upload photos" on storage.objects;
drop policy if exists "Owner can update photos" on storage.objects;
drop policy if exists "Owner can delete photos" on storage.objects;

do $$
declare
  owner_uid text := '28dccdbc-5527-42df-82e3-47ca97ab4d7f';
begin
  execute format(
    'create policy "Owner can list photos"
     on storage.objects for select to authenticated
     using (bucket_id = %L and owner_id = %L)',
    'photos', owner_uid
  );

  execute format(
    'create policy "Owner can upload photos"
     on storage.objects for insert to authenticated
     with check (bucket_id = %L and owner_id = %L)',
    'photos', owner_uid
  );

  execute format(
    'create policy "Owner can update photos"
     on storage.objects for update to authenticated
     using (bucket_id = %L and owner_id = %L)
     with check (bucket_id = %L and owner_id = %L)',
    'photos', owner_uid, 'photos', owner_uid
  );

  execute format(
    'create policy "Owner can delete photos"
     on storage.objects for delete to authenticated
     using (bucket_id = %L and owner_id = %L)',
    'photos', owner_uid
  );
end $$;

grant usage on schema storage to anon, authenticated;
grant select on storage.objects to anon, authenticated;
grant insert, update, delete on storage.objects to authenticated;

