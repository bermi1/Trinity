import { useState } from 'react';
import { CATEGORIES, GENDERS, register, badge, checkStep } from './api';
import Icon from './icons';

const BLANK = { full_name: '', phone: '', email: '', organization: '', position: '', region: '', district: '', gender: '', category: '' };

// The three sections attendees step through (walk-in at the desk shows them all at once).
export const STEPS = [
  { k: 'me', sw: 'Taarifa zako', en: 'About you', ic: 'user' },
  { k: 'work', sw: 'Kazi na mahali', en: 'Work & location', ic: 'building' },
  { k: 'cat', sw: 'Unahudhuria kama', en: 'Attending as', ic: 'badge' }
];

function Field({ sw, en, children, req }) {
  return <label className="ev-field"><span>{sw}{req ? <em> *</em> : null}<small>{en}</small></span>{children}</label>;
}

// The registration form: a three-step flow for attendees (QR), one page for the desk (walk-in).
export default function RegisterForm({ mode, onDone, compact }) {
  const stepped = mode === 'qr';
  const [f, setF] = useState(BLANK);
  const [step, setStep] = useState(0), [dir, setDir] = useState(1);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k, v) => { setErr(''); setF(x => Object.assign({}, x, { [k]: v })); };
  const move = to => { const bad = to > step ? checkStep(f, step) : ''; if (bad) { setErr(bad); return; } setErr(''); setDir(to > step ? 1 : -1); setStep(to); };
  const submit = async e => {
    e.preventDefault();
    if (busy) return;
    if (stepped && step < STEPS.length - 1) { move(step + 1); return; }
    setBusy(true);
    const r = await register(f, mode);
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    onDone(Object.assign({ badgeT: badge(r.badge_no), form: f }, r));
    setF(BLANK); setStep(0);
  };

  const me = [
    <Field key="n" sw="Jina kamili" en="Full name" req><input value={f.full_name} onChange={e => set('full_name', e.target.value)} autoComplete="name" placeholder="mf. Asha Juma Mollel" aria-label="Full name" /></Field>,
    <Field key="p" sw="Namba ya simu" en="Phone number" req><input value={f.phone} onChange={e => set('phone', e.target.value)} inputMode="tel" autoComplete="tel" placeholder="07xx xxx xxx" aria-label="Phone number" /></Field>,
    <Field key="e" sw="Barua pepe" en="Email (optional)"><input value={f.email} onChange={e => set('email', e.target.value)} inputMode="email" autoComplete="email" placeholder="jina@mfano.co.tz" aria-label="Email" /></Field>,
    <div key="g" className="ev-field"><span>Jinsia<small>Gender</small></span><div className="ev-chips" role="radiogroup" aria-label="Gender">{GENDERS.map(g => <button key={g} type="button" role="radio" aria-checked={f.gender === g} className={f.gender === g ? 'is-on' : ''} onClick={() => set('gender', g)}>{g}</button>)}</div></div>
  ];
  const work = [
    <Field key="o" sw="Taasisi / Shirika" en="Organisation"><input value={f.organization} onChange={e => set('organization', e.target.value)} placeholder="mf. TANESCO Dodoma" aria-label="Organisation" /></Field>,
    <Field key="t" sw="Cheo" en="Position / title"><input value={f.position} onChange={e => set('position', e.target.value)} placeholder="mf. Afisa Mipango" aria-label="Position" /></Field>,
    <Field key="r" sw="Mkoa" en="Region"><input value={f.region} onChange={e => set('region', e.target.value)} placeholder="mf. Dodoma" aria-label="Region" /></Field>,
    <Field key="d" sw="Wilaya" en="District"><input value={f.district} onChange={e => set('district', e.target.value)} placeholder="mf. Chamwino" aria-label="District" /></Field>
  ];
  const cat = (
    <div className="ev-field"><span>Kundi<em> *</em><small>You are attending as</small></span><div className="ev-chips is-cats" role="radiogroup" aria-label="Category">{CATEGORIES.map((c, i) => <button key={c} type="button" role="radio" aria-checked={f.category === c} className={f.category === c ? 'is-on' : ''} style={{ '--i': i }} onClick={() => set('category', c)}>{c}</button>)}</div></div>
  );

  if (!stepped) {
    return (
      <form className={'ev-form' + (compact ? ' is-compact' : '')} onSubmit={submit} noValidate aria-label="Fomu ya usajili · Registration form">
        <div className="ev-grid is-desk">{me}{work}</div>
        {cat}
        {err ? <div className="ev-err" role="alert">{err}</div> : null}
        <button type="submit" className="ev-go" disabled={busy}><span>{busy ? 'Inasajili…' : 'Sajili mgeni · Register attendee'}</span></button>
      </form>
    );
  }

  const last = step === STEPS.length - 1;
  return (
    <form className="ev-form is-stepped" onSubmit={submit} noValidate aria-label="Fomu ya usajili · Registration form">
      <ol className="ev-steps" aria-label="Hatua · Steps">
        {STEPS.map((s, i) => (
          <li key={s.k} className={(i === step ? 'is-now' : '') + (i < step ? ' is-done' : '')} aria-current={i === step ? 'step' : undefined}>
            <button type="button" onClick={() => i < step && move(i)} disabled={i > step} aria-label={'Hatua ' + (i + 1) + ' · ' + s.en}><b>{i < step ? <Icon n="check" s={16} /> : i + 1}</b><span>{s.sw}<small>{s.en}</small></span></button>
          </li>
        ))}
      </ol>
      <div className="ev-bar" aria-hidden="true"><i style={{ width: ((step + 1) / STEPS.length) * 100 + '%' }} /></div>
      <section key={step} className={'ev-pane ' + (dir > 0 ? 'is-fwd' : 'is-back')} aria-label={STEPS[step].en}>
        <h3 className="ev-pane-h"><span aria-hidden="true"><Icon n={STEPS[step].ic} s={20} /></span>{STEPS[step].sw}<small>{STEPS[step].en}</small></h3>
        {step === 2 ? cat : <div className="ev-grid">{step === 0 ? me : work}</div>}
      </section>
      {err ? <div className="ev-err" role="alert">{err}</div> : null}
      <div className="ev-nav">
        {step > 0 ? <button type="button" className="ev-back" onClick={() => move(step - 1)}><Icon n="back" s={16} />Rudi · Back</button> : <span />}
        <button type="submit" className="ev-go" disabled={busy}><span>{busy ? 'Inasajili…' : last ? 'Jisajili · Register' : 'Endelea · Next'}</span>{!busy && !last ? <Icon n="next" s={18} /> : null}</button>
      </div>
      <p className="ev-fine">Taarifa zako zitatumika kwa ajili ya kikao hiki pekee. Your details are used only for this event.</p>
    </form>
  );
}
