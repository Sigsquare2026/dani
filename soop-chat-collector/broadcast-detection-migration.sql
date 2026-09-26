-- Apply to DaniLand Readdy Backend k2tbnmtgvh34rdbxdjk2 only.
-- Run before setting SOOP_RECORD_BROADCAST_TIMES=true on Railway.
alter table public.soop_chat_broadcasts
  add column if not exists first_detected_at timestamptz;
alter table public.soop_chat_broadcasts
  add column if not exists soop_started_at timestamptz;

create or replace function public.soop_chat_record_start(
  p_token text, p_broadcast_no text, p_detected_at timestamptz, p_soop_started_at timestamptz
) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not coalesce(public.songpyeon_bridge_token_ok(p_token), false) then
    raise exception 'invalid bridge token';
  end if;
  if p_broadcast_no is null or p_broadcast_no !~ '^[0-9]+$'
     or p_detected_at is null or p_detected_at > now() + interval '1 minute'
     or p_detected_at < now() - interval '7 days'
     or (p_soop_started_at is not null and
         (p_soop_started_at > p_detected_at + interval '1 minute'
          or p_soop_started_at < p_detected_at - interval '366 days')) then
    raise exception 'invalid broadcast time';
  end if;

  insert into public.soop_chat_broadcasts
    (broadcast_no, broadcast_date, first_detected_at, soop_started_at)
  values
    (p_broadcast_no, (coalesce(p_soop_started_at, p_detected_at) at time zone 'Asia/Seoul')::date,
     p_detected_at, p_soop_started_at)
  on conflict (broadcast_no) do update
    set first_detected_at = least(
      coalesce(public.soop_chat_broadcasts.first_detected_at, excluded.first_detected_at),
      excluded.first_detected_at
    ),
    soop_started_at = coalesce(excluded.soop_started_at, public.soop_chat_broadcasts.soop_started_at),
    broadcast_date = (coalesce(excluded.soop_started_at, public.soop_chat_broadcasts.soop_started_at,
      public.soop_chat_broadcasts.first_detected_at, excluded.first_detected_at)
      at time zone 'Asia/Seoul')::date;
  return true;
end;
$$;

-- On hosts that allow function grants, limit RPC execution to anon.
-- The bridge token is always checked inside the function.
-- revoke all on function public.soop_chat_record_start(text, text, timestamptz, timestamptz) from public, anon, authenticated;
-- grant execute on function public.soop_chat_record_start(text, text, timestamptz, timestamptz) to anon;

notify pgrst, 'reload schema';

-- Read only validation (KST):
-- select broadcast_no, soop_started_at at time zone 'Asia/Seoul' as soop_started_kst,
--        first_detected_at at time zone 'Asia/Seoul' as detected_kst
-- from public.soop_chat_broadcasts order by first_detected_at desc nulls last limit 10;
