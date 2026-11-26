import { useState } from 'react';

// Reads an internal budget from Excel or CSV: finds the header row (item/description, qty/quantity,
// unit cost/rate/price) and returns the lines. Totals and empty rows are skipped.
export async function readBudgetSheet(file) {
  try {
    const XLSX = await import('xlsx');
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
    const norm = v => String(v).toLowerCase().trim();
    let h = -1, ci = -1, cq = -1, cc = -1;
    for (let r = 0; r < Math.min(rows.length, 15) && h < 0; r++) {
      const row = rows[r].map(norm);
      const i = row.findIndex(x => /^(item|description|items|particulars|details)/.test(x)), q = row.findIndex(x => /^(qty|quantity|units|no\.?)$|quantity/.test(x)), c = row.findIndex(x => /(unit cost|unit price|rate|price|cost)/.test(x) && !/total/.test(x));
      if (i >= 0 && c >= 0) { h = r; ci = i; cq = q; cc = c; }
    }
    if (h < 0) return [];
    const num = v => +String(v).replace(/[^0-9.]/g, '') || 0;
    return rows.slice(h + 1).map(r => ({ item: String(r[ci] || '').trim(), qty: String(cq >= 0 ? num(r[cq]) || 1 : 1), cost: String(Math.round(num(r[cc]))) }))
      .filter(l => l.item && +l.cost > 0 && !/^(total|sub ?total|grand total)/i.test(l.item));
  } catch (e) { console.error(e); return []; }
}
import { Btn, faceStyle, faceText } from '../../ui/kit';

const n = v => Math.round(+v || 0).toLocaleString('en-US');
const digits = v => String(v || '').replace(/\D/g, '');

// The comment that goes with a step change: saved in the project's notes and sent to the next person.
function StepComment({ value, set, next, ph }) {
  return (
    <label className="pn-comment">
      <span>{next ? 'Comment for the move to ' + next : 'Comment'} <em>optional</em></span>
      <textarea rows={2} value={value} onChange={e => set(e.target.value)} placeholder={ph || 'What was done / note for the next step'} aria-label="Step comment" maxLength={500} />
    </label>
  );
}

