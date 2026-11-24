-- ════════════════════════════════════════════════════════════════════
-- Salon Queue: tables, security, queue rules and demo data
--
-- How to run: Supabase Dashboard → SQL Editor → New query → paste this
-- whole file → Run. Run it once, on a fresh project.
--
-- The rules follow docs/03-flows-rules.md. The browser can only READ the
-- public tables. Every change goes through a function below, which checks
-- the rules (and the PIN for staff actions).
-- Error messages are short codes (e.g. 'online_closed') that the app turns
-- into friendly text.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

-- ─────────────────────────── Tables ───────────────────────────

create table public.settings (
  id          int primary key default 1 check (id = 1),
  salon_name  text not null default 'Roselle',
  open_time   time not null default '10:00',
  close_time  time not null default '21:00',
  online_open boolean not null default true,
  updated_at  timestamptz not null default now()
);

create table public.barbers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  color      text not null,
  shape      text not null check (shape in ('star', 'clover', 'circle', 'pill')),
  on_duty    boolean not null default true,
  on_break   boolean not null default false,
  sort       int not null default 0,
  created_at timestamptz not null default now()
);

create table public.services (
  id      uuid primary key default gen_random_uuid(),
  name    text not null,
  minutes int not null check (minutes between 5 and 240),
  price   int not null check (price >= 0),
  active  boolean not null default true,
  sort    int not null default 0
);

-- One row per spot in the queue. Public screens may read it, so it holds
-- the first name only; full name and phone live in private.contacts.
create table public.queue_entries (
  id              uuid primary key default gen_random_uuid(),
  day             date not null default ((now() at time zone 'Asia/Kolkata')::date),
  token           int not null,
  first_name      text not null,
  barber_pref     uuid references public.barbers (id),   -- null = "Any barber"
  assigned_barber uuid references public.barbers (id),   -- set by Call next
  services        jsonb not null,                        -- [{id, name, minutes, price}] copied at join time
  total_minutes   int not null,
  total_price     int not null,
  status          text not null default 'waiting'
                  check (status in ('waiting', 'called', 'in_chair', 'done', 'cancelled', 'no_show')),
  source          text not null check (source in ('online', 'walk_in')),
  joined_at       timestamptz not null default now(),
  called_at       timestamptz,
  started_at      timestamptz,
  finished_at     timestamptz,
  cancelled_at    timestamptz,
  cancelled_by    text check (cancelled_by in ('customer', 'salon')),
  rating          int check (rating between 1 and 5),
  readded_from    uuid references public.queue_entries (id),
  unique (day, token)
);
create index queue_entries_day_status_idx on public.queue_entries (day, status, joined_at);

create table private.pins (
  role     text primary key check (role in ('staff', 'owner')),
  pin_hash text not null
);

create table private.contacts (
  entry_id  uuid primary key references public.queue_entries (id) on delete cascade,
  full_name text not null,
  phone     text not null
);
create index contacts_phone_idx on private.contacts (phone);

create table private.token_counters (
  day        date primary key,
  last_token int not null
);

-- ─────────────────────────── Security ───────────────────────────

alter table public.settings      enable row level security;
alter table public.barbers       enable row level security;
alter table public.services      enable row level security;
alter table public.queue_entries enable row level security;
alter table private.pins           enable row level security;
alter table private.contacts       enable row level security;
alter table private.token_counters enable row level security;

create policy "anyone can read settings" on public.settings      for select to anon, authenticated using (true);
create policy "anyone can read barbers"  on public.barbers       for select to anon, authenticated using (true);
create policy "anyone can read services" on public.services      for select to anon, authenticated using (true);
create policy "anyone can read queue"    on public.queue_entries for select to anon, authenticated using (true);

grant usage on schema public to anon, authenticated;
grant select on public.settings, public.barbers, public.services, public.queue_entries to anon, authenticated;
revoke insert, update, delete, truncate on public.settings, public.barbers, public.services, public.queue_entries from anon, authenticated;

