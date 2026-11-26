import { useEffect, useRef, useState } from 'react';

// Staff check-in / check-out on the reception screen, and today's attendance for the GM.
export default function AttendancePage({ v }) {
  const A = v.ATT;
  const [q, setQ] = useState(''), [pick, setPick] = useState(null), [msg, setMsg] = useState(null), [cam, setCam] = useState(false), [camErr, setCamErr] = useState(''), [now, setNow] = useState(new Date());
  const video = useRef(null), stream = useRef(null);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 15000); return () => { clearInterval(t); stopCam(); }; }, []);
  if (!A) return null;
  async function startCam() {
    setCamErr('');
    try { stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false }); setCam(true); setTimeout(() => { if (video.current) { video.current.srcObject = stream.current; video.current.play().catch(() => {}); } }, 0); }
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
            {cam ? <video ref={video} muted playsInline aria-label="Reception camera" /> : <button type="button" className="att-cambtn" onClick={startCam}>Turn on the camera (photo at each check-in)</button>}
            {cam ? <button type="button" className="att-camoff" onClick={stopCam}>Camera off</button> : null}
            {camErr ? <small className="att-err">{camErr}</small> : null}
          </div>
          {msg ? <div className={'att-msg' + (msg.error ? ' is-err' : msg.kind === 'out' ? ' is-out' : '')} role="status">{msg.error ? msg.error : msg.kind === 'in' ? <><b>Karibu, {msg.name.split(' ')[0]}!</b> Checked in at {msg.time}{msg.late ? ' · late' : ''}</> : <><b>Kwaheri, {msg.name.split(' ')[0]}!</b> Checked out at {msg.time} · in since {msg.since}</>}</div> : null}
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
