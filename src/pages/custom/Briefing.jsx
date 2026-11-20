import { useState, useEffect, useRef } from 'react';
import PdfReader from '../../components/PdfReader';
import { PageHead, Btn, Empty, faceStyle, faceText } from '../../ui/kit';

function MyUpdate({ B }) {
  const [f, setF] = useState({ done: '', issues: '', plan: '' }); const [err, setErr] = useState('');
  if (B.myUpdate) return <section className="fh-card"><h3>Your update is in ✓</h3><p className="k-sub">Sent {B.myUpdate.at}</p><p className="rp-pre">{B.myUpdate.done}</p></section>;
  return (
    <section className="fh-card" aria-label="Weekly update">
      <h3>Your department’s update for Monday</h3>
      <label className="ff"><span className="ff-l">Done last week<em>*</em></span><textarea rows={3} value={f.done} onChange={e => setF(Object.assign({}, f, { done: e.target.value }))} aria-label="Done last week" /></label>
      <label className="ff"><span className="ff-l">Issues and help needed</span><textarea rows={2} value={f.issues} onChange={e => setF(Object.assign({}, f, { issues: e.target.value }))} aria-label="Issues and help needed" /></label>
      <label className="ff"><span className="ff-l">Plan for this week</span><textarea rows={2} value={f.plan} onChange={e => setF(Object.assign({}, f, { plan: e.target.value }))} aria-label="Plan for this week" /></label>
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
      <div><button type="button" className="me-save" onClick={() => setErr(B.sendUpdate(f))}>Send update</button></div>
    </section>
  );
}

