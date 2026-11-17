import { useState } from 'react';
import { PageHead, Card, Btn, Empty } from '../../ui/kit';

// Company setup (administrators): which requests need fewer approvals, and which sections are switched on.
export default function CompanyPage({ v }) {
  const C = v.CO;
  const [limit, setLimit] = useState(String(C.limit));
  const [target, setTarget] = useState(String(C.csTarget));
  if (!C.can) return <Card><Empty>Only an administrator can change the company setup.</Empty></Card>;
  return (
    <>
      <PageHead kicker="System" title="Company setup" sub="Keep the system simple: fewer approvals for small amounts, and only the sections your team uses." />
      <div className="k-row">
        <Card title="Small money requests">
          <form className="k-form" onSubmit={e => { e.preventDefault(); C.setLimit(limit); }}>
            <p className="k-sub" style={{ margin: 0, flexBasis: '100%', fontSize: 13.5 }}>
              Project and office requests up to this amount go GM → Finance → paid, without Management. Larger ones also go to Management. Set 0 to send every request to Management.
            </p>
            <label>Amount (TZS)<input type="number" min="0" step="10000" inputMode="numeric" value={limit} onChange={e => setLimit(e.target.value)} /></label>
            <Btn kind="dark" type="submit">Save</Btn>
          </form>
        </Card>
        <Card title="Departments">
          <p className="k-sub" style={{ margin: '0 0 10px', fontSize: 13.5 }}>Each manager sees their team’s daily to-do, assigns them tasks and receives their “Send my day”.</p>
          <ul className="co-sections">
            {C.depts.map(d => (
              <li key={d.d}>
                <span>{d.l}</span>
                <select className="k-select" value={d.mgr || ''} onChange={e => d.set(e.target.value)} aria-label={d.l + ' manager'}>
                  {C.people.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
                </select>
              </li>
            ))}
          </ul>
          <form className="k-form" style={{ marginTop: 12 }} onSubmit={e => { e.preventDefault(); C.setTarget(target); }}>
            <label>Client Service target a month (TZS M)<input type="number" min="0" inputMode="numeric" value={target} onChange={e => setTarget(e.target.value)} /></label>
            <Btn kind="dark" type="submit">Save target</Btn>
          </form>
        </Card>
        <Card title="Sections">
          <p className="k-sub" style={{ margin: '0 0 10px', fontSize: 13.5 }}>Switched-off sections disappear from everyone’s menus. Nothing is deleted; switch them back on any time.</p>
          <ul className="co-sections">
            {C.sections.map(s => (
              <li key={s.k}>
                <span>{s.l}</span>
                <button type="button" role="switch" aria-checked={s.on} aria-label={s.l} className={'co-switch' + (s.on ? ' is-on' : '')} onClick={s.toggle}><i /></button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
