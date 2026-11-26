import { useEffect, useRef, useState } from 'react';
import { readFace, bestMatch, pack } from '../../logic/face';

// My check-in: each person registers their own face on their own phone or computer, then checks in and
// out for work with it. The face is compared only with their own registered face; only numbers are stored.
export default function CheckInPage({ v }) {
  const C = v.CHK;
  const video = useRef(null), stream = useRef(null), alive = useRef(true);
  const [cam, setCam] = useState(false), [camErr, setCamErr] = useState('');
  const [consent, setConsent] = useState(false), [busy, setBusy] = useState(''), [note, setNote] = useState(''), [msg, setMsg] = useState(null), [rereg, setRereg] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    alive.current = true;
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => { alive.current = false; clearInterval(t); stopCam(); };
  }, []);
  if (!C) return null;

  async function startCam() {
    setCamErr('');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false });
      if (!alive.current) { s.getTracks().forEach(t => t.stop()); return; }
      stream.current = s; setCam(true);
    } catch (e) { setCamErr('Camera not available · ' + (e.message || 'permission denied')); }
  }
  function stopCam() { if (stream.current) stream.current.getTracks().forEach(t => t.stop()); stream.current = null; if (alive.current) setCam(false); }
  const ready = () => !!(video.current && video.current.videoWidth);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  // A small photo (240 px wide) kept with the check-in, as on the reception screen.
  function snap() {
    const el = video.current; if (!el || !el.videoWidth) return '';
    const c = document.createElement('canvas'), w = 240, h = Math.round(el.videoHeight / el.videoWidth * w); c.width = w; c.height = h;
    c.getContext('2d').drawImage(el, 0, 0, w, h); return c.toDataURL('image/jpeg', 0.7);
  }

  // Register: three good frames, a moment apart, saved as numbers only.
  async function register() {
    setMsg(null);
    if (!cam || !ready()) { setNote(cam ? 'The camera is still starting. Try again in a moment.' : 'Turn on the camera first'); return; }
    if (!consent) { setNote('Tick the box to agree first'); return; }
    setBusy('reg'); setNote('Loading face check-in… (first time takes a few seconds)');
    const ds = [];
    try {
      for (let i = 0; i < 12 && ds.length < 3 && alive.current; i++) {
        const f = ready() ? await readFace(video.current) : null;
        if (f && f.score > 0.6) { ds.push(pack(f.d)); setNote('Captured ' + ds.length + ' of 3… keep looking at the camera'); }
        await wait(450);
      }
      if (!alive.current) return;
      if (ds.length < 3) { setNote('Could not see your face clearly. Face the camera in good light and try again.'); return; }
      const m = C.saveMyFace(ds, consent);
      setNote(m || 'Saved. You can now check in with your face.');
      if (!m) { setConsent(false); setRereg(false); }
    } catch (e) { setNote('Face check-in could not start · ' + (e.message || e)); } finally { if (alive.current) setBusy(''); }
  }

  // Check in or out: read a face (up to 10 tries) and compare it only with the person's own registered face.
  async function checkMe() {
    setMsg(null); setNote('');
    if (!cam || !ready()) { setNote(cam ? 'The camera is still starting. Try again in a moment.' : 'Turn on the camera first'); return; }
    setBusy('chk'); setNote('Looking at your face…');
    try {
      let seen = false, ok = false;
      for (let i = 0; i < 10 && !ok && alive.current; i++) {
        const f = ready() ? await readFace(video.current) : null;
        if (f) { seen = true; ok = !!bestMatch(f.d, [C.myFace]); }
        if (!ok) await wait(350);
      }
      if (!alive.current) return;
      setNote('');
      if (!ok) { setMsg({ error: seen ? 'Face did not match. Try again in good light' : 'No face seen. Look straight at the camera in good light and try again' }); return; }
      setMsg(C.clockMe(snap()));
    } catch (e) { setNote('Face check-in could not start · ' + (e.message || e)); } finally { if (alive.current) setBusy(''); }
  }

  const showReg = !C.hasFace || rereg;
  const first = C.me.first;
  return (
    <div className="att ck">
      <header className="att-head">
        <div><small>Mahudhurio · My check-in</small><h1>{now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</h1><p>{now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
        <div className="ck-status" role="status">
          <span className="att-av" style={{ background: C.me.c }}>{C.me.i}</span>
          <span><b>{C.me.n}</b><small>{C.status === 'in' ? 'In since ' + C.in + (C.late ? ' · late' : '') : C.status === 'left' ? 'Checked out at ' + C.out : 'Not checked in today'}</small></span>
        </div>
      </header>

      <div className="ck-cam">
        {cam ? <video ref={el => { video.current = el; if (el && stream.current && el.srcObject !== stream.current) { el.srcObject = stream.current; el.play().catch(() => {}); } }} muted playsInline autoPlay aria-label="Your camera" /> : <button type="button" className="att-cambtn ck-camon" onClick={startCam}>Turn on the camera</button>}
        {cam ? <button type="button" className="att-camoff" onClick={stopCam} disabled={!!busy}>Camera off</button> : null}
        {camErr ? <small className="att-err">{camErr}</small> : null}
      </div>

      {msg ? <div className={'att-msg' + (msg.error ? ' is-err' : msg.kind === 'out' ? ' is-out' : '')} role="status">{msg.error ? msg.error : msg.kind === 'in' ? <><b>Karibu, {first}!</b> Checked in at {msg.time}{msg.late ? ' · late' : ''}</> : <><b>Kwaheri, {first}!</b> Checked out at {msg.time} · in since {msg.since}</>}</div> : null}

      {showReg ? (
        <section className="ck-card" aria-label="Register my face">
          <h2>{C.hasFace ? 'Re-register my face' : 'Register my face'}</h2>
          <p className="att-regnote">Look straight at the camera in good light. Three pictures are read and turned into numbers that describe your face; the pictures themselves are not kept.</p>
          <label className="att-consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /> I agree my face is used for check-in; only numbers are stored, not photos</label>
          <div className="ck-acts">
            <button type="button" className="att-go" disabled={!!busy || !consent} onClick={register}>{busy === 'reg' ? 'Capturing…' : 'Register my face'}</button>
            {C.hasFace ? <button type="button" className="att-cancel" disabled={!!busy} onClick={() => { setRereg(false); setNote(''); }}>Cancel</button> : null}
          </div>
        </section>
      ) : (
        <section className="ck-card" aria-label="Check in or out">
          {C.status === 'left' ? <p className="ck-done">You checked out today at {C.out}. See you tomorrow!</p> : (
            <button type="button" className={'att-go ck-big' + (C.status === 'in' ? ' is-out' : '')} disabled={!!busy} onClick={checkMe}>
              {busy === 'chk' ? 'Checking…' : C.status === 'in' ? 'Check out with my face' : 'Check in with my face'}
            </button>
          )}
          <div className="ck-acts ck-small">
            <button type="button" className="att-cancel" disabled={!!busy} onClick={() => { setRereg(true); setMsg(null); setNote(''); }}>Re-register my face</button>
            <button type="button" className="att-cancel" disabled={!!busy} onClick={() => { const m = C.removeMyFace(); setMsg(null); setNote(m || 'Your face was removed. Register again to check in with your face.'); }}>Remove my face</button>
          </div>
        </section>
      )}
      {note ? <p className="att-capmsg" role="status">{note}</p> : null}
    </div>
  );
}
