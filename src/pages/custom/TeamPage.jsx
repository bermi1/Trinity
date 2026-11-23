import { useState } from 'react';

// Team & departments (Management and the General Manager): who leads, who is in which department,
// and one tap to move someone. Targets are set on the dashboard.
export default function TeamPage({ v }) {
  const T = v.TEAM;
  const [q, setQ] = useState(''), [only, setOnly] = useState(''), [open, setOpen] = useState('');
  if (!T) return null;
  const list = T.staff.filter(p => (!only || (only === 'none' ? !p.dept : p.dept === only)) && (!q || (p.n + ' ' + p.title).toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="tp">
      <header className="tp-head">
        <div><small>Team</small><h1>Team & departments</h1><p>Place each person in their department. Departments decide who gets memos, reports and team targets.</p></div>
        <button type="button" className="tp-go" onClick={T.goTargets}>Set targets</button>
      </header>

      <section className="tp-lead" aria-label="Leadership">
        {T.lead.map(l => (
          <div key={l.role} className="tp-leadc">
            <span className="tp-av" style={{ background: l.c }}>{l.i}</span>
            <div><small>{l.role}</small><b>{l.n}</b><span>{l.t}{l.phone ? ' · ' + l.phone : ''}</span></div>
          </div>
        ))}
      </section>

      <div className="tp-filters" role="group" aria-label="Filter by department">
        <button type="button" className={!only ? 'is-on' : ''} onClick={() => setOnly('')}>Everyone · {T.staff.length}</button>
        {T.counts.map(c => <button key={c.d} type="button" className={only === c.d ? 'is-on' : ''} onClick={() => setOnly(c.d)}>{c.l} · {c.n}</button>)}
        {T.none ? <button type="button" className={only === 'none' ? 'is-on' : ''} onClick={() => setOnly('none')}>No department · {T.none}</button> : null}
      </div>
      <input className="tp-search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search a name or job title" aria-label="Search staff" />

      <ul className="tp-list">
        {list.map(p => (
          <li key={p.k} className={open === p.k ? 'is-open' : ''}>
            <button type="button" className="tp-row" onClick={() => setOpen(open === p.k ? '' : p.k)} aria-expanded={open === p.k} aria-label={'Department for ' + p.n}>
              <span className="tp-av" style={{ background: p.c }}>{p.i}</span>
              <span className="tp-who"><b>{p.n}</b><small>{p.title}{p.head ? ' · Head of department' : ''}</small></span>
              <span className={'tp-dept' + (p.dept ? '' : ' is-none')}>{p.deptL}</span>
            </button>
            {open === p.k ? (
              <div className="tp-pick" role="radiogroup" aria-label={'Move ' + p.n}>
                {T.depts.map(d => <button key={d.d} type="button" role="radio" aria-checked={p.dept === d.d} className={p.dept === d.d ? 'is-on' : ''} onClick={() => { p.move(d.d); setOpen(''); }}>{d.l}</button>)}
              </div>
            ) : null}
          </li>
        ))}
        {!list.length ? <li className="tp-empty">No one matches.</li> : null}
      </ul>
    </div>
  );
}
