import test from 'node:test';
import assert from 'node:assert/strict';
import { Counter, broadcastDate, getBroadcast, soopStartForBroadcast } from '../src/collector.mjs';

test('duplicate and consecutive chats each count once within one BNO', () => {
  const c = new Counter();
  c.add({ userId: 'abc', username: '팬', comment: 'ㅋㅋ' }, '123');
  c.add({ userId: 'abc', username: '팬', comment: 'ㅋㅋ' }, '123');
  c.add({ userId: 'abc', username: '팬', comment: 'ㅋㅋ' }, '124');
  assert.deepEqual(c.take().map(x => [x.bno, x.count]), [['123', 2], ['124', 1]]);
});

test('SOOP start uses KST seconds only for the matching broadcast', () => {
  const station = { broad: { broad_no: 297376799 }, station: { broad_start: '2026-09-25 18:27:07' } };
  const now = new Date('2026-09-25T10:00:00Z');
  assert.equal(soopStartForBroadcast(station, '297376799', now), '2026-09-25T09:27:07.000Z');
  assert.equal(soopStartForBroadcast(station, '297376800', now), null);
  station.station.broad_start = '2026-02-30 18:27:07';
  assert.equal(soopStartForBroadcast(station, '297376799', now), null);
});

test('date is KST and offline BNO is rejected', () => {
  assert.equal(broadcastDate(new Date('2026-09-24T15:15:00Z')), '2026-09-25');
  assert.equal(getBroadcast({ RESULT: 1, BNO: '123' }), '123');
  assert.equal(getBroadcast({ RESULT: 0, BNO: '123' }), null);
});