// Full-screen presenter: the slides (PDF and images shown here, PowerPoint through the Office viewer) and the key points.
function Presenter({ B, list, start, onClose }) {
  const [i, setI] = useState(start); const [url, setUrl] = useState(''); const [err, setErr] = useState(''); const [notes, setNotes] = useState(true);
  const ref = useRef(null);
  const p = list[i];
  const name = (p.file && (p.file.name || p.file.n)) || '';
  const kind = /\.pdf$/i.test(name) ? 'pdf' : /\.(png|jpe?g|gif|webp)$/i.test(name) ? 'img' : /\.(pptx?|ppsx?)$/i.test(name) ? 'ppt' : 'other';
  useEffect(() => { let off = false; setUrl(''); setErr(''); B.docUrl({ n: name, url: p.file && p.file.url, path: p.file && p.file.path }).then(u => { if (!off) setUrl(u); }).catch(() => { if (!off) setErr('Could not load the file'); }); return () => { off = true; }; }, [p.id]);
  useEffect(() => { const el = ref.current; try { if (el && el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().catch(() => {}); } catch (e) {} 
    const key = e => { if (e.key === 'Escape') onClose(); if (kind !== 'pdf' && e.key === 'ArrowRight' && i < list.length - 1) setI(i + 1); if (kind !== 'pdf' && e.key === 'ArrowLeft' && i > 0) setI(i - 1); };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, [i]);
  const close = () => { try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {} onClose(); };
  const remote = url && /^https:/.test(url);
  return (
    <div ref={ref} className="br-show" role="dialog" aria-label={'Presenting · ' + p.title}>
      <header className="br-show-h">
        <div><b>{p.title}</b><small>{p.by} · {i + 1} of {list.length}</small></div>
        <div className="br-show-acts">
          <button type="button" onClick={() => setNotes(!notes)} aria-pressed={notes}>Key points</button>
          {url ? <a href={url} target="_blank" rel="noreferrer">Open file</a> : null}
          <button type="button" onClick={close} aria-label="Close presentation">✕</button>
        </div>
      </header>
      <div className={'br-show-body' + (notes ? ' has-notes' : '')}>
        <div className="br-show-slide">
          {err ? <p className="br-show-msg">{err}</p> : !url ? <p className="br-show-msg">{p.file ? 'Loading…' : 'No file attached · the key points are shown'}</p>
            : kind === 'pdf' ? <PdfReader key={p.id} url={url} name={p.title} />
            : kind === 'img' ? <img src={url} alt={p.title} />
            : kind === 'ppt' && remote ? <iframe title={p.title} src={'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(url)} />
            : <p className="br-show-msg">This file opens in its own app · tap “Open file”</p>}
        </div>
        {notes ? <aside className="br-show-notes"><h4>Key points</h4><p>{p.points}</p></aside> : null}
      </div>
      <footer className="br-show-f">
        <button type="button" disabled={i === 0} onClick={() => setI(i - 1)}>‹ Previous</button>
        <button type="button" disabled={i === list.length - 1} onClick={() => setI(i + 1)}>Next ›</button>
      </footer>
    </div>
  );
}

function Present({ B }) {
  const [show, setShow] = useState(null);
  const [f, setF] = useState({ title: '', points: '', file: null }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [open, setOpen] = useState(false);
  const mine = B.pres.filter(p => p.mine);
  return (
    <section className="fh-card" aria-label="Presentations">
      <header className="fr-chart-h"><h3>Presentations · {B.pres.length}</h3>{!open ? <Btn kind="ghost" onClick={() => setOpen(true)}>{mine.length ? 'Upload another' : 'Upload my presentation'}</Btn> : null}</header>
      {open ? (
        <div className="pn-form">
          <input className="me-who" value={f.title} onChange={e => setF(Object.assign({}, f, { title: e.target.value }))} placeholder="Title · e.g. Creative: designs delivered this week" aria-label="Presentation title" />
          <textarea className="cr-memo-t" rows={3} value={f.points} onChange={e => setF(Object.assign({}, f, { points: e.target.value }))} placeholder="Key points, 3 to 5 lines" aria-label="Key points" />
          <label className="bi-up"><input type="file" accept=".pdf,.ppt,.pptx,.key,image/*" onChange={e => setF(Object.assign({}, f, { file: e.target.files[0] || null }))} aria-label="Presentation file" />{f.file ? '✓ ' + f.file.name : '↑ PowerPoint or PDF'}</label>
          {err ? <div className="fm-err" role="alert">{err}</div> : null}
          <div className="fh-row"><button type="button" className="me-cancel" onClick={() => setOpen(false)}>Cancel</button><button type="button" className="me-save" disabled={busy} onClick={async () => { setBusy(true); const m = await B.upload(f); setBusy(false); if (m) setErr(m); else { setOpen(false); setF({ title: '', points: '', file: null }); } }}>{busy ? 'Uploading…' : 'Upload'}</button></div>
        </div>
      ) : null}
      {B.pres.length ? (
        <ul className="br-pres">
          {B.pres.map(p => (
            <li key={p.id} data-pres={p.id}>
              <span className="pv-face" style={{ background: p.bc, width: 34, height: 34 }}>{p.bi}</span>
              <span className="br-pres-main"><b>{p.title}</b><small>{p.by} · {p.at}</small><p className="rp-pre">{p.points}</p></span>
              <span className="br-pres-btns">
                <button type="button" className="me-save" onClick={() => setShow(B.pres.indexOf(p))} aria-label={'Present · ' + p.title}>Present</button>
                <button type="button" className="me-cancel" onClick={p.open} aria-label={'Open presentation · ' + p.title}>Open</button>
              </span>
            </li>
          ))}
        </ul>
      ) : <p className="k-sub">Presenting on Monday? Upload your slides and key points here, then just open them in the room.</p>}
      {show !== null ? <Presenter B={B} list={B.pres} start={show} onClose={() => setShow(null)} /> : null}
    </section>
  );
}

function Highlights({ B }) {
  const [t, setT] = useState(''); const [err, setErr] = useState('');
  return (
    <section className="fh-card" aria-label="Key highlights">
      <h3>Key highlights</h3>
      {B.highlights.length ? <ul className="br-list">{B.highlights.map((h, i) => <li key={i}><b>{h.t}</b><small>{h.by}</small></li>)}</ul> : <p className="k-sub">Highlights from the meeting appear here.</p>}
      {B.chair && !B.published ? (
        <form className="mr-reply" onSubmit={e => { e.preventDefault(); const m = B.addHighlight(t); setErr(m); if (!m) setT(''); }}>
          <input className="ff-search" value={t} onChange={e => setT(e.target.value)} placeholder="Add a key highlight" aria-label="Highlight" />
          <Btn kind="dark" type="submit">Add</Btn>
        </form>
      ) : null}
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
    </section>
  );
}

function Decide({ B }) {
  const [f, setF] = useState({ d: '', a: '', o: '', due: 'Fri', p: '' }); const [err, setErr] = useState('');
  const set = (k, v) => setF(x => Object.assign({}, x, { [k]: v }));
  return (
    <div className="pn-form" aria-label="New decision" role="group">
      <input className="me-who" value={f.d} onChange={e => set('d', e.target.value)} placeholder="Decision (e.g. Follow up Kilimo Bank permits with the council)" aria-label="Decision" />
      <input className="me-who" value={f.a} onChange={e => set('a', e.target.value)} placeholder="Action: what exactly must be done" aria-label="Action" />
      <div className="ff-people br-people" role="radiogroup" aria-label="Who does it">{B.people.map(p => <button key={p.v} type="button" role="radio" aria-checked={f.o === p.v} aria-label={p.l} className={f.o === p.v ? 'is-on' : ''} onClick={() => set('o', p.v)}><span className="ff-face" style={faceStyle(p)}>{faceText(p)}</span><span className="ff-name">{p.l.split(' ')[0]}</span></button>)}</div>
      <div className="fh-row">
        <div className="me-mini">{['Today', 'Wed', 'Fri', 'Next Mon'].map(d => <button key={d} type="button" className={f.due === d ? 'is-on' : ''} onClick={() => set('due', d)}>{d}</button>)}</div>
      </div>
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
      <div><button type="button" className="me-save" onClick={() => { const m = B.decide(f); setErr(m); if (!m) setF({ d: '', a: '', o: '', due: 'Fri', p: '' }); }}>Record decision · create task</button></div>
    </div>
  );
}

// Monday Briefing: prepared from the system and the heads' updates; decisions become tasks.
export default function Briefing({ v }) {
  const B = v.BRF;
  const [err, setErr] = useState('');
    return (
    <div className="br">
      <PageHead kicker={'Week of ' + B.week} title="Monday Briefing" sub={'Upload your presentation before the meeting; open it in the room. Highlights and what was agreed are here for everyone.'}>
        {B.chair ? <Btn kind="dark" onClick={() => setErr(B.publish())}>{B.published ? 'Minutes published' : 'Publish minutes'}</Btn> : null}
      </PageHead>
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
      {B.published ? <p className="mr-recline">Minutes published by {B.published}</p> : null}

      <Present B={B} />
      <div className="fr-two"><Highlights B={B} />
      <section className="fh-card"><h3>Agreed in the meeting · {B.decisions.length}</h3>
        {B.decisions.length ? <ul className="br-list">{B.decisions.map((x, i) => <li key={i}><b>{x.d}</b><small>To do: {x.a} · {x.who} · due {x.due}{x.st ? ' · ' + x.st : ''}</small></li>)}</ul> : <p className="k-sub">Decisions and to-dos agreed in the meeting appear here for everyone.</p>}
        {B.chair && !B.published ? <Decide B={B} /> : null}
      </section></div>

      {B.head ? <section className="hd-kpis br-kpis">{B.stats.map(k => <div key={k.l} className="hd-kpi"><span>{k.l}</span><b>{k.v}</b></div>)}</section> : null}

      {B.lastActions.length ? (
        <section className="fh-card"><h3>Last week’s actions</h3>
          <ul className="br-list">{B.lastActions.map((a, i) => <li key={i} className={a.done ? 'is-done' : 'is-open'}><b>{a.done ? '✓' : '○'} {a.a}</b><small>{a.who}{a.report ? ' · ' + a.report : a.done ? '' : ' · still open'}</small></li>)}</ul>
        </section>
      ) : null}

      {B.head ? <div className="fr-two">
        <section className="fh-card"><h3>Department updates · {B.sent} of {B.heads.length} in</h3>
          <ul className="br-list">{B.heads.map(h => (
            <li key={h.d} className={h.u ? 'is-done' : 'is-open'} data-dept={h.d}>
              <b>{h.l} · {h.head}</b>
              {h.u ? <><p className="rp-pre">{h.u.done}</p>{h.u.issues ? <p className="rp-issue">{h.u.issues}</p> : null}{h.u.plan ? <small>Plan: {h.u.plan}</small> : null}</> : <span className="fh-row"><small>Not sent yet</small>{B.chair ? <button type="button" className="td-start" onClick={h.remind}>Remind</button> : null}</span>}
            </li>
          ))}</ul>
        </section>
        <div className="br-side">
          {B.canUpdate ? <MyUpdate B={B} /> : null}
          <section className="fh-card"><h3>Issues to discuss · {B.issues.length}</h3>
            {B.issues.length ? <ul className="br-list">{B.issues.map((x, i) => <li key={i}><b><em className="br-tag">{x.tag}</em> {x.t}</b><small>{x.s}</small></li>)}</ul> : <Empty>No issues.</Empty>}
          </section>
        </div>
      </div> : null}

      <div className="fr-two">
        {B.head ? <section className="fh-card"><h3>Last week in the projects</h3>
          {B.moved.length ? <ul className="br-list">{B.moved.map((m, i) => <li key={i}><b>{m.t}</b><small>{m.s} · {m.at}</small></li>)}</ul> : <Empty>No project steps last week.</Empty>}
        </section> : null}
        <section className="fh-card"><h3>This week</h3>
          {B.weekItems.length ? <ul className="br-list">{B.weekItems.map(d => <li key={d.l}><b>{d.l}</b>{d.items.map((t, i) => <small key={i}>{t}</small>)}</li>)}</ul> : <Empty>Nothing on the calendar.</Empty>}
        </section>
      </div>

    </div>
  );
}
