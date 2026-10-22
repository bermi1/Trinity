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

  // Account administration, as the database functions behave (admin check included).
  const me = () => session && session.user.id;
  const isAdmin = () => !!(tables.profiles.get(me()) || {}).is_admin;
  const deny = { data: null, error: { message: 'Only an administrator can manage accounts' } };
  const rpcs = {
    admin_list_users: () => ({ data: [...tables.profiles.entries()].map(([id, p]) => ({ user_id: id, email: Object.keys(users).find(e => users[e].id === id), full_name: p.full_name, title: p.title || '', role: p.role, person_key: p.person_key, is_admin: !!p.is_admin, is_demo: !!p.is_demo, last_sign_in_at: null })), error: null }),
    admin_create_user: a => {
      if (users[a.p_email]) return { data: null, error: { message: 'An account with ' + a.p_email + ' already exists' } };
      const id = 'u' + (Object.keys(users).length + 1);
      users[a.p_email] = { id, password: a.p_password };
      tables.profiles.set(id, { role: a.p_role, full_name: a.p_full_name, title: a.p_title, person_key: a.p_person_key.toUpperCase(), is_admin: a.p_is_admin, is_demo: false });
      return { data: id, error: null };
    },
    admin_update_user: a => { Object.assign(tables.profiles.get(a.p_user), { role: a.p_role, is_admin: a.p_is_admin }); return { data: null, error: null }; },
    admin_set_password: a => { const e = Object.keys(users).find(k => users[k].id === a.p_user); users[e].password = a.p_password; return { data: null, error: null }; },
    admin_delete_user: a => { const e = Object.keys(users).find(k => users[k].id === a.p_user); delete users[e]; tables.profiles.delete(a.p_user); return { data: null, error: null }; },
    admin_remove_demo: () => {
      let n = 0;
      for (const [id, p] of [...tables.profiles]) if (p.is_demo && id !== me()) { tables.profiles.delete(id); delete users[Object.keys(users).find(k => users[k].id === id)]; n++; }
      const rows = tables.app_records.size;
      tables.app_records.clear();
      tables.app_records.set('_meta|workspace', { collection: '_meta', id: 'workspace', position: 0, data: { mode: 'live' } });
      return { data: { users_removed: n, records_removed: rows }, error: null };
    }
  };

  return {
    tables,
    users,
    async rpc(name, args) { return isAdmin() ? rpcs[name](args || {}) : deny; },
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
