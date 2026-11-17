import { useState } from 'react';
import { PageHead, Card, Btn, Avatar, Chips, Empty } from '../../ui/kit';

// One line to type, Enter to add.
function QuickAdd({ placeholder, label, onAdd }) {
  const [t, setT] = useState('');
  const add = e => { e.preventDefault(); if (onAdd(t)) setT(''); };
  return (
    <form className="td-add" onSubmit={add}>
      <input value={t} onChange={e => setT(e.target.value)} placeholder={placeholder} aria-label={label} maxLength={200} enterKeyHint="done" />
      <button type="submit" aria-label={'Add · ' + label} disabled={!t.trim()}>+</button>
    </form>
  );
}

function Item({ it }) {
  return (
    <li className={'td-item' + (it.done ? ' is-done' : '')}>
      <button type="button" className="td-tick" onClick={it.toggle} aria-pressed={it.done} aria-label={(it.done ? 'Not done: ' : 'Done: ') + it.t}>
        {it.done ? '✓' : ''}
      </button>
      <span className="td-text">{it.t}{it.since ? <small>{it.since}</small> : null}</span>
      <button type="button" className="td-x" onClick={it.remove} aria-label={'Remove: ' + it.t}>×</button>
    </li>
  );
}

function Mine({ T }) {
  return (
    <>
      <div className="k-row td-cols">
        <Card title={'To do · ' + T.plan.length}>
          <QuickAdd label="Plan" placeholder="What will you do? e.g. Set up 4 gazebos" onAdd={t => T.add(t, false)} />
          {T.fromTasks.length ? (
            <div className="td-suggest">
              <span>From your tasks:</span>
              {T.fromTasks.map(s => <button key={s.t} type="button" onClick={s.add}>+ {s.t}</button>)}
            </div>
          ) : null}
          {T.plan.length ? <ul className="td-list">{T.plan.map(it => <Item key={it.id} it={it} />)}</ul> : <Empty>Nothing planned yet. Add what you will work on.</Empty>}
        </Card>
        <Card title={'Done today · ' + T.done.length}>
          <QuickAdd label="Done" placeholder="What did you finish?" onAdd={t => T.add(t, true)} />
          {T.done.length ? <ul className="td-list">{T.done.map(it => <Item key={it.id} it={it} />)}</ul> : <Empty>Tick a to-do or add what you finished.</Empty>}
        </Card>
      </div>
      <div className="td-foot">
        {T.sent ? <span className="td-sent">✓ Today’s report sent</span> : <Btn kind="dark" onClick={T.send}>Send my day</Btn>}
        <Btn kind="ghost" onClick={T.share}>Share on WhatsApp</Btn>
        <span className="k-sub">Your manager sees this list. “Send my day” counts as today’s daily report.</span>
      </div>
    </>
  );
}

function Team({ T }) {
  return (
    <>
      <div className="td-teamhead">
        <Chips items={[{ l: 'Today', on: T.teamDay === 'today', set: () => T.setTeamDay('today') }, { l: 'Yesterday', on: T.teamDay === 'yesterday', set: () => T.setTeamDay('yesterday') }]} />
        <span className="k-sub">{T.teamDone} of {T.teamTotal} people have written their to-do</span>
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
                {p.plan.length ? <><h4>Plan</h4><ul>{p.plan.map(i => <li key={i.id}>• {i.t}{i.since ? <small> · {i.since}</small> : null}</li>)}</ul></> : null}
              </>
            )}
          </section>
        ))}
      </div>
    </>
  );
}

// Daily to-do: what each person did today and plans to do. Managers also see the whole team.
export default function TodayPage({ v }) {
  const T = v.TD;
  return (
    <>
      <PageHead kicker={T.dayLabel} title="Daily to-do" sub="What you did today and what you plan to do. It takes a minute.">
        {T.canTeam ? <Chips items={[{ l: 'My list', on: !T.isTeam, set: T.showMine }, { l: 'Team', on: T.isTeam, set: T.showTeam }]} /> : null}
      </PageHead>
      {T.isTeam && T.canTeam ? <Team T={T} /> : <Mine T={T} />}
    </>
  );
}
