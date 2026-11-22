import { useState } from 'react';
import { faceStyle, faceText } from '../../ui/kit';

const Face = ({ p, size = 32 }) => <span className="mm-face" style={faceStyle(p, { width: size, height: size })}>{faceText(p)}</span>;

// Write a memo to a department: category, what is needed, an optional file, linked to a project or lead.
export function MemoComposer({ M, project, lead, onDone }) {
  const [f, setF] = useState({ dept: '', cat: 'project', text: '', file: null });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  return (
    <section className="mm-compose" aria-label="New memo">
      <div className="ff"><span className="ff-l">To department</span><div className="ff-chips" role="radiogroup" aria-label="To department">{M.depts.map(d => <button key={d.v} type="button" role="radio" aria-checked={f.dept === d.v} className={f.dept === d.v ? 'is-on' : ''} onClick={() => setF({ ...f, dept: d.v })}>{d.l}</button>)}</div></div>
      <div className="ff"><span className="ff-l">Category</span><div className="ff-chips" role="radiogroup" aria-label="Memo category">{M.cats.map(c => <button key={c.v} type="button" role="radio" aria-checked={f.cat === c.v} className={(f.cat === c.v ? 'is-on' : '') + (c.v === 'emergency' ? ' is-urgent' : '')} onClick={() => setF({ ...f, cat: c.v })}>{c.l}</button>)}</div></div>
      <textarea rows={3} value={f.text} onChange={e => setF({ ...f, text: e.target.value })} placeholder="What do you need, by when?" aria-label="Memo" />
      <label className="bi-up"><input type="file" onChange={e => setF({ ...f, file: e.target.files[0] || null })} aria-label="Memo file" />{f.file ? '✓ ' + f.file.name : '↑ Attach a file (optional)'}</label>
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
      <div className="tg-foot">{onDone ? <button type="button" className="me-cancel" onClick={onDone}>Cancel</button> : null}<button type="button" className="me-save" disabled={busy} onClick={async () => { setBusy(true); const m = await M.send({ ...f, project: project || '', lead: lead || '' }); setBusy(false); if (m) setErr(m); else { setF({ dept: '', cat: 'project', text: '', file: null }); if (onDone) onDone(); } }}>{busy ? 'Sending…' : 'Send memo'}</button></div>
    </section>
  );
}

// A memo on a list: category, who, where it stands.
export function MemoCard({ m }) {
  return (
    <li className={'mm-card' + (m.urgent ? ' is-urgent' : '')} data-memo={m.id}>
      <button type="button" onClick={m.open} aria-label={'Open memo · ' + m.text.slice(0, 40)}>
        <Face p={m.from} />
        <span className="mm-main"><span className="mm-tags"><em className={'mm-cat is-' + m.cat}>{m.catL}</em><em className={'mm-st is-' + m.st}>{m.stL}</em></span><b>{m.text}</b><small>{m.from.n} → {m.dept}{m.who ? ' · with ' + m.who.n : ''}{m.about ? ' · ' + m.about : ''} · {m.at}</small></span>
      </button>
    </li>
  );
}

