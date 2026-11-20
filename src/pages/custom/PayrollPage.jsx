import { useState } from 'react';
import { PageHead, Btn, Empty, faceStyle, faceText } from '../../ui/kit';

const n = v => Math.round(+v || 0).toLocaleString('en-US');
const digits = v => String(v || '').replace(/\D/g, '');

function Employee({ e, admin }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ basic: String(e.e.basic || ''), allow: String(e.e.allow || ''), heslb: !!e.e.heslb, bank: e.e.bank || '', acc: e.e.acc || '', nssfNo: e.e.nssfNo || '', tin: e.e.tin || '' });
  const [err, setErr] = useState('');
  const set = (k, v) => setF(x => Object.assign({}, x, { [k]: v }));
  return (
    <li className="py-emp" data-emp={e.k}>
      <button type="button" className="py-emp-row" onClick={() => admin && setOpen(!open)} aria-expanded={open}>
        <span className="pv-face" style={faceStyle(e, { width: 34, height: 34 })}>{faceText(e)}</span>
        <span className="py-emp-n"><b>{e.n}</b><small>{e.role || '—'}</small></span>
        <span className="py-num"><small>Gross</small><b>{e.gross}</b></span>
        <span className="py-num"><small>Net</small><b>{e.net}</b></span>
        {!e.has ? <span className="br-tag">No pay record</span> : null}
      </button>
      {open ? (
        <div className="py-form">
          <div className="fh-three">
            <label className="ff"><span className="ff-l">Basic salary (TZS)</span><input inputMode="numeric" value={f.basic ? n(f.basic) : ''} onChange={x => set('basic', digits(x.target.value))} aria-label={'Basic salary · ' + e.n} /></label>
            <label className="ff"><span className="ff-l">Allowances (TZS)</span><input inputMode="numeric" value={f.allow ? n(f.allow) : ''} onChange={x => set('allow', digits(x.target.value))} aria-label={'Allowances · ' + e.n} /></label>
            <div className="ff"><span className="ff-l">HESLB loan</span><div className="me-mini"><button type="button" className={f.heslb ? 'is-on' : ''} onClick={() => set('heslb', !f.heslb)}>{f.heslb ? 'Yes · 15%' : 'No'}</button></div></div>
            <label className="ff"><span className="ff-l">Bank</span><input value={f.bank} onChange={x => set('bank', x.target.value)} /></label>
            <label className="ff"><span className="ff-l">Account no.</span><input value={f.acc} onChange={x => set('acc', x.target.value)} /></label>
            <label className="ff"><span className="ff-l">NSSF no.</span><input value={f.nssfNo} onChange={x => set('nssfNo', x.target.value)} /></label>
            <label className="ff"><span className="ff-l">TIN</span><input value={f.tin} onChange={x => set('tin', x.target.value)} /></label>
          </div>
          {err ? <div className="fm-err" role="alert">{err}</div> : null}
          <div className="fh-row"><button type="button" className="me-cancel" onClick={() => setOpen(false)}>Cancel</button><button type="button" className="me-save" onClick={() => { const m = e.save(f); if (m) setErr(m); else setOpen(false); }}>Save pay record</button></div>
        </div>
      ) : null}
    </li>
  );
}

