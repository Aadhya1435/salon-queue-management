-- Demo hours and PIN lock for the hosted demo (docs/01-brief.md → Demo data,
-- docs/03-flows-rules.md §9).
--
-- 1. Demo opening hours: 10:00 AM – 11:00 PM (India time), as set on the hosted demo.
--    Online joining then closes at 10:30 PM; walk-ins are allowed until 11:00 PM.
-- 2. settings.pin_change_locked: when true, owner_change_pin refuses every change,
--    so the test PINs published in the README (1234 / 9999) always work.
--
-- Run once in Supabase → SQL Editor (safe to run again).

alter table public.settings
  add column if not exists pin_change_locked boolean not null default false;

update public.settings
   set open_time = '10:00', close_time = '23:00', pin_change_locked = true, updated_at = now()
 where id = 1;

-- Same as before, plus the lock check (after the PIN check, so a wrong PIN still says invalid_pin).
create or replace function public.owner_change_pin(p_pin text, p_role text, p_new_pin text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.check_pin(p_pin, 'owner');
  if (select s.pin_change_locked from public.settings s where s.id = 1) then
    perform private.fail('pin_change_locked');
  end if;
  if coalesce(p_role, '') not in ('staff', 'owner') or coalesce(p_new_pin, '') !~ '^[0-9]{4}$' then
    perform private.fail('invalid_new_pin');
  end if;
  update private.pins set pin_hash = extensions.crypt(p_new_pin, extensions.gen_salt('bf')) where role = p_role;
end $$;
