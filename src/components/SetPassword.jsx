import { useState } from 'react';
import PasswordField from './PasswordField';

// First sign-in: everyone starts with the shared password the admin gave them and must choose their own.
export default function SetPassword({ v }) {
  const [a, setA] = useState(''); const [b, setB] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const go = async e => {
    e.preventDefault();
    if (a.length < 8) { setErr('Use at least 8 characters.'); return; }
    if (a !== b) { setErr('The two passwords do not match.'); return; }
    setBusy(true); const m = await v.setOwnPassword(a); setBusy(false);
    if (m) setErr(m);
  };
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#1D103D', padding: 16 }}>
      <form onSubmit={go} aria-label="Choose your password" style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 16, padding: 24, display: 'grid', gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 20, color: '#17152A' }}>Welcome, {v.me.n.split(' ')[0]}</h1>
        <p style={{ margin: 0, fontSize: 14, color: '#6E6A7C' }}>You signed in with the password you were given. Choose your own password to continue.</p>
        <PasswordField className="ff-search" autoFocus value={a} onChange={e => { setErr(''); setA(e.target.value); }} placeholder="New password (8+ characters)" aria-label="New password" autoComplete="new-password" />
        <PasswordField className="ff-search" value={b} onChange={e => { setErr(''); setB(e.target.value); }} placeholder="Type it again" aria-label="Confirm new password" autoComplete="new-password" />
        {err ? <div className="fm-err" role="alert">{err}</div> : null}
        <button type="submit" className="me-save" disabled={busy}>{busy ? 'Saving…' : 'Save and continue'}</button>
        <button type="button" className="me-cancel" onClick={v.signOut}>Sign out</button>
      </form>
    </div>
  );
}
