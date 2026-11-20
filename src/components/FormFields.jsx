import { faceStyle, faceText } from '../ui/kit';
import { useState } from 'react';

// Form fields shared by the desktop form and the phone sheet. No plain dropdowns:
// short choices are chips, people are faces, long lists open a searchable list,
// amounts get thousands separators and quick amounts.

const QUICK = [50000, 100000, 250000, 500000, 1000000];
const short = n => (n >= 1e6 ? n / 1e6 + 'M' : n / 1e3 + 'K');
const groupDigits = v => String(v || '').replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function Chips({ f }) {
  return (
    <div className="ff-chips" role="radiogroup" aria-label={f.l}>
      {f.opts.map(o => (
        <button key={o.v} type="button" role="radio" aria-checked={String(f.v) === String(o.v)} className={String(f.v) === String(o.v) ? 'is-on' : ''} onClick={() => f.set(o.v)}>{o.l}</button>
      ))}
    </div>
  );
}

function People({ f }) {
  const [q, setQ] = useState('');
  const list = q ? f.opts.filter(o => o.l.toLowerCase().includes(q.toLowerCase())) : f.opts;
  return (
    <div className="ff-people-wrap">
      {f.opts.length > 8 ? <input className="ff-search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search people" aria-label={'Search ' + f.l} /> : null}
      <div className="ff-people" role="radiogroup" aria-label={f.l}>
        {list.map(o => (
          <button key={o.v} type="button" role="radio" aria-checked={f.v === o.v} aria-label={o.l} className={f.v === o.v ? 'is-on' : ''} onClick={() => f.set(o.v)}>
            <span className="ff-face" style={faceStyle(o)}>{faceText(o)}</span>
            <span className="ff-name">{o.l.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Pick({ f }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const cur = f.opts.find(o => String(o.v) === String(f.v));
  const list = q ? f.opts.filter(o => o.l.toLowerCase().includes(q.toLowerCase())) : f.opts;
  return (
    <div className={'ff-pick' + (open ? ' is-open' : '')}>
      <button type="button" className="ff-pick-btn" aria-expanded={open} aria-label={f.l + ': ' + (cur ? cur.l : 'choose')} onClick={() => setOpen(!open)}>
        <span>{cur ? cur.l : 'Choose…'}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open ? (
        <div className="ff-pick-list">
          <input className="ff-search" autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={'Search ' + f.l.toLowerCase()} aria-label={'Search ' + f.l} />
          <div role="listbox" aria-label={f.l}>
            {list.map(o => (
              <button key={o.v} type="button" role="option" aria-selected={String(f.v) === String(o.v)} onClick={() => { f.set(o.v); setOpen(false); setQ(''); }}>{o.l}</button>
            ))}
            {!list.length ? <p className="ff-none">Nothing matches.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Money({ f, last, onEnter }) {
  return (
    <div className="ff-money">
      <div className="ff-money-in">
        <span>TZS</span>
        <input inputMode="numeric" value={groupDigits(f.v)} onChange={e => f.set(e.target.value.replace(/\D/g, ''))} placeholder={groupDigits(f.ph) || '0'} aria-label={f.l} enterKeyHint={last ? 'done' : 'next'} onKeyDown={onEnter} />
      </div>
      <div className="ff-quick" aria-label="Quick amounts">
        {QUICK.map(n => <button key={n} type="button" onClick={() => f.set(String(n))}>{short(n)}</button>)}
      </div>
    </div>
  );
}

function FileDrop({ f }) {
  return (
    <label className={'ff-file' + (f.attached ? ' is-done' : '')}>
      <input type="file" accept={f.accept || undefined} onChange={f.on} aria-label={f.l} />
      <span className="ff-file-ic" aria-hidden="true">{f.attached ? '✓' : '↑'}</span>
      <span>{f.attached ? f.attached : f.uploading ? 'Uploading…' : 'Tap to choose a file'}<small>{f.hint || 'PDF, Word or images'}</small></span>
    </label>
  );
}

export default function FormFields({ fields, onEnter }) {
  return fields.map((f, i) => {
    const last = i === fields.length - 1;
    if (f.kind === 'text' || f.kind === 'area') {
      return (
        <label key={f.k || i} className="ff" data-field={f.l}>
          <span className="ff-l">{f.l}{f.req ? <em>*</em> : null}</span>
          {f.kind === 'area'
            ? <textarea value={f.v} onChange={e => f.set(e.target.value)} placeholder={f.ph} rows={3} />
            : <input type={f.type === 'number' ? 'text' : f.type || 'text'} inputMode={f.type === 'number' ? 'decimal' : undefined} value={f.v} onChange={e => f.set(e.target.value)} placeholder={f.ph} enterKeyHint={last ? 'done' : 'next'} onKeyDown={onEnter} />}
        </label>
      );
    }
    return (
      <div key={f.k || i} className="ff" data-field={f.l}>
        <span className="ff-l">{f.l}{f.req ? <em>*</em> : null}</span>
        {f.kind === 'chips' ? <Chips f={f} /> : f.kind === 'people' ? <People f={f} /> : f.kind === 'pick' ? <Pick f={f} /> : f.kind === 'money' ? <Money f={f} last={last} onEnter={onEnter} /> : <FileDrop f={f} />}
      </div>
    );
  });
}
