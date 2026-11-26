import { useState } from 'react';

// The requester's own request, while it waits or after it was not approved: reply to a question,
// correct the payment details, and resubmit a request that was not approved.
export default function FixRequest({ R }) {
  const p = R.curPay || {};
  const [f, setF] = useState({ amt: R.curAmt || '', purpose: R.curPurpose || '', title: R.curTitle || '', reply: '', payBy: p.by || '', payName: p.name || '', payNo: p.no || '', payBank: p.bank || '' });
  const [msg, setMsg] = useState(''), [ok, setOk] = useState(false);
  const set = (k, v) => { setMsg(''); setF(x => Object.assign({}, x, { [k]: v })); };
  const rej = R.isRej;
  const send = () => { const m = R.fix(R.canEdit ? f : Object.assign({}, f, { amt: undefined, purpose: undefined, title: undefined })); setOk(!m); setMsg(m || (rej ? 'Resubmitted for approval' : 'Sent')); if (!m) set('reply', ''); };
  return (
    <section className={'fx' + (rej ? ' is-rej' : R.infoAsked ? ' is-ask' : '')} aria-label="Correct my request">
      <b className="fx-h">{rej ? 'Not approved: correct it and resubmit' : R.infoAsked ? 'You were asked for more information' : R.canEdit ? 'Edit my request (nobody has approved it yet)' : 'Change my request'}</b>
      {R.canEdit ? (
        <div className="fx-row">
          <label className="fx-f"><span>Amount (TZS)</span><input value={f.amt} onChange={e => set('amt', e.target.value)} inputMode="numeric" aria-label="Amount" /></label>
          {R.curTitle ? <label className="fx-f"><span>Title</span><input value={f.title} onChange={e => set('title', e.target.value)} aria-label="Title" /></label> : null}
          <label className="fx-f" style={{ flexBasis: '100%' }}><span>Purpose</span><textarea rows={2} value={f.purpose} onChange={e => set('purpose', e.target.value)} aria-label="Purpose" /></label>
        </div>
      ) : null}
      <label className="fx-f"><span>{rej ? 'What did you change?' : R.infoAsked ? 'Reply' : 'Note (optional)'}</span><textarea rows={2} value={f.reply} onChange={e => set('reply', e.target.value)} placeholder={rej ? 'e.g. Corrected the amount and the M-Pesa number' : 'Write your answer'} aria-label="Reply" /></label>
      <div className="fx-f"><span>Pay by</span><div className="fx-chips" role="radiogroup" aria-label="Pay by">{R.payOpts.map(o => <button key={o} type="button" role="radio" aria-checked={f.payBy === o} className={f.payBy === o ? 'is-on' : ''} onClick={() => set('payBy', o)}>{o}</button>)}</div></div>
      <div className="fx-row">
        <label className="fx-f"><span>Name on the account / recipient</span><input value={f.payName} onChange={e => set('payName', e.target.value)} aria-label="Payee name" /></label>
        {f.payBy !== 'Cash' ? <label className="fx-f"><span>Phone or account number</span><input value={f.payNo} onChange={e => set('payNo', e.target.value)} inputMode="tel" aria-label="Payee number" /></label> : null}
        {f.payBy === 'Bank' ? <label className="fx-f"><span>Bank</span><input value={f.payBank} onChange={e => set('payBank', e.target.value)} aria-label="Payee bank" /></label> : null}
      </div>
      {msg ? <div role="status" className={'fx-msg' + (ok ? ' is-ok' : '')}>{msg}</div> : null}
      <button type="button" className="fx-go" onClick={send}>{rej ? 'Correct and resubmit' : R.canEdit ? 'Save changes' : 'Send update'}</button>
    </section>
  );
}
