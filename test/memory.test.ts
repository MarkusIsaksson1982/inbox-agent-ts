import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryGraph, personId } from '../src/memory.js';
import type { InboxEvent } from '../src/types.js';
const E = (o: Partial<InboxEvent>): InboxEvent => ({ id: 'e1', kind: 'email_received', at: '2026-10-01T10:00:00Z', person: 'Anna@Acme.com', name: 'Anna', company: 'Acme', ...o });
test('personId normalizes email', () => { assert.equal(personId(' Anna@Acme.COM '), 'person:anna@acme.com'); });
test('ingest creates person and company nodes and works_at edge', () => {
  const g = new MemoryGraph(); g.ingest(E({}));
  assert.deepEqual(g.nodes().map((n) => n.id).sort(), ['company:acme', 'person:anna@acme.com']);
  assert.ok(g.edges().some((e) => e.from === 'person:anna@acme.com' && e.to === 'company:acme' && e.rel === 'works_at'));
});
test('nodes are deduplicated across events and labels kept', () => {
  const g = new MemoryGraph(); g.ingest(E({})); g.ingest(E({ id: 'e2', at: '2026-10-02T10:00:00Z' }));
  assert.equal(g.nodes().length, 2); assert.equal(g.nodes().find((n) => n.type === 'person')?.label, 'Anna');
});
test('edges deduplicated by from+to+rel keeping the latest at', () => {
  const g = new MemoryGraph(); g.ingest(E({})); g.ingest(E({ id: 'e2', at: '2026-10-05T10:00:00Z' }));
  const w = g.edges().filter((e) => e.rel === 'works_at'); assert.equal(w.length, 1); assert.equal(w[0].at, '2026-10-05T10:00:00Z');
});
test('crm stage change links company to a stage node', () => {
  const g = new MemoryGraph(); g.ingest(E({ id: 'e3', kind: 'crm_stage_changed', stage: 'Demo' }));
  assert.ok(g.nodes().some((n) => n.id === 'stage:demo' && n.type === 'stage'));
  assert.ok(g.edges().some((e) => e.from === 'company:acme' && e.to === 'stage:demo' && e.rel === 'in_stage'));
});
test('neighbors and history', () => {
  const g = new MemoryGraph(); g.ingest(E({})); g.ingest(E({ id: 'e2', kind: 'email_sent', at: '2026-10-03T09:00:00Z' }));
  assert.deepEqual(g.neighbors('person:anna@acme.com'), ['company:acme']);
  assert.deepEqual(g.history('person:anna@acme.com').map((e) => e.id), ['e1', 'e2']);
  assert.deepEqual(g.history('person:nobody@x.se'), []);
});
