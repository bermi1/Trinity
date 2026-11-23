import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import RegisterForm from './RegisterForm';
import { getEvent, saveEvent, listRegs, checkIn, badge, registerUrl, CATEGORIES } from './api';
import { printList, printPoster } from './print';
import Icon from './icons';
import './event.css';

// The registration desk (inside the office system): register walk-ins, see everyone who registered
// by QR or at the desk, check people in, print the list and the QR poster.
export default function EventDesk() {
  const [ev, setEv] = useState(null), [regs, setRegs] = useState([]), [tab, setTab] = useState('walkin');
  const [q, setQ] = useState(''), [cat, setCat] = useState(''), [mode, setMode] = useState(''), [last, setLast] = useState(null), [err, setErr] = useState(''), [qr, setQr] = useState('');
  const load = async () => { try { const [e, r] = await Promise.all([getEvent(), listRegs()]); setEv(e); setRegs(r); setErr(''); } catch (x) { setErr(x.message); } };
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);
  useEffect(() => { QRCode.toDataURL(registerUrl(), { width: 1000, margin: 1, color: { dark: '#0B3D1F', light: '#FFFFFF' } }).then(setQr); }, []);
  // A scanned pass reads "NISHATI-2026 · 001 · Name": search by its number.
  const pq = (q.match(/NISHATI-2026\s*·\s*(\d{3})/i) || [])[1];
  const list = useMemo(() => regs.filter(r => (!cat || r.category === cat) && (!mode || (mode === 'in' ? r.checked_in : r.mode === mode)) && (!q || (pq ? badge(r.badge_no) === pq : (r.full_name + ' ' + r.phone + ' ' + r.organization + ' ' + badge(r.badge_no)).toLowerCase().includes(q.toLowerCase())))), [regs, q, pq, cat, mode]);
  if (!ev) return <div className="evd"><p className="k-sub">{err || 'Inapakia…'}</p></div>;
  const n = { all: regs.length, qr: regs.filter(r => r.mode === 'qr').length, walk: regs.filter(r => r.mode === 'walkin').length, inn: regs.filter(r => r.checked_in).length };
  const invite = 'Habari! Unakaribishwa kuhudhuria ' + ev.title + ' · ' + ev.subtitle + (ev.event_date ? '\nTarehe: ' + ev.event_date + (ev.event_time ? ' · ' + ev.event_time : '') : '') + (ev.venue ? '\nMahali: ' + ev.venue : '') + '\nJisajili hapa: ' + registerUrl();
  const toggle = async r => { const m = await checkIn(r.id, !r.checked_in); if (m) setErr(m); else load(); };
  return (
    <div className="evd">
      <header className="evd-top">
        <img src="/event/logos.png" alt="" />
        <div><small>Usajili wa tukio · Event registration</small><h1>{ev.title}</h1><p>{ev.subtitle}</p></div>
      </header>
      <section className="evd-kpis" aria-label="Takwimu">
        <div><b>{n.all}</b><span>Waliosajiliwa · Registered</span></div>
        <div><b>{n.qr}</b><span>Kwa QR · Self-registered</span></div>
        <div><b>{n.walk}</b><span>Walk-in</span></div>
        <div className="is-in"><b>{n.inn}</b><span>Wamefika · Checked in</span></div>
      </section>
      {err ? <div className="ev-err" role="alert">{err}</div> : null}
      <div className="rc-smart" role="tablist">{[['walkin', 'Walk-in'], ['list', 'Washiriki · ' + n.all], ['qr', 'QR & mwaliko'], ['set', 'Taarifa za tukio']].map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'is-on' : ''} onClick={() => setTab(k)}><span>{l}</span></button>)}</div>

      {tab === 'walkin' ? (
        <section className="evd-card">
          {last ? <div className="evd-last" role="status"><b>{badge(last.badge_no)}</b><span>{last.existing ? 'Tayari amesajiliwa · Already registered' : 'Amesajiliwa na amefika · Registered and checked in'}: <b>{last.full_name}</b></span></div> : null}
          <RegisterForm mode="walkin" compact onDone={r => { setLast(r); load(); }} />
        </section>
      ) : null}

      {tab === 'list' ? (
        <section className="evd-card">
          <div className="evd-tools">
            <input className="ff-search" value={q} onChange={e => setQ(e.target.value)} placeholder="Tafuta jina, simu, namba, au scan pasi" aria-label="Search attendees" />
            <button type="button" className="me-save" onClick={() => setErr(printList(ev, list, [cat, mode === 'qr' ? 'QR' : mode === 'walkin' ? 'Walk-in' : mode === 'in' ? 'Wamefika' : ''].filter(Boolean).join(' · ')))}>Chapisha PDF · Print list</button>
          </div>
          <div className="ev-chips" role="group" aria-label="Filter">{[['', 'Wote'], ['qr', 'QR'], ['walkin', 'Walk-in'], ['in', 'Wamefika']].map(([k, l]) => <button key={k || 'all'} type="button" className={mode === k ? 'is-on' : ''} onClick={() => setMode(k)}>{l}</button>)}<span className="evd-sep" />{CATEGORIES.map(c => <button key={c} type="button" className={cat === c ? 'is-on' : ''} onClick={() => setCat(cat === c ? '' : c)}>{c}</button>)}</div>
          {list.length ? (
            <ul className="evd-list">
              {list.map(r => (
                <li key={r.id} data-reg={badge(r.badge_no)}>
                  <span className="evd-no">{badge(r.badge_no)}</span>
                  <span className="evd-who"><b>{r.full_name}</b><small>{[r.phone, r.organization, r.position].filter(Boolean).join(' · ')}</small><small>{[r.category, [r.region, r.district].filter(Boolean).join(', '), r.mode === 'qr' ? 'QR' : 'Walk-in'].filter(Boolean).join(' · ')}</small></span>
                  <button type="button" className={'evd-in' + (r.checked_in ? ' is-on' : '')} aria-pressed={r.checked_in} onClick={() => toggle(r)} aria-label={(r.checked_in ? 'Undo check-in · ' : 'Check in · ') + r.full_name}>{r.checked_in ? <><Icon n="check" s={15} />Amefika</> : 'Check in'}</button>
                </li>
              ))}
            </ul>
          ) : <p className="k-sub">Hakuna mshiriki bado.</p>}
        </section>
      ) : null}

      {tab === 'qr' ? (
        <section className="evd-card evd-qr">
          <div className="evd-qrbox">{qr ? <img src={qr} alt="QR code ya usajili" /> : null}<code>{registerUrl()}</code></div>
          <div className="evd-qrside">
            <h3>Usajili kwa QR</h3>
            <p>Washiriki wanascan QR hii kwa simu, wanajaza fomu fupi, na wanapata namba yao ya usajili pamoja na ujumbe wa kuwakaribisha.</p>
            <div className="ev-row"><button type="button" className="me-save" onClick={() => setErr(printPoster(ev, qr, 'a3'))}>Bango la QR · A3 (PDF)</button><button type="button" className="me-cancel" onClick={() => setErr(printPoster(ev, qr, 'screen'))}>Bango la skrini kubwa · 16:9</button><a className="me-cancel" href={registerUrl()} target="_blank" rel="noreferrer">Fungua ukurasa</a></div>
            <h3>Ujumbe wa mwaliko · Invitation message</h3>
            <textarea readOnly value={invite} rows={6} aria-label="Invitation message" />
            <div className="ev-row"><a className="me-save" href={'https://wa.me/?text=' + encodeURIComponent(invite)} target="_blank" rel="noreferrer">Tuma kwa WhatsApp</a><button type="button" className="me-cancel" onClick={() => { try { navigator.clipboard.writeText(invite); } catch (e) { /* not allowed */ } }}>Nakili · Copy</button></div>
          </div>
        </section>
      ) : null}

      {tab === 'set' ? <EventSettings ev={ev} onSaved={load} /> : null}
    </div>
  );
}

