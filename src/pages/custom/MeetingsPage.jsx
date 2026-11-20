import { useState } from 'react';
import { PageHead, Btn, Empty, faceStyle, faceText } from '../../ui/kit';

const TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

function NewMeeting({ M, onDone }) {
  const [f, setF] = useState({ kind: 'internal', title: '', date: M.dates[0].v, time: '10:00', place: 'Boardroom', all: false, depts: [], people: [], guest: '', co: '', phone: '' });
  const [err, setErr] = useState('');
  const set = (k, v) => setF(x => Object.assign({}, x, { [k]: v }));
  const tog = (k, v) => setF(x => Object.assign({}, x, { [k]: x[k].includes(v) ? x[k].filter(y => y !== v) : [...x[k], v] }));
  return (
    <section className="fh-card mt-new">
      <div className="ff-chips">{[['internal', 'Team meeting'], ['client', 'Client meeting']].map(([k, l]) => <button key={k} type="button" className={f.kind === k ? 'is-on' : ''} onClick={() => set('kind', k)}>{l}</button>)}</div>
      <label className="ff"><span className="ff-l">Title</span><input value={f.title} onChange={e => set('title', e.target.value)} placeholder={f.kind === 'client' ? 'e.g. Contract review with CRDB' : 'e.g. Weekly project review'} /></label>
      <div className="ff"><span className="ff-l">Day</span><div className="ff-chips">{M.dates.map(d => <button key={d.v} type="button" className={f.date === d.v ? 'is-on' : ''} onClick={() => set('date', d.v)}>{d.l}</button>)}</div></div>
      <div className="ff"><span className="ff-l">Time</span><div className="ff-chips">{TIMES.map(t => <button key={t} type="button" className={f.time === t ? 'is-on' : ''} onClick={() => set('time', t)}>{t}</button>)}</div></div>
      <div className="ff"><span className="ff-l">Where</span><div className="ff-chips">{['Boardroom', 'Main hall', 'Client office', 'Online'].map(p => <button key={p} type="button" className={f.place === p ? 'is-on' : ''} onClick={() => set('place', p)}>{p}</button>)}</div></div>
      {f.kind === 'client' ? (
        <div className="mt-guest">
          <label className="ff"><span className="ff-l">Guest name</span><input value={f.guest} onChange={e => set('guest', e.target.value)} placeholder="Who is coming?" /></label>
          <label className="ff"><span className="ff-l">From (company)</span><input value={f.co} onChange={e => set('co', e.target.value)} /></label>
          <label className="ff"><span className="ff-l">Phone</span><input inputMode="tel" value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="+255" /></label>
          <p className="k-sub">Reception is asked to welcome the guest at this time.</p>
        </div>
      ) : null}
      <div className="ff"><span className="ff-l">Invite</span>
        <div className="ff-chips">
          <button type="button" className={f.all ? 'is-on' : ''} onClick={() => set('all', !f.all)}>Everyone</button>
          {!f.all ? M.offices.map(o => <button key={o.v} type="button" className={f.depts.includes(o.v) ? 'is-on' : ''} onClick={() => tog('depts', o.v)}>{o.l}</button>) : null}
        </div>
      </div>
      {!f.all ? (
        <div className="ff"><span className="ff-l">And people</span>
          <div className="ff-people">{M.people.map(p => <button key={p.v} type="button" aria-label={p.l} className={f.people.includes(p.v) ? 'is-on' : ''} onClick={() => tog('people', p.v)}><span className="ff-face" style={faceStyle(p)}>{faceText(p)}</span><span className="ff-name">{p.l.split(' ')[0]}</span></button>)}</div>
        </div>
      ) : null}
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
      <div className="fh-row"><Btn kind="dark" onClick={() => { const e = M.create(f); if (e) setErr(e); else onDone(); }}>Send invitation</Btn><Btn kind="ghost" onClick={onDone}>Cancel</Btn></div>
    </section>
  );
}

