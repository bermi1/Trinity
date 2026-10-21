// In-memory stand-in for the parts of supabase-js the app uses, so the
// database flow can be tested without a network.
export function createFakeSupabase({ users = {}, profiles = {} } = {}) {
  const tables = { app_records: new Map(), profiles: new Map(Object.entries(profiles)) };
  const listeners = [];
  let session = null;
  const key = r => r.collection + '|' + r.id;
  const emit = (eventType, row, old) => listeners.forEach(fn => fn({ eventType, new: row || {}, old }));

  function query(table) {
    const filters = [];
    const q = {
      select() { return q; },
      limit() { return q; },
      eq(col, val) { filters.push(r => r[col] === val); return q; },
      async maybeSingle() {
        const rows = [...tables[table].entries()].map(([id, r]) => ({ user_id: id, ...r })).filter(r => filters.every(f => f(r)));
        return { data: rows[0] || null, error: null };
      },
      then(res, rej) { return Promise.resolve({ data: [...tables[table].values()].map(r => structuredClone(r)), error: null }).then(res, rej); },
      async upsert(rows, opts = {}) {
        for (const r of rows) {
          const k = key(r);
          if (opts.ignoreDuplicates && tables[table].has(k)) continue;
          const row = structuredClone(r);
          tables[table].set(k, row);
          emit('UPDATE', structuredClone(row));
        }
        return { error: null };
      },
      delete() {
        return {
          async match(m) {
            const k = key(m);
            const old = tables[table].get(k);
            tables[table].delete(k);
            if (old) emit('DELETE', null, { collection: m.collection, id: m.id });
            return { error: null };
          }
        };
      }
    };
    return q;
  }

  return {
    tables,
    from: query,
    auth: {
      async getSession() { return { data: { session } }; },
      onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; },
      async signInWithPassword({ email, password }) {
        const u = users[email];
        if (!u || u.password !== password) return { data: {}, error: { message: 'Invalid login credentials' } };
        session = { user: { id: u.id, email } };
        return { data: { user: session.user, session }, error: null };
      },
      async signOut() { session = null; return { error: null }; },
      async resetPasswordForEmail() { return { error: null }; }
    },
    channel() {
      const ch = { on(_t, _f, fn) { ch.fn = fn; return ch; }, subscribe() { listeners.push(ch.fn); return ch; } };
      return ch;
    },
    removeChannel(ch) { const i = listeners.indexOf(ch.fn); if (i >= 0) listeners.splice(i, 1); },
    // Simulates another person's edit arriving through realtime.
    remoteUpsert(row) { tables.app_records.set(key(row), row); emit('UPDATE', structuredClone(row)); }
  };
}
