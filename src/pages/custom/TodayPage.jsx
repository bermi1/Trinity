import { useState } from 'react';
import { PageHead, Btn, Avatar, Chips, Empty } from '../../ui/kit';

// One line to type, Enter to add.
function QuickAdd({ placeholder, label, onAdd, done }) {
  const [t, setT] = useState('');
  const add = e => { e.preventDefault(); if (onAdd(t)) setT(''); };
  return (
    <form className="td-add" onSubmit={add}>
      <input value={t} onChange={e => setT(e.target.value)} placeholder={placeholder} aria-label={label} maxLength={200} enterKeyHint="done" />
      <button type="submit" aria-label={'Add · ' + label} disabled={!t.trim()} className={done ? 'is-done' : ''}>+</button>
    </form>
  );
}

// One row: a task someone gave you, or something you wrote yourself.
function Item({ it }) {
  return (
    <li className={'td-item' + (it.done ? ' is-done' : '') + (it.task ? ' is-task' : '')}>
      <button type="button" className="td-tick" onClick={it.toggle} aria-pressed={it.done} aria-label={(it.done ? 'Not done: ' : 'Done: ') + it.t}>
        {it.done ? '✓' : ''}
      </button>
      <span className="td-text">
        {it.t}
        {it.task ? (
          <span className="td-meta">
            {it.pri ? <em className="td-pri">{it.pri}</em> : null}
            {it.from ? <span>From {it.from.split(' ')[0]}</span> : null}
            {it.where ? (it.go ? <button type="button" onClick={it.go}>{it.where}</button> : <span>{it.where}</span>) : null}
            {it.due && !it.done ? <span>Due {it.due}</span> : null}
            {it.started && !it.done ? <span className="td-going">In progress</span> : null}
          </span>
        ) : it.since ? <small>{it.since}</small> : null}
      </span>
      {it.task ? (!it.done && !it.started ? <button type="button" className="td-start" onClick={it.start}>Start</button> : null)
        : <button type="button" className="td-x" onClick={it.remove} aria-label={'Remove: ' + it.t}>×</button>}
    </li>
  );
}

function Mine({ T }) {
  const open = T.assigned.length + T.plan.length;
  return (
    <div className="mw">
      <section className="mw-card mw-main">
        <QuickAdd label="Plan" placeholder="Add something to do…" onAdd={t => T.add(t, false)} />
        <h3 className="mw-h">To do <span>{open}</span></h3>
        {open ? (
          <ul className="td-list">
            {T.assigned.map(it => <Item key={it.id} it={it} />)}
            {T.plan.map(it => <Item key={it.id} it={it} />)}
          </ul>
        ) : <Empty>Nothing to do. Add what you will work on today.</Empty>}
      </section>
      <section className="mw-card mw-done">
        <h3 className="mw-h">Done today <span>{T.done.length}</span></h3>
        <QuickAdd label="Done" placeholder="Finished something else? Add it" onAdd={t => T.add(t, true)} done />
        {T.done.length ? <ul className="td-list">{T.done.map(it => <Item key={it.id} it={it} />)}</ul> : <Empty>Tick an item when you finish it.</Empty>}
        <div className="td-foot">
          {T.sent ? <span className="td-sent">✓ Today’s report sent</span> : <Btn kind="dark" onClick={T.send}>Send my day</Btn>}
          <Btn kind="ghost" onClick={T.share}>WhatsApp</Btn>
        </div>
        <p className="k-sub">“Send my day” goes to your manager as today’s report.</p>
      </section>
    </div>
  );
}

function Given({ T }) {
  return (
    <section className="mw-card">
      <h3 className="mw-h">Tasks you gave <span>{T.given.filter(g => !g.done).length} open</span></h3>
      {T.given.length ? (
        <ul className="td-list">
          {T.given.map(g => (
            <li key={g.id} className={'td-item' + (g.done ? ' is-done' : '')}>
              <span className="pv-face" style={{ background: g.wc, width: 30, height: 30 }}>{g.wi}</span>
              <span className="td-text">{g.t}<span className="td-meta"><span>{g.who}</span><span>{g.done ? 'Done' : g.st + ' · due ' + g.due}</span></span></span>
              {!g.done ? <button type="button" className="td-start" onClick={g.nudge}>Remind</button> : null}
            </li>
          ))}
        </ul>
      ) : <Empty>You have not given anyone a task yet.</Empty>}
    </section>
  );
}

function Team({ T }) {
  return (
    <>
      <div className="td-teamhead">
        <Chips items={[{ l: 'Today', on: T.teamDay === 'today', set: () => T.setTeamDay('today') }, { l: 'Yesterday', on: T.teamDay === 'yesterday', set: () => T.setTeamDay('yesterday') }]} />
        <span className="k-sub">{T.teamDone} of {T.teamTotal} people have written their day</span>
      </div>
      <div className="td-team">
        {T.team.map(p => (
          <section key={p.k} className={'td-person' + (p.empty ? ' is-empty' : '')} data-person={p.k}>
            <header>
              <Avatar p={p} size={30} />
              <b>{p.n}</b>
              {p.sent ? <span className="td-badge">Report sent</span> : null}
            </header>
            {p.empty ? (
              <div className="td-nothing"><span>Nothing yet</span><Btn kind="ghost" onClick={p.remind}>Remind</Btn></div>
            ) : (
              <>
                {p.done.length ? <><h4>Done</h4><ul>{p.done.map(i => <li key={i.id} className="is-done">✓ {i.t}</li>)}</ul></> : null}
                {p.plan.length ? <><h4>To do</h4><ul>{p.plan.map(i => <li key={i.id}>• {i.t}{i.from ? <small> · from {i.from.split(' ')[0]}</small> : i.since ? <small> · {i.since}</small> : null}</li>)}</ul></> : null}
              </>
            )}
          </section>
        ))}
      </div>
    </>
  );
}

// My work: tasks given to you and your own to-dos in one list, what you finished today,
// the tasks you gave others, and (for managers) the whole team.
export default function TodayPage({ v }) {
  const T = v.TD;
  const tabs = [{ l: 'My work', on: !T.isTeam && !T.isGiven, set: T.showMine }];
  if (T.canGive) tabs.push({ l: 'Assigned by me', on: T.isGiven, set: T.showGiven });
  if (T.canTeam) tabs.push({ l: 'Team', on: T.isTeam, set: T.showTeam });
  return (
    <>
      <PageHead kicker={T.dayLabel} title="My work" sub="Tasks you were given and your own to-dos, in one list. Tick them as you finish.">
        {T.canGive ? <Btn kind="dark" onClick={T.give}>Assign a task</Btn> : null}
      </PageHead>
      {tabs.length > 1 ? <Chips items={tabs} /> : null}
      {T.isTeam && T.canTeam ? <Team T={T} /> : T.isGiven && T.canGive ? <Given T={T} /> : <Mine T={T} />}
    </>
  );
}
