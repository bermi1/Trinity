import FixRequest from './FixRequest';
import ReqItems from '../../components/ReqItems';
import { AccountForm } from '../../components/AccountForm';
import { useEffect, useRef, useState } from 'react';
import { PageHead, Card, Btn, Pill, Chips, Empty } from '../../ui/kit';

const TONE = { amber: ['#FBF1DD', '#8A6414'], green: ['#E6F4EC', '#1F7549'], red: ['#FBEDEE', '#B23A46'], blue: ['#E9EFFA', '#3559A8'] };

function Reply({ r }) {
  const [t, setT] = useState(''); const [e, setE] = useState('');
  return <div className="mr-reply"><input className="ff-search" value={t} onChange={x => setT(x.target.value)} placeholder="Your answer" aria-label="Your answer" /><Btn kind="dark" onClick={() => { const m = r.answer(t); if (m) setE(m); else setT(''); }}>Send</Btn>{e ? <span className="fm-err">{e}</span> : null}</div>;
}
function Req({ r, showWho, focus, focusDone }) {
  const ref = useRef(null);
  // Opened on purpose (a tap, a notification): bring the request into view.
  useEffect(() => {
    if (focus && focus === r.id && r.sel && ref.current) { try { ref.current.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) { /* old browser */ } if (focusDone) focusDone(); }
  }, [focus, r.id, r.sel, focusDone]);
  return (
    <li ref={ref} className={'mr-item' + (r.sel ? ' is-open' : '')} data-req={r.id}>
      <button type="button" className="mr-row" onClick={r.toggle} aria-expanded={r.sel}>
        <span className="mr-left"><b>{r.what}</b><small>{showWho ? r.who + ' · ' : ''}{r.where}{r.need ? ' · needed ' + r.need : ''}</small></span>
        <span className="mr-right"><b>{r.amt}</b><Pill l={r.asked ? 'Question for you' : r.canRec ? (r.account && r.account.overdue ? 'Account for it · overdue' : 'Account for it') : r.status} bg={r.asked || r.canRec ? '#FBF1DD' : TONE[r.tone][0]} fg={r.asked || r.canRec ? '#8A6414' : TONE[r.tone][1]} /></span>
      </button>
      {r.sel ? (
        <div className="mr-detail">
          {r.purpose ? <p>{r.purpose}</p> : null}
          <ReqItems items={r.items} total={r.amt} />
          <ol className="mr-steps">
            {r.steps.map((x, i) => <li key={i} className={x.rej ? 'is-rej' : x.done ? 'is-done' : x.cur ? 'is-cur' : ''}><i />{x.l}{x.at ? <small>{x.at}</small> : x.cur ? <small>Now</small> : null}</li>)}
          </ol>
          {r.note ? <p className="bi-ret">Reason: {r.note}</p> : null}
          {r.thread.length ? <ul className="mr-thread">{r.thread.map((m, i) => <li key={i} className={m.mine ? 'is-mine' : ''}><b>{m.who}</b> · <small>{m.at}</small><p>{m.t}</p></li>)}</ul> : null}
          {r.payTo ? <p className="mr-pay"><b>Pay to</b> {r.payTo}</p> : null}
          {r.canFix ? <FixRequest key={r.id + (r.isRej ? 'r' : '')} R={r} /> : r.asked ? <Reply r={r} /> : null}
          {r.rec ? <p className="mr-recline">Spent {r.rec.spent}{r.rec.over ? ' · spent more than given (' + r.rec.over + ')' : ' · returns ' + r.rec.back} · {r.rec.st}</p> : r.canRec && r.account ? <AccountForm key={r.id + (r.account.backNote ? 'b' : '')} r={r} /> : null}
          <div className="mr-acts">
            <span className="k-sub">{r.id}</span>
            {r.nudge ? <Btn kind="ghost" onClick={r.nudge}>Remind approver</Btn> : null}
            {r.wa ? <button type="button" className="td-start wa-btn" onClick={r.wa} aria-label="Remind approver on WhatsApp"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A11 11 0 0 0 3.2 17.4L2 22l4.7-1.2A11 11 0 1 0 20.5 3.5zM12 20a8 8 0 0 1-4.1-1.1l-.3-.2-2.8.7.7-2.7-.2-.3A8 8 0 1 1 12 20z" /></svg>WhatsApp</button> : null}
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
      {(M.todo || []).length ? (
        <Card title={'To do · ' + M.todo.length}>
          <p className="k-sub">You were paid: say what you spent, add the receipts and return the change.</p>
          <ul className="mr-list">{M.todo.map(r => <Req key={r.id} r={r} showWho={team} focus={M.focus} focusDone={M.focusDone} />)}</ul>
        </Card>
      ) : null}
      <Card title={'In progress · ' + M.open.length}>
        {M.open.length ? <ul className="mr-list">{M.open.map(r => <Req key={r.id} r={r} showWho={team} focus={M.focus} focusDone={M.focusDone} />)}</ul> : <Empty>Nothing waiting. Tap “New request” to ask for money.</Empty>}
      </Card>
      <Card title={'Finished · ' + M.done.length}>
        {M.done.length ? <ul className="mr-list">{M.done.map(r => <Req key={r.id} r={r} showWho={team} focus={M.focus} focusDone={M.focusDone} />)}</ul> : <Empty>Nothing finished yet.</Empty>}
      </Card>
    </>
  );
}
