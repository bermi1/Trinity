import { useState } from 'react';
import { CashChart } from './FinanceReports';
import MyWhatsApp from './MyWhatsApp';
import TargetPanel from './TargetPanel';

const TONE = { amber: ['#FFF4E0', '#9A6200'], purple: ['#F0EBFA', '#5A2FA8'], green: ['#E7F6EE', '#1F7549'], red: ['#FDECEE', '#B23A46'] };

// Company home: the few numbers that matter, then what needs attention today.
// The float as a bank-style virtual card: the balance, who holds it, the last money from the boss.
function FloatCard({ F }) {
  const C = F.card;
  return (
    <div className={'vc' + (F.neg ? ' is-neg' : '')} role="group" aria-label={'Float balance ' + F.balance}>
      <div className="vc-top-row">
        <span className="vc-brand"><b>TRINITY MARK</b><small>Float account<em className="vc-asof-m"> · as of {C.asOf.split(' · ')[1] || C.asOf}</em></small></span>
        <svg className="vc-nfc" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M8.5 7.5a6 6 0 0 1 0 9M12 5a9.5 9.5 0 0 1 0 14M5 10a2.5 2.5 0 0 1 0 4" /></svg>
      </div>
      <div className="vc-chip" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="vc-bal"><small>Available balance</small><b>{F.balance}</b></div>
      <div className="vc-num" aria-hidden="true">•••• •••• FLOAT {(C.asOf.match(/\d{4}/) || [''])[0]}</div>
      <div className="vc-foot">
        <span><small>Held by</small><b>{C.holder}</b></span>
        <span><small>Last from the boss</small><b>{C.last ? C.last.amt + ' · ' + C.last.at.slice(8) + '/' + C.last.at.slice(5, 7) : '—'}</b></span>
        <span className="vc-asof"><small>As of</small><b>{C.asOf}</b></span>
      </div>
    </div>
  );
}

// A float request from Finance, for Management: balance now → after, Approve (it is given at once) or Decline.
function FloatAsk({ a }) {
  const [no, setNo] = useState(false), [why, setWhy] = useState(''), [err, setErr] = useState('');
  return (
    <div className="hd-ask">
      <b>Float request · {a.amt}</b>
      <small>{a.who} · {a.at}</small>
      <span className="hd-ask-bal">Balance {a.before} → <b>{a.after}</b></span>
      {a.note ? <p>{a.note}</p> : null}
      {no ? (
        <div className="hd-ask-row"><input value={why} onChange={e => setWhy(e.target.value)} placeholder="Reason (required)" aria-label="Reason for declining" />
          <button type="button" className="me-save" onClick={() => { const m = a.decline(why); if (m) setErr(m); }}>Decline</button>
          <button type="button" className="me-cancel" onClick={() => setNo(false)}>Cancel</button></div>
      ) : (
        <div className="hd-ask-row"><button type="button" className="me-save" onClick={() => { const m = a.approve(); if (m) setErr(m); }}>Approve · give {a.amt}</button>
          <button type="button" className="me-cancel" onClick={() => setNo(true)}>Decline</button></div>
      )}
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
    </div>
  );
}

