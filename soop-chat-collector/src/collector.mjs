export function broadcastDate(when) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(when);
}

export function getBroadcast(channel) {
  const bno = String(channel?.BNO ?? '').trim();
  if (Number(channel?.RESULT) !== 1 || !/^\d+$/.test(bno) || bno === '0') return null;
  return bno;
}

export function normalizeDonationUserId(value) {
  return String(value ?? '').trim().replace(/\([1-9]\d*\)$/, '');
}

export function donationRow(event, type, bno) {
  if (!['text', 'video', 'ad'].includes(type)) return null;
  const userId = normalizeDonationUserId(event?.from);
  const amount = Number(event?.amount);
  if (!/^\d+$/.test(String(bno)) || !userId || !Number.isSafeInteger(amount)
      || amount < 1 || amount > 1_000_000_000) return null;
  const receivedAt = new Date(event?.receivedTime);
  if (!Number.isFinite(receivedAt.getTime())) return null;
  return {
    donation_type: type,
    user_id: userId,
    raw_user_id: String(event.from).trim(),
    nickname: String(event.fromUsername ?? userId).slice(0, 100),
    amount,
    received_at: receivedAt.toISOString(),
  };
}

// SOOP station timestamps are KST strings without an explicit timezone.
// Only trust the timestamp when the station response identifies the same BNO.
export function soopStartForBroadcast(station, bno, now = new Date()) {
  if (String(station?.broad?.broad_no ?? '') !== String(bno)) return null;
  const value = station?.station?.broad_start;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) return null;
  const start = new Date(`${value.replace(' ', 'T')}+09:00`);
  if (!Number.isFinite(start.getTime()) || start.getTime() > now.getTime() + 60_000
      || start.getTime() < now.getTime() - 366 * 86_400_000) return null;
  const actualKst = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).format(start);
  return actualKst === value ? start.toISOString() : null;
}

export class Counter {
  constructor() { this.pending = new Map(); }
  add(event, bno) {
    const userId = String(event?.userId ?? '').trim();
    if (!/^\d+$/.test(String(bno)) || !userId) return false;
    const key = `${bno}\u0000${userId}`;
    const old = this.pending.get(key);
    this.pending.set(key, {
      bno: String(bno), user_id: userId, nickname: String(event.username ?? userId).slice(0, 100),
      count: (old?.count ?? 0) + 1,
    });
    return true;
  }
  take() {
    const rows = [...this.pending.values()];
    this.pending = new Map();
    return rows;
  }
  restore(rows) {
    for (const row of rows) {
      const key = `${row.bno}\u0000${row.user_id}`;
      const old = this.pending.get(key);
      this.pending.set(key, { ...row, nickname: old?.nickname ?? row.nickname, count: row.count + (old?.count ?? 0) });
    }
  }
}
