import { useState } from 'react';
import { Empty } from '../../ui/kit';

const n = v => Math.round(+v || 0).toLocaleString('en-US');
const digits = v => String(v || '').replace(/\D/g, '');

function Entry({ P }) {
  const [f, setF] = useState({ dir: 'out', amt: '', cat: '', what: '', who: '' });
  const [err, setErr] = useState('');
  const set = (k, v) => { setErr(''); setF(x => Object.assign({}, x, { [k]: v })); };
  return (
    <section className={'fh-card me is-' + f.dir} aria-label="Petty cash entry">
      <div className="me-seg" role="radiogroup" aria-label="Cash out or top-up">{[['out', 'Pay out'], ['in', 'Top-up from bank']].map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={f.dir === k} className={f.dir === k ? 'is-on' : ''} onClick={() => set('dir', k)}>{l}</button>)}</div>
      <label className="me-amt"><span>TZS</span><input inputMode="numeric" value={f.amt ? n(f.amt) : ''} onChange={e => set('amt', digits(e.target.value))} placeholder="0" aria-label="Petty amount" /></label>
      {f.dir === 'out' ? (
        <>
          <div className="me-cats" role="radiogroup" aria-label="Petty category">{P.cats.map(c => <button key={c} type="button" role="radio" aria-checked={f.cat === c} className={f.cat === c ? 'is-on' : ''} onClick={() => set('cat', c)}>{c}</button>)}</div>
          <input className="me-who" value={f.who} onChange={e => set('who', e.target.value)} placeholder="Paid to (who received the cash)" aria-label="Paid to" />
          <input className="me-who" value={f.what} onChange={e => set('what', e.target.value)} placeholder="What for (e.g. Bajaji to Kariakoo for samples)" aria-label="What for" />
        </>
      ) : null}
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
      <div className="me-foot"><button type="button" className="me-save" onClick={() => { const m = P.add(f); if (m) setErr(m); else setF({ dir: f.dir, amt: '', cat: '', what: '', who: '' }); }}>{f.dir === 'out' ? 'Record payment · print voucher no.' : 'Record top-up'}</button></div>
    </section>
  );
}

function Count({ P }) {
  const [c, setC] = useState(''); const [note, setNote] = useState(''); const [err, setErr] = useState('');
  return (
    <section className="fh-card" aria-label="Cash count">
      <h3>Count the cash box</h3>
      <p className="k-sub">The book says <b>{P.balance}</b>. Count the cash and enter what is really there.</p>
      <div className="fh-row">
        <label className="fh-amt"><span>TZS</span><input inputMode="numeric" value={c ? n(c) : ''} onChange={e => setC(digits(e.target.value))} placeholder="Counted" aria-label="Cash counted" /></label>
        <input className="me-who" value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)" aria-label="Count note" />
        <button type="button" className="me-save" onClick={() => { const m = P.count(c, note); setErr(m); if (!m) { setC(''); setNote(''); } }}>Save count</button>
      </div>
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
      {P.lastCount ? <p className={P.lastCount.diff === 0 ? 'mr-recline' : 'bi-ret'}>Last count {P.lastCount.at}: {P.lastCount.t}</p> : null}
    </section>
  );
}

function Obligations({ P }) {
  const [paying, setPaying] = useState(''); const [amt, setAmt] = useState(''); const [ref, setRef] = useState(''); const [err, setErr] = useState('');
  return (
    <section className="fh-card" aria-label="Due this month">
      <h3>Due this month</h3>
      <ul className="ob-list">
        {P.obligations.map(o => (
          <li key={o.k} className={o.paid ? 'is-paid' : o.late ? 'is-late' : ''} data-ob={o.k}>
            <span><b>{o.l}</b><small>{o.paid ? 'Paid · ' + o.paid : o.due + (o.expect ? ' · ' + o.expect : '')}</small></span>
            {o.paid ? <span className="fh-ok">✓ Paid</span> : paying === o.k ? (
              <span className="ob-pay">
                <label className="fh-amt"><span>TZS</span><input inputMode="numeric" value={amt ? n(amt) : ''} onChange={e => setAmt(digits(e.target.value))} aria-label={'Amount paid · ' + o.l} /></label>
                <input className="ff-search" value={ref} onChange={e => setRef(e.target.value)} placeholder="Reference" aria-label={'Reference · ' + o.l} />
                <button type="button" className="me-save" onClick={() => { const m = o.pay(amt, ref); setErr(m); if (!m) { setPaying(''); setAmt(''); setRef(''); } }}>Save</button>
              </span>
            ) : <button type="button" className="td-start" onClick={() => { setPaying(o.k); setErr(''); setAmt(o.expectN ? String(o.expectN) : ''); }}>Record payment</button>}
          </li>
        ))}
      </ul>
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
    </section>
  );
}

// Petty cash book: the office cash box, voucher by voucher, with a cash count.
export function PettyCash({ P }) {
  return (
    <>
      <div className="fh-kpis">
        <div className="fh-kpi is-dark"><span>Cash in the box</span><b>{P.balance}</b><small>according to the book</small></div>
        <div className="fh-kpi is-red"><span>Paid out this month</span><b>{P.spentMonth}</b><small>petty cash vouchers</small></div>
        <div className="fh-kpi is-gold"><span>Last cash count</span><b>{P.lastCount ? P.lastCount.t : '—'}</b><small>{P.lastCount ? P.lastCount.at : 'not counted yet'}</small></div>
      </div>
      <div className="fr-two"><Entry P={P} /><Count P={P} /></div>
      <section className="fh-card">
        <h3>Petty cash book</h3>
        {P.book.length ? (
          <div className="fr-table-wrap"><table className="fr-table fr-book">
            <thead><tr><th>Date</th><th>Voucher</th><th>Details</th><th className="r">In</th><th className="r">Out</th><th className="r">Balance</th></tr></thead>
            <tbody>{P.book.map(e => <tr key={e.id}><td className="fr-date">{e.at.slice(5)}</td><td className="fr-date">{e.voucher || '—'}</td><td><b>{e.cat}</b><small>{[e.who, e.what, 'by ' + e.by].filter(Boolean).join(' · ')}</small></td><td className="r is-green">{e.dir === 'in' ? e.amt : ''}</td><td className="r is-red">{e.dir === 'out' ? e.amt : ''}</td><td className="r">{e.bal}</td></tr>)}</tbody>
          </table></div>
        ) : <Empty>No petty cash entries yet.</Empty>}
      </section>
    </>
  );
}
export { Obligations };
