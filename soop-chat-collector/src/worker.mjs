import { randomUUID } from 'node:crypto';
import { Agent } from 'node:https';
import { Counter, broadcastDate, getBroadcast } from './collector.mjs';

const streamerId = process.env.SOOP_STREAMER_ID?.trim();
const apiUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!streamerId || !apiUrl || !apiKey) {
  console.error('Required: SOOP_STREAMER_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const { SoopClient, SoopChatEvent } = await import('soop-extension');
const client = new SoopClient();
const counter = new Counter();
let active = null;
let stopping = false;
let polling = false;
let flushing = false;
let outbox = [];
let connected = false;
let currentConnection = null;

async function rpc(name, data) {
  const response = await fetch(`${apiUrl}/rest/v1/rpc/${name}`, {
    method: 'POST', headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data), signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status} ${String(await response.text()).slice(0, 240)}`);
  return response.json();
}

async function flush() {
  if (flushing) return;
  flushing = true;
  try {
    const rows = counter.take();
    if (rows.length) {
      const groups = new Map();
      for (const row of rows) groups.set(row.bno, [...(groups.get(row.bno) ?? []), row]);
      for (const [bno, group] of groups) {
        outbox.push({ batch_id: randomUUID(), broadcast_no: bno, broadcast_date: active?.bno === bno ? active.date : broadcastDate(new Date()), rows: group.map(({ user_id, nickname, count }) => ({ user_id, nickname, count })) });
      }
    }
    while (outbox.length) {
      const batch = outbox[0];
      await rpc('soop_chat_add_batch', { p_batch_id: batch.batch_id, p_broadcast_no: batch.broadcast_no, p_broadcast_date: batch.broadcast_date, p_rows: batch.rows });
      outbox.shift();
    }
  } catch (error) {
    console.error('batch save failed, retrying same batch:', error.message);
  } finally { flushing = false; }
}

async function poll() {
  if (polling || stopping) return;
  polling = true;
  try {
    const info = await client.live.detail(streamerId);
    const bno = getBroadcast(info?.CHANNEL);
    if (!bno) {
      if (active) {
        await flush();
        console.log(`broadcast ended: ${active.bno}`);
        active = null;
        connected = false;
        await currentConnection?.disconnect().catch(() => {});
        currentConnection = null;
      }
      return;
    }
    if (!active || active.bno !== bno) {
      if (active) await flush();
      active = { bno, date: broadcastDate(new Date()) };
      connected = false;
      await currentConnection?.disconnect().catch(() => {});
      currentConnection = null;
      console.log(`broadcast detected: ${bno}, ${active.date} KST`);
    }
    if (connected && currentConnection?.ws?.readyState === 1) return;
    await currentConnection?.disconnect().catch(() => {});
    const connection = client.chat({ streamerId });
    currentConnection = connection;
    connection.createAgent = () => new Agent({ rejectUnauthorized: true });
    const thisBno = bno;
    const receive = event => {
      if (active?.bno !== thisBno) return;
      counter.add(event, thisBno); // identical and consecutive messages are counted
    };
    connection.on(SoopChatEvent.CHAT, receive);
    connection.on(SoopChatEvent.EMOTICON, receive);
    connection.on(SoopChatEvent.CONNECT, () => console.log(`chat connected: ${thisBno}`));
    connection.on(SoopChatEvent.DISCONNECT, () => { if (currentConnection === connection) connected = false; console.log(`chat disconnected: ${thisBno}`); });
    await connection.connect();
    connection.ws?.on('close', () => { if (currentConnection === connection) connected = false; });
    connection.ws?.on('error', error => { if (currentConnection === connection) connected = false; console.error('socket:', error.message); });
    connected = connection.ws?.readyState === 1;
  } catch (error) { connected = false; console.error('SOOP poll/connect:', error.message); }
  finally { polling = false; }
}

setInterval(() => { void poll(); }, 15000);
setInterval(() => { void flush(); }, 5000);
await poll();
console.log('collector ready');
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
  stopping = true;
  await flush();
  process.exit(outbox.length ? 1 : 0);
});
