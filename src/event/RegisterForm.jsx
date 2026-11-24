import { useState } from 'react';
import { register, badge } from './api';
import Icon from './icons';

const BLANK = { full_name: '', phone: '', organization: '', position: '', category: '' };

function Field({ sw, en, children, req }) {
  return <label className="ev-field"><span>{sw}{req ? <em> *</em> : null}<small>{en}</small></span>{children}</label>;
}

// One short form, used by attendees (QR) and at the desk (walk-in): name, phone, company, title, attending as.
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
        <Field sw="Kampuni / Taasisi" en="Company you come from"><input value={f.organization} onChange={e => set('organization', e.target.value)} autoComplete="organization" placeholder="mf. CRDB Bank Foundation" aria-label="Company" /></Field>
        <Field sw="Cheo" en="Title"><input value={f.position} onChange={e => set('position', e.target.value)} autoComplete="organization-title" placeholder="mf. Afisa Mipango" aria-label="Title" /></Field>
      </div>
      <Field sw="Unahudhuria kama" en="Attending as" req><input value={f.category} onChange={e => set('category', e.target.value)} placeholder="mf. Mkulima, Mgeni, Mwanahabari" aria-label="Attending as" /></Field>
      {err ? <div className="ev-err" role="alert">{err}</div> : null}
      <button type="submit" className="ev-go" disabled={busy}>{busy ? <span>Inasajili…</span> : <><span>{mode === 'walkin' ? 'Sajili mgeni · Register attendee' : 'Jisajili · Register'}</span><Icon n="next" s={18} /></>}</button>
      {mode === 'qr' ? <p className="ev-fine">Taarifa zako zitatumika kwa ajili ya kikao hiki pekee. Your details are used only for this event.</p> : null}
    </form>
  );
}