revoke all on schema private from public, anon, authenticated;
revoke all on all tables in schema private from public, anon, authenticated;

-- ─────────────────────── Private helpers ───────────────────────

create function private.today() returns date
language sql stable set search_path = '' as $$
  select (now() at time zone 'Asia/Kolkata')::date
$$;

create function private.now_local() returns time
language sql stable set search_path = '' as $$
  select (now() at time zone 'Asia/Kolkata')::time
$$;

create function private.fail(p_code text, p_detail text default null) returns void
language plpgsql set search_path = '' as $$
begin
  raise exception using errcode = 'P0001', message = p_code, detail = coalesce(p_detail, '');
end $$;

-- Returns 'staff' or 'owner'. p_need = 'owner' accepts only the owner PIN.
create function private.check_pin(p_pin text, p_need text) returns text
language plpgsql set search_path = '' as $$
declare v_role text;
begin
  select p.role into v_role
    from private.pins p
   where p.pin_hash = extensions.crypt(coalesce(p_pin, ''), p.pin_hash)
   order by case p.role when 'owner' then 0 else 1 end
   limit 1;
  if v_role is null or (p_need = 'owner' and v_role <> 'owner') then
    perform private.fail('invalid_pin');
  end if;
  return v_role;
end $$;

-- 10-digit Indian mobile, starting 6–9. Accepts "+91 98765 43210" etc.
create function private.clean_phone(p_phone text) returns text
language plpgsql set search_path = '' as $$
declare d text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  if length(d) = 12 and left(d, 2) = '91' then d := right(d, 10); end if;
  if d !~ '^[6-9][0-9]{9}$' then perform private.fail('invalid_phone'); end if;
  return d;
end $$;

create function private.clean_name(p_name text) returns text
language plpgsql set search_path = '' as $$
declare n text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
begin
  if char_length(n) < 2 or char_length(n) > 30 then perform private.fail('invalid_name'); end if;
  return n;
end $$;

-- Today's Waiting / Called / In-chair spot for this phone, if any.
create function private.active_spot(p_phone text) returns public.queue_entries
language sql stable set search_path = '' as $$
  select e.*
    from public.queue_entries e
    join private.contacts c on c.entry_id = e.id
   where c.phone = p_phone
     and e.day = private.today()
     and e.status in ('waiting', 'called', 'in_chair')
   order by e.joined_at desc
   limit 1
$$;

-- 1–3 distinct, active services → snapshot [{id, name, minutes, price}].
create function private.pick_services(p_ids uuid[]) returns jsonb
language plpgsql set search_path = '' as $$
declare n int := coalesce(array_length(p_ids, 1), 0); v jsonb;
begin
  if n < 1 or n > 3 then perform private.fail('services_1_to_3'); end if;
  if (select count(distinct x) from unnest(p_ids) x) <> n then perform private.fail('duplicate_service'); end if;
  select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'minutes', s.minutes, 'price', s.price) order by s.sort)
    into v
    from public.services s
   where s.id = any (p_ids) and s.active;
  if coalesce(jsonb_array_length(v), 0) <> n then perform private.fail('service_unavailable'); end if;
  return v;
end $$;

-- S-1, S-2 … restarting every day.
create function private.next_token() returns int
language sql set search_path = '' as $$
  insert into private.token_counters as t (day, last_token)
  values (private.today(), 1)
  on conflict (day) do update set last_token = t.last_token + 1
  returning last_token
$$;

-- Why online joining is closed right now, or null if it is open.
create function private.online_block_reason() returns text
language plpgsql stable set search_path = '' as $$
declare s public.settings; t time := private.now_local();
begin
  select * into s from public.settings where id = 1;
  if not s.online_open then return 'online_closed'; end if;
  if t < s.open_time then return 'not_open_yet'; end if;
  if t >= s.close_time - interval '30 minutes' then return 'online_closed'; end if;
  if not exists (select 1 from public.barbers b where b.on_duty) then return 'no_barbers'; end if;
  return null;
