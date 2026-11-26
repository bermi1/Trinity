import FixRequest from './FixRequest';
import { useState } from 'react';
import { PageHead, Card, Btn, Pill, Chips, Empty } from '../../ui/kit';

const TONE = { amber: ['#FBF1DD', '#8A6414'], green: ['#E6F4EC', '#1F7549'], red: ['#FBEDEE', '#B23A46'], blue: ['#E9EFFA', '#3559A8'] };

function Reply({ r }) {
  const [t, setT] = useState(''); const [e, setE] = useState('');
  return <div className="mr-reply"><input className="ff-search" value={t} onChange={x => setT(x.target.value)} placeholder="Your answer" aria-label="Your answer" /><Btn kind="dark" onClick={() => { const m = r.answer(t); if (m) setE(m); else setT(''); }}>Send</Btn>{e ? <span className="fm-err">{e}</span> : null}</div>;
}
function Reconcile({ r }) {
  const [a, setA] = useState(''); const [f, setF] = useState(null); const [e, setE] = useState(''); const [busy, setBusy] = useState(false);
  return (
    <div className="mr-reconcile">
      <b>Reconcile: what did you spend?</b>
      <label className="fh-amt"><span>TZS</span><input inputMode="numeric" value={a ? Number(a).toLocaleString('en-US') : ''} onChange={x => setA(x.target.value.replace(/\D/g, ''))} placeholder="0" aria-label="Amount spent" /></label>
      <label className="bi-up"><input type="file" accept="image/*,.pdf" onChange={x => setF(x.target.files[0] || null)} aria-label="Receipt" />{f ? '✓ ' + f.name : '↑ Photo of receipt'}</label>
      <Btn kind="dark" disabled={busy} onClick={async () => { setBusy(true); const m = await r.reconcile(a, f); setBusy(false); if (m) setE(m); }}>{busy ? 'Sending…' : 'Send to Finance'}</Btn>
      {e ? <span className="fm-err">{e}</span> : null}
    </div>
  );
}

function Req({ r, showWho }) {
  return (
    <li className={'mr-item' + (r.sel ? ' is-open' : '')} data-req={r.id}>
      <button type="button" className="mr-row" onClick={r.toggle} aria-expanded={r.sel}>
        <span className="mr-left"><b>{r.what}</b><small>{showWho ? r.who + ' · ' : ''}{r.where}{r.need ? ' · needed ' + r.need : ''}</small></span>
        <span className="mr-right"><b>{r.amt}</b><Pill l={r.asked ? 'Question for you' : r.canRec ? 'Reconcile' : r.status} bg={r.asked || r.canRec ? '#FBF1DD' : TONE[r.tone][0]} fg={r.asked || r.canRec ? '#8A6414' : TONE[r.tone][1]} /></span>
      </button>
      {r.sel ? (
        <div className="mr-detail">
          {r.purpose ? <p>{r.purpose}</p> : null}
          <ol className="mr-steps">
            {r.steps.map((x, i) => <li key={i} className={x.rej ? 'is-rej' : x.done ? 'is-done' : x.cur ? 'is-cur' : ''}><i />{x.l}{x.at ? <small>{x.at}</small> : x.cur ? <small>Now</small> : null}</li>)}
          </ol>
          {r.note ? <p className="bi-ret">Reason: {r.note}</p> : null}
          {r.thread.length ? <ul className="mr-thread">{r.thread.map((m, i) => <li key={i} className={m.mine ? 'is-mine' : ''}><b>{m.who}</b> · <small>{m.at}</small><p>{m.t}</p></li>)}</ul> : null}
          {r.payTo ? <p className="mr-pay"><b>Pay to</b> {r.payTo}</p> : null}
          {r.canFix ? <FixRequest key={r.id + (r.isRej ? 'r' : '')} R={r} /> : r.asked ? <Reply r={r} /> : null}
          {r.rec ? <p className="mr-recline">Spent {r.rec.spent} · returns {r.rec.back} · {r.rec.st}</p> : r.canRec ? <Reconcile r={r} /> : null}
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
