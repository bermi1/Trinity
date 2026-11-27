import { useState } from 'react';
import { Btn } from '../ui/kit';

const n = v => Math.round(+v || 0).toLocaleString('en-US');
const digits = v => String(v || '').replace(/\D/g, '');

// The person who received money for a request accounts for it: what was spent per item (pre-filled from
// the request, amounts editable, rows can be added), receipts, and the change with how it comes back.
export function AccountForm({ r }) {
  const A = r.account;
  const [rows, setRows] = useState(() => A.items.map(x => ({ d: x.d, amt: digits(x.amt) })));
  const [back, setBack] = useState(null); // null = paid − spent
  const [via, setVia] = useState('');
  const [files, setFiles] = useState([]);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const spent = rows.reduce((t, x) => t + (+x.amt || 0), 0), left = A.paid - spent, over = spent - A.paid;
  const backV = back == null ? String(Math.max(0, left)) : back;
  const setRow = (i, k, val) => { setErr(''); setRows(l => l.map((x, j) => (j === i ? Object.assign({}, x, { [k]: val }) : x))); };
  const send = async () => {
    setBusy(true);
    const m = await r.reconcile({ items: rows, back: backV, backVia: +backV > 0 ? via : '', files });
    setBusy(false); if (m) setErr(m);
  };
  return (
    <div className="ac" data-account={r.id}>
      <div className="ac-head"><b>Account for {A.paidT}</b><span className={A.overdue ? 'ac-due is-late' : 'ac-due'}>{A.overdue ? 'Overdue · was due ' : 'Due '}{A.dueLabel}</span></div>
      {A.backNote ? <p className="bi-ret">Finance sent it back: {A.backNote}</p> : null}
      <div className="ac-rows">
        {rows.map((x, i) => (
          <div key={i} className="ac-row">
            <input className="ff-search" value={x.d} onChange={e => setRow(i, 'd', e.target.value)} placeholder="What it was for" aria-label={'What for' + (i ? ' · item ' + (i + 1) : '')} />
            <label className="fh-amt"><span>TZS</span><input inputMode="numeric" value={x.amt ? n(x.amt) : ''} onChange={e => setRow(i, 'amt', digits(e.target.value))} placeholder="0" aria-label={'Amount spent' + (i ? ' · item ' + (i + 1) : '')} /></label>
            {rows.length > 1 ? <button type="button" className="td-x" aria-label={'Remove item ' + (i + 1)} onClick={() => setRows(l => l.filter((_, j) => j !== i))}>×</button> : null}
          </div>
        ))}
        <button type="button" className="fh-addline" onClick={() => setRows(l => [...l, { d: '', amt: '' }])}>+ Add a row</button>
      </div>
      <p className="ac-sum">Spent <b>TZS {n(spent)}</b> of {A.paidT}</p>
      {over > 0 ? <p className="bi-ret" role="status">Spent more than given (TZS {n(over)}). Finance will decide; a top-up is a new request.</p> : (
        <div className="ac-change">
          <label className="fh-amt"><span>Change</span><input inputMode="numeric" value={n(backV)} onChange={e => setBack(digits(e.target.value))} aria-label="Change left over" /></label>
          {+backV > 0 ? <div className="ff-chips" role="radiogroup" aria-label="How the change comes back">{A.backVia.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={via === k} className={via === k ? 'is-on' : ''} onClick={() => setVia(k)}>{l}</button>)}</div> : null}
        </div>
      )}
      <label className="bi-up"><input type="file" multiple accept="image/*,.pdf" onChange={e => setFiles([...(e.target.files || [])])} aria-label="Receipts" />{files.length ? '✓ ' + files.map(f => f.name).join(', ') : '↑ Photos of the receipts'}</label>
      <Btn kind="dark" disabled={busy} onClick={send}>{busy ? 'Sending…' : 'Send to Finance'}</Btn>
      {err ? <span className="fm-err" role="alert">{err}</span> : null}
    </div>
  );
}

// Finance checks what was accounted for: the breakdown and receipts, then Accept or Send back.
export function RecCheck({ c, compact }) {
  const [via, setVia] = useState(c.backVia && c.backVia !== 'Not yet' ? c.backVia : '');
  const [note, setNote] = useState(''); const [back, setBack] = useState(false); const [err, setErr] = useState('');
  const run = m => setErr(m || '');
  return (
    <div className={'ac ac-check is-' + c.st} data-rec={c.id}>
      <div className="ac-head"><b>{compact ? c.who + ' · ' + c.id : c.stl}</b><span className="ac-due">{compact ? c.where : c.at}</span></div>
      <p className="ac-sum">Paid <b>{c.paid}</b> · spent <b>{c.spent}</b>{c.over ? <> · <span className="is-red">spent more than given ({c.over})</span></> : <> · change <b>{c.back}</b>{c.backVia ? ' (' + c.backVia + ')' : ''}</>}{c.short ? <> · <span className="is-red">missing {c.short}</span></> : null}</p>
      {c.items.length ? <ul className="ac-items">{c.items.map((x, i) => <li key={i}><span>{x.d}</span><b>{x.amt}</b></li>)}</ul> : null}
      {c.files.length ? <div className="fh-row">{c.files.map((f, i) => <button key={i} type="button" className="td-start" onClick={f.open}>View receipt{c.files.length > 1 ? ' ' + (i + 1) : ''}</button>)}</div> : <span className="k-sub">No receipt attached</span>}
      {c.st === 'back' && c.note ? <p className="bi-ret">Sent back: {c.note}</p> : null}
      {c.okLine ? <p className="mr-recline">{c.okLine}</p> : null}
      {c.canOk ? (
        <>
          {c.backN > 0 ? <div className="ff-chips" role="radiogroup" aria-label="Change came back by">{[['Cash', 'Cash'], ['M-Pesa', 'M-Pesa']].map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={via === k} className={via === k ? 'is-on' : ''} onClick={() => setVia(k)}>{l}</button>)}</div> : null}
          <div className="fh-row">
            <Btn kind="dark" onClick={() => run(c.ok(via || (c.backVia === 'Not yet' ? 'Not yet' : c.backVia || 'Cash')))}>Accept{c.backN > 0 ? ' · ' + c.back + ' back' : ''}</Btn>
            {!back ? <Btn kind="ghost" onClick={() => setBack(true)}>Send back</Btn> : null}
          </div>
          {back ? <div className="fh-row"><input className="ff-search" value={note} onChange={e => setNote(e.target.value)} placeholder="What needs fixing? (e.g. receipt photo missing)" aria-label="Why it is sent back" /><Btn kind="ghost" onClick={() => run(c.sendBack(note))}>Send back</Btn></div> : null}
        </>
      ) : null}
      {err ? <span className="fm-err" role="alert">{err}</span> : null}
    </div>
  );
}
