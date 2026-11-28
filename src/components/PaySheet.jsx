import { useState } from 'react';
import { Btn } from '../ui/kit';

const n = v => Math.round(+v || 0).toLocaleString('en-US');
const digits = v => String(v || '').replace(/\D/g, '');

// Confirm a payment before it is recorded: the amount (editable, up to what was asked), how it is paid
// (taken from the request), the transaction charges and the day. Used by the Float page's "Waiting to be
// paid" list and by "Mark paid" on the Requests page, so a payment is never recorded by one stray tap.
export default function PaySheet({ P }) {
  const [f, setF] = useState(() => ({ amt: String(P.asked), method: P.method, fee: '', at: P.today }));
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k, v) => { setErr(''); setF(x => Object.assign({}, x, { [k]: v })); };
  const amt = +f.amt || 0, fee = f.method === 'Cash' ? 0 : +f.fee || 0;
  const left = P.floatLeft == null ? null : P.floatLeft - amt - fee;
  const go = () => { setBusy(true); const m = P.pay(f); setBusy(false); if (m) setErr(m); };
  return (
    <div className="fm-back" onClick={P.close}>
      <div className="fm fl-sheet" role="dialog" aria-label="Confirm payment" onClick={e => e.stopPropagation()}>
        <header className="fm-head"><div><h2>Pay {P.id}</h2><p>{P.who} · {P.what}</p></div><button type="button" className="fm-x" onClick={P.close} aria-label="Close">×</button></header>
        <div className="fm-body">
          {P.payTo ? <p className="mr-pay"><b>Pay to</b> {P.payTo}</p> : null}
          <label className="fh-amt fl-money"><span>TZS</span><input inputMode="numeric" value={f.amt ? n(f.amt) : ''} onChange={e => set('amt', digits(e.target.value))} placeholder="0" aria-label="Amount paid" /></label>
          <small className="k-sub">Asked {P.askedT}{amt && amt < P.asked ? ' · paying part of it' : ''}</small>
          <div className="ff" data-field="Paid by"><span className="ff-l">Paid by</span>
            <div className="ff-chips" role="radiogroup" aria-label="Paid by">{P.methods.map(m => <button key={m} type="button" role="radio" aria-checked={f.method === m} className={f.method === m ? 'is-on' : ''} onClick={() => set('method', m)}>{m}</button>)}</div>
          </div>
          {f.method !== 'Cash' ? <label className="fh-amt"><span>Charges</span><input inputMode="numeric" value={f.fee ? n(f.fee) : ''} onChange={e => set('fee', digits(e.target.value))} placeholder="0" aria-label="Transaction charges" /></label> : null}
          <label className="fl-date"><span>Date paid</span><input type="date" value={f.at} min={P.minDay} max={P.today} onChange={e => set('at', e.target.value || P.today)} aria-label="Date paid" /></label>
          {left != null && left < 0 ? <p className="bi-ret" role="status">This takes the float below zero (−TZS {n(-left)}). It is still recorded and Management is told.</p> : null}
          <p className="k-sub">{P.first} must then account for it: what was spent, the receipts and the change.</p>
          {err ? <div className="fm-err" role="alert">{err}</div> : null}
        </div>
        <footer className="fm-foot"><Btn kind="ghost" onClick={P.close}>Cancel</Btn><Btn kind="dark" disabled={busy} onClick={go}>{'Pay TZS ' + n(amt)}</Btn></footer>
      </div>
    </div>
  );
}