function AddEvent({ M, onDone }) {
  const [f, setF] = useState({ title: '', date: M.dates[0].v, time: '', kind: 'Staff meeting' });
  const [err, setErr] = useState('');
  const set = (k, v) => setF(x => Object.assign({}, x, { [k]: v }));
  return (
    <section className="fh-card mt-new">
      <label className="ff"><span className="ff-l">What</span><input value={f.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Staff meeting · Q4 results presentation" /></label>
      <div className="ff"><span className="ff-l">Type</span><div className="ff-chips">{M.kinds.map(k => <button key={k} type="button" className={f.kind === k ? 'is-on' : ''} onClick={() => set('kind', k)}>{k}</button>)}</div></div>
      <div className="fh-two">
        <label className="ff"><span className="ff-l">Day</span><input type="date" value={f.date} onChange={e => set('date', e.target.value)} /></label>
        <label className="ff"><span className="ff-l">Time (optional)</span><input type="time" value={f.time} onChange={e => set('time', e.target.value)} /></label>
      </div>
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
      <div className="fh-row"><Btn kind="dark" onClick={() => { const e = M.addCal(f); if (e) setErr(e); else onDone(); }}>Add to calendar</Btn><Btn kind="ghost" onClick={onDone}>Cancel</Btn></div>
    </section>
  );
}

function AddVisitor({ M, onDone }) {
  const [f, setF] = useState({ name: '', co: '', phone: '', purpose: '', date: M.dates[0].v, time: '10:00' });
  const [err, setErr] = useState('');
  const set = (k, v) => setF(x => Object.assign({}, x, { [k]: v }));
  return (
    <section className="fh-card mt-new" aria-label="Expected visitor">
      <p className="k-sub">The front desk is told, so your visitor is welcomed and you are called when they arrive.</p>
      <div className="fh-two">
        <label className="ff"><span className="ff-l">Visitor name</span><input value={f.name} onChange={e => set('name', e.target.value)} placeholder="Who is coming?" /></label>
        <label className="ff"><span className="ff-l">From (company)</span><input value={f.co} onChange={e => set('co', e.target.value)} /></label>
        <label className="ff"><span className="ff-l">Phone</span><input inputMode="tel" value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="+255" /></label>
        <label className="ff"><span className="ff-l">Reason</span><input value={f.purpose} onChange={e => set('purpose', e.target.value)} placeholder="e.g. Contract signing" /></label>
        <label className="ff"><span className="ff-l">Day</span><input type="date" value={f.date} onChange={e => set('date', e.target.value)} /></label>
        <label className="ff"><span className="ff-l">Time</span><input type="time" value={f.time} onChange={e => set('time', e.target.value)} /></label>
      </div>
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
      <div className="fh-row"><Btn kind="dark" onClick={() => { const e = M.addAppt(f); if (e) setErr(e); else onDone(); }}>Tell the front desk</Btn><Btn kind="ghost" onClick={onDone}>Cancel</Btn></div>
    </section>
  );
}

// Calendar: meetings, company events and project deadlines, in one list everyone sees. Invitations reach everyone invited; client meetings also go to Reception.
export default function MeetingsPage({ v }) {
  const M = v.MT;
  const [adding, setAdding] = useState('');
  return (
    <>
      <PageHead kicker="Office" title="Calendar" sub="Meetings, company events and project deadlines. Client meetings tell Reception who to welcome.">
        {!adding ? <>{M.can ? <><Btn kind="dark" onClick={() => setAdding('meet')}>New meeting</Btn><Btn kind="ghost" onClick={() => setAdding('event')}>Add event</Btn></> : null}<Btn kind="ghost" onClick={() => setAdding('visit')}>I’m expecting a visitor</Btn></> : null}
      </PageHead>
      {adding === 'meet' ? <NewMeeting M={M} onDone={() => setAdding('')} /> : null}
      {adding === 'event' ? <AddEvent M={M} onDone={() => setAdding('')} /> : null}
      {adding === 'visit' ? <AddVisitor M={M} onDone={() => setAdding('')} /> : null}
      {M.days.length ? M.days.map(d => (
        <section key={d.k} className="fh-card">
          <h3>{d.l}</h3>
          <ul className="mt-list">
            {d.items.map(m => (
              <li key={m.id} className={'is-' + m.kind} onClick={m.go} style={m.go ? { cursor: 'pointer' } : undefined}>
                <time>{m.time}</time>
                <span><b>{m.title}</b><small>{m.place} · {m.who}{m.guest ? ' · Guest: ' + m.guest : ''}{m.by ? ' · by ' + m.by : ''}</small></span>
                {m.canCancel ? <button type="button" className="td-start" onClick={m.cancel}>Cancel</button> : null}
              </li>
            ))}
          </ul>
        </section>
      )) : <Empty>Nothing on the calendar yet.</Empty>}
    </>
  );
}
