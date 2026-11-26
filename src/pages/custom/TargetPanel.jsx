import { useState } from 'react';

const digits = v => String(v || '').replace(/\D/g, '');
const fmt = v => (v ? Number(v).toLocaleString('en-US') : '');
const STATUS = { ahead: 'Ahead of pace', close: 'Nearly on pace', behind: 'Behind pace' };

function Money({ label, value, onChange, big }) {
  return (
    <label className={'tg-money' + (big ? ' is-big' : '')}><span>{label}</span>
      <div><em>TZS</em><input inputMode="numeric" value={fmt(value)} onChange={e => onChange(digits(e.target.value))} placeholder="0" aria-label={label} /></div>
    </label>
  );
}

// Management sets the year: company target, each department's share, projects to complete.
function SetTargets({ T, onDone }) {
  const [f, setF] = useState(() => ({ revenue: String(T.setForm.revenue || ''), projects: String(T.setForm.projects || ''), depts: Object.fromEntries(T.deptChoices.map(d => [d.v, String(T.setForm.depts[d.v] || '')])) }));
  const [err, setErr] = useState('');
  const sum = T.deptChoices.reduce((a, d) => a + (+f.depts[d.v] || 0), 0);
  return (
    <section className="tg-sheet" aria-label="Set targets">
      <header><h3>Targets for {T.year}</h3><button type="button" className="tg-x" onClick={onDone} aria-label="Close">✕</button></header>
      <Money big label="Company target for the year" value={f.revenue} onChange={v => setF({ ...f, revenue: v })} />
      <div className="tg-grid2">{T.deptChoices.map(d => <Money key={d.v} label={d.l} value={f.depts[d.v]} onChange={v => setF({ ...f, depts: { ...f.depts, [d.v]: v } })} />)}</div>
      <p className="tg-hint">Departments: {sum ? 'TZS ' + sum.toLocaleString('en-US') : 'not set'}{+f.revenue ? ' of TZS ' + Number(f.revenue).toLocaleString('en-US') : ''}</p>
      <label className="tg-money"><span>Projects to complete this year</span><div><input inputMode="numeric" value={f.projects} onChange={e => setF({ ...f, projects: digits(e.target.value) })} placeholder="0" aria-label="Projects to complete this year" /></div></label>
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
      <div className="tg-foot"><button type="button" className="me-cancel" onClick={onDone}>Cancel</button><button type="button" className="me-save" onClick={() => { const m = T.saveTargets(Object.assign({ year: T.year }, f)); if (m) setErr(m); else onDone(); }}>Save targets</button></div>
    </section>
  );
}

// The GM or Management keys in a week: what came in (by department) and projects completed.
function RecordWeek({ T, onDone }) {
  const [w, setW] = useState(T.weekChoices[0].w);
  const pick = T.weekChoices.find(c => c.w === w), prev = pick && pick.prev;
  const blank = p => ({ amt: p ? String(p.amt) : '', projects: p ? String(p.projects) : '', note: p ? p.note || '' : '', depts: Object.fromEntries(T.deptChoices.map(d => [d.v, p && p.depts && p.depts[d.v] ? String(p.depts[d.v]) : ''])) });
  const [f, setF] = useState(() => blank(prev));
  const [err, setErr] = useState('');
  const sum = T.deptChoices.reduce((a, d) => a + (+f.depts[d.v] || 0), 0);
  return (
    <section className="tg-sheet" aria-label="Record the week">
      <header><h3>Record the week</h3><button type="button" className="tg-x" onClick={onDone} aria-label="Close">✕</button></header>
      <div className="tg-weeks" role="radiogroup" aria-label="Week">{T.weekChoices.map(c => <button key={c.w} type="button" role="radio" aria-checked={w === c.w} className={w === c.w ? 'is-on' : ''} onClick={() => { setW(c.w); setF(blank(c.prev)); setErr(''); }}><b>{c.l}</b><small>{c.sub}{c.prev ? ' · recorded' : ''}</small></button>)}</div>
      <div className="tg-grid2">{T.deptChoices.map(d => <Money key={d.v} label={'Earned · ' + d.l} value={f.depts[d.v]} onChange={v => setF({ ...f, depts: { ...f.depts, [d.v]: v } })} />)}</div>
      <Money big label={'Total earned this week' + (sum ? ' (departments: TZS ' + sum.toLocaleString('en-US') + ')' : '')} value={f.amt || (sum ? String(sum) : '')} onChange={v => setF({ ...f, amt: v })} />
      <div className="tg-row">
        <div className="tg-step"><span>Projects completed</span><div><button type="button" onClick={() => setF({ ...f, projects: String(Math.max(0, (+f.projects || 0) - 1)) })} aria-label="One fewer project">−</button><b aria-label="Projects completed">{+f.projects || 0}</b><button type="button" onClick={() => setF({ ...f, projects: String((+f.projects || 0) + 1) })} aria-label="One more project">+</button></div></div>
        <input className="me-who" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} placeholder="Note (optional): the big wins of the week" aria-label="Week note" />
      </div>
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
      <div className="tg-foot"><button type="button" className="me-cancel" onClick={onDone}>Cancel</button><button type="button" className="me-save" onClick={() => { const m = T.record(w, Object.assign({}, f, { amt: f.amt || String(sum) })); if (m) setErr(m); else onDone(); }}>Save week {w}</button></div>
    </section>
  );
}

