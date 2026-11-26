import { useState } from 'react';
import { PageHead, Btn, Empty, faceStyle, faceText } from '../../ui/kit';

function NewReport({ R, onDone }) {
  const [f, setF] = useState(Object.assign({ kind: R.defaultKind, title: '', summary: '', issues: '', next: '', to: R.targets.map(t => t.v), file: null }, R.draft || {}));
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k, v) => { setErr(''); setF(x => Object.assign({}, x, { [k]: v })); };
  const tog = k => set('to', f.to.includes(k) ? f.to.filter(x => x !== k) : [...f.to, k]);
  return (
    <section className="fh-card rp-new" aria-label="New report">
      <div className="me-seg rp-kinds" role="radiogroup" aria-label="Report type">{R.kinds.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={f.kind === k} className={f.kind === k ? 'is-on' : ''} onClick={() => set('kind', k)}>{l}</button>)}</div>
      <input className="me-who" value={f.title} onChange={e => set('title', e.target.value)} placeholder="Title (optional) · e.g. Week 47 · Operations" aria-label="Title" />
      <label className="ff"><span className="ff-l">What was done<em>*</em></span><textarea rows={4} value={f.summary} onChange={e => set('summary', e.target.value)} placeholder="Highlights, results, numbers" aria-label="What was done" /></label>
      <label className="ff"><span className="ff-l">Issues or help needed</span><textarea rows={2} value={f.issues} onChange={e => set('issues', e.target.value)} placeholder="Delays, risks, decisions needed" aria-label="Issues" /></label>
      <label className="ff"><span className="ff-l">Next</span><textarea rows={2} value={f.next} onChange={e => set('next', e.target.value)} placeholder="Plan for the next day or week" aria-label="Next" /></label>
      <label className="bi-up"><input type="file" onChange={e => set('file', e.target.files[0] || null)} aria-label="Report file" />{f.file ? '✓ ' + f.file.name : '↑ Attach a file (Excel, PDF, photos), optional'}</label>
      <div className="ff"><span className="ff-l">Send to</span>
        <div className="ff-people" role="group" aria-label="Send to">{R.targets.map(t => <button key={t.v} type="button" aria-pressed={f.to.includes(t.v)} aria-label={t.l} className={f.to.includes(t.v) ? 'is-on' : ''} onClick={() => tog(t.v)}><span className="ff-face" style={faceStyle(t)}>{faceText(t)}</span><span className="ff-name">{t.l.split(' ')[0]}</span></button>)}</div>
      </div>
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
      <div className="me-foot"><button type="button" className="me-cancel" onClick={onDone}>Cancel</button><button type="button" className="me-save" disabled={busy} onClick={async () => { setBusy(true); const m = await R.send(f); setBusy(false); if (m) setErr(m); else { R.clearDraft(); onDone(); } }}>{busy ? 'Sending…' : 'Send report'}</button></div>
    </section>
  );
}

function Report({ r, sent }) {
  const [open, setOpen] = useState(false); const [t, setT] = useState('');
  const toggle = () => { if (!open) r.open(); setOpen(!open); };
  return (
    <li className={'rp-item' + (r.unread ? ' is-unread' : '')} data-report={r.id}>
      <button type="button" className="rp-row" onClick={toggle} aria-expanded={open}>
        <span className="pv-face" style={{ background: r.bc, width: 34, height: 34 }}>{r.bi}</span>
        <span className="rp-main"><b>{r.title}</b><small>{sent ? 'To ' + r.to : r.by + (r.dept ? ' · ' + r.dept : '')} · {r.at} {r.time}</small></span>
        <span className="rp-kind">{r.kind}</span>
        {r.unread ? <span className="rp-dot" aria-label="Unread" /> : null}
      </button>
      {open ? (
        <div className="rp-body">
          <h4>What was done</h4><p>{r.summary}</p>
          {r.issues ? <><h4>Issues</h4><p className="rp-issue">{r.issues}</p></> : null}
          {r.next ? <><h4>Next</h4><p>{r.next}</p></> : null}
          {r.file ? <button type="button" className="cr-file" onClick={r.file.open}><span className="cr-doc">FILE</span><span><b>{r.file.name}</b><small>Attached</small></span></button> : null}
          <p className="k-sub">{r.readBy ? 'Read by ' + r.readBy : sent ? 'Not read yet' : ''}</p>
          {r.replies.length ? <ul className="mr-thread">{r.replies.map((x, i) => <li key={i} className={x.mine ? 'is-mine' : ''}><b>{x.who}</b> · <small>{x.at}</small><p>{x.t}</p></li>)}</ul> : null}
          <form className="mr-reply" onSubmit={e => { e.preventDefault(); if (!r.reply(t)) setT(''); }}>
            <input className="ff-search" value={t} onChange={e => setT(e.target.value)} placeholder="Reply or comment" aria-label={'Reply to ' + r.title} />
            <Btn kind="dark" type="submit">Reply</Btn>
          </form>
        </div>
      ) : null}
    </li>
  );
}

// Reports: send yours up the line, read what was sent to you.
export default function ReportingPage({ v }) {
  const R = v.RPT;
  // Staff only send reports: their page has Sent and New report, no Received.
  const tabs = [...(R.canReceive ? [['inbox', 'Received' + (R.unread ? ' · ' + R.unread + ' new' : '')]] : []), ...(R.canSend ? [['sent', 'Sent'], ['new', 'New report']] : [])];
  return (
    <>
      <PageHead kicker="Reporting" title="Reports" sub="Daily, weekly and monthly reports go up the line: staff to their head, heads and Finance to the GM and Management, the GM to Management." />
      <div className="rc-smart" role="tablist">{tabs.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={R.tab === k} className={R.tab === k ? 'is-on' : ''} onClick={() => R.setTab(k)}><span>{l}</span></button>)}</div>
      {R.tab === 'new' && R.canSend ? <NewReport R={R} onDone={() => R.setTab('sent')} /> : null}
      {R.tab === 'inbox' ? (R.inbox.length ? <ul className="rp-list">{R.inbox.map(r => <Report key={r.id} r={r} />)}</ul> : <Empty>No reports yet.</Empty>) : null}
      {R.tab === 'sent' ? (R.sent.length ? <ul className="rp-list">{R.sent.map(r => <Report key={r.id} r={r} sent />)}</ul> : <Empty>You have not sent a report yet.</Empty>) : null}
    </>
  );
}
