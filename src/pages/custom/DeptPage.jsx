import { useState } from 'react';
import BriefItem from '../../components/BriefItem';
import TargetPanel from './TargetPanel';
import { MemoCard } from './MemoPage';
import { PageHead, Card, Btn, Avatar, Kpis, Pill, Empty } from '../../ui/kit';

function Briefs({ list, designers, from }) {
  if (!list.length) return <Empty>No open briefs.</Empty>;
  return <ul className="dp-briefs bi-list">{list.map(b => <BriefItem key={b.id} b={b} designers={designers} showFrom={from} />)}</ul>;
}

function Team({ D }) {
  if (!D.isMgr) return null;
  return (
    <Card title={'My team · ' + D.team.length} aside={<span className="k-sub">Daily to-do and open tasks</span>}>
      {D.team.length ? (
        <ul className="dp-team">
          {D.team.map(p => (
            <li key={p.k} data-member={p.k}>
              <Avatar p={p} size={32} />
              <div className="dp-team-who"><b>{p.n}</b><span className="k-sub">{p.role}</span></div>
              <span className="dp-team-nums">
                <span title="Done today">✓ {p.done}</span>
                <span title="Planned">• {p.plan}</span>
                <span title="Open tasks">{p.open} tasks</span>
                {p.sent ? <span className="dp-sent">Day sent</span> : null}
              </span>
              <span className="dp-team-acts">
                <Btn kind="ghost" onClick={p.assign}>Assign task</Btn>
                {!p.done && !p.plan ? <Btn kind="ghost" onClick={p.remind}>Remind</Btn> : null}
              </span>
            </li>
          ))}
        </ul>
      ) : <Empty>No one in this department yet.</Empty>}
    </Card>
  );
}

function MyTasks({ D }) {
  return (
    <Card title="My tasks" aside={<Btn kind="ghost" onClick={D.newTask}>{D.canAssign ? 'New task' : 'Add task'}</Btn>}>
      {D.myTasks.length ? (
        <ul className="dp-tasks">
          {D.myTasks.map(t => (
            <li key={t.id}>
              <button type="button" className="td-tick" onClick={t.done} aria-label={'Done: ' + t.t} />
              <span><b>{t.t}</b><span className="k-sub">{[t.client, t.due].filter(Boolean).join(' · ')}</span></span>
            </li>
          ))}
        </ul>
      ) : <Empty>No open tasks.</Empty>}
    </Card>
  );
}

