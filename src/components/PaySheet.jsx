import { useState } from 'react';
import { Btn } from '../ui/kit';

const n = v => Math.round(+v || 0).toLocaleString('en-US');
const digits = v => String(v || '').replace(/\D/g, '');

// Confirm a payment before it is recorded: the amount (editable, up to what was asked), how it is paid
// (taken from the request), the transaction charges and the day. Used by the Float page's "Waiting to be
// paid" list and by "Mark paid" on the Requests page, so a payment is never recorded by one stray tap.
// A paid request: change its payment (amount, how, charges, day, from the float or not) with a reason,
// or undo it (back to waiting for payment).
function EditPay({ P }) {
  const E = P.edit;
  const [f, setF] = useState(() => ({ amt: E.amt, method: E.method, fee: E.fee, at: E.at, outside: E.outside, reason: '' }));
  const [err, setErr] = useState(''); const [undo, setUndo] = useState(false); const [why, setWhy] = useState('');
  const set = (k, v) => { setErr(''); setF(x => Object.assign({}, x, { [k]: v })); };
  const save = () => { const m = P.edit.save(f); if (m) setErr(m); };
  const back = () => { const m = P.edit.undo(why); if (m) setErr(m); };
  return (
    <div className="fm-back" onClick={P.close}>
      <div className="fm fl-sheet" role="dialog" aria-label="Edit payment" onClick={e => e.stopPropagation()}>
        <header className="fm-head"><div><h2>Edit payment · {P.id}</h2><p>{P.who} · {P.what}</p></div><button type="button" className="fm-x" onClick={P.close} aria-label="Close">×</button></header>
        <div className="fm-body">
          <p className="mr-pay"><b>Paid</b> {E.paidLine}</p>
          {E.fromBook ? <p className="k-sub">Paid with {E.fromBook} from the cash book. To change it, undo this payment ({E.fromBook} becomes a normal expense again), then mark it paid the right way.</p> : <>
            <div className="ff" data-field="Already recorded in the cash book?"><span className="ff-l">Already recorded in the cash book?</span>
              <div className="k-chips ps-mode" role="radiogroup" aria-label="Already recorded in the cash book?">
                {[[false, 'No · paid from the float'], [true, 'Yes · already recorded']].map(([k, l]) => <button key={l} type="button" role="radio" aria-checked={f.outside === k} className={f.outside === k ? 'is-on' : ''} onClick={() => set('outside', k)}>{l}</button>)}
              </div>
            </div>
            {f.outside ? <p className="k-sub">Already in the cash book: it is <b>not</b> taken from the float again and nothing is left for {P.first} to account for.</p> : null}
            <label className="fh-amt fl-money"><span>TZS</span><input inputMode="numeric" value={f.amt ? n(f.amt) : ''} onChange={e => set('amt', digits(e.target.value))} placeholder="0" aria-label="Amount paid" /></label>
            <small className="k-sub">Asked {P.askedT}</small>
            <div className="ff" data-field="Paid by"><span className="ff-l">Paid by</span>
              <div className="ff-chips" role="radiogroup" aria-label="Paid by">{P.methods.map(m => <button key={m} type="button" role="radio" aria-checked={f.method === m} className={f.method === m ? 'is-on' : ''} onClick={() => set('method', m)}>{m}</button>)}</div>
            </div>
            <label className="fh-amt"><span>Transaction charges</span><input inputMode="numeric" value={f.fee ? n(f.fee) : ''} onChange={e => set('fee', digits(e.target.value))} placeholder="0" aria-label="Transaction charges" /></label>
            <label className="fl-date"><span>Date paid</span><input type="date" value={f.at} max={P.today} onChange={e => set('at', e.target.value || E.at)} aria-label="Date paid" /></label>
            <input className="ff-search" value={f.reason} onChange={e => set('reason', e.target.value)} placeholder="Why the change? (required)" aria-label="Reason for the change" />
          </>}
          {E.history.length ? <ul className="fl-edits">{E.history.map((h, i) => <li key={i}>{h}</li>)}</ul> : null}
          {undo ? <div className="fl-del"><p><b>Undo this payment?</b> {P.id} goes back to waiting for payment{E.fromBook || E.outside ? '' : ' and the float goes back up'}.</p>
            <div className="fh-row"><input className="ff-search" autoFocus value={why} onChange={e => { setErr(''); setWhy(e.target.value); }} placeholder="Reason (required)" aria-label="Reason for undoing" /><Btn kind="dark" onClick={back}>Undo payment</Btn></div></div> : null}
          {err ? <div className="fm-err" role="alert">{err}</div> : null}
        </div>
        <footer className="fm-foot">{undo ? <Btn kind="ghost" onClick={() => setUndo(false)}>Keep it</Btn> : <Btn kind="ghost" onClick={() => setUndo(true)}>Undo payment</Btn>}{E.fromBook || undo ? null : <Btn kind="dark" onClick={save}>Save change</Btn>}</footer>
      </div>
    </div>
  );
}

export default function PaySheet({ P }) {
  if (P.edit) return <EditPay P={P} />;
  return <PaySheetNew P={P} />;
}

