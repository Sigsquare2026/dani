import { randomUUID } from 'node:crypto';
import { Agent } from 'node:https';
import { Counter, broadcastDate, donationRow, getBroadcast, soopStartForBroadcast } from './collector.mjs';

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
const captureDonations = process.env.SOOP_DONATION_CAPTURE_ENABLED === 'true';
const pendingDetections = new Map();
let savingDetections = false;
let resolvingStart = false;
let donationPending = [];
let donationOutbox = [];
let savingDonations = false;
const donationGaps = new Map();
const reportedDonationGaps = new Set();
let reportingDonationGaps = false;

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
    for (const [bno, entry] of pendingDetections) {
      try {
        const saved = await rpc('soop_chat_record_start', {
          p_token: bridgeToken, p_broadcast_no: bno,
          p_detected_at: entry.detectedAt, p_soop_started_at: entry.startedAt,
        });
        if (saved !== true) throw new Error('soop_chat_record_start returned an unexpected result');
        if (pendingDetections.get(bno) === entry) pendingDetections.delete(bno);
        console.log(`broadcast time saved: ${bno}, ${entry.startedAt ? `SOOP ${kstTime(new Date(entry.startedAt))}` : `detected ${kstTime(new Date(entry.detectedAt))}`} KST`);
      } catch (error) {
        console.error(`broadcast detection save failed: ${bno}, ${error.message}`);
        break;
      }
    }
  } finally { savingDetections = false; }
}

