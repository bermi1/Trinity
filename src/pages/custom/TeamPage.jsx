import { useState } from 'react';

function PhoneEdit({ value, onSave, name, dark }) {
  const [ph, setPh] = useState(value || ''), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false);
  const save = async () => { setBusy(true); const m = await onSave(ph); setBusy(false); setMsg(m || 'Saved'); };
  return (
    <div className={'tp-phone' + (dark ? ' is-dark' : '')}>
      <input value={ph} onChange={e => { setPh(e.target.value); setMsg(''); }} inputMode="tel" placeholder="07xx xxx xxx" aria-label={'Phone number for ' + name} />
      <button type="button" onClick={save} disabled={busy || !ph.trim() || ph === value}>{busy ? 'Saving…' : 'Save'}</button>
      {msg ? <small role="status" className={msg === 'Saved' ? 'is-ok' : 'is-err'}>{msg}</small> : null}
    </div>
  );
}

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
        <div><small>Team</small><h1>Team & departments</h1><p>Place each person in their department and keep their phone number up to date. Departments decide who gets memos, reports and team targets.</p></div>
        <button type="button" className="tp-go" onClick={T.goTargets}>Set targets</button>
      </header>

      <section className="tp-lead" aria-label="Leadership">
        {T.lead.map(l => (
          <div key={l.role} className="tp-leadc">
            <span className="tp-av" style={{ background: l.c }}>{l.i}</span>
            <div><small>{l.role}</small><b>{l.n}</b><span>{l.t}</span><PhoneEdit value={l.phone} onSave={l.setPhone} name={l.n} dark /></div>
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
              <span className="tp-who"><b>{p.n}</b><small>{p.title}{p.head ? ' · Head of department' : ''}{p.phone ? ' · ' + p.phone : ''}</small></span>
              <span className={'tp-dept' + (p.dept ? '' : ' is-none')}>{p.deptL}</span>
            </button>
            {open === p.k ? (
              <div className="tp-more">
                <div className="tp-pick" role="radiogroup" aria-label={'Move ' + p.n}>
                  {T.depts.map(d => <button key={d.d} type="button" role="radio" aria-checked={p.dept === d.d} className={p.dept === d.d ? 'is-on' : ''} onClick={() => { p.move(d.d); setOpen(''); }}>{d.l}</button>)}
                </div>
                <PhoneEdit value={p.phone} onSave={p.setPhone} name={p.n} />
              </div>
            ) : null}
          </li>
        ))}
        {!list.length ? <li className="tp-empty">No one matches.</li> : null}
      </ul>
    </div>
  );
}