// Department dashboard: Client Service, Creative or Operations.
function Memos({ list }) {
  const [reply, setReply] = useState({});
  if (!list.length) return null;
  return (
    <Card title={'Memos · ' + list.filter(m => m.st !== 'done').length + ' open'}>
      <ul className="cr-memos">
        {list.map(m => (
          <li key={m.id} data-memo={m.id}>
            <b>From {m.from}</b>{m.lead ? ' · ' + m.lead : ''} · <span className={'cr-mst is-' + m.st}>{m.st === 'sent' ? 'New' : m.st === 'seen' ? 'Seen' : 'Done'}</span>
            <p>{m.text}</p>{m.reply ? <p className="cr-reply">↳ {m.reply}</p> : null}
            {m.file ? <button type="button" className="td-start" onClick={m.file}>Open attachment</button> : null}
            {m.st !== 'done' ? (
              <div className="mr-reply">
                {m.st === 'sent' ? <button type="button" className="td-start" onClick={m.seen}>Mark seen</button> : null}
                <input className="ff-search" value={reply[m.id] || ''} onChange={e => setReply(Object.assign({}, reply, { [m.id]: e.target.value }))} placeholder="Reply (what was done)" aria-label={'Reply to memo from ' + m.from} />
                <Btn kind="dark" onClick={() => m.done(reply[m.id] || '')}>Done</Btn>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function DeptPage({ v }) {
  const D = v.DP;
  if (!D.has) return <Card><Empty>This page is for department portals.</Empty></Card>;
  return (
    <>
      <PageHead kicker={D.label + ' department'} title={'Hello, ' + D.first} sub={D.isMgr ? 'You lead ' + D.label + '. Your team’s day and tasks are below.' : 'Manager: ' + D.mgrName}>
        {D.dept === 'clientservice' ? (
          <>
            <Btn kind="dark" onClick={D.actions.project}>New project</Btn>
            <Btn kind="ghost" onClick={D.actions.lead}>New lead</Btn>
            <Btn kind="ghost" onClick={D.actions.brief}>Send brief to Creative</Btn>
          </>
        ) : null}
        {D.dept === 'operations' ? <Btn kind="dark" onClick={D.request}>Request money</Btn> : null}
      </PageHead>
      <div className="dp-kpis"><Kpis items={D.kpis} /></div>
      {v.MEMO && v.MEMO.inbox.filter(m => m.st !== 'done').length ? (
        <Card title={'Memos · ' + v.MEMO.inbox.filter(m => m.st !== 'done').length + ' open'} aside={<Btn kind="ghost" onClick={v.MEMO.goList}>All memos</Btn>}>
          <ul className="mm-list">{v.MEMO.inbox.filter(m => m.st !== 'done').slice(0, 5).map(m => <MemoCard key={m.id} m={m} />)}</ul>
        </Card>
      ) : null}
      {D.dept === 'clientservice' && v.TG ? <TargetPanel T={v.TG} /> : null}

      {D.dept === 'clientservice' ? (
        <>
          <div className="k-row">
            <Card title="Follow up">
              {D.flowTodo && D.flowTodo.length ? <ul className="dp-list dp-flow">{D.flowTodo.map((f, i) => <li key={'f' + i}><button type="button" onClick={f.go}><b>{f.t}</b><span className="k-sub">{f.s}</span></button></li>)}</ul> : null}
              {D.followUps.length ? <ul className="dp-list">{D.followUps.map((f, i) => <li key={i}><button type="button" onClick={f.go}><b>{f.t}</b><span className="k-sub">{f.s}</span></button></li>)}</ul> : <Empty>Nothing to follow up.</Empty>}
            </Card>
            <Card title={'Clients · ' + D.clients.length} aside={<Btn kind="ghost" onClick={D.actions.proposals}>Proposals</Btn>}>
              <ul className="dp-list">{D.clients.map(c => <li key={c.n}><span><b>{c.n}</b><span className="k-sub">{c.active} active · {c.projects} projects{c.leads ? ' · ' + c.leads + ' open leads' : ''}</span></span></li>)}</ul>
            </Card>
          </div>
          <Card title={'Briefs with Creative · ' + D.briefs.length}><Briefs list={D.briefs} /></Card>
        </>
      ) : null}

      {D.dept === 'creative' ? (
        <Card title={D.isMgr ? 'Brief inbox' : 'My briefs'} aside={<span className="k-sub">From Client Service</span>}>
          <Briefs list={D.briefs} designers={D.isMgr ? D.designers : null} from />
        </Card>
      ) : null}

      {D.dept === 'operations' ? (
        <>
        <Card title={'Budgets to prepare · ' + D.toBudget.length}>
          {D.toBudget.length ? <ul className="dp-list">{D.toBudget.map(f => <li key={f.id}><button type="button" onClick={f.go}><b>{f.t}</b><span className="k-sub">{f.s}</span></button></li>)}</ul> : <Empty>No budgets waiting.</Empty>}
          {D.waitingAppr.length ? <ul className="dp-list">{D.waitingAppr.map(f => <li key={f.id}><button type="button" onClick={f.go}><b>{f.t}</b><span className="k-sub">{f.s}</span></button></li>)}</ul> : null}
        </Card>
        <Card title={'In execution · ' + D.delivering.length}>
          {D.delivering.length ? (
            <ul className="dp-list">
              {D.delivering.map(p => (
                <li key={p.id}><button type="button" onClick={p.go}>
                  <b>{p.client} · {p.t}</b>
                  <span className="k-sub">{p.stage} · due {p.due}{p.late ? ' · Delayed' : p.risk ? ' · At risk' : ''}</span>
                </button></li>
              ))}
            </ul>
          ) : <Empty>No projects in execution.</Empty>}
        </Card>
        </>
      ) : null}

      <div className="k-row">
        <Team D={D} />
        <MyTasks D={D} />
      </div>
    </>
  );
}
