import { useEffect, useState } from 'react';
import RegisterForm from './RegisterForm';
import { getEvent, registerUrl } from './api';
import { conf, themeVars } from './events';
import { drawPass, sharePass } from './pass';
import Icon from './icons';
import './event.css';

// The page attendees reach by scanning the QR code: no account, a short three-step form, then their pass.
export default function RegisterPublic() {
  const [ev, setEv] = useState(null); const [done, setDone] = useState(null); const [err, setErr] = useState(''); const [pass, setPass] = useState('');
  useEffect(() => { document.title = 'Usajili · ' + conf().title; getEvent().then(setEv).catch(e => setErr(e.message)); }, []);
  useEffect(() => { setPass(''); if (done && ev) drawPass(ev, Object.assign({}, done.form, done)).then(setPass).catch(() => setPass('')); }, [done, ev]);
  const share = 'https://wa.me/?text=' + encodeURIComponent('Nimejisajili kuhudhuria ' + (ev ? ev.title : conf().title) + '. Jisajili hapa: ' + registerUrl());
  return (
    <div className="ev-page" style={themeVars()}>
      <div className="ev-orbs" aria-hidden="true"><i /><i /><i /></div>
      <div className="ev-sky" aria-hidden="true" style={{ backgroundImage: `url(${conf().sky})` }} />
      <main className="ev-wrap">
        <header className="ev-brand">
          <img src={conf().logos} alt={conf().logosAlt} />
        </header>
        <section className="ev-hero">
          {conf().hero ? <figure className="ev-heroimg"><img src={conf().hero} alt={conf().title} /></figure> : null}
          <span className="ev-kicker">Usajili wa washiriki · Registration</span>
          <h1 style={conf().keepCase ? { textTransform: 'none' } : undefined}>{ev ? ev.title : conf().title}</h1>
          <p>{ev ? ev.subtitle : ''}</p>
          {ev && ev.tagline ? <span className="ev-tag"><Icon n="bolt" s={16} fill />{ev.tagline}</span> : null}
          {ev && (ev.event_date || ev.venue) ? <div className="ev-when">{ev.event_date ? <span><Icon n="calendar" s={16} />{ev.event_date}{ev.event_time ? ' · ' + ev.event_time : ''}</span> : null}{ev.venue ? <span><Icon n="pin" s={16} />{ev.venue}</span> : null}</div> : null}
          <ul className="ev-perks" aria-label="Jinsi inavyofanya kazi">
            <li><b>1</b>Jaza fomu fupi <small>Fill a short form</small></li>
            <li><b>2</b>Pata pasi yako yenye QR <small>Get your QR pass</small></li>
            <li><b>3</b>Onyesha mezani siku ya kikao <small>Show it at the desk</small></li>
          </ul>
        </section>
        {err ? <div className="ev-card"><p className="ev-err" role="alert">{err}</p></div> : !ev ? <div className="ev-card ev-skel" aria-busy="true"><i /><i /><i /><i /></div> : done ? (
          <section className="ev-card ev-done" aria-label="Usajili umekamilika">
            <div className="ev-confetti" aria-hidden="true">{Array.from({ length: 14 }).map((_, i) => <i key={i} style={{ '--i': i }} />)}</div>
            <div className="ev-tick" aria-hidden="true"><svg viewBox="0 0 52 52"><path d="M14 27l8 8 16-17" /></svg></div>
            <h2>Karibu, {done.full_name.split(' ')[0]}!</h2>
            <p className="ev-sub">{done.existing ? 'Tayari umesajiliwa · Umeingia · You are checked in' : 'Umesajiliwa na umeingia · Registered and checked in'}</p>
            <div className="ev-ticket"><small>Namba yako ya usajili · Your number</small><b>{done.badgeT}</b></div>
            <p className="ev-msg">{ev.message}</p>
            <figure className="ev-pass">
              {pass ? <img src={pass} alt={'Pasi ya ' + done.full_name + ' · namba ' + done.badgeT} /> : <div className="ev-pass-wait">Inaandaa pasi yako…</div>}
              <figcaption>Pasi yako yenye QR · Your QR pass</figcaption>
            </figure>
            <div className="ev-row">
              <button type="button" className="ev-go is-small" disabled={!pass} onClick={() => sharePass(pass, done)}><Icon n="download" s={18} /><span>Hifadhi pasi · Save pass</span></button>
              <a className="ev-ghost" href={share} target="_blank" rel="noreferrer"><Icon n="share" s={16} />Mwalike mwenzako (WhatsApp)</a>
              <button type="button" className="ev-ghost" onClick={() => setDone(null)}><Icon n="plus" s={16} />Sajili mtu mwingine</button>
            </div>
          </section>
        ) : !ev.open ? (
          <section className="ev-card"><h2>Usajili umefungwa</h2><p>Registration is closed. Tafadhali ongea na mezani ya usajili.</p></section>
        ) : (
          <section className="ev-card">
            <h2>Fomu ya Usajili <small>Registration</small></h2>
            <RegisterForm mode="qr" onDone={setDone} />
          </section>
        )}
        <footer className="ev-foot">Imeandaliwa na <b>Trinity Mark Solutions</b></footer>
      </main>
    </div>
  );
}