// Client Service Manager: each team member's targets for the year.
function SetTeam({ T, onDone }) {
  const [f, setF] = useState(() => Object.fromEntries(T.team.map(r => [r.k, Object.fromEntries(Object.entries(r.form).map(([k, v]) => [k, String(v || '')]))])));
  const [err, setErr] = useState('');
  const sum = T.team.reduce((a, r) => a + (+(f[r.k] || {}).revenue || 0), 0);
  const set = (k, key, v) => setF(x => ({ ...x, [k]: { ...x[k], [key]: v } }));
  return (
    <section className="tg-sheet" aria-label="Set team targets">
      <header><h3>Client Service team targets · {T.year}</h3><button type="button" className="tg-x" onClick={onDone} aria-label="Close">✕</button></header>
      <p className="tg-hint">Revenue: TZS {sum.toLocaleString('en-US')}{T.csTarget ? ' of the Client Service target ' + T.csTarget : ''}</p>
      <div className="tg-team-set">
        {T.team.map(r => (
          <div key={r.k} className="tg-person" data-person={r.k}>
            <div className="tg-who"><span className="tg-face" style={{ background: r.ph ? 'center / cover no-repeat url("' + r.ph + '")' : r.c }}>{r.ph ? '' : r.i}</span><b>{r.n}</b></div>
            <Money label={'Revenue · ' + r.n} value={(f[r.k] || {}).revenue} onChange={v => set(r.k, 'revenue', v)} />
            {[['projects', 'Projects'], ['clients', 'Clients'], ['proposals', 'Proposals']].map(([key, l]) => (
              <label key={key} className="tg-money tg-num"><span>{l}</span><div><input inputMode="numeric" value={(f[r.k] || {})[key] || ''} onChange={e => set(r.k, key, digits(e.target.value))} placeholder="0" aria-label={l + ' · ' + r.n} /></div></label>
            ))}
          </div>
        ))}
      </div>
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
      <div className="tg-foot"><button type="button" className="me-cancel" onClick={onDone}>Cancel</button><button type="button" className="me-save" onClick={() => { const m = T.saveTeam(f); if (m) setErr(m); else onDone(); }}>Save team targets</button></div>
    </section>
  );
}

const Metric = ({ l, m }) => (
  <div className="tg-metric"><small>{l}</small><b>{m.got}{m.target != null ? <span> / {m.target}</span> : null}</b>{m.target != null ? <div className="tg-bar"><i style={{ width: m.pct + '%' }} /></div> : <span className="tg-unset">No target</span>}</div>
);