function Run({ r }) {
  const [ref, setRef] = useState(''); const [back, setBack] = useState(''); const [showBack, setShowBack] = useState(false); const [err, setErr] = useState('');
  const run = fn => { const m = fn(); setErr(m || ''); };
  return (
    <section className="fh-card py-run" data-run={r.id} aria-label={'Payroll ' + r.month}>
      <header className="fr-chart-h"><h3>{r.month}</h3><span className={'py-st is-' + r.st}>{r.stl}</span></header>
      {r.note ? <p className="bi-ret">Sent back: {r.note}</p> : null}
      <div className="py-totals">
        <span><small>Gross pay</small><b>{r.totals.gross}</b></span>
        <span><small>PAYE</small><b>{r.totals.paye}</b></span>
        <span><small>NSSF (employees)</small><b>{r.totals.nssf}</b></span>
        <span><small>Net to pay</small><b className="py-net">{r.totals.net}</b></span>
        <span><small>Employer: NSSF + SDL + WCF</small><b>{r.totals.erNssf} + {r.totals.sdl} + {r.totals.wcf}</b></span>
        <span><small>Total cost to the company</small><b>{r.totals.cost}</b></span>
      </div>
      <div className="fr-table-wrap">
        <table className="fr-table py-table">
          <thead><tr><th>Employee</th><th className="r">Basic</th><th className="r">Allow.</th><th className="r">Gross</th><th className="r">NSSF</th><th className="r">PAYE</th><th className="r">HESLB</th><th className="r">Advance</th><th className="r">Net</th><th /></tr></thead>
          <tbody>{r.lines.map(l => (
            <tr key={l.k}>
              <td><b>{l.n}</b></td><td className="r">{l.basicT}</td><td className="r">{l.allowT}</td><td className="r">{l.grossT}</td><td className="r">{l.nssfT}</td><td className="r">{l.payeT}</td><td className="r">{l.heslbT}</td>
              <td className="r">{r.canEdit ? <input className="py-adv" inputMode="numeric" defaultValue={l.otherN || ''} onBlur={e => l.setOther(digits(e.target.value))} aria-label={'Advance · ' + l.n} placeholder="0" /> : l.otherT}</td>
              <td className="r"><b>{l.netT}</b></td>
              <td>{r.st === 'paid' ? <button type="button" className="td-start" onClick={l.slip}>Payslip</button> : null}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <p className="k-sub">{[r.gm ? 'GM: ' + r.gm : '', r.mgmt ? 'Management: ' + r.mgmt : '', r.paid ? 'Paid: ' + r.paid : ''].filter(Boolean).join(' · ')}</p>
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
      <div className="fh-row">
        {r.canApprove ? <button type="button" className="me-save" onClick={() => run(r.approve)}>Approve payroll</button> : null}
        {r.canReturn ? (showBack ? <><input className="ff-search" value={back} onChange={e => setBack(e.target.value)} placeholder="What should change?" aria-label="Reason" /><button type="button" className="me-save" onClick={() => run(() => r.sendBack(back))}>Send back</button></> : <Btn kind="ghost" onClick={() => setShowBack(true)}>Send back</Btn>) : null}
        {r.canPay ? <><input className="ff-search" value={ref} onChange={e => setRef(e.target.value)} placeholder="Bank reference (e.g. CRDB PAYROLL NOV)" aria-label="Bank reference" /><button type="button" className="me-save" onClick={() => run(() => r.pay(ref))}>Mark salaries paid</button></> : null}
      </div>
    </section>
  );
}

export function Payslips({ list }) {
  return list.length ? <ul className="mr-list">{list.map(p => <li key={p.id}><button type="button" onClick={p.open} aria-label={'Payslip · ' + p.month}><span><b>{p.month}</b><small>Gross {p.gross}</small></span><span className="mr-right"><b>{p.net}</b><small>net · open payslip</small></span></button></li>)}</ul> : <Empty>No payslips yet.</Empty>;
}

// Payroll: the GM keeps pay records and prepares the month; GM → Management approve; Finance pays.
export default function PayrollPage({ v }) {
  const P = v.PAY;
  const [tab, setTab] = useState('run');
  const [err, setErr] = useState('');
  if (P.slipsOnly) return <><PageHead kicker="Me" title="My payslips" sub="Your payslip for every month your salary was paid." /><Payslips list={P.mySlips} /></>;
  const cur = P.runs.filter(r => r.st !== 'paid'), past = P.runs.filter(r => r.st === 'paid');
  return (
    <>
      <PageHead kicker="People" title="Payroll" sub="NSSF, PAYE, HESLB and employer costs (NSSF, SDL, WCF) are worked out from each pay record. GM prepares and approves, Management approves, Finance pays.">
        {P.admin && !P.hasThisMonth ? <Btn kind="dark" onClick={() => setErr(P.prepare())}>Prepare {P.thisMonth} payroll</Btn> : null}
      </PageHead>
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
      <div className="rc-smart" role="tablist">{[['run', 'This month'], ['emps', 'Employees · ' + P.emps.length], ['past', 'Paid months · ' + past.length], ...(P.mySlips.length ? [['mine', 'My payslips']] : [])].map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'is-on' : ''} onClick={() => setTab(k)}><span>{l}</span></button>)}</div>
      {tab === 'run' ? (cur.length ? cur.map(r => <Run key={r.id} r={r} />) : <Empty>{P.admin ? 'No payroll in progress. Prepare this month’s payroll from the pay records.' : 'No payroll waiting.'}</Empty>) : null}
      {tab === 'emps' ? <section className="fh-card">{P.missing ? <p className="bi-ret">{P.missing} employee(s) have no pay record yet.</p> : null}<ul className="py-emps">{P.emps.map(e => <Employee key={e.k} e={e} admin={P.admin} />)}</ul></section> : null}
      {tab === 'past' ? (past.length ? past.map(r => <Run key={r.id} r={r} />) : <Empty>No paid months yet.</Empty>) : null}
      {tab === 'mine' ? <Payslips list={P.mySlips} /> : null}
    </>
  );
}