export default function HomeDash({ v }) {
  const H = v.HD;
  if (!H) return null;
  return (
    <div className="hd">
      <header className="hd-top">
        <div><h1>{H.hello}</h1><p>{H.date}</p></div>
        <div className="hd-acts">{H.actions.map((a, i) => <button key={a.l} type="button" className={'hd-btn' + (i === 0 ? ' is-pri' : '')} onClick={a.on}><i aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={v.ic[['plus', 'checkSquare', 'fileText', 'banknote'][i]]} /></svg></i><span>{a.l}</span></button>)}</div>
      </header>
      <MyWhatsApp v={v} />
      {H.float ? (
        <section className="hd-card hd-float" aria-label="Today's float">
          <header><h3>Today’s float</h3><span className={H.float.sent ? 'hd-sent' : 'hd-unsent'}>{H.float.sent ? '✓ Report sent' : '✗ Report not sent'}</span></header>
          <div className="vc-wrap">
          <FloatCard F={H.float} />
          <div className="vc-stats">
            <div><span>Opened today</span><b>{H.float.card.opened}</b></div>
            <div><span>In today</span><b className="is-in">+{H.float.card.in}</b></div>
            <div><span>Out today</span><b className="is-out">−{H.float.out}</b></div>
            <div><span>Waiting to be paid</span><b>{H.float.waitN} · {H.float.waitT}</b></div>
            <div><span>Not yet accounted for</span><b className={H.float.card.advOver ? 'is-out' : ''}>{H.float.card.advN} · {H.float.card.advT}</b>{H.float.card.advOver ? <small>{H.float.card.advOver} overdue</small> : null}</div>
            <div><span>Daily report</span><b>{H.float.sentLine}</b></div>
          </div>
          </div>
          {H.float.card.usedPct != null ? (
            <div className="vc-use">
              <div className="vc-use-l"><span>This month</span><b>{H.float.card.spentMonth} used of {H.float.card.gotMonth} received</b></div>
              <div className="vc-bar" role="img" aria-label={H.float.card.usedPct + '% of this month’s float used'}><i style={{ width: H.float.card.usedPct + '%' }} /></div>
            </div>
          ) : null}
          {H.float.card.top.length ? (
            <div className="vc-top"><span>Spent today on</span>{H.float.card.top.map(t => <div key={t.name}><em>{t.name}</em><b>{t.t}</b></div>)}</div>
          ) : null}
          {H.float.asks && H.float.asks.length ? (
            <div className="hd-asks">
              {H.float.asks.map(a => <FloatAsk key={a.id} a={a} />)}
            </div>
          ) : null}
          <button type="button" className="k-btn is-dark hd-fopen" onClick={H.float.open}>Open today’s report</button>
        </section>
      ) : null}

      {v.TG ? <TargetPanel T={v.TG} /> : null}

      <section className="hd-kpis">
        {H.kpis.map(k => (
          <button key={k.l} type="button" className="hd-kpi" onClick={k.on}>
            <span>{k.l}</span><b>{k.v}</b><small className={k.warn ? 'is-warn' : ''}>{k.s}</small>
          </button>
        ))}
      </section>

      <div className="hd-grid">
        <section className="hd-card hd-att">
          <header><h3>Needs attention</h3><span>{H.att.length}</span></header>
          {H.att.length ? (
            <ul>
              {H.att.map((a, i) => (
                <li key={i}><button type="button" onClick={a.on}>
                  <em style={{ background: TONE[a.tone][0], color: TONE[a.tone][1] }}>{a.tag}</em>
                  <span><b>{a.t}</b><small>{a.s}</small></span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
                </button></li>
              ))}
            </ul>
          ) : <p className="hd-empty">Nothing waiting. All clear.</p>}
        </section>

        <section className="hd-card">
          <header><h3>Sales pipeline</h3><button type="button" className="hd-link" onClick={H.goClients}>Open</button></header>
          <ul className="hd-pipe">
            {H.stages.map(x => <li key={x.l}><span>{x.l}</span><i><b style={{ width: Math.max(4, x.w) + '%' }} /></i><em>{x.n}</em>{x.vt ? <small>{x.vt}</small> : null}</li>)}
          </ul>
          <footer className="hd-foot"><span><b>{H.won}</b> won</span><span><b>{H.customers}</b> customers</span></footer>
        </section>

        <section className="hd-card">
          <header><h3>Projects by stage</h3><button type="button" className="hd-link" onClick={H.goProjects}>Open</button></header>
          <div className="hd-stages">{H.pstages.map(p => <div key={p.l}><b>{p.n}</b><span>{p.l}</span></div>)}</div>
          <footer className="hd-foot"><button type="button" className="hd-link" onClick={H.goTeam}><b>{H.team.sent}</b> of {H.team.total} sent their day today →</button></footer>
        </section>

        <section className="hd-card" aria-label="Purchase orders">
          <header><h3>Purchase orders</h3></header>
          <div className="hd-stages"><div><b>{H.po.got}</b><span>PO received</span></div><div className={H.po.miss ? 'is-warn' : ''}><b>{H.po.miss}</b><span>PO not received</span></div></div>
          {H.po.list.length ? <ul className="hd-att">{H.po.list.map((x, i) => <li key={i}><button type="button" onClick={x.on}><em style={{ background: '#FFF4E0', color: '#9A6200' }}>No PO</em><span><b>{x.t}</b><small>{x.s}</small></span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg></button></li>)}</ul> : null}
        </section>
        {v.REP ? <div className="hd-wide"><CashChart R={v.REP} /></div> : null}

        <section className="hd-card hd-wide">
          <header><h3>Recent activity</h3></header>
          <ul className="hd-act">{H.activity.map((a, i) => <li key={i}><time>{a.time}</time><span><b>{a.t}</b><small>{a.s}</small></span></li>)}</ul>
        </section>
      </div>
    </div>
  );
}
