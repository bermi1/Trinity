import { useEffect, useRef, useState } from 'react';
import { readFace, bestMatch, runLiveness, makeChallenge, STEPS } from '../../logic/face';
import { getLocation } from '../../logic/attendance';

const FAIL = 'Could not confirm it’s really you. Try again in good light.';

// The big instruction shown while the liveness challenge runs (My check-in and the reception screen).
export function LiveBox({ st, who }) {
  if (!st) return null;
  const steps = st.challenge || [], done = st.ok ? steps.length + 1 : st.step;
  return (
    <div className="ck-live" role="status" aria-live="assertive">
      {who ? <small>{who}</small> : null}
      <b>{st.ok ? 'Done ✓' : STEPS[st.need] || STEPS.centre}{!st.ok && st.need === 'left' ? ' ←' : !st.ok && st.need === 'right' ? ' →' : ''}</b>
      <span className="ck-live-dots" aria-label={'Step ' + Math.min(done + 1, steps.length + 1) + ' of ' + (steps.length + 1)}>{[...steps, 'centre'].map((x, i) => <i key={i} className={i < done ? 'is-done' : i === done ? 'is-now' : ''} />)}</span>
    </div>
  );
}

// Office locations: where people must be to check in on their own phone, and who may check in away.
// Used on Company setup and on the Staff attendance page (Management and the GM).
export function OfficeSites({ S, bare }) {
  const blank = { name: '', lat: '', lng: '', r: String(S.defR) };
  const [f, setF] = useState(null), [edit, setEdit] = useState(-1), [err, setErr] = useState(''), [busy, setBusy] = useState(false), [fix, setFix] = useState('');
  const set = (k, x) => setF(Object.assign({}, f, { [k]: x }));
  async function here() {
    setBusy(true); setErr(''); setFix('');
    const l = await getLocation();
    setBusy(false);
    if (l.error) { setErr(l.error); return; }
    setF(Object.assign({}, f || blank, { lat: String(+l.lat.toFixed(6)), lng: String(+l.lng.toFixed(6)) }));
    setFix('Location found · accurate to ±' + l.acc + ' m' + (l.acc > 100 ? ' (stand outside or near a window for a better fix)' : ''));
  }
  function save(e) {
    e.preventDefault();
    const m = edit >= 0 ? S.sites[edit].save(f) : S.add(f);
    setErr(m); if (!m) { setF(null); setEdit(-1); setFix(''); }
  }
  return (
    <section className="att-sites" aria-label="Office location">
      {bare ? null : <h3>Office location</h3>}
      <label className="att-live"><input type="checkbox" checked={S.liveOn} onChange={e => S.setLive(e.target.checked)} /> <span><b>Head-turn check</b> · people turn their head left and right before checking in, so a photo of someone can’t be used. Switch off only if it keeps failing for real people.</span></label>
      <p className="att-regnote">When an office location is set, people can check in on their own phone only when the phone is within its radius. The reception screen works as before. {S.sites.length ? '' : 'No location set yet: check-in on phones works from anywhere (the place is still recorded).'}</p>
      {S.sites.length ? (
        <ul className="att-sitelist">
          {S.sites.map((x, i) => (
            <li key={i}>
              <span><b>{x.name}</b><small>{x.lat}, {x.lng} · within {x.r} m · <a href={x.map} target="_blank" rel="noopener noreferrer">map</a></small></span>
              <span className="att-siteacts">
                <button type="button" className="att-cancel" onClick={() => { setEdit(i); setErr(''); setFix(''); setF({ name: x.name, lat: String(x.lat), lng: String(x.lng), r: String(x.r) }); }}>Edit</button>
                <button type="button" className="att-cancel" onClick={() => { x.remove(); if (edit === i) { setF(null); setEdit(-1); } }} aria-label={'Remove ' + x.name}>Remove</button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {f ? (
        <form className="att-siteform" onSubmit={save} aria-label={edit >= 0 ? 'Edit office location' : 'Add office location'}>
          <button type="button" className="att-go att-here" onClick={here} disabled={busy}>{busy ? 'Finding your location…' : 'Use my current location as the office'}</button>
          {fix ? <small className="att-fix" role="status">{fix}</small> : null}
          <label>Name<input value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Office, Warehouse" /></label>
          <div className="att-siterow">
            <label>Latitude<input inputMode="decimal" value={f.lat} onChange={e => set('lat', e.target.value)} placeholder="-6.7924" /></label>
            <label>Longitude<input inputMode="decimal" value={f.lng} onChange={e => set('lng', e.target.value)} placeholder="39.2083" /></label>
            <label>Radius (m)<input type="number" min="20" max="5000" inputMode="numeric" value={f.r} onChange={e => set('r', e.target.value)} /></label>
          </div>
          <div className="ck-acts"><button type="submit" className="att-go">Save location</button><button type="button" className="att-cancel" onClick={() => { setF(null); setEdit(-1); setErr(''); setFix(''); }}>Cancel</button></div>
        </form>
      ) : <button type="button" className="att-cancel att-addsite" onClick={() => { setF(blank); setEdit(-1); setErr(''); }}>{S.sites.length ? '+ Add another site (e.g. warehouse)' : '+ Set the office location'}</button>}
      {err ? <p className="att-err" role="alert">{err}</p> : null}
      <details className="att-reg">
        <summary>May check in away from the office · {S.people.filter(p => p.away).length} people</summary>
        <p className="att-regnote">For field staff (for example the operations crew on site). Their check-in away from the office is allowed, with the place recorded and flagged here.</p>
        <ul className="att-sitelist">{S.people.map(p => <li key={p.k}><span>{p.n}</span><button type="button" role="switch" aria-checked={p.away} aria-label={'May check in away · ' + p.n} className={'co-switch' + (p.away ? ' is-on' : '')} onClick={() => p.set(!p.away)}><i /></button></li>)}</ul>
      </details>
    </section>
  );
}

const minsSince = t => { if (!t) return 0; const [h, m] = t.split(':').map(Number), d = new Date(); return d.getHours() * 60 + d.getMinutes() - (h * 60 + m); };

// Staff check-in / check-out on the reception screen, and today's attendance for the GM.
export default function AttendancePage({ v }) {
  const A = v.ATT;
  const [q, setQ] = useState(''), [msg, setMsg] = useState(null), [cam, setCam] = useState(false), [camErr, setCamErr] = useState(''), [now, setNow] = useState(new Date());
  const video = useRef(null), stream = useRef(null);
  const [faceOn, setFaceOn] = useState(true), [seen, setSeen] = useState(''), [faceErr, setFaceErr] = useState('');
  const [reg, setReg] = useState(false), [capMsg, setCapMsg] = useState('');
  const busy = useRef(false), streak = useRef({ k: '', n: 0 }), cool = useRef({}), live = useRef(null), here = useRef(null), alive = useRef(true);
  const [chal, setChal] = useState(null);
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
        // Liveness: the recognised person turns their head as asked; then the last frame must still be them.
        setSeen(''); setMsg(null);
        const who = (p ? p.first : '') + ', to ' + (st === 'in' ? 'check out' : 'check in') + ':';
        const res = L.A.liveOn ? await runLiveness(el, { challenge: makeChallenge(), alive: () => alive.current && !!video.current, onStep: x => setChal(Object.assign({ who }, x)) }) : { ok: true };
        const fin = res.ok ? await readFace(el) : null, same = fin && bestMatch(fin.d, L.A.faces);
        setChal(null);
        if (!res.ok || !same || same.k !== m.k) { setMsg({ error: FAIL }); cool.current[m.k] = Date.now() - 50000; setTimeout(() => setMsg(null), 6000); return; }
        const r = L.A.clock(m.k, snap(), { live: !!L.A.liveOn, loc: here.current }); setMsg(Object.assign({ face: true }, r));
        setTimeout(() => setMsg(null), 6000);
      } catch (e) { setFaceErr('Face check-in could not start · ' + (e.message || e)); } finally { busy.current = false; }
    }, 900);
    return () => clearInterval(t);
  }, [cam, faceOn]);
  // Register a face: three good frames, a moment apart, saved as numbers only.
  useEffect(() => { alive.current = true; const t = setInterval(() => setNow(new Date()), 15000); return () => { alive.current = false; clearInterval(t); stopCam(); }; }, []);
  if (!A) return null;
  async function startCam() {
    setCamErr('');
    try { stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false }); setCam(true); }
    catch (e) { setCamErr('Camera not available · ' + (e.message || 'permission denied')); return; }
    // Where the reception screen is, if the device can tell (recorded with each check-in; not required).
    if (!here.current) getLocation(10000).then(l => { if (!l.error) here.current = l; });
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
          <LiveBox st={chal} who={chal && chal.who} />
          {msg ? <div className={'att-msg' + (msg.error ? ' is-err' : msg.kind === 'out' ? ' is-out' : '')} role="status">{msg.error ? msg.error : msg.kind === 'in' ? <><b>Karibu, {msg.name.split(' ')[0]}!</b> {msg.face ? 'Recognised · ' : ''}Checked in at {msg.time}{msg.late ? ' · late' : ''}</> : <><b>Kwaheri, {msg.name.split(' ')[0]}!</b> {msg.face ? 'Recognised · ' : ''}Checked out at {msg.time} · in since {msg.since}</>}</div> : null}
          <p className="att-regnote">Check in by looking at the camera, then turn your head as the screen asks; nobody can check in for someone else. No face registered yet? Register it on your own phone: <b>More → My check-in</b>.</p>
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
          <h2>Today · {A.counts.in + A.counts.left} came in{A.counts.late ? ' · ' + A.counts.late + ' late (after ' + A.lateAfter + ')' : ''}{A.counts.away ? ' · ' + A.counts.away + ' away from the office' : ''}</h2>
          <div className="att-feed">
            {A.feed.length ? A.feed.map((e, i) => (
              <div key={i} className={'att-ev is-' + e.kind + (e.away ? ' is-away' : '')}>
                {e.photo ? <img src={e.photo} alt={'Photo of ' + e.n} /> : <span className="att-nophoto">No photo</span>}
                <div>
                  <b>{e.n}</b><small>{e.kind === 'in' ? 'In' : 'Out'} · {e.t}{e.late ? ' · late' : ''}</small>
                  <small className="att-how">{e.how || 'Face'}{e.live ? ' · live ✓' : ''}</small>
                  {e.place ? <small className={'att-place' + (e.away ? ' is-away' : '')}>{e.map ? <a href={e.map} target="_blank" rel="noopener noreferrer">{e.place}</a> : e.place}{e.acc != null ? ' (±' + e.acc + ' m)' : ''}</small> : null}
                </div>
              </div>
            )) : <p className="att-empty">No one has checked in yet today.</p>}
          </div>
          <table className="att-table"><thead><tr><th>Name</th><th>In</th><th>Out</th><th>Time in office</th></tr></thead>
            <tbody>{A.people.map(p => <tr key={p.k} className={p.st === 'out' ? 'is-absent' : ''}><td>{p.n}{p.away ? <span className="att-awaytag">away</span> : null}</td><td>{p.in ? p.in + (p.late ? ' (late)' : '') : '—'}</td><td>{p.out || (p.st === 'in' ? 'In now' : '—')}</td><td>{p.hours || '—'}</td></tr>)}</tbody></table>
          {A.SITES ? <OfficeSites S={A.SITES} /> : null}
        </section>
      ) : null}
    </div>
  );
}
