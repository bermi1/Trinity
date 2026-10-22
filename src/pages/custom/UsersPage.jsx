import { useEffect, useState } from 'react';
import { PageHead, Card, Btn, Avatar, Pill, Empty } from '../../ui/kit';

const BLANK = { name: '', email: '', role: 'staff', title: '', k: '', password: '', admin: false };

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
  useEffect(() => { if (A.db && v.isAdmin && !loaded && !A.busy) A.load(); }, [A, v.isAdmin, loaded]);

  if (!A.db) return (
    <>
      <PageHead kicker="System" title="Users & access" />
      <Card><Empty>Accounts are managed on the live database. This is the demo, where anyone can sign in to any portal.</Empty></Card>
    </>
  );
  if (!v.isAdmin) return <Card><Empty>Only an administrator can manage accounts.</Empty></Card>;

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

      {demo.length || !A.live ? (
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
            <label>Portal<select value={f.role} onChange={set('role')}>{A.roles.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}</select></label>
            <label>Job title<input value={f.title} onChange={set('title')} placeholder="e.g. Account Manager" /></label>
            <label style={{ flex: '0 1 110px' }}>Initials<input value={f.k} onChange={set('k')} placeholder={initials || 'NL'} maxLength={3} /></label>
            <label>Starting password<input type="text" value={f.password} onChange={set('password')} placeholder="at least 8 characters" autoComplete="new-password" /></label>
            <label className="k-check"><input type="checkbox" checked={f.admin} onChange={set('admin')} />Administrator (can manage accounts)</label>
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
                        <Avatar p={{ i: u.person_key || '?', n: u.full_name, c: v.colorFor(u.person_key || u.email) }} size={30} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700 }}>{u.full_name} {u.is_admin ? <Pill l="Admin" bg="#EFE8FA" fg="#5A2FA8" /> : null} {u.is_demo ? <Pill l="Demo" bg="#FBF1DD" fg="#8A6414" /> : null}</div>
                          <div className="k-sub">{u.email}{u.title ? ' · ' + u.title : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select className="k-select" value={u.role} onChange={e => A.update(u, { role: e.target.value })} aria-label={'Portal for ' + u.email}>
                        {A.roles.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
                      </select>
                    </td>
                    <td className="k-sub">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <Btn kind="ghost" onClick={() => { setResetFor(u); setNewPw(''); setResetErr(''); }}>Reset password</Btn>
                        {u.email !== A.me ? <Btn kind="ghost" onClick={() => A.update(u, { is_admin: !u.is_admin })}>{u.is_admin ? 'Remove admin' : 'Make admin'}</Btn> : null}
                        {u.email !== A.me ? <Btn kind="danger" onClick={() => A.del(u)}>Delete</Btn> : null}
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
