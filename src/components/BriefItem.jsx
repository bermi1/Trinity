import { useState } from 'react';
import { Btn, Pill, faceStyle, faceText } from '../ui/kit';

export const BRIEF_PILL = { todo: ['#FBF1DD', '#8A6414'], prog: ['#EFE8FA', '#5A2FA8'], review: ['#E9EFFA', '#3559A8'], done: ['#E6F4EC', '#1F7549'] };

// One design brief: what Client Service asked for, the designs uploaded, and the next step.
// Designers upload and send to the Creative Manager; the Creative Manager approves or returns.
export default function BriefItem({ b, designers, showFrom }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [back, setBack] = useState(false);
  const [note, setNote] = useState('');
  const pick = async e => {
    const f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f) return;
    setBusy(true); setErr('');
    const m = await b.upload(f);
    if (m) setErr(m);
    setBusy(false);
  };
  return (
    <li className="bi" data-brief={b.id}>
      <div className="bi-head">
        <div className="bi-main">
          <b>{b.t}</b>
          <span className="k-sub">{[b.client, b.place, 'due ' + b.due].filter(Boolean).join(' · ')}</span>
        </div>
        <Pill l={b.stl} bg={BRIEF_PILL[b.st][0]} fg={BRIEF_PILL[b.st][1]} />
      </div>
      {b.note ? <p className="dp-note">{b.note}</p> : null}
      {b.ret ? <p className="bi-ret">Returned: {b.ret}</p> : null}
      <span className="k-sub">{showFrom ? 'From ' + b.from + ' · ' : ''}Designer: {b.who}</span>

      {b.files.length ? (
        <div className="bi-files">
          {b.files.map(f => (
            <button key={f.i} type="button" className="bi-file" onClick={f.open} title={f.name}>
              {f.img ? <img src={f.img} alt="" /> : <span className="bi-doc">FILE</span>}
              <span>{f.name}<small>{f.by} · {f.at}</small></span>
            </button>
          ))}
        </div>
      ) : null}

      {designers && designers.length > 1 && b.st !== 'done' ? (
        <div className="ff-people bi-people" role="radiogroup" aria-label={'Designer for ' + b.t}>
          {designers.map(d => (
            <button key={d.v} type="button" role="radio" aria-checked={b.whoK === d.v} aria-label={d.l} className={b.whoK === d.v ? 'is-on' : ''} onClick={() => b.assign(d.v)}>
              <span className="ff-face" style={faceStyle(d)}>{faceText(d)}</span><span className="ff-name">{d.l.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      ) : null}

      {back ? (
        <div className="bi-back">
          <input className="ff-search" value={note} onChange={e => setNote(e.target.value)} placeholder="What should change?" aria-label="What should change" />
          <Btn kind="dark" onClick={() => { b.giveBack(note); setBack(false); }}>Return</Btn>
          <Btn kind="ghost" onClick={() => setBack(false)}>Cancel</Btn>
        </div>
      ) : (b.canUpload || b.next || b.canReturn) ? (
        <div className="bi-acts">
          {b.canUpload ? (
            <label className="bi-up">
              <input type="file" accept="image/*,.pdf,.ai,.psd,.zip" onChange={pick} aria-label={'Upload design for ' + b.t} />
              {busy ? 'Uploading…' : '↑ Upload design'}
            </label>
          ) : null}
          {b.next ? <Btn kind="dark" onClick={b.move}>{b.next}</Btn> : null}
          {b.canReturn ? <Btn kind="ghost" onClick={() => setBack(true)}>Return with comment</Btn> : null}
        </div>
      ) : null}
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
    </li>
  );
}
