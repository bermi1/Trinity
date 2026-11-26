import { useState } from 'react';

const WA_ICON = 'M20.5 3.5A11 11 0 0 0 3.2 17.4L2 22l4.7-1.2A11 11 0 1 0 20.5 3.5zM12 20a8 8 0 0 1-4.1-1.1l-.3-.2-2.8.7.7-2.7-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.7-.8s-.4-.1-.5.1-.6.8-.8 1-.3.1-.5 0a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.8 2c0 1.2.9 2.3 1 2.5s1.7 2.6 4.1 3.7c1.5.6 2.1.7 2.9.6.5-.1 1.4-.6 1.6-1.1s.2-1 .1-1.1-.2-.2-.4-.3z';

// Your WhatsApp number: reminders about tasks, requests and reports can reach you on WhatsApp (and SMS).
export default function MyWhatsApp({ v }) {
  const W = v.WA;
  const [edit, setEdit] = useState(false), [ph, setPh] = useState(''), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false);
  if (!W) return null;
  if (W.phone && !edit) return (
    <div className="mwa is-set"><svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true"><path d={WA_ICON} /></svg><span>WhatsApp reminders go to <b>{W.phone}</b></span><button type="button" onClick={() => { setPh(W.phone); setEdit(true); setMsg(''); }}>Change</button></div>
  );
  const save = async () => { setBusy(true); const m = await W.save(ph); setBusy(false); setMsg(m || ''); if (!m) setEdit(false); };
  return (
    <section className="mwa" aria-label="My WhatsApp number">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true"><path d={WA_ICON} /></svg>
      <div className="mwa-t"><b>Add your WhatsApp number</b><span>So reminders about your tasks and requests can reach you on WhatsApp.</span></div>
      <div className="mwa-f">
        <input value={ph} onChange={e => { setPh(e.target.value); setMsg(''); }} inputMode="tel" placeholder="07xx xxx xxx" aria-label="My WhatsApp number" />
        <button type="button" onClick={save} disabled={busy || !ph.trim()}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
      {msg ? <small role="alert">{msg}</small> : null}
    </section>
  );
}
