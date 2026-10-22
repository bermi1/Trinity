import { useEffect, useState } from 'react';
import { Logo } from '../mobile/Icon';
import { useThemeColor } from '../mobile/native';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

// Full-screen PIN keypad. mode 'setup': choose and confirm a PIN. mode 'lock': unlock with it.
export default function PinScreen({ v }) {
  const P = v.PIN;
  const [pin, setPin] = useState('');
  const [first, setFirst] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  useThemeColor('#1D103D');
  const setup = P.mode === 'setup';

  const fail = msg => { setErr(msg); setPin(''); setShake(n => n + 1); try { navigator.vibrate && navigator.vibrate([30, 40, 30]); } catch (e) {} };

  const submit = async value => {
    if (busy) return;
    if (setup) {
      if (first === null) { setFirst(value); setPin(''); setErr(''); return; }
      setBusy(true);
      const e = await P.set(first, value);
      setBusy(false);
      if (e) { setFirst(null); fail(e); }
      return;
    }
    setBusy(true);
    const e = await P.unlock(value);
    setBusy(false);
    if (e) fail(e);
  };

  const press = k => {
    if (busy) return;
    setErr('');
    if (k === 'del') { setPin(p => p.slice(0, -1)); return; }
    if (!k || pin.length >= 6) return;
    const next = pin + k;
    setPin(next);
  };

  // Computer keyboards: digits, Backspace and Enter.
  useEffect(() => {
    const on = e => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('del');
      else if (e.key === 'Enter' && pin.length >= 4) submit(pin);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });

  const title = setup ? (first === null ? 'Set a PIN for quick sign-in' : 'Enter the PIN again') : 'Enter your PIN';
  const sub = setup
    ? (first === null ? '4 to 6 digits. Next time you open the app, this PIN unlocks it.' : 'To make sure it’s right.')
    : 'Signed in as ' + P.name;

  return (
    <div className="pin" role="dialog" aria-modal="true" aria-label={title}>
      <div className="pin-top">
        <Logo size={30} />
        <h1>{title}</h1>
        <p>{sub}</p>
        <div className={'pin-dots' + (shake ? ' is-shake' : '')} key={shake} aria-label={pin.length + ' digits entered'}>
          {Array.from({ length: Math.min(6, Math.max(4, pin.length)) }).map((_, i) => <i key={i} className={i < pin.length ? 'is-on' : ''} />)}
        </div>
        <p className="pin-err" role="alert">{err}</p>
      </div>
      <div className="pin-pad">
        {KEYS.map((k, i) => k === '' ? <span key={i} /> : (
          <button key={i} type="button" className={k === 'del' ? 'is-del' : ''} onClick={() => press(k)} aria-label={k === 'del' ? 'Delete' : k}>
            {k === 'del' ? '⌫' : k}
          </button>
        ))}
      </div>
      <div className="pin-foot">
        {pin.length >= 4 ? (
          <button type="button" className="pin-go" onClick={() => submit(pin)} disabled={busy}>{setup ? (first === null ? 'Next' : 'Save PIN') : 'Unlock'}</button>
        ) : null}
        {setup
          ? <button type="button" className="pin-link" onClick={P.skip}>Not now</button>
          : <button type="button" className="pin-link" onClick={P.usePassword}>Use password instead</button>}
      </div>
    </div>
  );
}
