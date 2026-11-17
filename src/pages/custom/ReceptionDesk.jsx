import { useState } from 'react';
import { Btn, Empty } from '../../ui/kit';

const PURPOSE = ['Meeting', 'Delivery', 'Interview', 'Enquiry', 'Collection', 'Other'];
const BLANK = { name: '', co: '', phone: '', dept: '', host: '', purpose: 'Meeting' };

// Reception desk on the front-office touch screen: guests sign in here instead of the book.
export default function ReceptionDesk({ v }) {
  const R = v.RD;
  const [f, setF] = useState(BLANK);
  const [err, setErr] = useState('');
  const [done, setDone] = useState('');
  const set = (k, val) => setF(x => Object.assign({}, x, { [k]: val }));
  const office = R.offices.find(o => o.v === f.dept);
  const go = () => { const e = R.checkIn(f); if (e) { setErr(e); return; } setErr(''); setDone(f.name.split(' ')[0]); setF(BLANK); setTimeout(() => setDone(''), 4000); };
  return (
    <div className="rd">
      <header className="hd-top"><div><h1>Reception</h1><p>{R.today}</p></div>
        <div className="rd-stats"><span><b>{R.inside.length}</b>In the building</span><span><b>{R.expected.length}</b>Expected</span><span><b>{R.left.length}</b>Left today</span></div>
      </header>
      <div className="rd-grid">
        <section className="fh-card rd-form">
          <h3>Guest check-in</h3>
          {done ? <div className="rd-welcome">Welcome, {done}! Your host has been told you are here.</div> : null}
          <label className="ff"><span className="ff-l">Full name</span><input value={f.name} onChange={e => set('name', e.target.value)} placeholder="Guest’s name" autoComplete="off" /></label>
          <div className="fh-two">
            <label className="ff"><span className="ff-l">Coming from</span><input value={f.co} onChange={e => set('co', e.target.value)} placeholder="Company or ‘Private’" /></label>
            <label className="ff"><span className="ff-l">Phone number</span><input inputMode="tel" value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="+255 7xx xxx xxx" /></label>
          </div>
          <div className="ff"><span className="ff-l">Visiting</span><div className="rd-tiles">{R.offices.map(o => <button key={o.v} type="button" className={f.dept === o.v ? 'is-on' : ''} onClick={() => setF(x => Object.assign({}, x, { dept: o.v, host: '' }))}>{o.l}</button>)}</div></div>
          {office ? (
            <div className="ff"><span className="ff-l">Person (optional)</span>
              <div className="ff-people">{office.people.map(p => <button key={p.v} type="button" aria-label={p.l} className={f.host === p.v ? 'is-on' : ''} onClick={() => set('host', f.host === p.v ? '' : p.v)}><span className="ff-face" style={{ background: p.c }}>{p.i}</span><span className="ff-name">{p.l.split(' ')[0]}</span></button>)}</div>
            </div>
          ) : null}
          <div className="ff"><span className="ff-l">Reason</span><div className="ff-chips">{PURPOSE.map(p => <button key={p} type="button" className={f.purpose === p ? 'is-on' : ''} onClick={() => set('purpose', p)}>{p}</button>)}</div></div>
          {err ? <div className="fm-err" role="alert">{err}</div> : null}
          <button type="button" className="rd-go" onClick={go}>Check in</button>
        </section>

        <div className="rd-side">
          <section className="fh-card">
            <h3>Expected today</h3>
            {R.expected.length ? <ul className="rd-list">{R.expected.map(g => <li key={g.id}><time>{g.time}</time><span><b>{g.name}</b><small>{[g.co, g.purpose, 'host ' + g.host].filter(Boolean).join(' · ')}</small></span><Btn kind="dark" onClick={g.arrive}>Arrived</Btn></li>)}</ul> : <Empty>No appointments today.</Empty>}
          </section>
          <section className="fh-card">
            <h3>In the building</h3>
            {R.inside.length ? <ul className="rd-list">{R.inside.map(g => <li key={g.id}><time>{g.time}</time><span><b>{g.name}</b><small>{[g.co, g.purpose, 'with ' + g.host, g.phone].filter(Boolean).join(' · ')}</small></span><Btn kind="ghost" onClick={g.leave}>Check out</Btn></li>)}</ul> : <Empty>No guests inside.</Empty>}
          </section>
          {R.left.length ? (
            <section className="fh-card">
              <h3>Left today</h3>
              <ul className="rd-list">{R.left.map(g => <li key={g.id}><time>{g.time}</time><span><b>{g.name}</b><small>{[g.co, 'left ' + g.out].filter(Boolean).join(' · ')}</small></span></li>)}</ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
