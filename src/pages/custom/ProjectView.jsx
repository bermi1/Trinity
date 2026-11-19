import { useState } from 'react';
import { Btn, Pill, Empty } from '../../ui/kit';
import BriefItem from '../../components/BriefItem';
import ProjectNow from './ProjectNow';

const TONE = { amber: ['#FBF1DD', '#8A6414'], green: ['#E6F4EC', '#1F7549'], red: ['#FBEDEE', '#B23A46'], blue: ['#E9EFFA', '#3559A8'] };
const Face = ({ p, size = 28 }) => <span className="pv-face" style={{ background: p.c, width: size, height: size, fontSize: size < 26 ? 9.5 : 11 }} title={p.n}>{p.i}</span>;
const Field = ({ l, children }) => <div className="rc-field"><dt>{l}</dt><dd>{children}</dd></div>;

function Feed({ P }) {
  const [t, setT] = useState('');
  return (
    <aside className="rc-feed" aria-label="Activity">
      <form className="rc-note" onSubmit={e => { e.preventDefault(); if (P.addNote(t)) setT(''); }}>
        <textarea value={t} onChange={e => setT(e.target.value)} placeholder="Log a note for the team on this project…" rows={2} aria-label="Note" />
        <Btn kind="dark" disabled={!t.trim()}>Log note</Btn>
      </form>
      <h3 className="rc-feed-h">Activity</h3>
      {P.feed.length ? (
        <ol className="rc-events">
          {P.feed.map((e, i) => (
            <li key={i} className={'is-' + e.tone}>
              <Face p={e.w} size={28} />
              <div>
                <p><b>{e.w.n.split(' ')[0]}</b> · {e.t}{e.at ? <time>{e.at}</time> : null}</p>
                {e.s ? <span className={e.note ? 'rc-bubble' : ''}>{e.s}</span> : null}
              </div>
            </li>
          ))}
        </ol>
      ) : <Empty>Nothing yet.</Empty>}
    </aside>
  );
}