// The Client Service team: what each person brought in against their targets.
function TeamTargets({ T, open, setOpen }) {
  return (
    <div className="tg-team" aria-label="Client Service team targets">
      <header><h3>Client Service team</h3><span className="tg-hint">Counted from the system: projects they lead, clients they own, proposals they uploaded.</span>{T.canSetTeam ? <button type="button" className="me-save" onClick={() => setOpen(open === 'team' ? '' : 'team')}>Set team targets</button> : null}</header>
      <ul>
        {T.team.map(r => (
          <li key={r.k} data-member={r.k}>
            <div className="tg-who"><span className="tg-face" style={{ background: r.ph ? 'center / cover no-repeat url("' + r.ph + '")' : r.c }}>{r.ph ? '' : r.i}</span><b>{r.n}</b>{r.overall != null ? <span className={'tg-pill is-' + r.status}>{r.overall}%</span> : <span className="tg-unset">Targets not set</span>}</div>
            <Metric l="Revenue brought in" m={r.revenue} /><Metric l="Projects" m={r.projects} /><Metric l="Clients" m={r.clients} /><Metric l="Proposals" m={r.proposals} />
          </li>
        ))}
      </ul>
    </div>
  );
}

// A team member's own targets, on My work.
export function MyTargets({ M }) {
  if (!M) return null;
  return (
    <section className="tg-mine" aria-label="My targets">
      <header><div><small>My targets · {M.year}</small><h3>{M.overall != null ? M.overall + '% speed' : 'Targets'}</h3></div>{M.status ? <span className={'tg-pill is-' + M.status}>{M.status === 'ahead' ? 'Ahead' : M.status === 'close' ? 'Nearly there' : 'Behind'}</span> : null}</header>
      <div className="tg-mine-grid"><Metric l="Revenue brought in" m={M.revenue} /><Metric l="Projects" m={M.projects} /><Metric l="Clients" m={M.clients} /><Metric l="Proposals" m={M.proposals} /></div>
    </section>
  );
}

