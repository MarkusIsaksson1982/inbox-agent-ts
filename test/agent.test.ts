import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planFollowUps } from '../src/agent.js';
import type { InboxEvent } from '../src/types.js';
const E = (o: Partial<InboxEvent>): InboxEvent => ({ id: 'e', kind: 'email_received', at: '2026-10-01T10:00:00Z', person: 'anna@acme.com', ...o });
const now = '2026-10-10T12:00:00Z';
test('unanswered inbound email older than 1 day -> high reply due at+1d', () => {
  const f = planFollowUps([E({ id: 'in1' })], { now });
  assert.equal(f.length, 1); assert.equal(f[0].action, 'reply'); assert.equal(f[0].priority, 'high');
  assert.equal(f[0].personId, 'person:anna@acme.com'); assert.equal(f[0].dueAt, '2026-10-02T10:00:00.000Z'); assert.deepEqual(f[0].sources, ['in1']);
});
test('fresh inbound email (<1 day) -> medium reply', () => {
  assert.equal(planFollowUps([E({ at: '2026-10-10T08:00:00Z' })], { now })[0].priority, 'medium');
});
test('inbound answered by a later sent email -> nothing', () => {
  assert.deepEqual(planFollowUps([E({ id: 'a' }), E({ id: 'b', kind: 'email_sent', at: '2026-10-09T10:00:00Z' })], { now: '2026-10-10T00:00:00Z' }), []);
});
test('sent email without reply after nudgeAfterDays -> medium nudge', () => {
  const f = planFollowUps([E({ id: 's1', kind: 'email_sent', at: '2026-10-05T10:00:00Z' })], { now });
  assert.deepEqual(f.map((x) => [x.action, x.priority, x.dueAt]), [['nudge', 'medium', '2026-10-08T10:00:00.000Z']]);
  assert.deepEqual(planFollowUps([E({ kind: 'email_sent', at: '2026-10-09T10:00:00Z' })], { now }), []);
  assert.equal(planFollowUps([E({ kind: 'email_sent', at: '2026-10-09T10:00:00Z' })], { now, nudgeAfterDays: 1 })[0].action, 'nudge');
});
test('sent email followed by a reply -> no nudge (but the reply itself may need an answer)', () => {
  const f = planFollowUps([E({ id: 's', kind: 'email_sent', at: '2026-10-05T10:00:00Z' }), E({ id: 'r', at: '2026-10-06T10:00:00Z' })], { now });
  assert.deepEqual(f.map((x) => x.action), ['reply']);
});
test('upcoming meeting -> high prep_meeting due one day before, past meeting ignored', () => {
  const f = planFollowUps([E({ id: 'm', kind: 'meeting_booked', meetingAt: '2026-10-12T09:00:00Z' })], { now });
  assert.deepEqual(f.map((x) => [x.action, x.priority, x.dueAt]), [['prep_meeting', 'high', '2026-10-11T09:00:00.000Z']]);
  assert.deepEqual(planFollowUps([E({ kind: 'meeting_booked', meetingAt: '2026-10-09T09:00:00Z' })], { now }), []);
});
test('dedupe per person+action merges sources; sorted by priority then dueAt then personId', () => {
  const f = planFollowUps([
    E({ id: 'i1', at: '2026-10-01T10:00:00Z' }), E({ id: 'i2', at: '2026-10-03T10:00:00Z' }),
    E({ id: 'b1', person: 'bo@beta.se', kind: 'email_sent', at: '2026-10-02T10:00:00Z' }),
    E({ id: 'c1', person: 'cy@gamma.se', kind: 'meeting_booked', meetingAt: '2026-10-11T08:00:00Z' }),
  ], { now });
  assert.deepEqual(f.map((x) => `${x.personId}:${x.action}`), ['person:anna@acme.com:reply', 'person:cy@gamma.se:prep_meeting', 'person:bo@beta.se:nudge']);
  assert.deepEqual(f[0].sources, ['i1', 'i2']); assert.equal(f[0].dueAt, '2026-10-02T10:00:00.000Z');
});
