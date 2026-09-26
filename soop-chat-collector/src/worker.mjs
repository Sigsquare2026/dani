import { randomUUID } from 'node:crypto';
import { Agent } from 'node:https';
import { Counter, broadcastDate, getBroadcast } from './collector.mjs';

const streamerId = process.env.SOOP_STREAMER_ID?.trim();
const apiUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
const apiKey = process.env.SUPABASE_ANON_KEY;
const bridgeToken = process.env.SOOP_BRIDGE_TOKEN;
if (!streamerId || !apiUrl || !apiKey || !bridgeToken) {
  console.error('Required: SOOP_STREAMER_ID, SUPABASE_URL, SUPABASE_ANON_KEY, SOOP_BRIDGE_TOKEN');
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
let currentConnection = null;
let connectionStartedAt = 0;
let reconnectTimer = null;
const recordBroadcastTimes = process.env.SOOP_RECORD_BROADCAST_TIMES === 'true';
const pendingDetections = new Map();
let savingDetections = false;

function kstTime(when) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).format(when);
}

async function saveDetections() {
  if (!recordBroadcastTimes || savingDetections) return;
  savingDetections = true;
  try {
    for (const [bno, detectedAt] of pendingDetections) {
      try {
        const saved = await rpc('soop_chat_record_detection', {
          p_token: bridgeToken, p_broadcast_no: bno, p_detected_at: detectedAt,
        });
        if (saved !== true) throw new Error('soop_chat_record_detection returned an unexpected result');
        pendingDetections.delete(bno);
        console.log(`broadcast detection saved: ${bno}, ${kstTime(new Date(detectedAt))} KST`);
      } catch (error) {
        console.error(`broadcast detection save failed: ${bno}, ${error.message}`);
        break;
      }
    }
  } finally { savingDetections = false; }
}

function reconnectSoon(connection) {
  if (stopping || currentConnection !== connection || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void poll();
  }, 1000);
}

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
      const saved = await rpc('soop_chat_add_batch', { p_token: bridgeToken, p_batch_id: batch.batch_id, p_broadcast_no: batch.broadcast_no, p_broadcast_date: batch.broadcast_date, p_rows: batch.rows });
      if (saved !== true && saved !== false) throw new Error('soop_chat_add_batch returned an unexpected result');
      console.log(`chat batch ${saved ? 'saved' : 'already saved'}: ${batch.broadcast_no}, ${batch.rows.length} users, ${batch.rows.reduce((sum, row) => sum + row.count, 0)} messages`);
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
    const observedAt = new Date();
    if (!bno) {
      if (active) {
        await flush();
        console.log(`broadcast ended: ${active.bno}`);
        active = null;
        await currentConnection?.disconnect().catch(() => {});
        currentConnection = null;
      }
      return;
    }
    if (!active || active.bno !== bno) {
      if (active) await flush();
      const detectedAt = observedAt;
      active = { bno, date: broadcastDate(detectedAt) };
      if (recordBroadcastTimes) pendingDetections.set(bno, detectedAt.toISOString());
      await currentConnection?.disconnect().catch(() => {});
      currentConnection = null;
      console.log(`broadcast detected: ${bno}, ${kstTime(detectedAt)} KST (collector detection time)`);
      void saveDetections();
    }
    const wsState = currentConnection?.ws?.readyState;
    if (wsState === 1 || (wsState === 0 && Date.now() - connectionStartedAt < 30000)) return;
    await currentConnection?.disconnect().catch(() => {});
    const connection = client.chat({ streamerId });
    currentConnection = connection;
    connectionStartedAt = Date.now();
    connection.createAgent = () => new Agent({ rejectUnauthorized: true });
    const thisBno = bno;
    const receive = event => {
      if (active?.bno !== thisBno) return;
      counter.add(event, thisBno); // identical and consecutive messages are counted
    };
    connection.on(SoopChatEvent.CHAT, receive);
    connection.on(SoopChatEvent.EMOTICON, receive);
    connection.on(SoopChatEvent.CONNECT, () => console.log(`chat connected: ${thisBno}`));
    connection.on(SoopChatEvent.DISCONNECT, () => {
      console.log(`chat disconnected: ${thisBno}`);
      reconnectSoon(connection);
    });
    await connection.connect();
    connection.ws?.on('close', (code, reason) => {
      console.log(`socket closed: ${thisBno}, code ${code}${reason?.length ? `, reason ${reason.toString().slice(0, 100)}` : ''}`);
      reconnectSoon(connection);
    });
    connection.ws?.on('error', error => console.error('socket:', error.message));
  } catch (error) { console.error('SOOP poll/connect:', error.message); }
  finally { polling = false; }
}

setInterval(() => { void poll(); }, 15000);
setInterval(() => { void flush(); }, 5000);
setInterval(() => { void saveDetections(); }, 15000);
const tokenValid = await rpc('songpyeon_bridge_token_ok', { p_token: bridgeToken });
if (tokenValid !== true) throw new Error('SOOP bridge token verification failed');
console.log('Readdy RPC and bridge token verified');
await poll();
console.log('collector ready');
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
  stopping = true;
  await flush();
  process.exit(outbox.length ? 1 : 0);
});
