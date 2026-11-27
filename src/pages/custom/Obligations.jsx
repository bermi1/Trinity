import { useState } from 'react';

const n = v => Math.round(+v || 0).toLocaleString('en-US');
const digits = v => String(v || '').replace(/\D/g, '');

function Obligations({ P }) {
  const [paying, setPaying] = useState(''); const [amt, setAmt] = useState(''); const [ref, setRef] = useState(''); const [fee, setFee] = useState(''); const [err, setErr] = useState('');
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
                <label className="fh-amt"><span>Charges</span><input inputMode="numeric" value={fee ? n(fee) : ''} onChange={e => setFee(digits(e.target.value))} placeholder="0" aria-label={'Transaction charges · ' + o.l} /></label>
                <button type="button" className="me-save" onClick={() => { const m = o.pay(amt, ref, fee); setErr(m); if (!m) { setPaying(''); setAmt(''); setRef(''); setFee(''); } }}>Save</button>
              </span>
            ) : <button type="button" className="td-start" onClick={() => { setPaying(o.k); setErr(''); setAmt(o.expectN ? String(o.expectN) : ''); }}>Record payment</button>}
          </li>
        ))}
      </ul>
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
    </section>
  );
}

export { Obligations };
