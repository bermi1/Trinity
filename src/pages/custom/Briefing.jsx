import { useState } from 'react';
import { PageHead, Btn, Empty } from '../../ui/kit';

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

function Decide({ B }) {
  const [f, setF] = useState({ d: '', a: '', o: '', due: 'Fri', p: '' }); const [err, setErr] = useState('');
  const set = (k, v) => setF(x => Object.assign({}, x, { [k]: v }));
  return (
    <div className="pn-form" aria-label="New decision" role="group">
      <input className="me-who" value={f.d} onChange={e => set('d', e.target.value)} placeholder="Decision (e.g. Follow up Kilimo Bank permits with the council)" aria-label="Decision" />
      <input className="me-who" value={f.a} onChange={e => set('a', e.target.value)} placeholder="Action: what exactly must be done" aria-label="Action" />
      <div className="ff-people br-people" role="radiogroup" aria-label="Who does it">{B.people.map(p => <button key={p.v} type="button" role="radio" aria-checked={f.o === p.v} aria-label={p.l} className={f.o === p.v ? 'is-on' : ''} onClick={() => set('o', p.v)}><span className="ff-face" style={{ background: p.c }}>{p.i}</span><span className="ff-name">{p.l.split(' ')[0]}</span></button>)}</div>
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
  if (!B) return <Empty>The Monday Briefing is for Management, the GM and department heads.</Empty>;
  return (
    <div className="br">
      <PageHead kicker={'Week of ' + B.week} title="Monday Briefing" sub={'Last week (' + B.range + ') from the system, each department’s update, this week ahead, and decisions that become tasks.'}>
        {B.chair ? <Btn kind="dark" onClick={() => setErr(B.publish())}>{B.published ? 'Minutes published' : 'Publish minutes'}</Btn> : null}
      </PageHead>
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
      {B.published ? <p className="mr-recline">Minutes published by {B.published}</p> : null}

      <section className="hd-kpis br-kpis">{B.stats.map(k => <div key={k.l} className="hd-kpi"><span>{k.l}</span><b>{k.v}</b></div>)}{B.money ? <div className="hd-kpi"><span>Money in / out last week</span><b>{B.money.in}</b><small>out {B.money.out}</small></div> : null}</section>

      {B.lastActions.length ? (
        <section className="fh-card"><h3>Last week’s actions</h3>
          <ul className="br-list">{B.lastActions.map((a, i) => <li key={i} className={a.done ? 'is-done' : 'is-open'}><b>{a.done ? '✓' : '○'} {a.a}</b><small>{a.who}{a.report ? ' · ' + a.report : a.done ? '' : ' · still open'}</small></li>)}</ul>
        </section>
      ) : null}

      <div className="fr-two">
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
      </div>

      <div className="fr-two">
        <section className="fh-card"><h3>Last week in the projects</h3>
          {B.moved.length ? <ul className="br-list">{B.moved.map((m, i) => <li key={i}><b>{m.t}</b><small>{m.s} · {m.at}</small></li>)}</ul> : <Empty>No project steps last week.</Empty>}
        </section>
        <section className="fh-card"><h3>This week</h3>
          {B.weekItems.length ? <ul className="br-list">{B.weekItems.map(d => <li key={d.l}><b>{d.l}</b>{d.items.map((t, i) => <small key={i}>{t}</small>)}</li>)}</ul> : <Empty>Nothing on the calendar.</Empty>}
        </section>
      </div>

      <section className="fh-card"><h3>Decisions and actions · {B.decisions.length}</h3>
        {B.decisions.length ? <ul className="br-list">{B.decisions.map((x, i) => <li key={i}><b>{x.d}</b><small>Action: {x.a} · {x.who} · due {x.due}{x.st ? ' · ' + x.st : ''}</small></li>)}</ul> : <p className="k-sub">Decisions recorded in the meeting become tasks for the person responsible.</p>}
        {B.chair && !B.published ? <Decide B={B} /> : null}
      </section>
    </div>
  );
}
