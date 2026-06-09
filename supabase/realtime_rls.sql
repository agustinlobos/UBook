-- UBook Realtime + RLS hardening.
-- Apply this in Supabase SQL Editor after confirming the table names match production.

begin;

alter table if exists public.profiles enable row level security;
alter table if exists public.university_turns enable row level security;
alter table if exists public.turn_applications enable row level security;
alter table if exists public.turn_messages enable row level security;
alter table if exists public.turn_history enable row level security;
alter table if exists public.turn_ratings enable row level security;
alter table if exists public.user_groups enable row level security;
alter table if exists public.group_members enable row level security;
alter table if exists public.reports enable row level security;
alter table if exists public.waitlist_signups enable row level security;

grant usage on schema public to anon, authenticated;
revoke all on public.profiles from anon, authenticated;
grant select (id, email, full_name, university, commune, avatar_url, rating, rating_count)
on public.profiles
to authenticated;
grant insert (id, email, full_name, university, commune, rut, phone)
on public.profiles
to authenticated;
grant update (full_name, university, commune, avatar_url, phone)
on public.profiles
to authenticated;
grant select, insert, update, delete
on public.university_turns,
   public.turn_applications,
   public.turn_messages,
   public.turn_history,
   public.turn_ratings,
   public.user_groups,
   public.group_members,
   public.reports
to authenticated;
grant insert on public.waitlist_signups to anon;

alter table if exists public.profiles replica identity full;
alter table if exists public.university_turns replica identity full;
alter table if exists public.turn_applications replica identity full;
alter table if exists public.turn_messages replica identity full;
alter table if exists public.turn_history replica identity full;
alter table if exists public.turn_ratings replica identity full;
alter table if exists public.user_groups replica identity full;
alter table if exists public.group_members replica identity full;
alter table if exists public.reports replica identity full;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_group_owner(target_group_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_groups g
    where g.id = target_group_id
      and g.owner_id = (select auth.uid())
  );
$$;

create or replace function private.is_group_member(target_group_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_group_owner(uuid) from public;
revoke all on function private.is_group_member(uuid) from public;
grant execute on function private.is_group_owner(uuid) to authenticated;
grant execute on function private.is_group_member(uuid) to authenticated;

create index if not exists university_turns_visibility_status_idx on public.university_turns (visibility, status);
create index if not exists university_turns_driver_id_idx on public.university_turns (driver_id);
create index if not exists university_turns_group_id_idx on public.university_turns (group_id);
create index if not exists turn_applications_applicant_id_idx on public.turn_applications (applicant_id);
create index if not exists turn_applications_driver_id_idx on public.turn_applications (driver_id);
create index if not exists turn_applications_turn_id_status_idx on public.turn_applications (turn_id, status);
create index if not exists turn_messages_sender_id_idx on public.turn_messages (sender_id);
create index if not exists turn_messages_recipient_id_idx on public.turn_messages (recipient_id);
create index if not exists turn_messages_turn_id_idx on public.turn_messages (turn_id);
create index if not exists turn_history_user_id_idx on public.turn_history (user_id);
create index if not exists turn_history_driver_id_idx on public.turn_history (driver_id);
create index if not exists turn_ratings_history_id_idx on public.turn_ratings (history_id);
create index if not exists user_groups_owner_id_idx on public.user_groups (owner_id);
create index if not exists group_members_group_id_user_id_idx on public.group_members (group_id, user_id);
create index if not exists group_members_user_id_idx on public.group_members (user_id);
create index if not exists reports_reporter_id_idx on public.reports (reporter_id);

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'profiles',
    'university_turns',
    'turn_applications',
    'turn_messages',
    'turn_history',
    'turn_ratings',
    'user_groups',
    'group_members',
    'reports'
  ]
  loop
    if exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = target_table
    ) and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = target_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', target_table);
    end if;
  end loop;
end $$;

drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;

create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "profiles_delete_own"
on public.profiles
for delete
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "turns_select_visible" on public.university_turns;
drop policy if exists "turns_insert_own" on public.university_turns;
drop policy if exists "turns_update_own" on public.university_turns;
drop policy if exists "turns_delete_own" on public.university_turns;

create policy "turns_select_visible"
on public.university_turns
for select
to authenticated
using (
  visibility = 'public'
  or driver_id = (select auth.uid())
  or (select private.is_group_member(group_id))
);

create policy "turns_insert_own"
on public.university_turns
for insert
to authenticated
with check (
  driver_id = (select auth.uid())
  and status = 'active'
  and (
    visibility = 'public'
    or (select private.is_group_member(group_id))
  )
);

create policy "turns_update_own"
on public.university_turns
for update
to authenticated
using (driver_id = (select auth.uid()))
with check (driver_id = (select auth.uid()));

create policy "turns_delete_own"
on public.university_turns
for delete
to authenticated
using (driver_id = (select auth.uid()));

drop policy if exists "applications_select_participants" on public.turn_applications;
drop policy if exists "applications_insert_applicant" on public.turn_applications;
drop policy if exists "applications_update_participants" on public.turn_applications;
drop policy if exists "applications_delete_participants" on public.turn_applications;

