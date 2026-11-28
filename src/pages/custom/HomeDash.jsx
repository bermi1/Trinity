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

const Chev = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>;

// Management's float on the home page, kept small: the card, one line of what matters, the requests
// waiting for Management, and the way to the Float page (where the full breakdown lives).
function FloatBlock({ F }) {
  const C = F.card;
  return (
    <section className="hd-card hd-float is-mini" aria-label="Today's float">
      <header><h3>Today’s float</h3><span className={F.sent ? 'hd-sent' : 'hd-unsent'}>{F.sent ? '✓ Report sent' : '✗ Report not sent'}</span></header>
      <FloatCard F={F} />
      <p className="hd-fline">
        <span><b>{F.waitN}</b> waiting to be paid{F.waitN ? <> · <b>{F.waitT}</b></> : null}</span>
        <span className={C.advOver ? 'is-warn' : ''}><b>{C.advN}</b> not yet accounted for{C.advOver ? <> · {C.advOver} overdue</> : null}</span>
      </p>
      {F.asks && F.asks.length ? <div className="hd-asks">{F.asks.map(a => <FloatAsk key={a.id} a={a} />)}</div> : null}
      <button type="button" className="k-btn is-dark hd-fopen" onClick={F.go}>Open float</button>
    </section>
  );
}

function Kpis({ list, cls }) {
  return (
    <section className={'hd-kpis' + (cls ? ' ' + cls : '')}>
      {list.map(k => (
        <button key={k.l} type="button" className="hd-kpi" onClick={k.on}>
          <span>{k.l}</span><b>{k.v}</b><small className={k.warn ? 'is-warn' : ''}>{k.s}</small>
        </button>
      ))}
    </section>
  );
}

export default function HomeDash({ v }) {
  const H = v.HD;
  if (!H) return null;
  const top = (
    <header className="hd-top">
      <div><h1>{H.hello}</h1><p>{H.date}</p></div>
      <div className="hd-acts">{H.actions.map((a, i) => <button key={a.l} type="button" className={'hd-btn' + (i === 0 ? ' is-pri' : '')} onClick={a.on}><i aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={v.ic[['plus', 'checkSquare', 'fileText', 'banknote'][i]]} /></svg></i><span>{a.l}</span></button>)}</div>
    </header>
  );
  const att = (
    <section className="hd-card hd-att">
      <header><h3>Needs attention</h3><span>{H.att.length}</span></header>
      {H.att.length ? (
        <ul>
          {H.att.map((a, i) => (
            <li key={i}><button type="button" onClick={a.on}>
              <em style={{ background: TONE[a.tone][0], color: TONE[a.tone][1] }}>{a.tag}</em>
              <span><b>{a.t}</b><small>{a.s}</small></span>
              <Chev />
            </button></li>
          ))}
        </ul>
      ) : <p className="hd-empty">Nothing waiting. All clear.</p>}
    </section>
  );
  const pipe = (
    <section className="hd-card hd-pipec">
      <header><h3>Sales pipeline</h3><button type="button" className="hd-link" onClick={H.goClients}>Open</button></header>
      <ul className="hd-pipe">
        {H.stages.map(x => <li key={x.l}><span>{x.l}</span><i><b style={{ width: Math.max(4, x.w) + '%' }} /></i><em>{x.n}</em>{x.vt ? <small>{x.vt}</small> : null}</li>)}
      </ul>
      <footer className="hd-foot"><span><b>{H.won}</b> won</span><span><b>{H.customers}</b> customers</span></footer>
    </section>
  );
  const proj = team => (
    <section className="hd-card hd-projc">
      <header><h3>Projects by stage</h3><button type="button" className="hd-link" onClick={H.goProjects}>Open</button></header>
      <div className="hd-stages">{H.pstages.map(p => <div key={p.l}><b>{p.n}</b><span>{p.l}</span></div>)}</div>
      {team ? <footer className="hd-foot"><button type="button" className="hd-link" onClick={H.goTeam}><b>{H.team.sent}</b> of {H.team.total} sent their day today →</button></footer> : null}
    </section>
  );
  const po = (
    <section className="hd-card hd-poc" aria-label="Purchase orders">
      <header><h3>Purchase orders</h3></header>
      <div className="hd-stages"><div><b>{H.po.got}</b><span>PO received</span></div><div className={H.po.miss ? 'is-warn' : ''}><b>{H.po.miss}</b><span>PO not received</span></div></div>
      {H.po.list.length ? <ul className="hd-att">{H.po.list.map((x, i) => <li key={i}><button type="button" onClick={x.on}><em style={{ background: '#FFF4E0', color: '#9A6200' }}>No PO</em><span><b>{x.t}</b><small>{x.s}</small></span><Chev /></button></li>)}</ul> : null}
    </section>
  );
  const activity = (
    <section className="hd-card hd-wide hd-actc">
      <header><h3>Recent activity</h3></header>
      <ul className="hd-act">{H.activity.map((a, i) => <li key={i}><time>{a.time}</time><span><b>{a.t}</b><small>{a.s}</small></span></li>)}</ul>
    </section>
  );

  if (H.mgmt) {
    // Management / GM / PA: what waits for me and the money first, then the float, attention, work, sales.
    const T = v.TG && !v.TG.empty ? v.TG : null, A = v.ATT;
    const kpis = H.mkpis.slice();
    if (T) kpis.splice(Math.min(2, kpis.length), 0, { l: 'Company target · ' + T.year, v: T.pace + '%', s: T.earned + ' of ' + T.target, warn: T.status === 'behind', on: () => { const el = document.querySelector('.hd-target'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
    const today = (
      <section className="hd-card hd-teamc" aria-label="Today's team">
        <header><h3>Today’s team</h3></header>
        <div className="hd-stages is-3">
          {A ? <button type="button" onClick={H.goAtt}><b>{A.counts.in + A.counts.left}<small> / {A.people.length}</small></b><span>Checked in</span></button> : null}
          {A ? <button type="button" className={A.counts.late ? 'is-warn' : ''} onClick={H.goAtt}><b>{A.counts.late}</b><span>Late</span></button> : null}
          <button type="button" onClick={H.goTeam}><b>{H.team.sent}<small> / {H.team.total}</small></b><span>Day sent</span></button>
        </div>
      </section>
    );
    return (
      <div className="hd is-m">
        {top}
        <MyWhatsApp v={v} />
        <Kpis list={kpis} cls="is-m" />
        <div className="hd-mgrid">
          <div className="hd-col">{H.float ? <FloatBlock F={H.float} /> : null}{today}</div>
          <div className="hd-col">{att}{proj(false)}</div>
          <div className="hd-col">{pipe}{po}</div>
        </div>
        {v.TG ? <div className="hd-target"><TargetPanel T={v.TG} /></div> : null}
        <div className="hd-grid">
          {v.REP ? <div className="hd-wide"><CashChart R={v.REP} /></div> : null}
          {activity}
        </div>
      </div>
    );
  }

  return (
    <div className="hd">
      {top}
      <MyWhatsApp v={v} />
      {v.TG ? <TargetPanel T={v.TG} /> : null}
      <Kpis list={H.kpis} />
      <div className="hd-grid">
        {att}
        {pipe}
        {proj(true)}
        {po}
        {v.REP ? <div className="hd-wide"><CashChart R={v.REP} /></div> : null}
        {activity}
      </div>
    </div>
  );
}