function Upload({ N, c, setC }) {
  const [f, setF] = useState(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  return (
    <div className="pn-form">
      <label className="bi-up"><input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,image/*" onChange={e => setF(e.target.files[0] || null)} aria-label="Proposal file" />{f ? '✓ ' + f.name : '↑ Choose the proposal file'}</label>
      <StepComment value={c} set={setC} next={N.next} ph="What was done / note for Operations" />
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
      <div><button type="button" className="me-save" disabled={busy} onClick={async () => { setBusy(true); const m = await N.upload(f, c); setBusy(false); if (m) setErr(m); else setC(''); }}>{busy ? 'Uploading…' : 'Upload proposal · send to Operations'}</button></div>
    </div>
  );
}

function Budget({ B, N, c, setC }) {
  const [pm, setPm] = useState(B.pm);
  const [lines, setLines] = useState(B.lines.length ? B.lines : [{ item: '', qty: '1', cost: '' }]);
  const [value, setValue] = useState(B.value);
  const [err, setErr] = useState(''); const [ok, setOk] = useState('');
  const set = (i, k, v) => setLines(ls => ls.map((l, j) => (j === i ? Object.assign({}, l, { [k]: v }) : l)));
  const internal = lines.reduce((a, l) => a + (+l.qty || 0) * (+l.cost || 0), 0);
  const data = () => ({ pm, lines, value });
  return (
    <div className="pn-form">
      <div className="ff" data-field="Project Manager"><span className="ff-l">Project Manager</span>
        <div className="ff-people" role="radiogroup" aria-label="Project Manager">{B.people.map(p => <button key={p.k} type="button" role="radio" aria-checked={pm === p.k} aria-label={p.n} className={pm === p.k ? 'is-on' : ''} onClick={() => setPm(p.k)}><span className="ff-face" style={faceStyle(p)}>{faceText(p)}</span><span className="ff-name">{p.n.split(' ')[0]}</span></button>)}</div>
      </div>
      <div className="ff"><span className="ff-l">Internal budget</span>
        <div className="pn-lines">
          <div className="pn-line pn-head"><span>Item</span><span>Qty</span><span>Unit cost (TZS)</span><span>Total</span><span /></div>
          {lines.map((l, i) => (
            <div key={i} className="pn-line">
              <input value={l.item} onChange={e => set(i, 'item', e.target.value)} placeholder="e.g. Stage truss hire" aria-label={'Budget item ' + (i + 1)} />
              <input inputMode="numeric" value={l.qty} onChange={e => set(i, 'qty', digits(e.target.value))} aria-label={'Quantity ' + (i + 1)} />
              <input inputMode="numeric" value={l.cost ? n(l.cost) : ''} onChange={e => set(i, 'cost', digits(e.target.value))} placeholder="0" aria-label={'Unit cost ' + (i + 1)} />
              <b>{n((+l.qty || 0) * (+l.cost || 0))}</b>
              {lines.length > 1 ? <button type="button" className="td-x" onClick={() => setLines(ls => ls.filter((_, j) => j !== i))} aria-label={'Remove line ' + (i + 1)}>×</button> : <span />}
            </div>
          ))}
          <button type="button" className="fh-addline" onClick={() => setLines(ls => [...ls, { item: '', qty: '1', cost: '' }])}>+ Add line</button>
        </div>
      </div>
      <label className="bi-up"><input type="file" accept=".xlsx,.xls,.csv,.pdf" onChange={async e => { const f = e.target.files[0]; if (!f) return; let filled = 0; if (/\.(xlsx|xls|csv)$/i.test(f.name)) { const got = await readBudgetSheet(f); if (got.length) { setLines(got); filled = got.length; } } const m = await B.attach(f); setErr(m); setOk(m ? '' : filled ? 'Budget file attached · ' + filled + ' lines read from the sheet' : 'Budget file attached'); }} aria-label="Budget file" />{B.file ? '✓ ' + B.file.name : '↑ Attach the budget file (Excel or PDF, optional)'}</label>
      <div className="pn-totals">
        <span>Internal budget <b>TZS {n(internal)}</b></span>
        <label className="fh-amt"><span>Project value TZS</span><input inputMode="numeric" value={value ? n(value) : ''} onChange={e => setValue(digits(e.target.value))} placeholder="What the client pays" aria-label="Project value" /></label>
        {+value > 0 ? <span>Margin <b>{Math.round((value - internal) / value * 100)}%</b></span> : null}
      </div>
      <StepComment value={c} set={setC} next={N.next} ph="What was done / note for the GM" />
      {err ? <div className="fm-err" role="alert">{err}</div> : ok ? <div className="td-sent">{ok}</div> : null}
      <div className="fh-row">
        <button type="button" className="me-cancel" onClick={() => { const m = B.save(data()); setErr(m); setOk(m ? '' : 'Draft saved'); }}>Save draft</button>
        <button type="button" className="me-save" onClick={() => { const m = B.submit(data(), c); if (m) { setErr(m); setOk(''); } else setC(''); }}>Submit for approval</button>
      </div>
    </div>
  );
}

function Approve({ N, c, setC }) {
  const [back, setBack] = useState(false); const [note, setNote] = useState(''); const [err, setErr] = useState('');
  return back ? (
    <div className="pn-form">
      <input className="me-who" autoFocus value={note} onChange={e => setNote(e.target.value)} placeholder="What should Operations change?" aria-label="Reason" />
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
      <div className="fh-row"><button type="button" className="me-cancel" onClick={() => setBack(false)}>Cancel</button><button type="button" className="me-save" onClick={() => { const m = N.sendBack(note); if (m) setErr(m); }}>Send back</button></div>
    </div>
  ) : (
    <div className="pn-form">
      <StepComment value={c} set={setC} next={N.gmStep ? '' : N.next} ph={N.gmStep ? 'Note for Management' : 'What was done / note for the team'} />
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
      <div className="fh-row"><button type="button" className="me-save" onClick={() => { const m = N.approve(c); if (m) setErr(m); else setC(''); }}>Approve budget</button><Btn kind="ghost" onClick={() => setBack(true)}>Send back</Btn></div>
    </div>
  );
}

// A hand move (Brief → Design, Design → Proposal) or closing: the comment box and the button.
function Move({ N, c, setC, run, label, block }) {
  const [err, setErr] = useState('');
  return (
    <div className="pn-form pn-move">
      <StepComment value={c} set={setC} next={N.next} />
      {err ? <div className="fm-err" role="alert">{err}</div> : block ? <p className="k-sub">{block}</p> : null}
      <div className="fh-row"><Btn kind={N.flow === 'brief' ? 'ghost' : 'dark'} disabled={!!block} onClick={() => { const m = run(c); if (m) setErr(m); else setC(''); }}>{label}</Btn></div>
    </div>
  );
}

// The current step of the project: who is responsible and, for that person, the action itself.
export default function ProjectNow({ N }) {
  const [c, setC] = useState('');
  return (
    <section className={'pn is-' + N.flow} aria-label="Current step">
      <header><span className="pn-step">Now · {N.title}</span>{N.owner ? <span className="pn-owner">{N.owner}</span> : null}</header>
      <p className={N.returned ? 'pn-back' : ''}>{N.text}</p>
      {N.brief || N.goDesigns || N.assign ? (
        <div className="fh-row">
          {N.brief ? <Btn kind={N.flow === 'brief' ? 'dark' : 'ghost'} onClick={N.brief}>{N.flow === 'brief' ? 'Send design brief to Creative' : 'Send another brief'}</Btn> : null}
          {N.goDesigns ? <Btn kind="ghost" onClick={N.goDesigns}>See designs</Btn> : null}
          {N.assign ? <Btn kind="dark" onClick={N.assign}>Assign a task</Btn> : null}
        </div>
      ) : null}
      {N.move ? <Move N={N} c={c} setC={setC} run={N.move} label={'Move to ' + N.next} block={N.moveBlock} /> : null}
      {N.close ? <Move N={N} c={c} setC={setC} run={N.close} label="Close project" block={N.closeBlock} /> : null}
      {N.upload ? <Upload N={N} c={c} setC={setC} /> : null}
      {N.budgetForm ? <Budget B={N.budgetForm} N={N} c={c} setC={setC} /> : null}
      {N.approve ? <Approve N={N} c={c} setC={setC} /> : null}
    </section>
  );
}
