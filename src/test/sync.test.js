import { describe, it, expect } from 'vitest';
import RecordSync, { diffCollection, rowsToState, applyChange } from '../logic/sync';
import { seed } from '../logic/seed';
import { createFakeSupabase } from './fakeSupabase';

describe('diffCollection', () => {
  it('writes only changed or moved items and deletes removed ones', () => {
    const a = { id: 'A', n: 1 }, b = { id: 'B', n: 2 }, c = { id: 'C', n: 3 };
    const b2 = { ...b, n: 20 };
    const d = diffCollection('tasks', [a, b, c], [a, b2]);
    expect(d.upserts.map(r => r.id)).toEqual(['B']);
    expect(d.deletes).toEqual(['C']);
  });

  it('uses the right id field per collection', () => {
    const d = diffCollection('stock', [], [{ sku: 'X1', q: 2 }]);
    expect(d.upserts[0]).toMatchObject({ collection: 'stock', id: 'X1', position: 0 });
  });

  it('stores values without ids as one row', () => {
    expect(diffCollection('activity', [], [{ t: 'a' }, { t: 'b' }]).upserts).toEqual([{ collection: 'activity', id: '*', position: 0, data: [{ t: 'a' }, { t: 'b' }] }]);
    expect(diffCollection('reportsSub', 44, 45).upserts[0]).toMatchObject({ id: '*', data: 45 });
  });
});

describe('rows and realtime changes', () => {
  it('rebuilds collections in order', () => {
    const st = rowsToState([
      { collection: 'tasks', id: 'B', position: 1, data: { id: 'B' } },
      { collection: 'tasks', id: 'A', position: 0, data: { id: 'A' } },
      { collection: 'agenda', id: '*', position: 0, data: [true, false] }
    ]);
    expect(st.tasks.map(t => t.id)).toEqual(['A', 'B']);
    expect(st.agenda).toEqual([true, false]);
  });

  it('ignores echoes of our own writes and applies other people’s', () => {
    const cur = [{ id: 'A', n: 1 }];
    expect(applyChange(cur, { eventType: 'UPDATE', new: { collection: 'tasks', id: 'A', position: 0, data: { id: 'A', n: 1 } } })).toBeUndefined();
    expect(applyChange(cur, { eventType: 'UPDATE', new: { collection: 'tasks', id: 'A', position: 0, data: { id: 'A', n: 9 } } })).toEqual([{ id: 'A', n: 9 }]);
    expect(applyChange(cur, { eventType: 'INSERT', new: { collection: 'tasks', id: 'Z', position: 0, data: { id: 'Z' } } }).map(t => t.id)).toEqual(['Z', 'A']);
    expect(applyChange(cur, { eventType: 'DELETE', old: { collection: 'tasks', id: 'A' } })).toEqual([]);
  });
});

describe('RecordSync', () => {
  it('seeds an empty database once and round-trips every collection', async () => {
    const db = createFakeSupabase();
    const sync = new RecordSync(db, Object.keys(seed()));
    const first = await sync.load(seed());
    expect(first.projects).toEqual(seed().projects);
    expect(first.reportsSub).toBe(44);
    expect(first.reportText).toBeUndefined();
    const n = db.tables.app_records.size;
    await sync.load(seed());
    expect(db.tables.app_records.size).toBe(n);
  });

  it('pushes edits and deletions', async () => {
    const db = createFakeSupabase();
    const sync = new RecordSync(db, Object.keys(seed()));
    const prev = await sync.load(seed());
    const next = { ...prev, tasks: prev.tasks.slice(1).map((t, i) => (i === 0 ? { ...t, st: 'done' } : t)) };
    await sync.push(prev, next, ['tasks'], e => { throw e; });
    const again = await sync.load({});
    expect(again.tasks.length).toBe(prev.tasks.length - 1);
    expect(again.tasks[0].st).toBe('done');
  });
});
