import { useEffect, useRef, useState } from 'react';
import { readFace, bestMatch } from '../../logic/face';

const minsSince = t => { if (!t) return 0; const [h, m] = t.split(':').map(Number), d = new Date(); return d.getHours() * 60 + d.getMinutes() - (h * 60 + m); };

// Staff check-in / check-out on the reception screen, and today's attendance for the GM.
export default function AttendancePage({ v }) {
  const A = v.ATT;
  const [q, setQ] = useState(''), [msg, setMsg] = useState(null), [cam, setCam] = useState(false), [camErr, setCamErr] = useState(''), [now, setNow] = useState(new Date());
  const video = useRef(null), stream = useRef(null);
  const [faceOn, setFaceOn] = useState(true), [seen, setSeen] = useState(''), [faceErr, setFaceErr] = useState('');
  const [reg, setReg] = useState(false), [capMsg, setCapMsg] = useState('');
  const busy = useRef(false), streak = useRef({ k: '', n: 0 }), cool = useRef({}), live = useRef(null);
  live.current = { A, reg };
  // Face check-in: every ~0.9 s, read the face in front of the camera; two matching frames in a row = recognised.
  useEffect(() => {
    if (!cam || !faceOn) return undefined;
    const t = setInterval(async () => {
      const L = live.current; if (busy.current || !L.A || L.reg || !(L.A.faces || []).length) return;
      const el = video.current; if (!el || !el.videoWidth) return;
      busy.current = true;
      try {
        const f = await readFace(el); setFaceErr('');
        if (!f) { setSeen(''); streak.current = { k: '', n: 0 }; return; }
        const m = bestMatch(f.d, L.A.faces);
        if (!m) { setSeen('Face not recognised · tap your name below'); streak.current = { k: '', n: 0 }; return; }
        streak.current = streak.current.k === m.k ? { k: m.k, n: streak.current.n + 1 } : { k: m.k, n: 1 };
        const p = L.A.people.find(x => x.k === m.k); setSeen('Hold still, ' + (p ? p.first : '') + '…');
        if (streak.current.n < 2 || (cool.current[m.k] && Date.now() - cool.current[m.k] < 60000)) return;
        cool.current[m.k] = Date.now(); streak.current = { k: '', n: 0 };
        const st = L.A.statusOf(m.k);
        if (st === 'in' && minsSince(L.A.sinceOf(m.k)) < 30) { setMsg({ error: (p ? p.first : '') + ', you are already checked in (since ' + L.A.sinceOf(m.k) + ')' }); return; }
        const r = L.A.clock(m.k, snap()); setMsg(Object.assign({ face: true }, r)); setSeen('');
        setTimeout(() => setMsg(null), 6000);
      } catch (e) { setFaceErr('Face check-in could not start · ' + (e.message || e)); } finally { busy.current = false; }
    }, 900);
    return () => clearInterval(t);
  }, [cam, faceOn]);
  // Register a face: three good frames, a moment apart, saved as numbers only.
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 15000); return () => { clearInterval(t); stopCam(); }; }, []);
  if (!A) return null;
  async function startCam() {
    setCamErr('');
    try { stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false }); setCam(true); }
    catch (e) { setCamErr('Camera not available · ' + (e.message || 'permission denied')); }
  }
  function stopCam() { if (stream.current) stream.current.getTracks().forEach(t => t.stop()); stream.current = null; setCam(false); }
  // A small photo (240 px wide) taken at the moment of check-in or check-out.
  function snap() {
    const el = video.current; if (!cam || !el || !el.videoWidth) return '';
    const c = document.createElement('canvas'), w = 240, h = Math.round(el.videoHeight / el.videoWidth * w); c.width = w; c.height = h;
    c.getContext('2d').drawImage(el, 0, 0, w, h); return c.toDataURL('image/jpeg', 0.7);
  }
  const list = A.people.filter(p => !q || p.n.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="att">
      {A.kiosk ? (
        <section className="att-kiosk" aria-label="Staff check-in">
          <header className="att-head">
            <div><small>Mahudhurio · Staff check-in</small><h1>{now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</h1><p>{now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
            <div className="att-counts"><span><b>{A.counts.in}</b>In</span><span><b>{A.counts.left}</b>Left</span><span><b>{A.counts.out}</b>Not in</span></div>
          </header>
          <div className="att-cam">
            {cam ? <video ref={el => { video.current = el; if (el && stream.current && el.srcObject !== stream.current) { el.srcObject = stream.current; el.play().catch(() => {}); } }} muted playsInline autoPlay aria-label="Reception camera" /> : <button type="button" className="att-cambtn" onClick={startCam}>Turn on the camera (photo at each check-in)</button>}
            {cam ? <button type="button" className="att-camoff" onClick={stopCam}>Camera off</button> : null}
            {cam && A.faces.length ? <button type="button" className={'att-camoff' + (faceOn ? ' is-on' : '')} aria-pressed={faceOn} onClick={() => setFaceOn(!faceOn)}>{faceOn ? 'Face check-in: on' : 'Face check-in: off'}</button> : null}
            {cam && faceOn && A.faces.length ? <small className="att-seen" role="status">{faceErr || seen || 'Looking for a face… stand in front of the camera'}</small> : null}
            {camErr ? <small className="att-err">{camErr}</small> : null}
          </div>
          {msg ? <div className={'att-msg' + (msg.error ? ' is-err' : msg.kind === 'out' ? ' is-out' : '')} role="status">{msg.error ? msg.error : msg.kind === 'in' ? <><b>Karibu, {msg.name.split(' ')[0]}!</b> {msg.face ? 'Recognised · ' : ''}Checked in at {msg.time}{msg.late ? ' · late' : ''}</> : <><b>Kwaheri, {msg.name.split(' ')[0]}!</b> {msg.face ? 'Recognised · ' : ''}Checked out at {msg.time} · in since {msg.since}</>}</div> : null}
          <p className="att-regnote">Check in by looking at the camera; nobody can check in for someone else. No face registered yet? Register it on your own phone: <b>More → My check-in</b>.</p>
          {A.canFaces ? (
            <details className="att-reg" open={reg} onToggle={e => setReg(e.target.open)}>
              <summary>Registered faces · {A.faces.length} of {A.people.length}</summary>
              <p className="att-regnote">Each person registers their own face on their own account. If someone’s face no longer matches, remove it here and they register again on My check-in.</p>
              <div className="att-regpick" aria-label="Registered faces">{A.people.map(p => { const has = A.faces.some(f => f.k === p.k); return has ? <button key={p.k} type="button" className="has-face" onClick={() => { A.removeFace(p.k); setCapMsg('Face removed · ' + p.first + ' registers again on My check-in'); }} aria-label={'Remove face of ' + p.n}>✓ {p.n} · remove</button> : <span key={p.k} className="att-noface">{p.n}</span>; })}</div>
              {capMsg ? <p className="att-capmsg" role="status">{capMsg}</p> : null}
            </details>
          ) : null}
          <input className="att-search" value={q} onChange={e => setQ(e.target.value)} placeholder="Type your name · Andika jina lako" aria-label="Find your name" />
          <ul className="att-grid">
            {list.map(p => (
              <li key={p.k}><div className={'att-tile is-' + p.st} aria-label={p.n + ' · ' + (p.st === 'in' ? 'in' : p.st === 'left' ? 'left' : 'not in yet')}>
                <span className="att-av" style={{ background: p.c }}>{p.i}</span><b>{p.n}</b>
                <small>{p.st === 'in' ? 'In since ' + p.in : p.st === 'left' ? 'Left at ' + p.out : 'Not in yet'}</small>
              </div></li>
            ))}
          </ul>
        </section>
      ) : null}

      {A.see ? (
        <section className="att-today" aria-label="Attendance today">
          <h2>Today · {A.counts.in + A.counts.left} came in{A.counts.late ? ' · ' + A.counts.late + ' late (after ' + A.lateAfter + ')' : ''}</h2>
          <div className="att-feed">
            {A.feed.length ? A.feed.map((e, i) => (
              <div key={i} className={'att-ev is-' + e.kind}>
                {e.photo ? <img src={e.photo} alt={'Photo of ' + e.n} /> : <span className="att-nophoto">No photo</span>}
                <div><b>{e.n}</b><small>{e.kind === 'in' ? 'In' : 'Out'} · {e.t}{e.late ? ' · late' : ''}</small></div>
              </div>
            )) : <p className="att-empty">No one has checked in yet today.</p>}
          </div>
          <table className="att-table"><thead><tr><th>Name</th><th>In</th><th>Out</th><th>Time in office</th></tr></thead>
            <tbody>{A.people.map(p => <tr key={p.k} className={p.st === 'out' ? 'is-absent' : ''}><td>{p.n}</td><td>{p.in ? p.in + (p.late ? ' (late)' : '') : '—'}</td><td>{p.out || (p.st === 'in' ? 'In now' : '—')}</td><td>{p.hours || '—'}</td></tr>)}</tbody></table>
        </section>
      ) : null}
    </div>
  );
}