function EventSettings({ ev, onSaved }) {
  const [f, setF] = useState({ event_date: ev.event_date || '', event_time: ev.event_time || '', venue: ev.venue || '', message: ev.message || '', open: ev.open });
  const [msg, setMsg] = useState('');
  const set = (k, v) => { setMsg(''); setF(x => Object.assign({}, x, { [k]: v })); };
  return (
    <section className="evd-card ev-form" aria-label="Taarifa za tukio">
      <div className="ev-grid">
        <label className="ev-field"><span>Tarehe<small>Date</small></span><input value={f.event_date} onChange={e => set('event_date', e.target.value)} placeholder="mf. Alhamisi, 27 Novemba 2026" aria-label="Event date" /></label>
        <label className="ev-field"><span>Muda<small>Time</small></span><input value={f.event_time} onChange={e => set('event_time', e.target.value)} placeholder="mf. Saa 2:00 asubuhi" aria-label="Event time" /></label>
        <label className="ev-field"><span>Mahali<small>Venue</small></span><input value={f.venue} onChange={e => set('venue', e.target.value)} placeholder="mf. Ukumbi wa Jakaya Kikwete, Dodoma" aria-label="Venue" /></label>
        <div className="ev-field"><span>Usajili kwa QR<small>Self-registration</small></span><div className="ev-chips" role="radiogroup" aria-label="Registration open"><button type="button" role="radio" aria-checked={f.open} className={f.open ? 'is-on' : ''} onClick={() => set('open', true)}>Wazi · Open</button><button type="button" role="radio" aria-checked={!f.open} className={!f.open ? 'is-on' : ''} onClick={() => set('open', false)}>Imefungwa · Closed</button></div></div>
      </div>
      <label className="ev-field"><span>Ujumbe baada ya kujisajili<small>Message attendees see after registering</small></span><textarea rows={3} value={f.message} onChange={e => set('message', e.target.value)} aria-label="Welcome message" /></label>
      {msg ? <div className={msg === 'Imehifadhiwa · Saved' ? 'evd-ok' : 'ev-err'} role="status">{msg}</div> : null}
      <button type="button" className="ev-go" onClick={async () => { const m = await saveEvent(f); setMsg(m || 'Imehifadhiwa · Saved'); if (!m) onSaved(); }}>Hifadhi · Save</button>
    </section>
  );
}
