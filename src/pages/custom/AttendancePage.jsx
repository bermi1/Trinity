import { useEffect, useRef, useState } from 'react';
import { readFace, bestMatch, pack } from '../../logic/face';

const minsSince = t => { if (!t) return 0; const [h, m] = t.split(':').map(Number), d = new Date(); return d.getHours() * 60 + d.getMinutes() - (h * 60 + m); };

// Staff check-in / check-out on the reception screen, and today's attendance for the GM.
export default function AttendancePage({ v }) {
  const A = v.ATT;
  const [q, setQ] = useState(''), [pick, setPick] = useState(null), [msg, setMsg] = useState(null), [cam, setCam] = useState(false), [camErr, setCamErr] = useState(''), [now, setNow] = useState(new Date());
  const video = useRef(null), stream = useRef(null);
  const [faceOn, setFaceOn] = useState(true), [seen, setSeen] = useState(''), [faceErr, setFaceErr] = useState('');
  const [reg, setReg] = useState(false), [who, setWho] = useState(''), [consent, setConsent] = useState(false), [capMsg, setCapMsg] = useState(''), [capBusy, setCapBusy] = useState(false);
  const busy = useRef(false), streak = useRef({ k: '', n: 0 }), cool = useRef({}), live = useRef(null);
  live.current = { A, pick, capBusy, reg };
  // Face check-in: every ~0.9 s, read the face in front of the camera; two matching frames in a row = recognised.
  useEffect(() => {
    if (!cam || !faceOn) return undefined;
    const t = setInterval(async () => {
      const L = live.current; if (busy.current || !L.A || L.pick || L.capBusy || L.reg || !(L.A.faces || []).length) return;
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
  async function capture() {
    if (!cam) { setCapMsg('Turn on the camera first'); return; }
    if (!consent) { setCapMsg('Tick the consent box first'); return; }
    if (!video.current || !video.current.videoWidth) { setCapMsg('The camera is still starting. Try again in a moment.'); return; }
    setCapBusy(true); setCapMsg('Loading face check-in… (first time takes a few seconds)');
    const ds = [];
    try {
      for (let i = 0; i < 12 && ds.length < 3; i++) {
        const f = await readFace(video.current);
        if (f && f.score > 0.6) { ds.push(pack(f.d)); setCapMsg('Captured ' + ds.length + ' of 3…'); }
        await new Promise(r => setTimeout(r, 450));
      }
      if (ds.length < 3) { setCapMsg('Could not see the face clearly. Face the camera in good light and try again.'); return; }
      const m = A.saveFace(who, ds, consent);
      setCapMsg(m || 'Saved. ' + (A.people.find(p => p.k === who) || {}).first + ' can now check in by face.');
      if (!m) { setWho(''); setConsent(false); }
    } catch (e) { setCapMsg('Face check-in could not start · ' + (e.message || e)); } finally { setCapBusy(false); }
  }
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
  const confirm = () => { const r = A.clock(pick.k, snap()); setPick(null); setQ(''); setMsg(r); setTimeout(() => setMsg(null), 6000); };
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
          {A.canFaces ? (
            <details className="att-reg" open={reg} onToggle={e => setReg(e.target.open)}>
              <summary>Register faces · {A.faces.length} of {A.people.length} registered</summary>
              <p className="att-regnote">Each person agrees first (signed consent form). Only numbers describing the face are saved, never the photo. Turn on the camera, choose the person, tick consent, then capture while they look at the camera.</p>
              <div className="att-regpick" role="radiogroup" aria-label="Person to register">{A.people.map(p => { const has = A.faces.some(f => f.k === p.k); return <button key={p.k} type="button" role="radio" aria-checked={who === p.k} className={(who === p.k ? 'is-on' : '') + (has ? ' has-face' : '')} onClick={() => { setWho(p.k); setCapMsg(''); }}>{has ? '✓ ' : ''}{p.n}</button>; })}</div>
              {who ? (
                <div className="att-regact">
                  <label className="att-consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /> {(A.people.find(p => p.k === who) || {}).n} has agreed to face check-in</label>
                  <button type="button" className="att-go" disabled={capBusy} onClick={capture}>{capBusy ? 'Capturing…' : 'Capture face'}</button>
                  {A.faces.some(f => f.k === who) ? <button type="button" className="att-cancel" onClick={() => { A.removeFace(who); setCapMsg('Face removed'); }}>Remove face</button> : null}
                </div>
              ) : null}
              {capMsg ? <p className="att-capmsg" role="status">{capMsg}</p> : null}
            </details>
          ) : null}
          <input className="att-search" value={q} onChange={e => setQ(e.target.value)} placeholder="Type your name · Andika jina lako" aria-label="Find your name" />
          <ul className="att-grid">
            {list.map(p => (
              <li key={p.k}><button type="button" className={'att-tile is-' + p.st} onClick={() => setPick(p)} aria-label={(p.st === 'in' ? 'Check out ' : 'Check in ') + p.n}>
                <span className="att-av" style={{ background: p.c }}>{p.i}</span><b>{p.n}</b>
                <small>{p.st === 'in' ? 'In since ' + p.in : p.st === 'left' ? 'Left at ' + p.out : 'Not in yet'}</small>
              </button></li>
            ))}
          </ul>
        </section>
      ) : null}

      {pick ? (
        <div className="att-sheet" role="dialog" aria-label={'Confirm ' + pick.n}>
          <div className="att-sheetc">
            <span className="att-av is-big" style={{ background: pick.c }}>{pick.i}</span>
            <h2>{pick.n}</h2>
            {pick.st === 'left' ? <p>Already checked out today at {pick.out}.</p> : <p>{pick.st === 'in' ? 'Leaving the office now?' : 'Arriving now?'}</p>}
            <div className="att-sheetb">
              {pick.st !== 'left' ? <button type="button" className={'att-go' + (pick.st === 'in' ? ' is-out' : '')} onClick={confirm}>{pick.st === 'in' ? 'Check out' : 'Check in'}</button> : null}
              <button type="button" className="att-cancel" onClick={() => setPick(null)}>Cancel</button>
            </div>
          </div>
        </div>
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
