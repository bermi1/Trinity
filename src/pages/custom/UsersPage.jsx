import { useEffect, useState } from 'react';
import { PageHead, Card, Btn, Avatar, Pill, Empty } from '../../ui/kit';

const BLANK = { name: '', email: '', role: 'staff', dept: 'operations', title: '', k: '', password: '', admin: false };
const DEPTS = [['clientservice', 'Client Service'], ['creative', 'Creative'], ['operations', 'Operations'], ['finance', 'Finance'], ['production', 'Printing'], ['reception', 'Reception']];
const DEPT_PORTALS = ['clientservice', 'creative', 'operations', 'finance', 'production', 'reception'];

// Administrator: create, change and remove sign-in accounts, and remove the demo in one tap.
export default function UsersPage({ v }) {
  const A = v.ADM;
  const [f, setF] = useState(BLANK);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetFor, setResetFor] = useState(null);
  const [newPw, setNewPw] = useState('');
  const [resetErr, setResetErr] = useState('');

  const loaded = A.users !== null;
  useEffect(() => { if (A.db && v.canStaff && !loaded && !A.busy) A.load(); }, [A, v.canStaff, loaded]);

  if (!A.db) return (
    <>
      <PageHead kicker="System" title="Users & access" />
      <Card><Empty>Accounts are managed on the live database. This is the demo, where anyone can sign in to any portal.</Empty></Card>
    </>
  );
  if (!v.canStaff) return <Card><Empty>Only Management, the General Manager or an administrator can manage accounts.</Empty></Card>;
  // Management and the GM add and remove staff; administrators' accounts (and, for the GM, Management's) are left to an administrator.
  const canTouch = u => A.admin || (!u.is_admin && !(A.role === 'gm' && u.role === 'ceo'));
  const roles = A.admin || A.role === 'ceo' ? A.roles : A.roles.filter(r => r.v !== 'ceo');

  const users = A.users || [];
  const demo = users.filter(u => u.is_demo);
  const set = k => e => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const initials = f.k || f.name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const create = async e => {
    e.preventDefault();
    if (!f.name.trim() || !f.email.trim()) { setErr('Enter a name and an email.'); return; }
    if (f.password.length < 8) { setErr('The starting password needs at least 8 characters.'); return; }
    setBusy(true); setErr('');
    const problem = await A.create({ ...f, k: initials });
    setBusy(false);
    if (problem) setErr(problem); else setF(BLANK);
  };
  const reset = async e => {
    e.preventDefault();
    const problem = await A.reset(resetFor, newPw);
    if (problem) setResetErr(problem); else { setResetFor(null); setNewPw(''); setResetErr(''); }
  };

  return (
    <>
      <PageHead kicker="System" title="Users & access" sub="Create accounts for staff, choose their portal, reset passwords and remove people who leave." />

      {A.admin && (demo.length || !A.live) ? (
        <Card title="Demo accounts and data" className="k-danger">
          <p className="k-sub" style={{ margin: '0 0 12px', fontSize: 13.5 }}>
            {demo.length} demo account{demo.length === 1 ? '' : 's'} and the demo projects, stock, money requests and other records are still in the system.
            Remove them when you are ready to start with Trinity Mark's real data. Accounts you created stay.
          </p>
          <Btn kind="danger" icon={v.ic.x} onClick={A.removeDemo}>Remove demo accounts and data</Btn>
        </Card>
      ) : null}

      <div className="k-row">
        <Card title="New account">
          <form className="k-form" onSubmit={create} noValidate>
            <label>Full name<input value={f.name} onChange={set('name')} placeholder="e.g. Neema Lyimo" autoComplete="off" /></label>
            <label>Email<input type="email" value={f.email} onChange={set('email')} placeholder="name@trinitymark.co.tz" autoComplete="off" /></label>
            <div className="ff us-wide" data-field="Portal"><span className="ff-l">Portal</span>
              <div className="ff-chips" role="radiogroup" aria-label="Portal">{roles.map(r => <button key={r.v} type="button" role="radio" aria-checked={f.role === r.v} className={f.role === r.v ? 'is-on' : ''} onClick={() => setF({ ...f, role: r.v })}>{r.l}</button>)}</div>
              <small className="k-sub">Department heads get their department’s portal (they then see and task their team). Everyone else gets the Staff portal.</small>
            </div>
            {!DEPT_PORTALS.includes(f.role) && !['ceo', 'gm', 'pa'].includes(f.role) ? (
              <div className="ff us-wide" data-field="Department"><span className="ff-l">Department (whose head they report to)</span>
                <div className="ff-chips" role="radiogroup" aria-label="Department">{DEPTS.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={f.dept === k} className={f.dept === k ? 'is-on' : ''} onClick={() => setF({ ...f, dept: k })}>{l}</button>)}</div>
              </div>
            ) : null}
            <label>Job title<input value={f.title} onChange={set('title')} placeholder="e.g. Account Manager" /></label>
            <label style={{ flex: '0 1 110px' }}>Initials<input value={f.k} onChange={set('k')} placeholder={initials || 'NL'} maxLength={3} /></label>
            <label>Starting password<input type="text" value={f.password} onChange={set('password')} placeholder="at least 8 characters" autoComplete="new-password" /></label>
            {A.admin ? <label className="k-check"><input type="checkbox" checked={f.admin} onChange={set('admin')} />Administrator (can manage accounts)</label> : null}
            {err ? <div className="k-alert is-bad" role="alert" style={{ flexBasis: '100%' }}>{err}</div> : null}
            <Btn kind="dark" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</Btn>
          </form>
        </Card>
      </div>

      <Card title={'Accounts · ' + users.length} pad={false} aside={<Btn kind="ghost" icon={v.ic.refresh} onClick={A.load}>Refresh</Btn>}>
        {!loaded ? <Empty>Loading accounts…</Empty> : users.length === 0 ? <Empty>No accounts yet.</Empty> : (
          <div className="k-scroll">
            <table className="k-table" style={{ minWidth: 820 }}>
              <thead><tr><th>Person</th><th>Portal</th><th>Last sign-in</th><th /></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.user_id} data-user={u.email}>
                    <td>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <label className="us-photo" title="Upload photo">
                          <input type="file" accept="image/*" onChange={async e => { const fl = e.target.files[0]; e.target.value = ''; if (fl && u.person_key) await A.photo(u.person_key, fl); }} aria-label={'Photo for ' + u.full_name} />
                          <Avatar p={{ i: u.person_key || '?', n: u.full_name, c: v.colorFor(u.person_key || u.email), ph: (v.photos || {})[u.person_key] }} size={36} />
                        </label>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700 }}>{u.full_name} {u.is_admin ? <Pill l="Admin" bg="#EFE8FA" fg="#5A2FA8" /> : null} {u.is_demo ? <Pill l="Demo" bg="#FBF1DD" fg="#8A6414" /> : null}</div>
                          <div className="k-sub">{u.email}{u.title ? ' · ' + u.title : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select className="k-select" value={u.role} disabled={!canTouch(u)} onChange={e => A.update(u, { role: e.target.value })} aria-label={'Portal for ' + u.email}>
                        {(canTouch(u) && u.role !== 'ceo' ? roles : A.roles).map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
                      </select>
                    </td>
                    <td className="k-sub">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {canTouch(u) ? <Btn kind="ghost" onClick={() => { setResetFor(u); setNewPw(''); setResetErr(''); }}>Reset password</Btn> : null}
                        {A.admin && u.email !== A.me ? <Btn kind="ghost" onClick={() => A.update(u, { is_admin: !u.is_admin })}>{u.is_admin ? 'Remove admin' : 'Make admin'}</Btn> : null}
                        {u.email !== A.me && canTouch(u) ? <Btn kind="danger" onClick={() => A.del(u)}>Delete</Btn> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {resetFor ? (
        <Card title={'New password for ' + resetFor.email}>
          <form className="k-form" onSubmit={reset}>
            <label>New password<input type="text" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="at least 8 characters" autoFocus /></label>
            {resetErr ? <div className="k-alert is-bad" role="alert" style={{ flexBasis: '100%' }}>{resetErr}</div> : null}
            <Btn kind="dark" type="submit">Set password</Btn>
            <Btn kind="ghost" type="button" onClick={() => setResetFor(null)}>Cancel</Btn>
          </form>
        </Card>
      ) : null}
    </>
  );
}
