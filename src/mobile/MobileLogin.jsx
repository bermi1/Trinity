import { useState } from 'react';
import { Logo } from './Icon';
import Icon from './Icon';
import { useInstall, useThemeColor } from './native';
import InstallSteps from './InstallSteps';

// Phone sign-in: brand header, large fields and buttons, portal picker, password visibility.
export default function MobileLogin({ v }) {
  const [show, setShow] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);
  const { mode, install } = useInstall();
  useThemeColor('#1D103D');
  const submit = e => { e.preventDefault(); v.haptic(12); v.signIn(); };
  const busy = v.signingIn;
  const err = v.loginErr && v.loginErr !== 'Signing in…' ? v.loginErr : '';

  return (
    <div className="m-login">
      <div className="m-login-hero">
        <svg className="m-login-art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g fill="none" stroke="#B49A5A" strokeOpacity=".22"><path d="M210 300 L310 40 L410 300" /><path d="M240 300 L310 110 L380 300" /><path d="M262 230 L358 230 M252 262 L368 262 M272 198 L348 198" /></g>
          <g fill="none" stroke="#6D3CC2" strokeOpacity=".45"><path d="M0 230 H170 M0 244 H130 M0 258 H90" /><rect x="34" y="70" width="104" height="62" rx="2" /></g>
        </svg>
        <div className="m-login-brand">
          <Logo size={34} />
          <div><b>TRINITY MARK</b><span>360 · OPERATIONS</span></div>
        </div>
        <h1>One system.<br /><em>All operations.</em></h1>
      </div>

      <form className="m-login-card" onSubmit={submit} noValidate>
        <div className="m-login-head">
          <h2>Welcome back</h2>
          <p>{v.loginNote}</p>
        </div>

        <label className="m-field">
          <span>Email</span>
          <input type="email" inputMode="email" autoComplete="username" autoCapitalize="none" value={v.email ?? ''} onChange={v.onEmail} placeholder="name@trinitymark.co.tz" />
        </label>
        <label className="m-field">
          <span>Password</span>
          <div className="m-field-row">
            <input type={show ? 'text' : 'password'} autoComplete="current-password" value={v.pw ?? ''} onChange={v.onPw} placeholder="Your password" />
            <button type="button" className="m-icon-btn" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
              <Icon d={show ? 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6M3 3l18 18' : 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6'} size={19} />
            </button>
          </div>
        </label>

        <div className="m-field">
          <span>Portal</span>
          <div className="m-segment" role="radiogroup" aria-label="Portal">
            {v.loginRoles.map(r => (
              <button type="button" key={r.l} role="radio" aria-checked={r.bg === '#2B1459'} className={r.bg === '#2B1459' ? 'is-on' : ''} onClick={() => { v.haptic(6); r.on(); }}>{r.l}</button>
            ))}
          </div>
        </div>

        <div className="m-login-row">
          <button type="button" className="m-switch-row" onClick={v.toggleRemember} role="switch" aria-checked={v.remember}>
            <span className={'m-switch' + (v.remember ? ' is-on' : '')}><i /></span>Remember me
          </button>
          <a href="#" onClick={v.forgot}>Forgot password?</a>
        </div>

        {err ? <div className="m-alert" role="alert">{err}</div> : null}

        <button type="submit" className="m-primary" disabled={busy}>
          {busy ? <span className="m-spinner" aria-hidden="true" /> : null}{busy ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="m-login-alt">
          <button type="button" onClick={v.signInGoogle}>Google</button>
          <button type="button" onClick={v.signInMicrosoft}>Microsoft</button>
        </div>

        {mode ? (
          <button type="button" className="m-install" onClick={() => (mode === 'prompt' ? install() : setIosHelp(true))}>
            <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" size={18} />
            Install the app on this phone
          </button>
        ) : null}
        <p className="m-login-foot">Trinity Mark Solutions · Dar es Salaam</p>
      </form>
      {iosHelp ? <InstallSteps onClose={() => setIosHelp(false)} /> : null}
    </div>
  );
}
