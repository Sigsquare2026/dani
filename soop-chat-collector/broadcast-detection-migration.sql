-- Apply to DaniLand Readdy Backend k2tbnmtgvh34rdbxdjk2 only.
-- Run before setting SOOP_RECORD_BROADCAST_TIMES=true on Railway.
alter table public.soop_chat_broadcasts
  add column if not exists first_detected_at timestamptz;

create or replace function public.soop_chat_record_detection(
  p_token text, p_broadcast_no text, p_detected_at timestamptz
) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not coalesce(public.songpyeon_bridge_token_ok(p_token), false) then
    raise exception 'invalid bridge token';
  end if;
  if p_broadcast_no is null or p_broadcast_no !~ '^[0-9]+$'
     or p_detected_at is null or p_detected_at > now() + interval '1 minute'
     or p_detected_at < now() - interval '7 days' then
    raise exception 'invalid broadcast detection';
  end if;

  insert into public.soop_chat_broadcasts
    (broadcast_no, broadcast_date, first_detected_at)
  values
    (p_broadcast_no, (p_detected_at at time zone 'Asia/Seoul')::date, p_detected_at)
  on conflict (broadcast_no) do update
    set first_detected_at = least(
      coalesce(public.soop_chat_broadcasts.first_detected_at, excluded.first_detected_at),
      excluded.first_detected_at
    );
  return true;
end;
$$;

-- On hosts that allow function grants, limit RPC execution to anon.
-- The bridge token is always checked inside the function.
-- revoke all on function public.soop_chat_record_detection(text, text, timestamptz) from public, anon, authenticated;
-- grant execute on function public.soop_chat_record_detection(text, text, timestamptz) to anon;

notify pgrst, 'reload schema';

-- Read only validation (KST):
-- select broadcast_no, first_detected_at at time zone 'Asia/Seoul' as first_detected_kst
-- from public.soop_chat_broadcasts order by first_detected_at desc nulls last limit 10;
