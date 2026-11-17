import { PageHead, Card, Btn, Avatar, Kpis, Pill, Empty } from '../../ui/kit';

const BRIEF_PILL = { todo: ['#FBF1DD', '#8A6414'], prog: ['#EFE8FA', '#5A2FA8'], review: ['#E9EFFA', '#3559A8'], done: ['#E6F4EC', '#1F7549'] };

function Briefs({ list, designers, canAssign, from }) {
  if (!list.length) return <Empty>No open briefs.</Empty>;
  return (
    <ul className="dp-briefs">
      {list.map(b => (
        <li key={b.id} data-brief={b.id}>
          <div className="dp-brief-main">
            <b>{b.t}</b>
            <span className="k-sub">{[b.client, b.place, 'due ' + b.due].filter(Boolean).join(' · ')}</span>
            {b.note ? <span className="dp-note">{b.note}</span> : null}
            <span className="k-sub">{from ? 'From ' + b.from + ' · ' : ''}{canAssign ? null : 'With ' + b.who}</span>
          </div>
          <div className="dp-brief-side">
            <Pill l={b.stl} bg={BRIEF_PILL[b.st][0]} fg={BRIEF_PILL[b.st][1]} />
            {canAssign && designers ? (
              <select className="k-select" value={b.whoK} onChange={e => b.assign(e.target.value)} aria-label={'Designer for ' + b.t}>
                {designers.map(d => <option key={d.v} value={d.v}>{d.l}</option>)}
              </select>
            ) : null}
            {b.next && designers ? <Btn kind="dark" onClick={b.move}>{b.next}</Btn> : null}
          </div>
        </li>
      ))}
    </ul>
  );
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
      {D.dept === 'clientservice' ? (
        <div className="dp-target" aria-label={'Target ' + D.targetPct + '% achieved'}><i style={{ width: D.targetPct + '%' }} /></div>
      ) : null}

      {D.dept === 'clientservice' ? (
        <>
          <div className="k-row">
            <Card title="Follow up">
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
          <Briefs list={D.briefs} designers={D.designers} canAssign={D.isMgr} from />
        </Card>
      ) : null}

      {D.dept === 'operations' ? (
        <Card title={'Being delivered · ' + D.delivering.length}>
          {D.delivering.length ? (
            <ul className="dp-list">
              {D.delivering.map(p => (
                <li key={p.id}><button type="button" onClick={p.go}>
                  <b>{p.client} · {p.t}</b>
                  <span className="k-sub">{p.stage} · PM {p.pm} · due {p.due}{p.late ? ' · Delayed' : p.risk ? ' · At risk' : ''}</span>
                </button></li>
              ))}
            </ul>
          ) : <Empty>No projects in production or on site.</Empty>}
        </Card>
      ) : null}

      <div className="k-row">
        <Team D={D} />
        <MyTasks D={D} />
      </div>
    </>
  );
}
