import { Card, Btn, Pill, Empty } from '../../ui/kit';
import BriefItem from '../../components/BriefItem';

const TONE = { amber: ['#FBF1DD', '#8A6414'], green: ['#E6F4EC', '#1F7549'], red: ['#FBEDEE', '#B23A46'], blue: ['#E9EFFA', '#3559A8'] };
const Face = ({ p, size = 30 }) => <span className="pv-face" style={{ background: p.c, width: size, height: size }} title={p.n}>{p.i}</span>;

// A project, as each department sees it: the shared header, then only that department's part.
export default function ProjectView({ v }) {
  const P = v.PV;
  if (P.none) return <Card><Empty>This project is not shared with you.</Empty><Btn kind="ghost" onClick={P.back}>Back to projects</Btn></Card>;
  const c = P.can;
  return (
    <div className="pv">
      <button type="button" className="pv-back" onClick={P.back}>← Projects</button>
      <header className="pv-head">
        <div>
          <span className="pv-id">{P.id} · {P.client}</span>
          <h1>{P.name}</h1>
          <p>Due {P.due} · Project Manager: <b>{P.pm}</b></p>
        </div>
        <Pill l={P.st.l} bg={P.st.bg} fg={P.st.fg} />
      </header>

      <ol className="pv-stages" aria-label="Stages">
        {P.stages.map(s => <li key={s.l} className={s.done ? 'is-done' : s.cur ? 'is-cur' : ''}><i />{s.l}</li>)}
      </ol>
      {P.advance && P.nextStage ? <div><Btn kind="dark" onClick={P.advance}>Move to {P.nextStage}</Btn></div> : P.advance ? <div><Btn kind="dark" onClick={P.advance}>Close project</Btn></div> : null}

      <div className="pv-grid">
        {P.clientPart ? (
          <Card title="Client Service" aside={<span className="pv-tag">Client</span>}>
            <dl className="cr-facts">
              <div><dt>Account owner</dt><dd>{P.clientPart.owner}</dd></div>
              {P.clientPart.contact ? <div><dt>Contact</dt><dd>{P.clientPart.contact}</dd></div> : null}
              {P.clientPart.src ? <div><dt>Came in by</dt><dd>{P.clientPart.src}</dd></div> : null}
              {P.clientPart.value ? <div><dt>Agreed value</dt><dd>{P.clientPart.value}</dd></div> : null}
            </dl>
            {P.clientPart.proposal ? <button type="button" className="cr-file" onClick={P.clientPart.proposal.open}><span className="cr-doc">PDF</span><span><b>{P.clientPart.proposal.name}</b><small>Proposal sent to the client</small></span></button> : null}
            {P.clientPart.openLead ? <Btn kind="ghost" onClick={P.clientPart.openLead}>Open lead history</Btn> : null}
          </Card>
        ) : null}

        <Card title="Delivery" aside={<span className="pv-tag">Operations</span>}>
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
          <div className="pv-team">{P.team.length ? P.team.map(p => <span key={p.k} className="pv-member"><Face p={p} size={28} />{p.n.split(' ')[0]}</span>) : <span className="k-sub">No team yet</span>}</div>
          {P.budget ? (
            <div className="pv-budget">
              <div className="pv-bar"><i style={{ width: Math.min(100, P.budget.pct) + '%', background: P.budget.over ? '#D9535F' : '#2B1459' }} /></div>
              <div className="pv-budnums">
                <span><small>Internal budget</small><b>{P.budget.bud}</b></span>
                <span><small>Spent</small><b>{P.budget.spent}</b></span>
                <span><small>Left</small><b className={P.budget.over ? 'is-red' : ''}>{P.budget.left}</b></span>
              </div>
            </div>
          ) : null}
        </Card>

        {P.briefs ? (
          <Card title={'Designs · ' + P.briefs.length} aside={P.newBrief ? <Btn kind="ghost" onClick={P.newBrief}>Send brief</Btn> : <span className="pv-tag">Creative</span>}>
            {P.briefs.length ? <ul className="bi-list">{P.briefs.map(b => <BriefItem key={b.id} b={b} designers={P.designers} showFrom />)}</ul> : <Empty>No design brief yet.</Empty>}
          </Card>
        ) : null}

        <Card title={P.tasksTitle + ' · ' + P.tasks.filter(t => !t.done).length} aside={P.addTask ? <Btn kind="ghost" onClick={P.addTask}>Assign task</Btn> : null}>
          {P.tasks.length ? (
            <ul className="td-list">
              {P.tasks.map(t => (
                <li key={t.id} className={'td-item' + (t.done ? ' is-done' : '')}>
                  <button type="button" className="td-tick" onClick={t.toggle} aria-pressed={t.done} aria-label={(t.done ? 'Not done: ' : 'Done: ') + t.t}>{t.done ? '✓' : ''}</button>
                  <span className="td-text">{t.t}<small className="pv-sub">{t.who} · {t.due}</small></span>
                </li>
              ))}
            </ul>
          ) : <Empty>No tasks for you on this project.</Empty>}
        </Card>

        <Card title={P.reqsTitle} aside={<Btn kind="ghost" onClick={P.reqMoney}>Request money</Btn>}>
          {P.reqs.length ? (
            <ul className="mr-list">
              {P.reqs.map(r => (
                <li key={r.id}><button type="button" onClick={r.open}>
                  <span><b>{r.what}</b><small>{r.who} · {r.id}</small></span>
                  <span className="mr-right"><b>{r.amt}</b><Pill l={r.status} bg={TONE[r.tone][0]} fg={TONE[r.tone][1]} /></span>
                </button></li>
              ))}
            </ul>
          ) : <Empty>No money requests.</Empty>}
        </Card>

        {P.money ? (
          <Card title="Money" aside={<Btn kind="ghost" onClick={P.money.invoice}>Create invoice</Btn>}>
            <div className="pv-budnums">
              <span><small>Contract value</small><b>{P.money.val}</b></span>
              <span><small>Invoiced</small><b>{P.money.invoiced}</b></span>
              <span><small>Margin</small><b>{P.money.margin}</b></span>
            </div>
            {P.money.invoices.length ? <ul className="dp-list">{P.money.invoices.map(i => <li key={i.id}><span><b>{i.id} · {i.v}</b><span className="k-sub">{i.st} · {i.due}</span></span></li>)}</ul> : null}
          </Card>
        ) : null}
      </div>
    </div>
  );
}
