-- AeroMed Germany member area setup.
-- Run this only in your own Supabase project's SQL Editor.
-- Frontend code must use the Project URL + publishable key only (never secret/service_role).

create table if not exists public.aeromed_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  published_on date not null,
  google_doc_url text not null check (google_doc_url like 'https://docs.google.com/%' or google_doc_url like 'https://drive.google.com/%'),
  is_published boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.member_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  description text,
  original_file_name text not null,
  file_path text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create or replace function public.is_aeromed_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.aeromed_admins
    where user_id = (select auth.uid())
  );
$$;

grant execute on function public.is_aeromed_admin() to anon, authenticated;

alter table public.aeromed_admins enable row level security;
alter table public.announcements enable row level security;
alter table public.member_resources enable row level security;

grant select on public.aeromed_admins to authenticated;
grant select, insert, update, delete on public.announcements to authenticated;
grant select on public.announcements to anon;
grant select, insert, update, delete on public.member_resources to authenticated;

drop policy if exists "members can check own admin row" on public.aeromed_admins;
create policy "members can check own admin row" on public.aeromed_admins
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "public can read published announcements" on public.announcements;
create policy "public can read published announcements" on public.announcements
  for select to anon, authenticated using (is_published = true);
drop policy if exists "admins manage announcements" on public.announcements;
create policy "admins manage announcements" on public.announcements
  for all to authenticated using (public.is_aeromed_admin()) with check (public.is_aeromed_admin());

drop policy if exists "members can read member resources" on public.member_resources;
create policy "members can read member resources" on public.member_resources
  for select to authenticated using ((select auth.uid()) is not null);
drop policy if exists "admins manage member resources" on public.member_resources;
create policy "admins manage member resources" on public.member_resources
  for all to authenticated using (public.is_aeromed_admin()) with check (public.is_aeromed_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'aeromed-member-resources',
  'aeromed-member-resources',
  false,
  26214400,
  array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain','image/png','image/jpeg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "signed-in members can read private resources" on storage.objects;
create policy "signed-in members can read private resources" on storage.objects
  for select to authenticated using (bucket_id = 'aeromed-member-resources');
drop policy if exists "admins can upload private resources" on storage.objects;
create policy "admins can upload private resources" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'aeromed-member-resources'
    and public.is_aeromed_admin()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
drop policy if exists "admins can delete private resources" on storage.objects;
create policy "admins can delete private resources" on storage.objects
  for delete to authenticated using (bucket_id = 'aeromed-member-resources' and public.is_aeromed_admin());

-- After you create your own Auth user in Authentication > Users, add its UUID:
-- insert into public.aeromed_admins (user_id) values ('YOUR-AUTH-USER-UUID');
