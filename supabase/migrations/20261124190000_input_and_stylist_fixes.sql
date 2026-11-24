-- Input and stylist fixes (docs/03-flows-rules.md §5 and §9, docs/02-screens.md → Screen 7).
--
-- 1. Phone: a leading 0 is dropped (0 98765 43210 → 9876543210), like +91.
-- 2. Name: invisible characters are removed and at least 2 letters are needed, so
--    emoji-only or blank-looking names are refused. Public screens show the first
--    name without a title ("Dr. Priya Shah" → "Priya").
-- 3. Online joining needs at least one service switched On (no_services).
-- 4. A stylist keeps her page address (slug) when renamed, so a bookmarked
--    /stylist/neha keeps working. Names with no Latin letters get "stylist-1a2b3c4d".
-- 5. The Staff PIN and the Owner PIN must be different (pin_in_use).
--
-- Run once in Supabase → SQL Editor (safe to run again).

-- 1. Phone ---------------------------------------------------------------
create or replace function private.clean_phone(p_phone text) returns text
language plpgsql set search_path = '' as $$
declare d text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  if length(d) = 12 and left(d, 2) = '91' then d := right(d, 10); end if;
  d := regexp_replace(d, '^0+', '');
  if d !~ '^[6-9][0-9]{9}$' then perform private.fail('invalid_phone'); end if;
  return d;
end $$;

-- 2. Name ----------------------------------------------------------------
-- "Letters" are A–Z plus the code-point ranges of the world's alphabets (Latin
-- accents, Greek, Cyrillic, Indic scripts, CJK, Hangul). Emoji, digits and
-- punctuation don't count. Ranges are by code point, so this doesn't depend on
-- the database locale.
create or replace function private.clean_name(p_name text) returns text
language plpgsql set search_path = '' as $$
declare
  n text := coalesce(p_name, '');
  letters text := 'A-Za-z' || chr(192) || '-' || chr(8191) || chr(11264) || '-' || chr(11775)
                  || chr(12352) || '-' || chr(40959) || chr(44032) || '-' || chr(55215);
begin
  n := regexp_replace(n, '[[:cntrl:]]', ' ', 'g');
  -- soft hyphen, zero-width space / non-joiner / joiner, LRM, RLM, word joiner, BOM
  n := translate(n, chr(173) || chr(8203) || chr(8204) || chr(8205) || chr(8206) || chr(8207) || chr(8288) || chr(65279), '');
  n := btrim(regexp_replace(n, '\s+', ' ', 'g'));
  if char_length(regexp_replace(n, '[^' || letters || ']', '', 'g')) < 2 or char_length(n) > 30 then
    perform private.fail('invalid_name');
  end if;
  return n;
end $$;

-- Same as before; the public first name now skips a title.
create or replace function private.create_entry(
  p_name text, p_phone text, p_service_ids uuid[], p_barber_id uuid,
  p_source text, p_readded_from uuid default null, p_services jsonb default null
) returns json
language plpgsql set search_path = '' as $$
declare v_services jsonb; v_id uuid; v_token int;
begin
  v_services := coalesce(p_services, private.pick_services(p_service_ids));
  if p_barber_id is not null and not exists (
       select 1 from public.barbers b where b.id = p_barber_id and b.on_duty) then
    perform private.fail('barber_unavailable');
  end if;
  v_token := private.next_token();
  insert into public.queue_entries (token, first_name, barber_pref, services, total_minutes, total_price, source, readded_from)
  values (
    v_token,
    split_part(regexp_replace(p_name, '^(dr|mr|mrs|ms|miss|smt|shri|sri)\.?\s+', '', 'i'), ' ', 1),
    p_barber_id,
    v_services,
    (select sum((x ->> 'minutes')::int) from jsonb_array_elements(v_services) x),
    (select sum((x ->> 'price')::int) from jsonb_array_elements(v_services) x),
    p_source,
    p_readded_from
  )
  returning id into v_id;
  insert into private.contacts (entry_id, full_name, phone) values (v_id, p_name, p_phone);
  return json_build_object('id', v_id, 'token', v_token, 'existing', false);
end $$;

-- 3. Online joining needs a service ---------------------------------------
create or replace function private.online_block_reason() returns text
language plpgsql stable set search_path = '' as $$
declare s public.settings; t time := private.now_local();
begin
  select * into s from public.settings where id = 1;
  if not s.online_open then return 'online_closed'; end if;
  if t < s.open_time then return 'not_open_yet'; end if;
  if t >= s.close_time - interval '30 minutes' then return 'online_closed'; end if;
  if not exists (select 1 from public.barbers b where b.on_duty) then return 'no_barbers'; end if;
  if not exists (select 1 from public.services v where v.active) then return 'no_services'; end if;
  return null;
end $$;

-- 4. Stylist addresses survive a rename -----------------------------------
create or replace function public.owner_save_barber(p_pin text, p_id uuid, p_name text, p_color text, p_shape text, p_sort int)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_name text := btrim(coalesce(p_name, '')); v_slug text;
begin
  perform private.check_pin(p_pin, 'owner');
  if char_length(v_name) not between 2 and 30
     or coalesce(p_color, '') !~ '^#[0-9A-Fa-f]{6}$'
     or coalesce(p_shape, '') not in ('star', 'clover', 'circle', 'pill') then
    perform private.fail('invalid_barber');
  end if;
  if exists (select 1 from public.barbers b where lower(b.name) = lower(v_name) and b.id is distinct from p_id) then
    perform private.fail('barber_name_taken');
  end if;
  begin
    if p_id is null then
      v_id := gen_random_uuid();
      v_slug := trim(both '-' from regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'));
      -- No Latin letters, or the address belongs to someone else (e.g. a renamed stylist): use a short code.
      if v_slug = '' or exists (select 1 from public.barbers b where b.slug = v_slug) then
        v_slug := 'stylist-' || left(v_id::text, 8);
      end if;
      insert into public.barbers (id, name, slug, color, shape, sort)
      values (v_id, v_name, v_slug, p_color, p_shape, coalesce(p_sort, 0));
    else
      -- The slug is left as it is, so bookmarked stylist phones keep working.
      update public.barbers
         set name = v_name, color = p_color, shape = p_shape, sort = coalesce(p_sort, sort)
       where id = p_id
      returning id into v_id;
      if v_id is null then perform private.fail('barber_not_found'); end if;
    end if;
  exception when unique_violation then
    perform private.fail('barber_name_taken');
  end;
  return v_id;
end $$;

-- 5. Staff and Owner PINs must differ (the demo lock from 20261124180000 stays) ----
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
  if exists (select 1 from private.pins p where p.role <> p_role and p.pin_hash = extensions.crypt(p_new_pin, p.pin_hash)) then
    perform private.fail('pin_in_use');
  end if;
  update private.pins set pin_hash = extensions.crypt(p_new_pin, extensions.gen_salt('bf')) where role = p_role;
end $$;