// The year's target on the overview: where we are, where we should be, and what each week now needs.
export default function TargetPanel({ T }) {
  const [open, setOpen] = useState('');
  if (!T) return null;
  if (T.empty) {
    return (
      <section className="tg tg-empty" aria-label="Company target">
        <div><small>Company target · {T.year}</small><h3>No target set for {T.year} yet</h3><p>Set the year’s earnings target and each department’s share. The system then spreads it over the weeks and carries any shortfall forward.</p></div>
        {T.canSet ? <button type="button" className="me-save" onClick={() => setOpen('set')}>Set the year’s targets</button> : <p className="tg-hint">Management sets the targets.</p>}
        {open === 'set' ? <SetTargets T={T} onDone={() => setOpen('')} /> : null}
      </section>
    );
  }
  const W = T.week;
  return (
    <section className="tg" aria-label="Company target">
      <div className="tg-hero">
        <div className="tg-hero-top">
          <div><small>Company target · {T.year}</small><h2>{T.earned} <span>of {T.target}</span></h2></div>
          <div className={'tg-speed is-' + T.status} aria-label={'Speed ' + T.pace + '% · ' + STATUS[T.status]}><b>{T.pace}%</b><span>speed · {STATUS[T.status]}</span></div>
        </div>
        <div className="tg-track" aria-hidden="true"><i style={{ width: Math.min(100, T.pctEarned) + '%' }} /><em style={{ left: T.pctTime + '%' }} /></div>
        <div className="tg-legend"><span><i className="is-got" />Earned {T.pctEarned}%</span><span><i className="is-time" />Year gone {T.pctTime}%</span><span>{T.ahead ? T.gap + ' ahead of where we should be' : T.gap + ' behind where we should be'}</span></div>
        {T.won && T.won.n ? (
          <div className="tg-won" aria-label="Won projects">
            <b>{T.won.total}</b><span>from {T.won.n} won project{T.won.n === 1 ? '' : 's'}, taken off the goal automatically</span>
            <ul>{T.won.list.map(x => <li key={x.id}><span>{x.name}{x.client ? ' · ' + x.client : ''}</span><em>{x.v}</em></li>)}</ul>
          </div>
        ) : null}
        <div className="tg-clock">
          <div><b>{W.n}</b><span>week of {T.weeks}</span></div>
          <div><b>{T.dayNo}</b><span>day of the year</span></div>
          <div><b>{T.daysLeft}</b><span>days left</span></div>
          <div><b>{T.projection}</b><span>year-end at this speed</span></div>
        </div>
        <div className="tg-acts">
          {T.canRecord ? <button type="button" className="tg-btn is-pri" onClick={() => setOpen(open === 'week' ? '' : 'week')}>Record this week</button> : null}
          {T.canSet ? <button type="button" className="tg-btn" onClick={() => setOpen(open === 'set' ? '' : 'set')}>Edit targets</button> : null}
        </div>
      </div>
      {open === 'week' ? <RecordWeek T={T} onDone={() => setOpen('')} /> : null}
      {open === 'set' ? <SetTargets T={T} onDone={() => setOpen('')} /> : null}

      <div className="tg-cards">
        <div className="tg-card">
          <small>This week · {W.label}</small>
          <b>{W.target}</b>
          <div className="tg-bar"><i style={{ width: W.pct + '%' }} /></div>
          <p>{W.got == null ? 'Not recorded yet' : W.hit ? W.got + ' earned · ' + W.over + ' over' : W.got + ' earned so far'}</p>
          <p className="tg-note">{W.carried ? 'Includes ' + W.carry + ' carried forward from earlier weeks' : W.carry + ' below the base week of ' + W.base + ' thanks to earlier weeks'}</p>
        </div>
        <div className="tg-card">
          <small>{T.month.l} target</small>
          <b>{T.month.target}</b>
          <div className="tg-bar"><i style={{ width: T.month.pct + '%' }} /></div>
          <p>{T.month.got} earned this month</p>
        </div>
        <div className="tg-card">
          <small>Needed from now</small>
          <b>{T.need.perWeek}<span> / week</span></b>
          <p>{T.need.left} left over {T.need.weeksLeft} weeks</p>
        </div>
        <div className="tg-card">
          <small>Projects completed</small>
          <b>{T.projects.done}{T.projects.target ? <span> of {T.projects.target}</span> : null}</b>
          {T.projects.target ? <div className="tg-bar"><i style={{ width: Math.min(100, Math.round(T.projects.done / T.projects.target * 100)) + '%' }} /></div> : null}
          <p>{T.projects.target ? 'Speed ' + T.projects.pace + '% · ' : ''}{T.projects.closed} closed in the system</p>
        </div>
      </div>

      <div className="tg-split">
        <div className="tg-chart" aria-label="Weekly earnings against the week’s target">
          <header><h3>Week by week</h3><span><i className="is-got" />Earned <i className="is-need" />Week target</span></header>
          <div className="tg-bars">
            {T.bars.map(b => (
              <div key={b.w} className={'tg-col' + (b.cur ? ' is-cur' : '')} title={'Week ' + b.w + ': ' + b.gotT + ' of ' + b.needT}>
                <div className="tg-colbox"><i className={'is-got' + (b.got >= b.need ? ' is-hit' : '')} style={{ height: b.gotH + '%' }} /><em style={{ bottom: b.needH + '%' }} /></div>
                <small>W{b.w}</small>
              </div>
            ))}
          </div>
        </div>
        {T.depts.length ? (
          <div className="tg-depts">
            <header><h3>Departments</h3></header>
            <ul>
              {T.depts.map(d => (
                <li key={d.k}>
                  <div className="tg-dl"><b>{d.l}</b><small>{d.earned} of {d.target} · this week {d.week}</small></div>
                  <div className="tg-bar"><i style={{ width: Math.min(100, d.pct) + '%' }} /></div>
                  <span className={'tg-pill is-' + d.status}>{d.pace}%</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      {T.team && T.team.length ? <TeamTargets T={T} open={open} setOpen={setOpen} /> : null}
      {open === 'team' ? <SetTeam T={T} onDone={() => setOpen('')} /> : null}
    </section>
  );
}
