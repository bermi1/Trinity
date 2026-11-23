import { useState } from 'react';
import { CATEGORIES, GENDERS, register, badge } from './api';

const BLANK = { full_name: '', phone: '', email: '', organization: '', position: '', region: '', district: '', gender: '', category: '' };

function Field({ sw, en, children, req }) {
  return <label className="ev-field"><span>{sw}{req ? <em> *</em> : null}<small>{en}</small></span>{children}</label>;
}

// The registration form, used by attendees (QR) and at the desk (walk-in).
export default function RegisterForm({ mode, onDone, compact }) {
  const [f, setF] = useState(BLANK);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k, v) => { setErr(''); setF(x => Object.assign({}, x, { [k]: v })); };
  const submit = async e => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const r = await register(f, mode);
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    onDone(Object.assign({ badgeT: badge(r.badge_no), form: f }, r));
    setF(BLANK);
  };
  return (
    <form className={'ev-form' + (compact ? ' is-compact' : '')} onSubmit={submit} noValidate aria-label="Fomu ya usajili · Registration form">
      <div className="ev-grid">
        <Field sw="Jina kamili" en="Full name" req><input value={f.full_name} onChange={e => set('full_name', e.target.value)} autoComplete="name" placeholder="mf. Asha Juma Mollel" aria-label="Full name" /></Field>
        <Field sw="Namba ya simu" en="Phone number" req><input value={f.phone} onChange={e => set('phone', e.target.value)} inputMode="tel" autoComplete="tel" placeholder="07xx xxx xxx" aria-label="Phone number" /></Field>
        <Field sw="Taasisi / Shirika" en="Organisation"><input value={f.organization} onChange={e => set('organization', e.target.value)} placeholder="mf. TANESCO Mkoa wa Dodoma" aria-label="Organisation" /></Field>
        <Field sw="Cheo" en="Position / title"><input value={f.position} onChange={e => set('position', e.target.value)} placeholder="mf. Afisa Mipango" aria-label="Position" /></Field>
        <Field sw="Mkoa" en="Region"><input value={f.region} onChange={e => set('region', e.target.value)} placeholder="mf. Dodoma" aria-label="Region" /></Field>
        <Field sw="Wilaya" en="District"><input value={f.district} onChange={e => set('district', e.target.value)} placeholder="mf. Chamwino" aria-label="District" /></Field>
        <Field sw="Barua pepe" en="Email (optional)"><input value={f.email} onChange={e => set('email', e.target.value)} inputMode="email" autoComplete="email" placeholder="jina@mfano.co.tz" aria-label="Email" /></Field>
        <div className="ev-field"><span>Jinsia<small>Gender</small></span><div className="ev-chips" role="radiogroup" aria-label="Gender">{GENDERS.map(g => <button key={g} type="button" role="radio" aria-checked={f.gender === g} className={f.gender === g ? 'is-on' : ''} onClick={() => set('gender', g)}>{g}</button>)}</div></div>
      </div>
      <div className="ev-field"><span>Kundi<em> *</em><small>You are attending as</small></span><div className="ev-chips" role="radiogroup" aria-label="Category">{CATEGORIES.map(c => <button key={c} type="button" role="radio" aria-checked={f.category === c} className={f.category === c ? 'is-on' : ''} onClick={() => set('category', c)}>{c}</button>)}</div></div>
      {err ? <div className="ev-err" role="alert">{err}</div> : null}
      <button type="submit" className="ev-go" disabled={busy}>{busy ? 'Inasajili…' : mode === 'walkin' ? 'Sajili mgeni · Register attendee' : 'Jisajili · Register'}</button>
      {mode === 'qr' ? <p className="ev-fine">Taarifa zako zitatumika kwa ajili ya kikao hiki pekee. Your details are used only for this event.</p> : null}
    </form>
  );
}
