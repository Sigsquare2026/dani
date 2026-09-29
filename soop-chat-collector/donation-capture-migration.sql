-- OBSOLETE: do not apply. Readdy deployed a different donation ledger and
-- soop_donation_record_batch RPC on 2026-09-29. Retained for historical context.
-- Apply ONLY to the operating DaniLand Readdy Backend k2tbnmtgvh34rdbxdjk2.
-- Apply before SOOP_DONATION_CAPTURE_ENABLED=true on Railway.
create table if not exists public.soop_donation_batches (
  batch_id uuid primary key,
  broadcast_no text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.soop_donation_events (
  event_id uuid primary key,
  broadcast_no text not null references public.soop_chat_broadcasts(broadcast_no),
  donation_type text not null check (donation_type in ('text', 'video', 'ad')),
  soop_user_id text not null,
  raw_soop_user_id text not null,
  nickname text not null,
  amount bigint not null check (amount > 0),
  received_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.soop_donation_counts (
  broadcast_no text not null references public.soop_chat_broadcasts(broadcast_no),
  donation_type text not null check (donation_type in ('text', 'video', 'ad')),
  soop_user_id text not null,
  nickname text not null,
  amount bigint not null default 0 check (amount >= 0),
  first_received_at timestamptz not null,
  last_received_at timestamptz not null,
  primary key (broadcast_no, donation_type, soop_user_id)
);

create index if not exists soop_donation_counts_broadcast_rank_idx
  on public.soop_donation_counts (broadcast_no, amount desc);

alter table public.soop_donation_batches enable row level security;
alter table public.soop_donation_events enable row level security;
alter table public.soop_donation_counts enable row level security;
revoke all on public.soop_donation_batches, public.soop_donation_events,
  public.soop_donation_counts from anon, authenticated;

create or replace function public.soop_donation_add_batch(
  p_token text, p_batch_id uuid, p_broadcast_no text, p_broadcast_date date, p_rows jsonb
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare item jsonb;
declare affected integer;
declare uid text;
declare raw_uid text;
declare label text;
declare kind text;
declare quantity bigint;
declare received timestamptz;
begin
  if not coalesce(public.songpyeon_bridge_token_ok(p_token), false) then
    raise exception 'invalid bridge token';
  end if;
  if p_batch_id is null or p_broadcast_no is null or p_broadcast_no !~ '^[0-9]+$'
     or p_broadcast_date is null or pg_catalog.jsonb_typeof(p_rows) is distinct from 'array'
     or pg_catalog.jsonb_array_length(p_rows) < 1 or pg_catalog.jsonb_array_length(p_rows) > 500 then
    raise exception 'invalid donation batch';
  end if;

  insert into public.soop_donation_batches(batch_id, broadcast_no)
    values (p_batch_id, p_broadcast_no) on conflict do nothing;
  get diagnostics affected = row_count;
  if affected = 0 then return false; end if;

  insert into public.soop_chat_broadcasts(broadcast_no, broadcast_date)
    values (p_broadcast_no, p_broadcast_date) on conflict (broadcast_no) do nothing;

  for item in select value from pg_catalog.jsonb_array_elements(p_rows) loop
    raw_uid := left(pg_catalog.btrim(item->>'raw_user_id'), 100);
    uid := left(pg_catalog.regexp_replace(raw_uid, '\([1-9][0-9]*\)$', ''), 100);
    label := left(coalesce(nullif(pg_catalog.btrim(item->>'nickname'), ''), uid), 100);
    kind := item->>'donation_type';
    quantity := (item->>'amount')::bigint;
    received := (item->>'received_at')::timestamptz;
    if raw_uid is null or raw_uid = '' or uid = '' or kind is null or kind not in ('text', 'video', 'ad')
       or quantity is null or quantity < 1 or quantity > 1000000000
       or received is null or received > now() + interval '1 minute'
       or received < now() - interval '7 days' then
      raise exception 'invalid donation event';
    end if;

    insert into public.soop_donation_events
      (event_id, broadcast_no, donation_type, soop_user_id, raw_soop_user_id,
       nickname, amount, received_at)
    values ((item->>'event_id')::uuid, p_broadcast_no, kind, uid, raw_uid,
            label, quantity, received)
    on conflict (event_id) do nothing;
    get diagnostics affected = row_count;
    if affected = 1 then
      insert into public.soop_donation_counts
        (broadcast_no, donation_type, soop_user_id, nickname, amount, first_received_at, last_received_at)
      values (p_broadcast_no, kind, uid, label, quantity, received, received)
      on conflict (broadcast_no, donation_type, soop_user_id) do update
        set amount = public.soop_donation_counts.amount + excluded.amount,
            nickname = excluded.nickname,
            first_received_at = least(public.soop_donation_counts.first_received_at, excluded.first_received_at),
            last_received_at = greatest(public.soop_donation_counts.last_received_at, excluded.last_received_at);
    end if;
  end loop;
  return true;
end;
$$;

notify pgrst, 'reload schema';

-- Admin-only read query after a broadcast (do not grant this to anon):
-- select b.broadcast_date, c.soop_user_id, max(c.nickname) as nickname,
--        sum(c.amount) filter (where c.donation_type in ('text', 'video')) as balloons,
--        sum(c.amount) filter (where c.donation_type = 'ad') as ad_balloons
-- from public.soop_donation_counts c join public.soop_chat_broadcasts b using (broadcast_no)
-- where b.broadcast_date = date '2026-09-29'
-- group by b.broadcast_date, c.soop_user_id order by balloons desc nulls last;
