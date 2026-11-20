import { useState } from 'react';

// A password input with an eye button to show or hide what was typed.
export default function PasswordField({ className, style, label = 'Password', ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'flex', width: '100%' }}>
      <input {...rest} className={className} type={show ? 'text' : 'password'} aria-label={rest['aria-label'] || label} style={Object.assign({ width: '100%', boxSizing: 'border-box', paddingRight: 48 }, style || {})} />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} title={show ? 'Hide password' : 'Show password'}
        style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, border: 'none', background: 'none', borderRadius: 8, cursor: 'pointer', color: '#6E6A7C', display: 'grid', placeItems: 'center', padding: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
          {show ? null : <path d="M3 3l18 18" />}
        </svg>
      </button>
    </span>
  );
}
