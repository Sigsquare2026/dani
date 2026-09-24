export function broadcastDate(when) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(when);
}

export function getBroadcast(channel) {
  const bno = String(channel?.BNO ?? '').trim();
  if (Number(channel?.RESULT) !== 1 || !/^\d+$/.test(bno) || bno === '0') return null;
  return bno;
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
