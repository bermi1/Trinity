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

describe('faces stored per person', () => {
  const f = (k, n = 1) => ({ k, ds: [[n]] });
  it('writes one row per person and removes the leftover whole row', () => {
    const a = f('AA'), b = f('BB');
    const d = diffCollection('faces', [a], [a, b]);
    expect(d.upserts).toEqual([{ collection: 'faces', id: 'BB', position: 1, data: b }]);
    expect(d.deletes).toEqual(['*']);
    expect(diffCollection('faces', [a, b], [b]).deletes).toEqual(['AA', '*']);
  });

  it('keeps other collections unchanged', () => {
    expect(diffCollection('tasks', [{ id: 'A' }], [{ id: 'A' }, { id: 'B' }]).deletes).toEqual([]);
    const st = rowsToState([{ collection: 'agenda', id: '*', position: 0, data: [1] }, { collection: 'agenda', id: 'X', position: 0, data: 2 }]);
    expect(st.agenda).toEqual([1]);
  });

  it('prefers per-person rows over a stale whole row, and still reads an old whole row', () => {
    const st = rowsToState([{ collection: 'faces', id: '*', position: 0, data: [f('OLD')] }, { collection: 'faces', id: 'BB', position: 1, data: f('BB') }, { collection: 'faces', id: 'AA', position: 0, data: f('AA') }]);
    expect(st.faces.map(x => x.k)).toEqual(['AA', 'BB']);
    expect(rowsToState([{ collection: 'faces', id: '*', position: 0, data: [f('OLD')] }]).faces.map(x => x.k)).toEqual(['OLD']);
  });

  it('migrates an old whole row without losing anyone, and two people registering do not overwrite each other', async () => {
    const db = createFakeSupabase();
    await db.from('app_records').upsert([{ collection: 'faces', id: '*', position: 0, data: [f('AA'), f('BB')] }], { onConflict: 'collection,id' });
    const one = new RecordSync(db, ['faces']), two = new RecordSync(db, ['faces']);
    const p1 = await one.load({}), p2 = await two.load({});
    expect(p1.faces.map(x => x.k)).toEqual(['AA', 'BB']);
    await one.push(p1, { faces: [...p1.faces, f('CC')] }, ['faces'], e => { throw e; });
    await two.push(p2, { faces: [...p2.faces, f('DD')] }, ['faces'], e => { throw e; });
    const rows = [...db.tables.app_records.values()].filter(r => r.collection === 'faces');
    expect(rows.some(r => r.id === '*')).toBe(false);
    const st = await new RecordSync(db, ['faces']).load({});
    expect(st.faces.map(x => x.k).sort()).toEqual(['AA', 'BB', 'CC', 'DD']);
  });
});
