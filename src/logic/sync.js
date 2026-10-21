// Keeps the app's data collections in step with the `app_records` table.
// Each item of a collection is one row (collection, id, position, data), so
// people editing different items never overwrite each other. Collections whose
// items have no stable id, and single values, are stored as one row with id '*'.

export const TABLE = 'app_records';
const WHOLE = '*';

// Field that identifies an item, where it isn't `id`.
const ID_FIELD = { stock: 'sku', staff: 'k', vehicles: 'reg', actions: 'task' };

// Drafts and form text stay in the browser; everything else is shared.
export const LOCAL_ONLY = new Set(['reportText', 'fieldReq', 'newUpdate', 'newVisitor', 'roomTitle']);

function idOf(collection, item) {
  const f = ID_FIELD[collection] || 'id';
  return item && typeof item === 'object' && item[f] != null ? String(item[f]) : null;
}

// True when every item has its own unique id, so rows can be stored per item.
function perItem(collection, value) {
  if (!Array.isArray(value)) return false;
  const ids = value.map(it => idOf(collection, it));
  return ids.every(Boolean) && new Set(ids).size === ids.length;
}

// Rows to upsert and ids to delete for one collection that changed from prev to next.
export function diffCollection(collection, prev, next) {
  if (!perItem(collection, next) || !perItem(collection, prev || [])) {
    return { upserts: [{ collection, id: WHOLE, position: 0, data: next }], deletes: [] };
  }
  const before = new Map((prev || []).map((it, i) => [idOf(collection, it), { it, i }]));
  const upserts = [];
  next.forEach((it, i) => {
    const id = idOf(collection, it), old = before.get(id);
    if (!old || old.it !== it || old.i !== i) upserts.push({ collection, id, position: i, data: it });
    before.delete(id);
  });
  return { upserts, deletes: [...before.keys()] };
}

// Turns rows from the table back into state values.
export function rowsToState(rows) {
  const groups = {};
  for (const r of rows) (groups[r.collection] ||= []).push(r);
  const out = {};
  for (const [c, list] of Object.entries(groups)) {
    const whole = list.find(r => r.id === WHOLE);
    out[c] = whole ? whole.data : list.sort((a, b) => a.position - b.position).map(r => r.data);
  }
  return out;
}

// Applies one realtime change to the current value of its collection.
// Returns undefined when nothing changes (for example, our own write echoing back).
export function applyChange(current, { eventType, new: row, old }) {
  if (eventType === 'DELETE') {
    if (!Array.isArray(current) || !old) return undefined;
    const next = current.filter(it => idOf(old.collection, it) !== old.id);
    return next.length === current.length ? undefined : next;
  }
  if (row.id === WHOLE) return JSON.stringify(current) === JSON.stringify(row.data) ? undefined : row.data;
  const list = Array.isArray(current) ? current : [];
  const at = list.findIndex(it => idOf(row.collection, it) === row.id);
  if (at >= 0 && at === row.position && JSON.stringify(list[at]) === JSON.stringify(row.data)) return undefined;
  const next = list.filter((_, i) => i !== at);
  next.splice(Math.min(row.position, next.length), 0, row.data);
  return next;
}

export default class RecordSync {
  constructor(client, keys) {
    this.db = client;
    this.keys = keys.filter(k => !LOCAL_ONLY.has(k));
    this.channel = null;
    this.queue = Promise.resolve();
  }

  // Loads every collection. Seeds the table with `seed` when it is empty.
  async load(seed) {
    const { data, error } = await this.db.from(TABLE).select('collection,id,position,data').limit(10000);
    if (error) throw error;
    if (data.length) return rowsToState(data);
    const rows = this.keys.flatMap(k => diffCollection(k, [], seed[k]).upserts);
    const { error: e2 } = await this.db.from(TABLE).upsert(rows, { onConflict: 'collection,id', ignoreDuplicates: true });
    if (e2) throw e2;
    return this.load({});
  }

  // Saves the collections that changed. Writes run one after another, in order.
  push(prevState, nextState, changedKeys, onError) {
    const rows = [], deletes = [];
    for (const k of changedKeys) {
      if (!this.keys.includes(k)) continue;
      const d = diffCollection(k, prevState[k], nextState[k]);
      rows.push(...d.upserts);
      d.deletes.forEach(id => deletes.push([k, id]));
    }
    if (!rows.length && !deletes.length) return this.queue;
    this.queue = this.queue.then(async () => {
      if (rows.length) {
        const { error } = await this.db.from(TABLE).upsert(rows, { onConflict: 'collection,id' });
        if (error) throw error;
      }
      for (const [collection, id] of deletes) {
        const { error } = await this.db.from(TABLE).delete().match({ collection, id });
        if (error) throw error;
      }
    }).catch(onError);
    return this.queue;
  }

  // Calls onChange(collection, payload) for every change made by anyone.
  subscribe(onChange) {
    this.channel = this.db.channel('app_records')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, p => {
        const c = (p.new && p.new.collection) || (p.old && p.old.collection);
        if (c && this.keys.includes(c)) onChange(c, p);
      })
      .subscribe();
  }

  unsubscribe() {
    if (this.channel) this.db.removeChannel(this.channel);
    this.channel = null;
  }
}