function PaySheetNew({ P }) {
  const [f, setF] = useState(() => ({ amt: String(P.asked), method: P.method, fee: '', at: P.today }));
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k, v) => { setErr(''); setF(x => Object.assign({}, x, { [k]: v })); };
  const amt = +f.amt || 0, fee = +f.fee || 0;
  // The one question: is this payment already recorded in the cash book? Yes = no second deduction.
  const [inBook, setInBook] = useState(false); const [pick, setPick] = useState('');
  const left = P.floatLeft == null || inBook ? null : P.floatLeft - amt - fee;
  const book = P.book || [], chosen = book.find(e => e.id === pick);
  const go = () => { setBusy(true); const m = inBook ? (pick ? P.payFromBook(pick) : P.paidOutside(f)) : P.pay(f); setBusy(false); if (m) setErr(m); };
  return (
    <div className="fm-back" onClick={P.close}>
      <div className="fm fl-sheet" role="dialog" aria-label="Confirm payment" onClick={e => e.stopPropagation()}>
        <header className="fm-head"><div><h2>Pay {P.id}</h2><p>{P.who} · {P.what}</p></div><button type="button" className="fm-x" onClick={P.close} aria-label="Close">×</button></header>
        <div className="fm-body">
          {P.paidOutside ? <div className="ff" data-field="Already recorded in the cash book?"><span className="ff-l">Already recorded in the cash book?</span>
            <div className="k-chips ps-mode" role="radiogroup" aria-label="Already recorded in the cash book?">
              {[[false, 'No · pay from the float'], [true, 'Yes · already recorded']].map(([k, l]) => (
                <button key={l} type="button" role="radio" aria-checked={inBook === k} className={inBook === k ? 'is-on' : ''} onClick={() => { setErr(''); setInBook(k); setPick(''); if (!k && f.at < P.minDay) set('at', P.today); }}>{l}</button>))}
            </div>
          </div> : null}
          {inBook ? <p className="k-sub">The payment is already in the cash book, so {P.id} is marked paid and accounted for, and <b>the float is not reduced again</b> (no double entry).{book.length ? ' Link the record if it is listed:' : ''}</p> : null}
          {inBook && book.length ? <div className="fl-settle" role="radiogroup" aria-label="Cash book record">
            {book.map(e => (
              <button key={e.id} type="button" role="radio" aria-checked={pick === e.id} className={'fl-req' + (pick === e.id ? ' is-on' : '')} onClick={() => { setErr(''); setPick(pick === e.id ? '' : e.id); }}>
                <span><b>{e.voucher} · {e.day}</b><small>{e.what}{e.who ? ' · ' + e.who : ''} · {e.where}</small></span><em>{e.amtT}</em>
              </button>))}
            <button type="button" role="radio" aria-checked={!pick} className={'fl-req' + (!pick ? ' is-on' : '')} onClick={() => { setErr(''); setPick(''); }}><span><b>Not listed</b><small>Recorded on another line or earlier · enter the amount and day below</small></span></button>
          </div> : null}
          {chosen ? null : <>
          {P.payTo && !inBook ? <p className="mr-pay"><b>Pay to</b> {P.payTo}</p> : null}
          <label className="fh-amt fl-money"><span>TZS</span><input inputMode="numeric" value={f.amt ? n(f.amt) : ''} onChange={e => set('amt', digits(e.target.value))} placeholder="0" aria-label="Amount paid" /></label>
          <small className="k-sub">Asked {P.askedT}{amt && amt < P.asked ? ' · paying part of it' : ''}</small>
          <div className="ff" data-field="Paid by"><span className="ff-l">Paid by</span>
            <div className="ff-chips" role="radiogroup" aria-label="Paid by">{P.methods.map(m => <button key={m} type="button" role="radio" aria-checked={f.method === m} className={f.method === m ? 'is-on' : ''} onClick={() => set('method', m)}>{m}</button>)}</div>
          </div>
          <label className="fh-amt"><span>Transaction charges</span><input inputMode="numeric" value={f.fee ? n(f.fee) : ''} onChange={e => set('fee', digits(e.target.value))} placeholder="0" aria-label="Transaction charges" /></label>
          <label className="fl-date"><span>Date paid</span><input type="date" value={f.at} min={inBook ? undefined : P.minDay} max={P.today} onChange={e => set('at', e.target.value || P.today)} aria-label="Date paid" /></label>
          {left != null && left < 0 ? <p className="bi-ret" role="status">This takes the float below zero (−TZS {n(-left)}). It is still recorded and Management is told.</p> : null}
          {inBook ? null : <p className="k-sub">{P.first} must then account for it: what was spent, the receipts and the change.</p>}
          </>}
          {err ? <div className="fm-err" role="alert">{err}</div> : null}
        </div>
        <footer className="fm-foot"><Btn kind="ghost" onClick={P.close}>Cancel</Btn><Btn kind="dark" disabled={busy} onClick={go}>{inBook ? (chosen ? 'Mark paid · ' + chosen.voucher : 'Mark paid · TZS ' + n(amt)) : 'Pay TZS ' + n(amt)}</Btn></footer>
      </div>
    </div>
  );
}