create policy "applications_select_participants"
on public.turn_applications
for select
to authenticated
using (
  applicant_id = (select auth.uid())
  or driver_id = (select auth.uid())
);

create policy "applications_insert_applicant"
on public.turn_applications
for insert
to authenticated
with check (
  applicant_id = (select auth.uid())
  and exists (
    select 1
    from public.university_turns t
    where t.id = turn_applications.turn_id
      and t.driver_id <> (select auth.uid())
      and t.status = 'active'
  )
);

create policy "applications_update_participants"
on public.turn_applications
for update
to authenticated
using (
  applicant_id = (select auth.uid())
  or driver_id = (select auth.uid())
)
with check (
  applicant_id = (select auth.uid())
  or driver_id = (select auth.uid())
);

create policy "applications_delete_participants"
on public.turn_applications
for delete
to authenticated
using (
  applicant_id = (select auth.uid())
  or driver_id = (select auth.uid())
);

drop policy if exists "messages_select_participants" on public.turn_messages;
drop policy if exists "messages_insert_sender" on public.turn_messages;
drop policy if exists "messages_delete_participants" on public.turn_messages;

create policy "messages_select_participants"
on public.turn_messages
for select
to authenticated
using (
  sender_id = (select auth.uid())
  or recipient_id = (select auth.uid())
);

create policy "messages_insert_sender"
on public.turn_messages
for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and recipient_id <> (select auth.uid())
  and exists (
    select 1
    from public.turn_applications a
    where a.turn_id = turn_messages.turn_id
      and a.status = 'accepted'
      and (
        (a.driver_id = sender_id and a.applicant_id = recipient_id)
        or (a.driver_id = recipient_id and a.applicant_id = sender_id)
      )
  )
);

create policy "messages_delete_participants"
on public.turn_messages
for delete
to authenticated
using (
  sender_id = (select auth.uid())
  or recipient_id = (select auth.uid())
);

drop policy if exists "history_crud_own" on public.turn_history;

create policy "history_crud_own"
on public.turn_history
for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "ratings_select_participants" on public.turn_ratings;
drop policy if exists "ratings_insert_own_history" on public.turn_ratings;
drop policy if exists "ratings_update_own_history" on public.turn_ratings;
drop policy if exists "ratings_delete_own_history" on public.turn_ratings;

create policy "ratings_select_participants"
on public.turn_ratings
for select
to authenticated
using (
  exists (
    select 1
    from public.turn_history h
    where h.id = turn_ratings.history_id
      and (h.user_id = (select auth.uid()) or h.driver_id = (select auth.uid()))
  )
);

create policy "ratings_insert_own_history"
on public.turn_ratings
for insert
to authenticated
with check (
  exists (
    select 1
    from public.turn_history h
    where h.id = turn_ratings.history_id
      and h.user_id = (select auth.uid())
      and h.driver_id <> (select auth.uid())
  )
);

create policy "ratings_update_own_history"
on public.turn_ratings
for update
to authenticated
using (
  exists (
    select 1
    from public.turn_history h
    where h.id = turn_ratings.history_id
      and h.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.turn_history h
    where h.id = turn_ratings.history_id
      and h.user_id = (select auth.uid())
      and h.driver_id <> (select auth.uid())
  )
);

create policy "ratings_delete_own_history"
on public.turn_ratings
for delete
to authenticated
using (
  exists (
    select 1
    from public.turn_history h
    where h.id = turn_ratings.history_id
      and h.user_id = (select auth.uid())
  )
);

drop policy if exists "groups_select_member" on public.user_groups;
drop policy if exists "groups_insert_owner" on public.user_groups;
drop policy if exists "groups_update_owner" on public.user_groups;
drop policy if exists "groups_delete_owner" on public.user_groups;

create policy "groups_select_member"
on public.user_groups
for select
to authenticated
using (
  owner_id = (select auth.uid())
  or (select private.is_group_member(id))
);

create policy "groups_insert_owner"
on public.user_groups
for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "groups_update_owner"
on public.user_groups
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "groups_delete_owner"
on public.user_groups
for delete
to authenticated
using (owner_id = (select auth.uid()));

drop policy if exists "members_select_group_member" on public.group_members;
drop policy if exists "members_insert_group_owner" on public.group_members;
drop policy if exists "members_delete_group_owner_or_self" on public.group_members;

create policy "members_select_group_member"
on public.group_members
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_group_owner(group_id))
);

create policy "members_insert_group_owner"
on public.group_members
for insert
to authenticated
with check (
  (select private.is_group_owner(group_id))
);

create policy "members_delete_group_owner_or_self"
on public.group_members
for delete
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_group_owner(group_id))
);

drop policy if exists "reports_select_own" on public.reports;
drop policy if exists "reports_insert_own" on public.reports;

create policy "reports_select_own"
on public.reports
for select
to authenticated
using (reporter_id = (select auth.uid()));

create policy "reports_insert_own"
on public.reports
for insert
to authenticated
with check (reporter_id = (select auth.uid()));

drop policy if exists "waitlist_insert_anon" on public.waitlist_signups;

create policy "waitlist_insert_anon"
on public.waitlist_signups
for insert
to anon
with check (true);

commit;
