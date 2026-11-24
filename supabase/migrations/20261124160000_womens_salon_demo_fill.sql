-- Women's salon: "Fill demo queue" books the new services with female sample names,
-- and its sample stylist choices use the stylists' new addresses (neha, ayesha).
-- Run once in Supabase → SQL Editor (the service menu itself was updated through the
-- owner functions; this only refreshes the demo helper).

create or replace function public.owner_demo_fill(p_pin text) returns int
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
