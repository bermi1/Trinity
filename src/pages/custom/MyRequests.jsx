import { PageHead, Card, Btn, Pill, Chips, Empty } from '../../ui/kit';

const TONE = { amber: ['#FBF1DD', '#8A6414'], green: ['#E6F4EC', '#1F7549'], red: ['#FBEDEE', '#B23A46'], blue: ['#E9EFFA', '#3559A8'] };

function Req({ r, showWho }) {
  return (
    <li className={'mr-item' + (r.sel ? ' is-open' : '')} data-req={r.id}>
      <button type="button" className="mr-row" onClick={r.toggle} aria-expanded={r.sel}>
        <span className="mr-left"><b>{r.what}</b><small>{showWho ? r.who + ' · ' : ''}{r.where}{r.need ? ' · needed ' + r.need : ''}</small></span>
        <span className="mr-right"><b>{r.amt}</b><Pill l={r.status} bg={TONE[r.tone][0]} fg={TONE[r.tone][1]} /></span>
      </button>
      {r.sel ? (
        <div className="mr-detail">
          {r.purpose ? <p>{r.purpose}</p> : null}
          <ol className="mr-steps">
            {r.steps.map((x, i) => <li key={i} className={x.rej ? 'is-rej' : x.done ? 'is-done' : x.cur ? 'is-cur' : ''}><i />{x.l}{x.at ? <small>{x.at}</small> : x.cur ? <small>Now</small> : null}</li>)}
          </ol>
          {r.note ? <p className="bi-ret">Reason: {r.note}</p> : null}
          <div className="mr-acts">
            <span className="k-sub">{r.id}</span>
            {r.nudge ? <Btn kind="ghost" onClick={r.nudge}>Remind approver</Btn> : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}

// My requests: what you asked for, where each one is, and what happened. Nothing else.
export default function MyRequests({ M }) {
  const team = M.scope === 'team';
  return (
    <>
      <PageHead kicker="Money" title={team ? M.deptL + ' requests' : 'My requests'} sub="Ask for money for a project or the office, and follow each request until it is paid.">
        <Btn kind="dark" onClick={M.newReq}>New request</Btn>
      </PageHead>
      {M.mgr ? <Chips items={[{ l: 'Mine', on: !team, set: () => M.setScope('mine') }, { l: M.deptL, on: team, set: () => M.setScope('team') }]} /> : null}
      <Card title={'In progress · ' + M.open.length}>
        {M.open.length ? <ul className="mr-list">{M.open.map(r => <Req key={r.id} r={r} showWho={team} />)}</ul> : <Empty>Nothing waiting. Tap “New request” to ask for money.</Empty>}
      </Card>
      <Card title={'Finished · ' + M.done.length}>
        {M.done.length ? <ul className="mr-list">{M.done.map(r => <Req key={r.id} r={r} showWho={team} />)}</ul> : <Empty>No paid or rejected requests yet.</Empty>}
      </Card>
    </>
  );
}
