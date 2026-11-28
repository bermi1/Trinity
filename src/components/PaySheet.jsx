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
  const amt = +f.amt || 0, fee = +f.fee || 0;
  const [mode, setMode] = useState('new'); const [pick, setPick] = useState('');
  const out = mode === 'outside', left = P.floatLeft == null || out ? null : P.floatLeft - amt - fee;
  // "Already in the cash book": the money went out before approval and was recorded as an expense.
  const book = P.book || [], chosen = book.find(e => e.id === pick);
  const go = () => {
    if (mode === 'book' && !pick) { setErr('Choose the cash book record'); return; }
    setBusy(true); const m = mode === 'book' ? P.payFromBook(pick) : out ? P.paidOutside(f) : P.pay(f); setBusy(false); if (m) setErr(m);
  };
  return (
    <div className="fm-back" onClick={P.close}>
      <div className="fm fl-sheet" role="dialog" aria-label="Confirm payment" onClick={e => e.stopPropagation()}>
        <header className="fm-head"><div><h2>Pay {P.id}</h2><p>{P.who} · {P.what}</p></div><button type="button" className="fm-x" onClick={P.close} aria-label="Close">×</button></header>
        <div className="fm-body">
          {P.paidOutside ? <div className="k-chips ps-mode" role="tablist" aria-label="How it was paid">
            {[['new', 'Pay now'], ...(book.length ? [['book', 'Already in the cash book']] : []), ['outside', 'Already paid']].map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={mode === k} className={mode === k ? 'is-on' : ''} onClick={() => { setErr(''); setMode(k); if (k === 'new' && f.at < P.minDay) set('at', P.today); }}>{l}</button>))}
          </div> : null}
          {out ? <p className="k-sub">Paid earlier, outside the float (by the boss, the bank, or before the float started) and not in the cash book? Mark it paid here: <b>the float is not touched</b>. {P.first} still accounts for it.</p> : null}
          {mode === 'book' ? <>
            <p className="k-sub">Paid before it was approved and already recorded as an expense? Choose that record. {P.id} is marked paid with it and the float is <b>not</b> reduced a second time.</p>
            <div className="fl-settle" role="radiogroup" aria-label="Cash book record">{book.map(e => (
              <button key={e.id} type="button" role="radio" aria-checked={pick === e.id} className={'fl-req' + (pick === e.id ? ' is-on' : '')} onClick={() => { setErr(''); setPick(e.id); }}>
                <span><b>{e.voucher} · {e.day}</b><small>{e.what}{e.who ? ' · ' + e.who : ''} · {e.where}</small></span><em>{e.amtT}</em>
              </button>))}</div>
          </> : <>
          {P.payTo ? <p className="mr-pay"><b>Pay to</b> {P.payTo}</p> : null}
          <label className="fh-amt fl-money"><span>TZS</span><input inputMode="numeric" value={f.amt ? n(f.amt) : ''} onChange={e => set('amt', digits(e.target.value))} placeholder="0" aria-label="Amount paid" /></label>
          <small className="k-sub">Asked {P.askedT}{amt && amt < P.asked ? ' · paying part of it' : ''}</small>
          <div className="ff" data-field="Paid by"><span className="ff-l">Paid by</span>
            <div className="ff-chips" role="radiogroup" aria-label="Paid by">{P.methods.map(m => <button key={m} type="button" role="radio" aria-checked={f.method === m} className={f.method === m ? 'is-on' : ''} onClick={() => set('method', m)}>{m}</button>)}</div>
          </div>
          <label className="fh-amt"><span>Transaction charges</span><input inputMode="numeric" value={f.fee ? n(f.fee) : ''} onChange={e => set('fee', digits(e.target.value))} placeholder="0" aria-label="Transaction charges" /></label>
          <label className="fl-date"><span>Date paid</span><input type="date" value={f.at} min={out ? undefined : P.minDay} max={P.today} onChange={e => set('at', e.target.value || P.today)} aria-label="Date paid" /></label>
          {left != null && left < 0 ? <p className="bi-ret" role="status">This takes the float below zero (−TZS {n(-left)}). It is still recorded and Management is told.</p> : null}
          {out ? null : <p className="k-sub">{P.first} must then account for it: what was spent, the receipts and the change.</p>}
          </>}
          {err ? <div className="fm-err" role="alert">{err}</div> : null}
        </div>
        <footer className="fm-foot"><Btn kind="ghost" onClick={P.close}>Cancel</Btn><Btn kind="dark" disabled={busy} onClick={go}>{mode === 'book' ? (chosen ? 'Mark paid · ' + chosen.voucher : 'Mark paid') : out ? 'Mark already paid · TZS ' + n(amt) : 'Pay TZS ' + n(amt)}</Btn></footer>
      </div>
    </div>
  );
}
