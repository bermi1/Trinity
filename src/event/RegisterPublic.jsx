import { useEffect, useState } from 'react';
import RegisterForm from './RegisterForm';
import { getEvent, registerUrl } from './api';
import './event.css';

// The page attendees reach by scanning the QR code: no account, just the form and a welcome.
export default function RegisterPublic() {
  const [ev, setEv] = useState(null); const [done, setDone] = useState(null); const [err, setErr] = useState('');
  useEffect(() => { document.title = 'Usajili · Mpango wa Nishati wa Taifa'; getEvent().then(setEv).catch(e => setErr(e.message)); }, []);
  const share = done ? 'https://wa.me/?text=' + encodeURIComponent('Nimejisajili kuhudhuria ' + (ev ? ev.title : '') + '. Jisajili hapa: ' + registerUrl()) : '';
  return (
    <div className="ev-page">
      <div className="ev-sky" aria-hidden="true" />
      <main className="ev-wrap">
        <header className="ev-brand">
          <img src="/event/logos.png" alt="Serikali ya Tanzania · TANESCO · CRDB Bank Foundation · iMbeju Nuru" />
        </header>
        <section className="ev-hero">
          <h1>{ev ? ev.title : 'Mpango wa Nishati wa Taifa'}</h1>
          <p>{ev ? ev.subtitle : ''}</p>
          {ev && ev.tagline ? <span className="ev-tag">{ev.tagline}</span> : null}
          {ev && (ev.event_date || ev.venue) ? <div className="ev-when">{ev.event_date ? <span>📅 {ev.event_date}{ev.event_time ? ' · ' + ev.event_time : ''}</span> : null}{ev.venue ? <span>📍 {ev.venue}</span> : null}</div> : null}
        </section>
        {err ? <div className="ev-card"><p className="ev-err" role="alert">{err}</p></div> : !ev ? <div className="ev-card"><p>Inapakia…</p></div> : done ? (
          <section className="ev-card ev-done" aria-label="Usajili umekamilika">
            <div className="ev-tick" aria-hidden="true">✓</div>
            <h2>Karibu, {done.full_name.split(' ')[0]}!</h2>
            <p className="ev-sub">{done.existing ? 'Tayari umesajiliwa · You are already registered' : 'Usajili umekamilika · You are registered'}</p>
            <div className="ev-ticket"><small>Namba yako ya usajili · Your number</small><b>{done.badgeT}</b></div>
            <p className="ev-msg">{ev.message}</p>
            {ev.event_date || ev.venue ? <p className="ev-msg"><b>{[ev.event_date, ev.event_time, ev.venue].filter(Boolean).join(' · ')}</b></p> : null}
            <p className="ev-fine">Piga picha ya skrini hii na uionyeshe mezani · Take a screenshot and show it at the desk.</p>
            <div className="ev-row"><a className="ev-ghost" href={share} target="_blank" rel="noreferrer">Mwalike mwenzako (WhatsApp)</a><button type="button" className="ev-ghost" onClick={() => setDone(null)}>Sajili mtu mwingine</button></div>
          </section>
        ) : !ev.open ? (
          <section className="ev-card"><h2>Usajili umefungwa</h2><p>Registration is closed. Tafadhali ongea na mezani ya usajili.</p></section>
        ) : (
          <section className="ev-card">
            <h2>Fomu ya Usajili <small>Registration</small></h2>
            <RegisterForm mode="qr" onDone={setDone} />
          </section>
        )}
        <footer className="ev-foot">Imeandaliwa na Trinity Mark Solutions</footer>
      </main>
    </div>
  );
}
