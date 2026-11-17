import { useState } from 'react';
import { PageHead, Card, Btn, Empty } from '../../ui/kit';

// Company setup (administrators): which requests need fewer approvals, and which sections are switched on.
export default function CompanyPage({ v }) {
  const C = v.CO;
  const [limit, setLimit] = useState(String(C.limit));
  if (!C.can) return <Card><Empty>Only an administrator can change the company setup.</Empty></Card>;
  return (
    <>
      <PageHead kicker="System" title="Company setup" sub="Keep the system simple: fewer approvals for small amounts, and only the sections your team uses." />
      <div className="k-row">
        <Card title="Small money requests">
          <form className="k-form" onSubmit={e => { e.preventDefault(); C.setLimit(limit); }}>
            <p className="k-sub" style={{ margin: 0, flexBasis: '100%', fontSize: 13.5 }}>
              Requests up to this amount go to the Project Manager and Finance only. Larger requests also go to Operations and Management. Set 0 to send every request through all steps.
            </p>
            <label>Amount (TZS)<input type="number" min="0" step="10000" inputMode="numeric" value={limit} onChange={e => setLimit(e.target.value)} /></label>
            <Btn kind="dark" type="submit">Save</Btn>
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
