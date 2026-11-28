import { useState } from 'react';

const n = v => (v ? Number(v).toLocaleString('en-US') : '');
const digits = v => String(v || '').replace(/\D/g, '');

// Transaction charges on a payment already recorded: shows them and lets Finance add or correct them.
export default function ChargesEdit({ fee, save, compact }) {
  const [open, setOpen] = useState(false), [v, setV] = useState(''), [err, setErr] = useState('');
  if (!save) return fee ? <span className="ch-show">Charges TZS {n(fee)}</span> : null;
  if (!open) return (
    <span className={'ch-show' + (compact ? ' is-compact' : '')}>
      {fee ? 'Charges TZS ' + n(fee) : 'No charges recorded'}
      <button type="button" className="k-link ch-btn" onClick={() => { setV(fee ? String(fee) : ''); setErr(''); setOpen(true); }}>{fee ? 'Change' : 'Add charges'}</button>
    </span>
  );
  return (
    <span className="ch-edit">
      <label className="fh-amt"><span>Transaction charges</span><input autoFocus inputMode="numeric" value={n(v)} onChange={e => setV(digits(e.target.value))} placeholder="0" aria-label="Transaction charges" /></label>
      <button type="button" className="me-save" onClick={() => { const m = save(v || '0'); if (m) setErr(m); else setOpen(false); }}>Save</button>
      <button type="button" className="me-cancel" onClick={() => setOpen(false)}>Cancel</button>
      {err ? <span className="fm-err" role="alert">{err}</span> : null}
    </span>
  );
}