function Overview({ P }) {
  return (
    <div className="rc-sections">
      {P.clientPart ? (
        <section className="rc-sec">
          <h3><span className="rc-dot" style={{ background: '#3559A8' }} />Client Service</h3>
          <dl className="rc-fields">
            <Field l="Account owner">{P.clientPart.owner}</Field>
            {P.clientPart.contact ? <Field l="Client contact">{P.clientPart.contact}</Field> : null}
            {P.clientPart.src ? <Field l="Came in by">{P.clientPart.src}</Field> : null}
            {P.clientPart.value ? <Field l="Agreed value">{P.clientPart.value}</Field> : null}
          </dl>
          <div className="rc-row">
            {P.clientPart.proposal ? <button type="button" className="cr-file" onClick={P.clientPart.proposal.open}><span className="cr-doc">PDF</span><span><b>{P.clientPart.proposal.name}</b><small>Proposal sent to the client</small></span></button> : null}
            {P.clientPart.openLead ? <Btn kind="ghost" onClick={P.clientPart.openLead}>Lead history</Btn> : null}
          </div>
        </section>
      ) : null}

      <section className="rc-sec">
        <h3><span className="rc-dot" style={{ background: '#B49A5A' }} />{P.budget || P.pmOpts ? 'Operations' : 'Team'}</h3>
        {P.pmOpts ? (
          <div className="ff" data-field="Project Manager">
            <span className="ff-l">Project Manager{!P.pmSet ? <em> · choose one</em> : null}</span>
            <div className="ff-people" role="radiogroup" aria-label="Project Manager">
              {P.pmOpts.map(p => (
                <button key={p.k} type="button" role="radio" aria-checked={P.pm === p.n} aria-label={p.n} className={P.pm === p.n ? 'is-on' : ''} onClick={() => P.setPM(p.k)}>
                  <span className="ff-face" style={{ background: p.c }}>{p.i}</span><span className="ff-name">{p.n.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="pv-team">{P.team.length ? P.team.map(p => <span key={p.k} className="pv-member"><Face p={p} size={26} />{p.n.split(' ')[0]}</span>) : <span className="k-sub">No team yet</span>}</div>
        {P.budget ? (
          <div className="pv-budget">
            <div className="pv-budnums">
              <span><small>Internal budget</small><b>{P.budget.bud}</b></span>
              <span><small>Spent</small><b>{P.budget.spent}</b></span>
              <span><small>Left</small><b className={P.budget.over ? 'is-red' : ''}>{P.budget.left}</b></span>
            </div>
            <div className="pv-bar"><i style={{ width: Math.min(100, P.budget.pct) + '%', background: P.budget.over ? '#D9535F' : 'linear-gradient(90deg,#2B1459,#6D3CC2)' }} /></div>
            <span className="k-sub">{P.budget.pct}% of the internal budget used</span>
          </div>
        ) : null}
      </section>

      {P.proposalFile ? (
        <section className="rc-sec">
          <h3><span className="rc-dot" style={{ background: '#3559A8' }} />Proposal</h3>
          <button type="button" className="cr-file" onClick={P.proposalFile.open}><span className="cr-doc">PDF</span><span><b>{P.proposalFile.name}</b><small>Uploaded by {P.proposalFile.by} · {P.proposalFile.at}{P.proposalFile.note ? ' · ' + P.proposalFile.note : ''}</small></span></button>
        </section>
      ) : null}
      {P.budgetSheet ? (
        <section className="rc-sec">
          <h3><span className="rc-dot" style={{ background: '#B49A5A' }} />Internal budget · {P.budgetSheet.st}</h3>
          <div className="fr-table-wrap"><table className="fr-table"><thead><tr><th>Item</th><th className="r">Qty</th><th className="r">Unit cost</th><th className="r">Total</th></tr></thead>
            <tbody>{P.budgetSheet.lines.map((l, i) => <tr key={i}><td>{l.item}</td><td className="r">{l.qty}</td><td className="r">{l.cost}</td><td className="r">{l.total}</td></tr>)}</tbody></table></div>
          <div className="pv-budnums"><span><small>Internal budget</small><b>{P.budgetSheet.internal}</b></span><span><small>Project value</small><b>{P.budgetSheet.value}</b></span><span><small>Margin</small><b>{P.budgetSheet.margin}</b></span></div>
          {P.budgetSheet.gm || P.budgetSheet.mgmt ? <p className="k-sub">{P.budgetSheet.gm ? 'GM: ' + P.budgetSheet.gm : ''}{P.budgetSheet.mgmt ? ' · Management: ' + P.budgetSheet.mgmt : ''}</p> : null}
          {P.budgetSheet.file ? <button type="button" className="cr-file" onClick={P.budgetSheet.file.open}><span className="cr-doc">XLS</span><span><b>{P.budgetSheet.file.name}</b><small>Budget file</small></span></button> : null}
        </section>
      ) : null}
      {P.money ? (
        <section className="rc-sec">
          <h3><span className="rc-dot" style={{ background: '#2E9B63' }} />Finance</h3>
          <div className="pv-budnums">
            <span><small>Contract value</small><b>{P.money.val}</b></span>
            <span><small>Invoiced</small><b>{P.money.invoiced}</b></span>
            <span><small>Margin</small><b>{P.money.margin}</b></span>
          </div>
        </section>
      ) : null}
    </div>
  );
}

// A project as one record, the way Odoo and Zoho show it: breadcrumb and actions, the stage bar,
// the key fields, count buttons that open each part, and the activity on the side.
// What appears depends on the person: each department sees the part it adds.
export default function ProjectView({ v }) {
  const P = v.PV;
  if (P.none) return <div className="rc-sheet"><Empty>This project is not shared with you.</Empty><Btn kind="ghost" onClick={P.back}>Back to projects</Btn></div>;
  const tab = P.tabs.some(t => t.k === P.tab) ? P.tab : 'overview';
  return (
    <div className="rc">
      <div className="rc-bar">
        <nav className="rc-crumbs" aria-label="Breadcrumb"><button type="button" onClick={P.back}>Projects</button><span>/</span><b>{P.id}</b></nav>
        <div className="rc-acts">
          {P.addTask ? <Btn kind="ghost" onClick={P.addTask}>Assign task</Btn> : null}
          <Btn kind="ghost" onClick={P.reqMoney}>Request money</Btn>
          {P.newBrief ? <Btn kind="ghost" onClick={P.newBrief}>Send design brief</Btn> : null}
          {P.money ? <Btn kind="ghost" onClick={P.money.invoice}>Create invoice</Btn> : null}
        </div>
      </div>

      <ol className="rc-status" aria-label="Stage">
        {P.stages.map(s => <li key={s.l} className={s.done ? 'is-done' : s.cur ? 'is-cur' : ''} aria-current={s.cur ? 'step' : undefined}>{s.l}</li>)}
      </ol>

      {P.now ? <ProjectNow key={P.now.flow + (P.now.returned ? 'r' : '')} N={P.now} /> : null}
      <div className="rc-body">
        <article className="rc-sheet">
          <header className="rc-title">
            <div>
              <span className="pv-id">{P.client}</span>
              <h1>{P.name}</h1>
            </div>
            <Pill l={P.st.l} bg={P.st.bg} fg={P.st.fg} />
          </header>
          <dl className="rc-fields rc-main">
            <Field l="Client">{P.client}</Field>
            <Field l="Project Manager">{P.pmSet ? P.pm : <em className="rc-missing">Not chosen yet</em>}</Field>
            <Field l="Due">{P.due}</Field>
            <Field l="Stage">{P.stageLabel}</Field>
          </dl>

          <div className="rc-smart" role="tablist">
            {P.tabs.map(t => (
              <button key={t.k} type="button" role="tab" aria-selected={tab === t.k} className={tab === t.k ? 'is-on' : ''} onClick={() => P.setTab(t.k)}>
                {t.n ? <b>{t.n}</b> : null}<span>{t.l}</span>
              </button>
            ))}
          </div>

          <div className="rc-tab">
            {tab === 'overview' ? <Overview P={P} /> : null}
            {tab === 'designs' ? (P.briefs.length ? <ul className="bi-list">{P.briefs.map(b => <BriefItem key={b.id} b={b} designers={P.designers} showFrom />)}</ul> : <Empty>No design brief yet.</Empty>) : null}
            {tab === 'tasks' ? (
              P.tasks.length ? (
                <ul className="td-list">
                  {P.tasks.map(t => (
                    <li key={t.id} className={'td-item' + (t.done ? ' is-done' : '')}>
                      <button type="button" className="td-tick" onClick={t.toggle} aria-pressed={t.done} aria-label={(t.done ? 'Not done: ' : 'Done: ') + t.t}>{t.done ? '✓' : ''}</button>
                      <span className="td-text">{t.t}<span className="td-meta"><span>{t.who}</span><span>Due {t.due}</span></span></span>
                      <Face p={t.wi} size={26} />
                    </li>
                  ))}
                </ul>
              ) : <Empty>No tasks for you on this project.</Empty>
            ) : null}
            {tab === 'money' ? (
              P.reqs.length ? (
                <ul className="mr-list">
                  {P.reqs.map(r => (
                    <li key={r.id}><button type="button" onClick={r.open}>
                      <span><b>{r.what}</b><small>{r.who} · {r.id}</small></span>
                      <span className="mr-right"><b>{r.amt}</b><Pill l={r.status} bg={TONE[r.tone][0]} fg={TONE[r.tone][1]} /></span>
                    </button></li>
                  ))}
                </ul>
              ) : <Empty>No money requests.</Empty>
            ) : null}
            {tab === 'invoices' && P.money ? (
              P.money.invoices.length ? <ul className="mr-list">{P.money.invoices.map(i => <li key={i.id}><button type="button"><span><b>{i.id}</b><small>Due {i.due}</small></span><span className="mr-right"><b>{i.v}</b><span className="k-sub">{i.st}</span></span></button></li>)}</ul> : <Empty>No invoices yet.</Empty>
            ) : null}
          </div>
        </article>
        <Feed P={P} />
      </div>
    </div>
  );
}
