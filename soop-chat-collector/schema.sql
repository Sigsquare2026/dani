-- Apply to the actual DaniLand/Readdy Supabase database, not another project.
create table if not exists public.soop_chat_broadcasts (
  broadcast_no text primary key,
  broadcast_date date not null,
  created_at timestamptz not null default now(),
  last_chat_at timestamptz
);

create table if not exists public.soop_chat_counts (
  broadcast_no text not null references public.soop_chat_broadcasts(broadcast_no),
  soop_user_id text not null,
  nickname text not null,
  chat_count bigint not null default 0 check (chat_count >= 0),
  first_chat_at timestamptz not null default now(),
  last_chat_at timestamptz not null default now(),
  primary key (broadcast_no, soop_user_id)
);

create index if not exists soop_chat_counts_rank_idx
  on public.soop_chat_counts (broadcast_no, chat_count desc, first_chat_at asc, soop_user_id asc);

create table if not exists public.soop_chat_batches (
  batch_id uuid primary key,
  broadcast_no text not null,
  created_at timestamptz not null default now()
);

alter table public.soop_chat_broadcasts enable row level security;
alter table public.soop_chat_counts enable row level security;
alter table public.soop_chat_batches enable row level security;

revoke all on public.soop_chat_broadcasts, public.soop_chat_counts, public.soop_chat_batches from anon, authenticated;
grant select, insert, update on public.soop_chat_broadcasts, public.soop_chat_counts to service_role;
grant select, insert on public.soop_chat_batches to service_role;

create or replace function public.soop_chat_add_batch(
  p_batch_id uuid, p_broadcast_no text, p_broadcast_date date, p_rows jsonb
) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare item jsonb;
declare affected integer;
declare uid text;
declare label text;
declare quantity integer;
begin
  if p_broadcast_no !~ '^[0-9]+$' or p_broadcast_date is null
     or jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows) > 1000 then
    raise exception 'invalid batch';
  end if;
  insert into public.soop_chat_batches(batch_id, broadcast_no)
    values (p_batch_id, p_broadcast_no) on conflict do nothing;
  get diagnostics affected = row_count;
  if affected = 0 then return false; end if;
  insert into public.soop_chat_broadcasts(broadcast_no, broadcast_date, last_chat_at)
    values (p_broadcast_no, p_broadcast_date, now()) on conflict (broadcast_no)
    do update set last_chat_at = excluded.last_chat_at;
  for item in select value from jsonb_array_elements(p_rows) loop
    uid := left(trim(item->>'user_id'), 100);
    label := left(coalesce(nullif(trim(item->>'nickname'), ''), uid), 100);
    quantity := (item->>'count')::integer;
    if uid is null or uid = '' or quantity is null or quantity < 1 or quantity > 100000 then
      raise exception 'invalid chat row';
    end if;
    insert into public.soop_chat_counts(broadcast_no, soop_user_id, nickname, chat_count)
      values (p_broadcast_no, uid, label, quantity)
      on conflict (broadcast_no, soop_user_id) do update
      set chat_count = public.soop_chat_counts.chat_count + excluded.chat_count,
          nickname = excluded.nickname,
          last_chat_at = now();
  end loop;
  return true;
end;
$$;

revoke all on function public.soop_chat_add_batch(uuid, text, date, jsonb) from public, anon, authenticated;
grant execute on function public.soop_chat_add_batch(uuid, text, date, jsonb) to service_role;

-- Public leaderboard reading and point settlement are separate later steps.