async function resolveSoopStart() {
  const target = active;
  if (!target || target.startedAt || resolvingStart || stopping) return;
  resolvingStart = true;
  try {
    const response = await fetch(`https://chapi.sooplive.co.kr/api/${encodeURIComponent(streamerId)}/station`, {
      headers: { 'User-Agent': client.options.userAgent },
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) throw new Error(`station HTTP ${response.status}`);
    const station = await response.json();
    const startedAt = soopStartForBroadcast(station, target.bno);
    if (!startedAt) {
      if (!target.startWarningLogged) {
        console.log(`SOOP start time unavailable for ${target.bno}; will retry while live`);
        target.startWarningLogged = true;
      }
      return;
    }
    target.startedAt = startedAt;
    target.date = broadcastDate(new Date(startedAt));
    for (const entry of [...donationPending, ...donationOutbox]) {
      if (entry.broadcast_no === target.bno) entry.broadcast_date = target.date;
    }
    console.log(`SOOP broadcast started: ${target.bno}, ${kstTime(new Date(startedAt))} KST`);
    if (recordBroadcastTimes) {
      pendingDetections.set(target.bno, { detectedAt: target.detectedAt, startedAt });
      void saveDetections();
    }
  } catch (error) {
    if (!target.startWarningLogged) {
      console.error(`SOOP start time lookup failed: ${target.bno}, ${error.message}`);
      target.startWarningLogged = true;
    }
  } finally { resolvingStart = false; }
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

function queueDonationGap(bno, reason) {
  if (!captureDonations || !bno || reportedDonationGaps.has(bno) || donationGaps.has(bno)) return;
  donationGaps.set(bno, reason);
  void reportDonationGaps();
}

async function reportDonationGaps() {
  if (reportingDonationGaps) return;
  reportingDonationGaps = true;
  try {
    for (const [bno, reason] of donationGaps) {
      try {
        const result = await rpc('soop_donation_report_gap', {
          p_token: bridgeToken, p_broadcast_no: bno, p_reason: reason,
        });
        if (result?.ok !== true) throw new Error('soop_donation_report_gap returned an unexpected result');
        reportedDonationGaps.add(bno);
        donationGaps.delete(bno);
        console.log(`donation review alert saved: ${bno}`);
      } catch (error) {
        console.error(`donation review alert failed: ${bno}, ${error.message}`);
        break;
      }
    }
  } finally { reportingDonationGaps = false; }
}

function receiveDonation(event, type, bno, replayRisk) {
  if (!captureDonations || active?.bno !== bno) return;
  const row = donationRow(event, type, bno);
  if (!row) {
    console.error(`invalid SOOP ${type} donation for ${bno}`);
    queueDonationGap(bno, '후원 이벤트의 아이디 또는 개수를 읽지 못했습니다.');
    return;
  }
  // One event per request. The UUID survives HTTP retries, while separate
  // consecutive donations always get separate request IDs.
  donationPending.push({
    request_id: randomUUID(), broadcast_no: bno,
    broadcast_date: active.date, event: row, replay_risk: replayRisk,
  });
  void flushDonations();
}

async function flushDonations() {
  if (!captureDonations || savingDonations) return;
  savingDonations = true;
  try {
    if (donationPending.length) {
      donationOutbox.push(...donationPending);
      donationPending = [];
    }
    while (donationOutbox.length) {
      const entry = donationOutbox[0];
      const result = await rpc('soop_donation_record_batch', {
        p_token: bridgeToken, p_request_id: entry.request_id,
        p_broadcast_no: entry.broadcast_no, p_broadcast_date: entry.broadcast_date,
        p_events: [entry.event], p_replay_risk: entry.replay_risk,
      });
      if (result?.ok !== true || typeof result.duplicate_request !== 'boolean') {
        throw new Error('soop_donation_record_batch returned an unexpected result');
      }
      if (!result.duplicate_request && result.accepted !== 1) {
        queueDonationGap(entry.broadcast_no, '후원 저장 RPC에서 해당 이벤트가 반영되지 않았습니다.');
      }
      console.log(`donation ${result.duplicate_request ? 'already saved' : 'saved'}: ${entry.broadcast_no}, ${entry.event.donation_type}, ${entry.event.amount} units, review ${result.needs_review ?? 0}`);
      donationOutbox.shift();
    }
  } catch (error) {
    console.error('donation save failed, retrying same request:', error.message);
    queueDonationGap(donationOutbox[0]?.broadcast_no, '후원 저장 요청이 실패했거나 응답을 확인하지 못했습니다.');
  } finally { savingDonations = false; }
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
        await flushDonations();
        console.log(`broadcast ended: ${active.bno}`);
        active = null;
        await currentConnection?.disconnect().catch(() => {});
        currentConnection = null;
      }
      return;
    }
    if (!active || active.bno !== bno) {
      if (active) {
        await flush();
        await flushDonations();
      }
      const detectedAt = observedAt;
      active = { bno, date: broadcastDate(detectedAt), detectedAt: detectedAt.toISOString(), startedAt: null };
      if (recordBroadcastTimes) pendingDetections.set(bno, { detectedAt: active.detectedAt, startedAt: null });
      await currentConnection?.disconnect().catch(() => {});
      currentConnection = null;
      console.log(`broadcast detected: ${bno}, ${kstTime(detectedAt)} KST (collector detection time)`);
      void saveDetections();
    }
    void resolveSoopStart();
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
    // SOOP has no stable donation ID in these packets. Flag events received
    // just after a new connection for review rather than guessing duplicates.
    let replayRiskUntil = Number.POSITIVE_INFINITY;
    connection.on(SoopChatEvent.TEXT_DONATION, event => receiveDonation(event, 'balloon', thisBno, Date.now() < replayRiskUntil));
    connection.on(SoopChatEvent.VIDEO_DONATION, event => receiveDonation(event, 'video', thisBno, Date.now() < replayRiskUntil));
    connection.on(SoopChatEvent.AD_BALLOON_DONATION, event => receiveDonation(event, 'adballoon', thisBno, Date.now() < replayRiskUntil));
    connection.on(SoopChatEvent.CONNECT, () => {
      replayRiskUntil = Date.now() + 30_000;
      console.log(`chat connected: ${thisBno}`);
    });
    connection.on(SoopChatEvent.DISCONNECT, () => {
      console.log(`chat disconnected: ${thisBno}`);
      if (active?.bno === thisBno) queueDonationGap(thisBno, '방송 중 SOOP 채팅 연결이 끊겼습니다. 누락 가능 구간을 확인해 주세요.');
      reconnectSoon(connection);
    });
    await connection.connect();
    connection.ws?.on('close', (code, reason) => {
      console.log(`socket closed: ${thisBno}, code ${code}${reason?.length ? `, reason ${reason.toString().slice(0, 100)}` : ''}`);
      if (active?.bno === thisBno) queueDonationGap(thisBno, '방송 중 SOOP 채팅 소켓이 닫혔습니다. 누락 가능 구간을 확인해 주세요.');
      reconnectSoon(connection);
    });
    connection.ws?.on('error', error => {
      console.error('socket:', error.message);
      if (active?.bno === thisBno) queueDonationGap(thisBno, '방송 중 SOOP 채팅 소켓 오류가 발생했습니다.');
    });
  } catch (error) { console.error('SOOP poll/connect:', error.message); }
  finally { polling = false; }
}

setInterval(() => { void poll(); }, 15000);
setInterval(() => { void flush(); }, 5000);
setInterval(() => { void flushDonations(); }, 5000);
setInterval(() => { void reportDonationGaps(); }, 15000);
setInterval(() => { void saveDetections(); }, 15000);
const tokenValid = await rpc('songpyeon_bridge_token_ok', { p_token: bridgeToken });
if (tokenValid !== true) throw new Error('SOOP bridge token verification failed');
console.log('Readdy RPC and bridge token verified');
await poll();
console.log('collector ready');
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
  stopping = true;
  await flush();
  await flushDonations();
  await reportDonationGaps();
  process.exit(outbox.length || donationOutbox.length || donationPending.length || donationGaps.size ? 1 : 0);
});