// The memo itself, full page: what was asked, who has it, the files, and the actions for the person looking.
function MemoFull({ m, back }) {
  const [reply, setReply] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  return (
    <article className={'mm-full' + (m.urgent ? ' is-urgent' : '')} aria-label="Memo">
      <nav className="rc-crumbs"><button type="button" onClick={back}>Memos</button><span>/</span><b>{m.catL}</b></nav>
      <header className="mm-head">
        <div className="mm-tags"><em className={'mm-cat is-' + m.cat}>{m.catL}</em><em className={'mm-st is-' + m.st}>{m.stL}</em></div>
        <h1>{m.text}</h1>
        <div className="mm-route"><span><Face p={m.from} size={28} /><span><small>From</small><b>{m.from.n}</b></span></span><i>→</i><span><Face p={m.to} size={28} /><span><small>{m.dept}</small><b>{m.to.n}</b></span></span>{m.who ? <><i>→</i><span><Face p={m.who} size={28} /><span><small>Working on it</small><b>{m.who.n}</b></span></span></> : null}</div>
        {m.about ? <button type="button" className="mm-about" onClick={m.goAbout}>Project · {m.about} →</button> : null}
      </header>
      <ol className="mm-steps" aria-label="Status">{m.steps.map(s => <li key={s.k} className={s.done ? 'is-done' : ''}><i />{s.l}</li>)}</ol>
      <div className="mm-grid">
        <div className="mm-col">
          {m.file ? <section className="mm-box"><h3>Attached by {m.from.n}</h3><button type="button" className="cr-file" onClick={m.file.open}><span className="cr-doc">FILE</span><span><b>{m.file.name}</b></span></button></section> : null}
          <section className="mm-box" aria-label="Work attached">
            <h3>Work attached · {m.files.length}</h3>
            {m.files.length ? <div className="mm-files">{m.files.map((f, i) => <button key={i} type="button" className="mm-file" onClick={f.open} title={f.name}>{f.img ? <img src={f.img} alt="" /> : <span className="bi-doc">FILE</span>}<span><b>{f.name}</b><small>{f.by} · {f.at}</small></span></button>)}</div> : <p className="k-sub">Nothing attached yet.</p>}
            {m.canWork ? <label className="bi-up"><input type="file" onChange={async e => { const fl = e.target.files[0]; e.target.value = ''; if (!fl) return; setBusy(true); const r = await m.attach(fl); setBusy(false); setErr(r); }} aria-label="Attach work" />{busy ? 'Uploading…' : '↑ Attach the work (design, costing, photos)'}</label> : null}
          </section>
          {m.reply ? <section className="mm-box"><h3>Reply</h3><p>{m.reply}</p></section> : null}
          {m.canWork ? (
            <section className="mm-box">
              <h3>Finish</h3>
              {m.canStart ? <button type="button" className="td-start" onClick={m.start}>Start working</button> : null}
              <div className="mr-reply"><input className="ff-search" value={reply} onChange={e => setReply(e.target.value)} placeholder="What was done" aria-label="What was done" /><button type="button" className="me-save" onClick={() => setErr(m.done(reply))}>Mark done</button></div>
            </section>
          ) : null}
          {err ? <div className="fm-err" role="alert">{err}</div> : null}
        </div>
        <div className="mm-col">
          {m.canAssign ? (
            <section className="mm-box" aria-label="Assign">
              <h3>Assign to</h3>
              <div className="ff-people" role="radiogroup" aria-label="Assign memo to">{m.team.map(p => <button key={p.k} type="button" role="radio" aria-checked={!!m.who && m.who.k === p.k} aria-label={p.n} className={m.who && m.who.k === p.k ? 'is-on' : ''} onClick={() => setErr(m.assign(p.k))}><span className="ff-face" style={faceStyle(p)}>{faceText(p)}</span><span className="ff-name">{p.n.split(' ')[0]}</span></button>)}</div>
            </section>
          ) : null}
          <section className="mm-box"><h3>Trail</h3><ul className="mm-log">{m.log.map((l, i) => <li key={i}><b>{l.t}</b><small>{l.by} · {l.at}</small></li>)}</ul></section>
        </div>
      </div>
    </article>
  );
}

export function MemoPage({ v }) {
  const M = v.MEMO;
  if (!M.cur) return <p className="k-sub">Memo not found.</p>;
  return <MemoFull m={M.cur} back={M.back} />;
}

export function MemosPage({ v }) {
  const M = v.MEMO; const [write, setWrite] = useState(false);
  const tabs = [['in', 'For me · ' + M.inbox.filter(m => m.st !== 'done').length], ['sent', 'Sent · ' + M.sent.length], ...(M.all ? [['all', 'All memos · ' + M.all.length]] : [])];
  const list = M.tab === 'sent' ? M.sent : M.tab === 'all' && M.all ? M.all : M.inbox;
  return (
    <div className="mm">
      <header className="mm-top"><div><small>Memos</small><h1>Requests between departments</h1></div><button type="button" className="me-save" onClick={() => setWrite(!write)}>New memo</button></header>
      {write ? <MemoComposer M={M} onDone={() => setWrite(false)} /> : null}
      <div className="rc-smart" role="tablist">{tabs.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={M.tab === k} className={M.tab === k ? 'is-on' : ''} onClick={() => M.setTab(k)}><span>{l}</span></button>)}</div>
      {list.length ? <ul className="mm-list">{list.map(m => <MemoCard key={m.id} m={m} />)}</ul> : <p className="k-sub">No memos here.</p>}
    </div>
  );
}

// A new memo pops up for the department head who receives it (and for the person it is assigned to).
export function MemoPop({ M }) {
  const m = M && M.pop;
  if (!m) return null;
  return (
    <div className="mm-pop" role="dialog" aria-label="New memo arrived">
      <div className={'mm-pop-card' + (m.urgent ? ' is-urgent' : '')}>
        <div className="mm-tags"><em className={'mm-cat is-' + m.cat}>{m.catL}</em><em className="mm-st is-sent">{m.who && m.st === 'assigned' ? 'Assigned to you' : 'New memo'}</em></div>
        <div className="mm-pop-from"><Face p={m.from} size={40} /><span><b>{m.from.n}</b><small>to {m.dept}{m.about ? ' · ' + m.about : ''}</small></span></div>
        <p className="mm-pop-text">{m.text}</p>
        <div className="tg-foot"><button type="button" className="me-cancel" onClick={() => M.skip(m.id)}>Later</button><button type="button" className="me-save" onClick={m.open}>Open memo</button></div>
      </div>
    </div>
  );
}