end $$;

-- Creates a spot at the END of the queue (first come, first served).
create function private.create_entry(
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
    split_part(p_name, ' ', 1),
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

-- ─────────────────── Customer functions (no PIN) ───────────────────

-- Join from a phone. Returns {id, token, existing}. If this phone already
-- has an active spot today, returns that spot with existing = true.
create function public.join_queue(p_name text, p_phone text, p_service_ids uuid[], p_barber_id uuid default null)
returns json
language plpgsql security definer set search_path = '' as $$
declare v_phone text := private.clean_phone(p_phone);
        v_name  text := private.clean_name(p_name);
        v_old   public.queue_entries;
        v_why   text;
begin
  perform pg_advisory_xact_lock(hashtext('phone:' || v_phone));
  v_old := private.active_spot(v_phone);
  if v_old.id is not null then
    return json_build_object('id', v_old.id, 'token', v_old.token, 'existing', true);
  end if;
  v_why := private.online_block_reason();
  if v_why is not null then perform private.fail(v_why); end if;
  return private.create_entry(v_name, v_phone, p_service_ids, p_barber_id, 'online');
end $$;

-- "Find my spot": returns {id, token} or null.
create function public.find_my_spot(p_phone text) returns json
language plpgsql security definer set search_path = '' as $$
declare v public.queue_entries;
begin
  v := private.active_spot(private.clean_phone(p_phone));
  if v.id is null then return null; end if;
  return json_build_object('id', v.id, 'token', v.token);
end $$;

-- A customer can cancel only while Waiting.
create function public.cancel_my_spot(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.queue_entries
     set status = 'cancelled', cancelled_at = now(), cancelled_by = 'customer'
   where id = p_id and status = 'waiting';
  if not found then perform private.fail('cannot_cancel'); end if;
end $$;

-- One rating per visit, only after Done, never changed.
create function public.rate_visit(p_id uuid, p_stars int) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_stars is null or p_stars < 1 or p_stars > 5 then perform private.fail('invalid_rating'); end if;
  update public.queue_entries set rating = p_stars
   where id = p_id and status = 'done' and rating is null;
  if not found then perform private.fail('cannot_rate'); end if;
end $$;

-- ───────────────────── Staff functions (PIN) ─────────────────────

-- PIN gate: returns 'staff' or 'owner', or fails with invalid_pin.
create function public.staff_login(p_pin text) returns text
language plpgsql security definer set search_path = '' as $$
begin
  return private.check_pin(p_pin, 'staff');
end $$;

-- Today's queue with full names and phones (reception only).
create function public.staff_queue(p_pin text) returns json
language plpgsql security definer set search_path = '' as $$
declare v json;
begin
  perform private.check_pin(p_pin, 'staff');
  select coalesce(json_agg(row_to_json(t) order by t.joined_at), '[]'::json) into v
    from (select e.*, c.full_name, c.phone
            from public.queue_entries e
            left join private.contacts c on c.entry_id = e.id
           where e.day = private.today()) t;
  return v;
end $$;

-- Walk-ins join the same line at the end; allowed until closing time,
-- even when online joining is closed.
create function public.add_walk_in(p_pin text, p_name text, p_phone text, p_service_ids uuid[], p_barber_id uuid default null)
returns json
language plpgsql security definer set search_path = '' as $$
declare v_phone text; v_name text; v_old public.queue_entries;
begin
  perform private.check_pin(p_pin, 'staff');
  v_phone := private.clean_phone(p_phone);
  v_name  := private.clean_name(p_name);
  perform pg_advisory_xact_lock(hashtext('phone:' || v_phone));
  v_old := private.active_spot(v_phone);
  if v_old.id is not null then
    return json_build_object('id', v_old.id, 'token', v_old.token, 'existing', true);
  end if;
  if private.now_local() >= (select s.close_time from public.settings s where s.id = 1) then
    perform private.fail('salon_closed');
  end if;
  return private.create_entry(v_name, v_phone, p_service_ids, p_barber_id, 'walk_in');
end $$;

-- Call next for barber X: the earliest Waiting customer who chose X or Any.
-- A customer who chose Ravi is never given to another barber.
-- Returns {id, token, first_name}, or null when nobody is eligible.
create function public.call_next(p_pin text, p_barber_id uuid) returns json
language plpgsql security definer set search_path = '' as $$
declare b public.barbers; v public.queue_entries;
begin
  perform private.check_pin(p_pin, 'staff');
  select * into b from public.barbers where id = p_barber_id for update;
  if b.id is null then perform private.fail('barber_not_found'); end if;
  if not b.on_duty then perform private.fail('barber_off_duty'); end if;
  if b.on_break then perform private.fail('barber_on_break'); end if;
  if exists (select 1 from public.queue_entries e
              where e.assigned_barber = b.id and e.day = private.today()
                and e.status in ('called', 'in_chair')) then
    perform private.fail('barber_busy');
  end if;
  select * into v
    from public.queue_entries e
   where e.day = private.today() and e.status = 'waiting'
     and (e.barber_pref = b.id or e.barber_pref is null)
   order by e.joined_at, e.token
   limit 1
   for update skip locked;
  if v.id is null then return null; end if;
  update public.queue_entries
     set status = 'called', assigned_barber = b.id, called_at = now()
   where id = v.id;
  return json_build_object('id', v.id, 'token', v.token, 'first_name', v.first_name);
end $$;

create function public.start_service(p_pin text, p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.check_pin(p_pin, 'staff');
  update public.queue_entries set status = 'in_chair', started_at = now()
   where id = p_id and status = 'called';
  if not found then perform private.fail('bad_transition'); end if;
end $$;

create function public.finish_service(p_pin text, p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.check_pin(p_pin, 'staff');
  update public.queue_entries set status = 'done', finished_at = now()
   where id = p_id and status = 'in_chair';
  if not found then perform private.fail('bad_transition'); end if;
end $$;

-- No-show only 10 minutes or more after Called.
create function public.mark_no_show(p_pin text, p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v public.queue_entries;
begin
  perform private.check_pin(p_pin, 'staff');
  select * into v from public.queue_entries where id = p_id for update;
  if v.id is null or v.status <> 'called' then perform private.fail('bad_transition'); end if;
  if v.called_at > now() - interval '10 minutes' then
    perform private.fail('no_show_too_early', ceil(extract(epoch from v.called_at + interval '10 minutes' - now()))::text);
  end if;
  update public.queue_entries set status = 'no_show' where id = p_id;
end $$;

-- A no-show who turns up later gets a NEW token at the END of the queue,
-- with the same services and barber choice.
create function public.readd(p_pin text, p_id uuid) returns json
language plpgsql security definer set search_path = '' as $$
declare v public.queue_entries; c private.contacts; v_old public.queue_entries; v_pref uuid;
begin
  perform private.check_pin(p_pin, 'staff');
  select * into v from public.queue_entries where id = p_id and status = 'no_show' and day = private.today();
  if v.id is null then perform private.fail('cannot_readd'); end if;
  select * into c from private.contacts where entry_id = v.id;
  perform pg_advisory_xact_lock(hashtext('phone:' || c.phone));
  v_old := private.active_spot(c.phone);
  if v_old.id is not null then
    return json_build_object('id', v_old.id, 'token', v_old.token, 'existing', true);
  end if;
  if private.now_local() >= (select s.close_time from public.settings s where s.id = 1) then
    perform private.fail('salon_closed');
  end if;
  select b.id into v_pref from public.barbers b where b.id = v.barber_pref and b.on_duty;
  return private.create_entry(c.full_name, c.phone, null, v_pref, v.source, v.id, v.services);
end $$;

-- Reception can cancel a Waiting spot.
create function public.cancel_entry(p_pin text, p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.check_pin(p_pin, 'staff');
  update public.queue_entries
     set status = 'cancelled', cancelled_at = now(), cancelled_by = 'salon'
   where id = p_id and status = 'waiting';
  if not found then perform private.fail('cannot_cancel'); end if;
end $$;

-- On break only when nobody is Called or In chair for that barber.
create function public.set_break(p_pin text, p_barber_id uuid, p_on_break boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.check_pin(p_pin, 'staff');
  if p_on_break and exists (select 1 from public.queue_entries e
                             where e.assigned_barber = p_barber_id and e.day = private.today()
                               and e.status in ('called', 'in_chair')) then
    perform private.fail('finish_current_first');
  end if;
  update public.barbers set on_break = p_on_break where id = p_barber_id;
  if not found then perform private.fail('barber_not_found'); end if;
end $$;

-- ───────────────────── Owner functions (owner PIN) ─────────────────────

create function public.owner_update_settings(p_pin text, p_salon_name text, p_open time, p_close time) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.check_pin(p_pin, 'owner');
  if char_length(btrim(coalesce(p_salon_name, ''))) not between 2 and 40 or p_open is null or p_close is null or p_open >= p_close then
    perform private.fail('invalid_settings');
  end if;
  update public.settings
     set salon_name = btrim(p_salon_name), open_time = p_open, close_time = p_close, updated_at = now()
   where id = 1;
end $$;

-- The big Open / Closed switch for online joining.
create function public.owner_set_online(p_pin text, p_open boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.check_pin(p_pin, 'owner');
  update public.settings set online_open = p_open, updated_at = now() where id = 1;
end $$;

-- Add (p_id null) or edit a service. Turning it off hides it from Join.
create function public.owner_save_service(p_pin text, p_id uuid, p_name text, p_minutes int, p_price int, p_active boolean, p_sort int)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform private.check_pin(p_pin, 'owner');
  if char_length(btrim(coalesce(p_name, ''))) not between 2 and 40
     or p_minutes is null or p_minutes not between 5 and 240
     or p_price is null or p_price < 0 then
    perform private.fail('invalid_service');
  end if;
  if p_id is null then
    insert into public.services (name, minutes, price, active, sort)
    values (btrim(p_name), p_minutes, p_price, coalesce(p_active, true), coalesce(p_sort, 0))
    returning id into v_id;
  else
    update public.services
       set name = btrim(p_name), minutes = p_minutes, price = p_price,
           active = coalesce(p_active, active), sort = coalesce(p_sort, sort)
     where id = p_id
    returning id into v_id;
    if v_id is null then perform private.fail('service_not_found'); end if;
  end if;
  return v_id;
end $$;

-- Add (p_id null) or edit a barber's name, colour, shape and order.
create function public.owner_save_barber(p_pin text, p_id uuid, p_name text, p_color text, p_shape text, p_sort int)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_slug text;
begin
  perform private.check_pin(p_pin, 'owner');
  if char_length(btrim(coalesce(p_name, ''))) not between 2 and 30
     or coalesce(p_color, '') !~ '^#[0-9A-Fa-f]{6}$'
     or coalesce(p_shape, '') not in ('star', 'clover', 'circle', 'pill') then
    perform private.fail('invalid_barber');
  end if;
  v_slug := trim(both '-' from regexp_replace(lower(btrim(p_name)), '[^a-z0-9]+', '-', 'g'));
  begin
    if p_id is null then
      insert into public.barbers (name, slug, color, shape, sort)
      values (btrim(p_name), v_slug, p_color, p_shape, coalesce(p_sort, 0))
      returning id into v_id;
    else
      update public.barbers
         set name = btrim(p_name), slug = v_slug, color = p_color, shape = p_shape, sort = coalesce(p_sort, sort)
       where id = p_id
      returning id into v_id;
      if v_id is null then perform private.fail('barber_not_found'); end if;
    end if;
  exception when unique_violation then
    perform private.fail('barber_name_taken');
  end;
  return v_id;
end $$;

-- Barbers on duty today. Taking a barber off duty while customers are
-- waiting specifically for them fails with barber_has_customers (detail =
-- how many) unless p_move_to_any = true, which moves them to "Any barber"
-- and keeps their places.
create function public.owner_set_duty(p_pin text, p_barber_id uuid, p_on_duty boolean, p_move_to_any boolean default false)
returns void
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  perform private.check_pin(p_pin, 'owner');
  if not exists (select 1 from public.barbers where id = p_barber_id) then perform private.fail('barber_not_found'); end if;
  if p_on_duty then
    update public.barbers set on_duty = true where id = p_barber_id;
    return;
  end if;
  if exists (select 1 from public.queue_entries e
              where e.assigned_barber = p_barber_id and e.day = private.today()
                and e.status in ('called', 'in_chair')) then
    perform private.fail('finish_current_first');
  end if;
  select count(*) into n from public.queue_entries e
   where e.barber_pref = p_barber_id and e.day = private.today() and e.status = 'waiting';
  if n > 0 and not coalesce(p_move_to_any, false) then
    perform private.fail('barber_has_customers', n::text);
  end if;
  update public.queue_entries set barber_pref = null
   where barber_pref = p_barber_id and day = private.today() and status = 'waiting';
  update public.barbers set on_duty = false, on_break = false where id = p_barber_id;
end $$;

-- Change the Staff or Owner PIN (4 digits).
create function public.owner_change_pin(p_pin text, p_role text, p_new_pin text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.check_pin(p_pin, 'owner');
  if coalesce(p_role, '') not in ('staff', 'owner') or coalesce(p_new_pin, '') !~ '^[0-9]{4}$' then
    perform private.fail('invalid_new_pin');
  end if;
  update private.pins set pin_hash = extensions.crypt(p_new_pin, extensions.gen_salt('bf')) where role = p_role;
end $$;

-- Today's stats for the owner (India time).
create function public.owner_stats(p_pin text) returns json
language plpgsql security definer set search_path = '' as $$
declare v json;
begin
  perform private.check_pin(p_pin, 'owner');
  with t as (select * from public.queue_entries where day = private.today())
  select json_build_object(
    'served',       (select count(*) from t where status = 'done'),
    'avg_wait_min', (select round(avg(extract(epoch from called_at - joined_at) / 60)::numeric, 1) from t where called_at is not null),
    'no_shows',     (select count(*) from t where status = 'no_show'),
    'cancelled',    (select count(*) from t where status = 'cancelled'),
    'takings',      (select coalesce(sum(total_price), 0) from t where status = 'done'),
    'avg_rating',   (select round(avg(rating)::numeric, 1) from t where rating is not null),
    'per_barber',   (select coalesce(json_agg(json_build_object(
                        'barber_id',  b.id,
                        'name',       b.name,
                        'served',     (select count(*) from t where t.assigned_barber = b.id and t.status = 'done'),
                        'avg_rating', (select round(avg(t.rating)::numeric, 1) from t where t.assigned_barber = b.id and t.rating is not null)
                      ) order by b.sort), '[]'::json)
                     from public.barbers b),
    'joins_by_hour', (select coalesce(json_agg(json_build_object('hour', h, 'count', c) order by h), '[]'::json)
                        from (select extract(hour from joined_at at time zone 'Asia/Kolkata')::int h, count(*) c
                                from t group by 1) x),
    'wait_by_hour',  (select coalesce(json_agg(json_build_object('hour', h, 'avg_wait_min', w) order by h), '[]'::json)
                        from (select extract(hour from joined_at at time zone 'Asia/Kolkata')::int h,
                                     round(avg(extract(epoch from called_at - joined_at) / 60)::numeric, 1) w
                                from t where called_at is not null group by 1) y)
  ) into v;
  return v;
end $$;

-- ─────────────── Demo helpers (owner PIN) for testing and the demo ───────────────

-- Fills an empty queue with 6 sample customers who joined over the last
-- ~70 minutes, so "waiting over 60 min" and barber preferences show up.
create function public.owner_demo_fill(p_pin text) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_names text[] := array['Priya Patel', 'Meera Joshi', 'Ananya Rao', 'Zoya Khan', 'Kavya Iyer', 'Riya Shah'];
  v_mins  int[]  := array[70, 52, 38, 25, 12, 4];
  v_svc   text[][] := array[['Haircut & blow-dry', 'Eyebrow threading'], ['Hair spa', ''], ['Blow-dry & styling', ''], ['Facial', 'Eyebrow threading'], ['Manicure', 'Pedicure'], ['Waxing (full arms)', '']];
  v_pref  text[] := array['', 'neha', '', 'ayesha', 'neha', ''];
  i int; v_ids uuid[]; v_barber uuid; r json;
begin
  perform private.check_pin(p_pin, 'owner');
  if exists (select 1 from public.queue_entries e where e.day = private.today() and e.status in ('waiting', 'called', 'in_chair')) then
    perform private.fail('queue_not_empty');
  end if;
  for i in 1 .. array_length(v_names, 1) loop
    select array_agg(s.id) into v_ids from public.services s
     where s.active and s.name in (v_svc[i][1], v_svc[i][2]);
    if v_ids is null then   -- that sample service was switched off: use the first active one
      select array[s.id] into v_ids from public.services s where s.active order by s.sort limit 1;
    end if;
    select b.id into v_barber from public.barbers b where b.slug = nullif(v_pref[i], '') and b.on_duty;
    r := private.create_entry(v_names[i], '90000000' || lpad(i::text, 2, '0'), v_ids, v_barber, case when i % 2 = 0 then 'walk_in' else 'online' end);
    update public.queue_entries set joined_at = now() - make_interval(mins => v_mins[i]) where id = (r ->> 'id')::uuid;
  end loop;
  return array_length(v_names, 1);
end $$;

-- Clears today's queue and restarts tokens at S-1 (demo reset).
create function public.owner_reset_today(p_pin text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.check_pin(p_pin, 'owner');
  update public.queue_entries set readded_from = null where day = private.today();
  delete from public.queue_entries where day = private.today();
  delete from private.token_counters where day = private.today();
end $$;

-- Only the public.* functions above may be called from the app.
revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;

-- ─────────────────────────── Live updates ───────────────────────────

do $$
declare t text;
begin
  foreach t in array array['settings', 'barbers', 'services', 'queue_entries'] loop
    if not exists (select 1 from pg_publication_tables
                    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ─────────────────────────── Demo data ───────────────────────────
-- Hours are 12:00 AM – 11:59 PM so the hosted demo can be tested at any time.
-- Switch to 10:00 AM – 9:00 PM in Owner settings to show the closing rules.

insert into public.settings (id, salon_name, open_time, close_time, online_open)
values (1, 'Roselle', '00:00', '23:59', true);

insert into private.pins (role, pin_hash) values
  ('staff', extensions.crypt('1234', extensions.gen_salt('bf'))),
  ('owner', extensions.crypt('9999', extensions.gen_salt('bf')));

insert into public.barbers (name, slug, color, shape, sort) values
  ('Neha',   'neha',   '#A64DB5', 'star',   1),
  ('Ayesha', 'ayesha', '#2F8A6B', 'clover', 2),
  ('Simran', 'simran', '#4A72BC', 'circle', 3);

insert into public.services (name, minutes, price, sort) values
  ('Haircut & blow-dry',  45,  600,  1),
  ('Blow-dry & styling',  30,  400,  2),
  ('Hair spa',            45,  900,  3),
  ('Global hair colour',  90, 2500,  4),
  ('Highlights',         120, 3500,  5),
  ('Facial',              60, 1200,  6),
  ('Eyebrow threading',   10,   60,  7),
  ('Waxing (full arms)',  20,  400,  8),
  ('Manicure',            30,  500,  9),
  ('Pedicure',            40,  700, 10);
