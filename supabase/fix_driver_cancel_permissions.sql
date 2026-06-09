-- Fix for: "permission denied for table university_turns"
-- Run this in Supabase SQL Editor.
-- It grants the browser-authenticated role access to cancel its own turns while RLS stays enabled.

begin;

grant usage on schema public to authenticated;

grant select, insert, update, delete
on table public.university_turns
to authenticated;

grant select, update, delete
on table public.turn_applications
to authenticated;

alter table public.university_turns enable row level security;
alter table public.turn_applications enable row level security;

create or replace function public.cancel_driver_turn(target_turn_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  affected_count integer;
begin
  if current_user_id is null then
    raise exception 'not authenticated';
  end if;

  update public.turn_applications
  set status = 'rejected'
  where turn_id = target_turn_id
    and driver_id = current_user_id;

  update public.university_turns
  set status = 'completed'
  where id = target_turn_id
    and driver_id = current_user_id;

  get diagnostics affected_count = row_count;

  if affected_count = 0 then
    delete from public.university_turns
    where id = target_turn_id
      and driver_id = current_user_id;

    get diagnostics affected_count = row_count;
  end if;

  if affected_count = 0 then
    raise exception 'turn not found or not owned by user';
  end if;

  return true;
end;
$$;

revoke all on function public.cancel_driver_turn(uuid) from public;
grant execute on function public.cancel_driver_turn(uuid) to authenticated;

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
);

create policy "turns_insert_own"
on public.university_turns
for insert
to authenticated
with check (
  driver_id = (select auth.uid())
  and status = 'active'
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

commit;
