import { useEffect, useState } from 'react';
import { PageHead, Card, Btn, Kpis, Empty, faceStyle, faceText } from '../../ui/kit';

const FOLLOW = ['Today', 'Tomorrow', 'This week', 'Next week'];

function LeadCard({ l }) {
  return (
    <button type="button" className={'cr-card' + (l.stale ? ' is-stale' : '')} onClick={l.open} data-lead={l.id}>
      <span className="cr-card-top"><b>{l.c}</b>{l.v ? <em>{l.v}</em> : null}</span>
      <span className="cr-card-t">{l.t}</span>
      {l.event ? <span className="cr-card-ev">{l.event}</span> : null}
      <span className="cr-card-foot">
        <span className="cr-face" style={{ background: l.oc }} title={l.owner}>{l.oi}</span>
        <span>{l.stale ? l.days + ' days without update' : l.next ? 'Next: ' + l.next : l.stage}</span>
        {l.hasFile ? <span className="cr-doc" title={l.fileL + ' attached'}>{l.fileL === 'Proposal' ? 'PDF' : l.fileL === 'Artwork' ? 'ART' : 'FILE'}</span> : null}
      </span>
    </button>
  );
}

// The lead panel: history, and the next step with exactly what that step needs.
function LeadPanel({ L, reasons }) {
  const [note, setNote] = useState('');
  const [value, setValue] = useState('');
  const [file, setFile] = useState(null);
  const [kind, setKind] = useState('proposal');
  const [busy, setBusy] = useState(false);
  const [lost, setLost] = useState(false);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const [pushErr, setPushErr] = useState('');
  useEffect(() => { const k = e => { if (e.key === 'Escape') L.close(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [L]);

  const pick = async e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    setBusy(true); setErr('');
    try { setFile(await L.store(f)); } catch (x) { setErr('Upload failed · ' + (x.message || x)); }
    setBusy(false);
  };
  const go = (to, extra) => { const e = L.move(to, Object.assign({ note }, extra)); if (e) setErr(e); else { setFile(null); setKind('proposal'); setErr(''); } };
  // Attach the chosen file now, without moving the lead.
  const attachOnly = () => { const e = L.attach(file, kind); if (e) setErr(e); else { setFile(null); setKind('proposal'); setErr(''); } };

  return (
    <div className="cr-back" onClick={L.close}>
      <aside className="cr-panel" onClick={e => e.stopPropagation()} role="dialog" aria-label={'Lead · ' + L.c}>
        <header className="cr-panel-head">
          <div>
            <span className="cr-stage">{L.stage}</span>
            <h2>{L.c}</h2>
            <p>{L.t}{L.v ? ' · ' + L.v : ''}</p>
          </div>
          {L.canEdit ? <button type="button" className="td-start cr-edit" onClick={L.edit}>Edit details</button> : null}
          <button type="button" className="fm-x" onClick={L.close} aria-label="Close">×</button>
        </header>

        <div className="cr-panel-body">
          <dl className="cr-facts">
            <div><dt>Follow-up by</dt><dd>{L.owner}</dd></div>
            <div><dt>Came in by</dt><dd>{L.src || '—'}</dd></div>
            <div><dt>Venue</dt><dd>{L.venue || '—'}</dd></div>
            <div><dt>Setup</dt><dd>{L.setup || '—'}</dd></div>
            <div><dt>Pax</dt><dd>{L.pax || '—'}</dd></div>
            {L.contact ? <div><dt>Contact</dt><dd>{L.contact}</dd></div> : null}
            {L.lost ? <div><dt>Lost because</dt><dd>{L.lost}</dd></div> : null}
          </dl>

          {L.files.map((f, i) => (
            <button key={i} type="button" className="cr-file" onClick={f.open} aria-label={'Open ' + f.label}>
              <span className="cr-doc">{f.kind === 'proposal' ? 'PDF' : f.kind === 'artwork' ? 'ART' : 'FILE'}</span>
              <span><b>{f.label}</b><small>Added by {f.byN}{f.at ? ' · ' + f.at : ''} · {f.size}</small></span>
            </button>
          ))}

          {L.job ? <Btn kind="ghost" onClick={L.goJob}>Open project {L.job}</Btn> : L.can ? (
            <div className="cr-push">
              <Btn kind="primary" onClick={() => { const r = L.push(); setPushErr(r && r.indexOf('PRJ') !== 0 ? r : ''); }}>Make client &amp; open project</Btn>
              <small>Adds {L.c} to clients and opens a project now. The lead stays at {L.stage}.</small>
              {pushErr ? <div className="fm-err" role="alert">{pushErr}</div> : null}
            </div>
          ) : null}

          {L.can && L.next1 != null ? (
            <section className="cr-step">
              <h3>Next step</h3>
              {L.offerFile && !lost ? (
                <>
                  <label className={'ff-file' + (file ? ' is-done' : '')}>
                    <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.ai,.psd,.eps,.svg,image/*" onChange={pick} aria-label="Lead file" />
                    <span className="ff-file-ic" aria-hidden="true">{file ? '✓' : '↑'}</span>
                    <span>{file ? file.name : busy ? 'Uploading…' : 'Attach a file (optional)'}<small>Optional · the proposal, artwork or another file you sent</small></span>
                  </label>
                  {file ? (
                    <div className="ff"><span className="ff-l">This file is</span>
                      <div className="ff-chips" role="radiogroup" aria-label="File type">
                        {L.kinds.map(k => <button key={k.v} type="button" role="radio" aria-checked={kind === k.v} className={kind === k.v ? 'is-on' : ''} onClick={() => setKind(k.v)}>{k.l}</button>)}
                      </div>
                      <button type="button" className="td-link" onClick={attachOnly}>Attach without moving the lead</button>
                    </div>
                  ) : null}
                </>
              ) : null}
              {L.needsValue && !lost ? (
                <label className="ff"><span className="ff-l">Agreed value (TZS M)</span><input inputMode="decimal" value={value} onChange={e => setValue(e.target.value)} placeholder={L.v ? L.v.replace(/[^\d.]/g, '') : 'e.g. 120'} /></label>
              ) : null}
              {lost ? (
                <div className="ff"><span className="ff-l">Why was it lost?</span>
                  <div className="ff-chips" role="radiogroup" aria-label="Reason">
                    {reasons.map(r => <button key={r} type="button" role="radio" aria-checked={reason === r} className={reason === r ? 'is-on' : ''} onClick={() => setReason(r)}>{r}</button>)}
                  </div>
                </div>
              ) : null}
              <label className="ff"><span className="ff-l">Note</span><input value={note} onChange={e => setNote(e.target.value)} placeholder="What happened? (optional)" /></label>
              {err ? <div className="fm-err" role="alert">{err}</div> : null}
              <div className="cr-step-acts">
                {lost ? (
                  <>
                    <Btn kind="danger" onClick={() => go(6, { reason })}>Mark lost</Btn>
                    <Btn kind="ghost" onClick={() => setLost(false)}>Back</Btn>
                  </>
                ) : (
                  <>
                    <Btn kind="dark" disabled={busy} onClick={() => go(L.next1, Object.assign(file && L.offerFile ? { proposal: file, kind } : {}, L.needsValue ? { value } : {}))}>{L.nextLabel}</Btn>
                    <Btn kind="ghost" onClick={() => setLost(true)}>Lost</Btn>
                  </>
                )}
              </div>
            </section>
          ) : !L.can && L.next1 != null ? <p className="k-sub">Only {L.owner} or the Client Service Manager can move this lead.</p> : null}

          {L.can && L.next1 != null ? (
            <div className="ff"><span className="ff-l">Next follow-up</span>
              <div className="ff-chips">{FOLLOW.map(f => <button key={f} type="button" className={L.next === f ? 'is-on' : ''} onClick={() => L.setNext(f)}>{f}</button>)}</div>
            </div>
          ) : null}

          {L.canOwner ? (
            <div className="ff"><span className="ff-l">Follow-up by</span>
              <div className="ff-people">
                {L.team.map(p => <button key={p.v} type="button" aria-label={p.l} className={L.ownerK === p.v ? 'is-on' : ''} onClick={() => L.setOwner(p.v)}><span className="ff-face" style={faceStyle(p)}>{faceText(p)}</span><span className="ff-name">{p.l.split(' ')[0]}</span></button>)}
              </div>
            </div>
          ) : null}

          <Memo L={L} />

          <section>
            <h3 className="cr-h3">History</h3>
            <ol className="cr-hist">
              {L.hist.map((h, i) => <li key={i}><b>{h.stage}</b><span>{h.by} · {h.at}</span>{h.note ? <p>{h.note}</p> : null}</li>)}
            </ol>
          </section>
        </div>
      </aside>
    </div>
  );
}

// A memo to a department, for a lead that only needs a piece of work done.
function Memo({ L }) {
  const [open, setOpen] = useState(false); const [dept, setDept] = useState(''); const [text, setText] = useState(''); const [file, setFile] = useState(null); const [err, setErr] = useState('');
  return (
    <section className="cr-memo">
      <h3 className="cr-h3">Memos</h3>
      {L.memos.length ? <ul className="cr-memos">{L.memos.map(m => <li key={m.id}><b>To {m.to}</b> · <span className={'cr-mst is-' + m.st.toLowerCase()}>{m.st}</span><p>{m.text}</p>{m.reply ? <p className="cr-reply">↳ {m.reply}</p> : null}<small>{m.at}</small></li>)}</ul> : null}
      {open ? (
        <div className="pn-form">
          <div className="ff-chips" role="radiogroup" aria-label="Department">{L.depts.map(d => <button key={d.v} type="button" role="radio" aria-checked={dept === d.v} className={dept === d.v ? 'is-on' : ''} onClick={() => setDept(d.v)}>{d.l}</button>)}</div>
          <textarea rows={3} className="cr-memo-t" value={text} onChange={e => setText(e.target.value)} placeholder="What do you need from them, and by when?" aria-label="Memo" />
          <label className="bi-up"><input type="file" onChange={e => setFile(e.target.files[0] || null)} aria-label="Memo attachment" />{file ? '✓ ' + file.name : '↑ Attach a file (optional)'}</label>
          {err ? <div className="fm-err" role="alert">{err}</div> : null}
          <div className="fh-row"><button type="button" className="me-cancel" onClick={() => setOpen(false)}>Cancel</button><button type="button" className="me-save" onClick={async () => { const m = await L.memo({ dept, text, file }); if (m) setErr(m); else { setOpen(false); setText(''); setFile(null); setDept(''); } }}>Send memo</button></div>
        </div>
      ) : <Btn kind="ghost" onClick={() => setOpen(true)}>Send memo to a department</Btn>}
    </section>
  );
}

// Everything done with one client: projects running now, finished projects, open leads, and deals won or lost.
function History({ c }) {
  const [open, setOpen] = useState(false);
  const n = c.ongoing.length + c.past.length + c.openLeads.length + c.dealt.length;
  if (!n) return <p className="k-sub cr-hist-none">No projects or deals yet.</p>;
  const Job = ({ j }) => (
    <li><button type="button" onClick={j.open} aria-label={'Open project ' + j.name}>
      <b>{j.name}</b>
      <span className="k-sub">{[j.done ? 'Closed' + (j.when ? ' · ' + j.when : '') : j.stage + (j.due ? ' · due ' + j.due : ''), j.pm ? 'PM ' + j.pm : '', j.value, j.po, j.billed].filter(Boolean).join(' · ')}</span>
    </button></li>
  );
  return (
    <div className="cr-hist">
      <button type="button" className="td-link" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Hide history' : 'History · ' + c.ongoing.length + ' ongoing · ' + c.past.length + ' past'}</button>
      {open ? (
        <div className="cr-hist-body" aria-label={'History of ' + c.n}>
          <h4>Ongoing projects · {c.ongoing.length}</h4>
          {c.ongoing.length ? <ul>{c.ongoing.map(j => <Job key={j.id} j={j} />)}</ul> : <p className="k-sub">None running now.</p>}
          <h4>Past projects · {c.past.length}</h4>
          {c.past.length ? <ul>{c.past.map(j => <Job key={j.id} j={j} />)}</ul> : <p className="k-sub">No finished projects yet.</p>}
          {c.openLeads.length ? <><h4>Open leads · {c.openLeads.length}</h4><ul>{c.openLeads.map(l => <li key={l.id}><button type="button" onClick={l.open}><b>{l.t}</b><span className="k-sub">{l.stage}{l.v ? ' · ' + l.v : ''}</span></button></li>)}</ul></> : null}
          {c.dealt.length ? <><h4>Deals won and lost</h4><ul>{c.dealt.map(l => <li key={l.id}><button type="button" onClick={l.open}><b>{l.t}</b><span className="k-sub">{l.won ? 'Won' : 'Lost' + (l.why ? ' · ' + l.why : '')}</span></button></li>)}</ul></> : null}
        </div>
      ) : null}
    </div>
  );
}

function Customers({ C }) {
  const [q, setQ] = useState('');
  const list = q ? C.customers.filter(c => (c.n + ' ' + c.contact + ' ' + c.city).toLowerCase().includes(q.toLowerCase())) : C.customers;
  return (
    <>
      <div className="cr-search"><input className="ff-search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search clients" aria-label="Search clients" /></div>
      <div className="cr-cust">
        {list.map(c => (
          <article key={c.id} className="cr-cust-card" data-customer={c.n}>
            <header><b>{c.n}</b>{c.active ? <span className="cr-active">{c.active} active</span> : null}{c.canEdit ? <button type="button" className="td-start cr-edit" onClick={c.edit} aria-label={'Edit ' + c.n}>Edit</button> : null}</header>
            <p>{c.contact || '—'}</p>
            <p className="k-sub">{[c.phone, c.email].filter(Boolean).join(' · ') || 'No contact details yet'}</p>
            {c.tin || c.vrn ? <p className="k-sub">{[c.tin ? 'TIN ' + c.tin : '', c.vrn ? 'VRN ' + c.vrn : ''].filter(Boolean).join(' · ')}</p> : null}
            <footer>
              <span>{c.jobs} jobs{c.value ? ' · ' + c.value : ''}{c.leads ? ' · ' + c.leads + ' open leads' : ''}</span>
              <span className="k-sub">{c.ownerN}</span>
            </footer>
            <History c={c} />
          </article>
        ))}
        {!list.length ? <Empty>No clients match.</Empty> : null}
      </div>
    </>
  );
}

// Client Service CRM: leads, customers, won and lost.
export default function ClientsPage({ v }) {
  const C = v.CR;
  const [stage, setStage] = useState(0);
  const tabs = [['leads', 'Leads'], ['customers', 'Clients · ' + C.customers.length], ['won', 'Won · ' + C.won.length], ['lost', 'Lost · ' + C.lost.length]];
  return (
    <>
      <PageHead kicker="Client Service" title="Clients & leads" sub="Every lead has one person following it up. Each step is recorded with who and when.">
        <Btn kind="dark" onClick={C.newWork}>New work</Btn>
        <Btn kind="ghost" onClick={C.newCustomer}>Add client</Btn>
      </PageHead>
      <Kpis items={C.kpis} />
      <div className="k-chips cr-tabs" role="tablist">
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={C.tab === k} className={C.tab === k ? 'is-on' : ''} onClick={() => C.setTab(k)}>{l}</button>)}
      </div>

      {C.tab === 'leads' ? (
        <>
          <div className="k-chips cr-stagechips" aria-label="Stages">
            {C.stages.map(s => <button key={s.i} className={stage === s.i ? 'is-on' : ''} onClick={() => setStage(s.i)}>{s.l} · {s.n}</button>)}
          </div>
          <div className="cr-board">
            {C.stages.map(s => (
              <section key={s.i} className={'cr-col' + (stage === s.i ? ' is-cur' : '')} aria-label={s.l}>
                <h3>{s.l}<span>{s.n}</span></h3>
                {s.leads.length ? s.leads.map(l => <LeadCard key={l.id} l={l} />) : <p className="cr-empty">Nothing here</p>}
              </section>
            ))}
          </div>
        </>
      ) : null}
      {C.tab === 'customers' ? <Customers C={C} /> : null}
      {C.tab === 'won' || C.tab === 'lost' ? (
        <Card>
          {(C.tab === 'won' ? C.won : C.lost).length ? (
            <ul className="dp-list">
              {(C.tab === 'won' ? C.won : C.lost).map(l => (
                <li key={l.id}><button type="button" onClick={l.open}><b>{l.c} · {l.t}</b><span className="k-sub">{C.tab === 'lost' ? 'Lost · ' + l.lost : 'Won' + (l.v ? ' · ' + l.v : '')} · {l.owner}</span></button></li>
              ))}
            </ul>
          ) : <Empty>Nothing yet.</Empty>}
        </Card>
      ) : null}
      {/* A new key resets the step form whenever the lead or its stage changes. */}
      {C.sel ? <LeadPanel key={C.sel.id + ':' + C.sel.st} L={C.sel} reasons={C.reasons} /> : null}
    </>
  );
}
