import { useEffect, useRef, useState } from 'react';
import { Btn, Empty } from '../../ui/kit';
import Icon from '../../mobile/Icon';
import { Pick } from '../../components/FormFields';
import { RecCheck } from '../../components/AccountForm';
import PaySheet from '../../components/PaySheet';

const n = v => Math.round(+v || 0).toLocaleString('en-US');
const digits = v => String(v || '').replace(/\D/g, '');
const QUICK = [1e6, 2e6, 5e6, 10e6];

function Chips({ opts, v, set, label }) {
  return <div className="ff-chips" role="radiogroup" aria-label={label}>{opts.map(o => { const [k, l] = Array.isArray(o) ? o : [o, o]; return <button key={k} type="button" role="radio" aria-checked={v === k} className={v === k ? 'is-on' : ''} onClick={() => set(k)}>{l}</button>; })}</div>;
}
function Money({ value, set, label, autoFocus, inRef }) {
  return <label className="fh-amt fl-money"><span>TZS</span><input ref={inRef} inputMode="numeric" autoFocus={autoFocus} value={value ? n(value) : ''} onChange={e => set(digits(e.target.value))} placeholder="0" aria-label={label} /></label>;
}
function Sheet({ title, sub, onClose, children, foot, label }) {
  return (
    <div className="fm-back" onClick={onClose}>
      <div className="fm fl-sheet" role="dialog" aria-label={label || title} onClick={e => e.stopPropagation()}>
        <header className="fm-head"><div><h2>{title}</h2>{sub ? <p>{sub}</p> : null}</div><button type="button" className="fm-x" onClick={onClose} aria-label="Close">×</button></header>
        <div className="fm-body">{children}</div>
        {foot ? <footer className="fm-foot">{foot}</footer> : null}
      </div>
    </div>
  );
}

// "Paid to": a staff member (searched by name) or someone else typed in. For a staff member, their
// approved requests can be ticked: the row is then the payment of that request.
function Payee({ F, payee, setPayee, who, setWho, settle, setSettle }) {
  const [q, setQ] = useState('');
  const hit = q.trim().length > 0 ? F.people.filter(p => p.l.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6) : [];
  const cur = payee && payee !== 'other' ? F.people.find(p => p.v === payee) : null;
  const reqs = cur ? F.staffReqs(cur.v) : [];
  return (
    <div className="ff" data-field="Paid to"><span className="ff-l">Paid to</span>
      {cur ? (
        <div className="fl-payee"><span className="ff-face" style={{ background: cur.c }}>{cur.i}</span><b>{cur.l}</b><button type="button" className="td-link fl-tap" onClick={() => { setPayee(''); setSettle(''); setQ(''); }}>Change</button></div>
      ) : payee === 'other' ? (
        <div className="fh-row"><input className="ff-search" autoFocus value={who} onChange={e => setWho(e.target.value)} placeholder="Shop, supplier or person" aria-label="Paid to (name)" /><button type="button" className="td-link fl-tap" onClick={() => { setPayee(''); setWho(''); }}>Staff</button></div>
      ) : (
        <>
          <input className="ff-search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search staff, or choose Other" aria-label="Search staff" />
          <div className="ff-chips fl-hits">{hit.map(p => <button key={p.v} type="button" onClick={() => { setPayee(p.v); setQ(''); }}>{p.l}</button>)}<button type="button" onClick={() => setPayee('other')}>Other (supplier, shop…)</button></div>
        </>
      )}
      {cur && reqs.length ? (
        <div className="fl-settle" role="radiogroup" aria-label="Settles a request">
          <small className="k-sub">{cur.l.split(' ')[0]}’s requests · tick one if this payment settles it</small>
          {reqs.map(r => (
            <button key={r.id} type="button" role="radio" aria-checked={settle === r.id} disabled={!r.can} className={'fl-req' + (settle === r.id ? ' is-on' : '') + (r.approved ? '' : ' is-wait')} onClick={() => setSettle(settle === r.id ? '' : r.id, r)}>
              <span><b>Settles {r.id}</b><small>{r.what} · {r.where}</small><small className={r.approved ? 'is-green' : 'is-gold'}>{r.note}</small></span><em>{r.amtT}</em>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// A daily expense (or, with a staff member's request ticked, that request's payment). ~10 seconds.
function ExpenseSheet({ F, onClose, edit, day }) {
  const e0 = edit ? edit.expense : null;
  const blank = () => ({ amt: '', cat: '', note: '', p: '', who: '', payee: '', method: 'Cash', fee: '', at: day || F.today, photo: null, settle: '', reason: '' });
  const [f, setF] = useState(() => (e0 ? Object.assign(blank(), e0, { payee: e0.who ? 'other' : '' }) : blank()));
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [done, setDone] = useState(0);
  const amtRef = useRef(null);
  const set = (k, v) => { setErr(''); setF(x => Object.assign({}, x, { [k]: v })); };
  // Something typed: closing (×, outside, the phone's back button) asks before throwing it away.
  const dirty = !edit && !!(f.amt || f.cat || f.note || f.p || f.who || f.payee || f.photo || f.settle);
  const setDirty = F.setDirty;
  useEffect(() => { if (setDirty) setDirty(dirty); }, [dirty, setDirty]);
  useEffect(() => () => { if (setDirty) setDirty(false); }, [setDirty]);
  const total = (+f.amt || 0) + (f.method === 'Cash' ? 0 : +f.fee || 0);
  const after = F.balanceN - total + (e0 ? (+e0.amt || 0) + (+e0.fee || 0) : 0);
  const save = async again => {
    setBusy(true);
    const x = Object.assign({}, f, { who: edit || f.payee === 'other' ? f.who : '', payee: edit || f.payee === 'other' ? '' : f.payee });
    const m = edit ? edit.edit(x) : await F.addExpense(x);
    setBusy(false);
    if (m) { setErr(m); return; }
    // Save & next: the fields are cleared (the method and date stay) and the amount is ready for the next one.
    if (again) { setDone(d => d + 1); setF(Object.assign(blank(), { at: f.at, method: f.method })); setTimeout(() => { if (amtRef.current) amtRef.current.focus(); }, 0); } else { if (setDirty) setDirty(false); onClose(true); }
  };
  return (
    <Sheet title={edit ? 'Change expense ' + edit.ref : 'Daily expense'} sub={edit ? 'Same day only · say why it changes' : 'Paid from the float' + (done ? ' · ' + done + ' saved' : '')} onClose={onClose} label="Daily expense"
      foot={<>{edit ? null : <Btn kind="ghost" disabled={busy} onClick={() => save(true)}>Save &amp; next</Btn>}<Btn kind="dark" disabled={busy} onClick={() => save(false)}>{edit ? 'Save change' : f.settle ? 'Pay ' + f.settle : 'Save expense'}</Btn></>}>
      <Money value={f.amt} set={v => set('amt', v)} label="Expense amount" autoFocus inRef={amtRef} />
      {edit ? null : <Payee F={F} payee={f.payee} setPayee={v => set('payee', v)} who={f.who} setWho={v => set('who', v)} settle={f.settle} setSettle={(id, r) => setF(x => Object.assign({}, x, { settle: id, amt: id && r && !x.amt ? String(r.amt) : x.amt, method: id && r && r.method ? r.method : x.method }))} />}
      {f.settle ? <p className="k-sub">Recorded as the payment of {f.settle}: its project, and the person then accounts for it (receipts and change). It is not counted again as an expense.</p> : (
        <>
          <div className="ff" data-field="What for"><span className="ff-l">What for</span><Chips opts={F.cats} v={f.cat} set={v => set('cat', v)} label="What for" /></div>
          <input className="ff-search" value={f.note} onChange={e => set('note', e.target.value)} placeholder={f.cat === 'Other' ? 'What was it? (required)' : 'Note (optional)'} aria-label="Expense note" />
          <div className="ff" data-field="Project"><span className="ff-l">Project</span><Pick f={{ l: 'Project', v: f.p, set: v => set('p', v), opts: F.projects, search: true }} /></div>
          {edit ? <input className="ff-search" value={f.who} onChange={e => set('who', e.target.value)} placeholder="Paid to" aria-label="Paid to (name)" /> : null}
        </>
      )}
      <div className="ff" data-field="Paid by"><span className="ff-l">Paid by</span><Chips opts={F.methods} v={f.method} set={v => set('method', v)} label="Payment method" /></div>
      {f.method !== 'Cash' ? <label className="fh-amt"><span>Charges</span><input inputMode="numeric" value={f.fee ? n(f.fee) : ''} onChange={e => set('fee', digits(e.target.value))} placeholder="0" aria-label="Transaction charges" /></label> : null}
      {edit ? <input className="ff-search" value={f.reason} onChange={e => set('reason', e.target.value)} placeholder="Why does it change? (required)" aria-label="Reason for the change" /> : (
        <div className="fh-row fl-two">
          {f.settle ? null : <label className="bi-up"><input type="file" accept="image/*" capture="environment" onChange={e => set('photo', e.target.files[0] || null)} aria-label="Receipt photo" />{f.photo ? '✓ ' + f.photo.name : '↑ Receipt photo'}</label>}
          <label className="fl-date"><span>Date</span><input type="date" value={f.at} min={F.minDay} max={F.today} onChange={e => set('at', e.target.value || F.today)} aria-label="Expense date" /></label>
        </div>
      )}
      {total > 0 && after < 0 ? <p className="bi-ret" role="status">This takes the float below zero (−TZS {n(-after)}). It is still saved and Management is told.</p> : null}
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
    </Sheet>
  );
}

function GrantSheet({ F, onClose }) {
  const [f, setF] = useState({ amt: '', method: 'Cash', note: '', at: F.today });
  const [err, setErr] = useState('');
  const set = (k, v) => { setErr(''); setF(x => Object.assign({}, x, { [k]: v })); };
  return (
    <Sheet title="Give float to Finance" sub="It shows on the Float as “Float received” · Finance and the GM are told" onClose={onClose} label="Give float to Finance"
      foot={<Btn kind="dark" onClick={() => { const m = F.receive(f); if (m) setErr(m); else onClose(true); }}>Give float</Btn>}>
      <Money value={f.amt} set={v => set('amt', v)} label="Float amount" autoFocus />
      <div className="ff-quick">{QUICK.map(v => <button key={v} type="button" onClick={() => set('amt', String(v))}>{v / 1e6}M</button>)}</div>
      <div className="ff"><span className="ff-l">Received by</span><Chips opts={F.methods} v={f.method} set={v => set('method', v)} label="Float method" /></div>
      <input className="ff-search" value={f.note} onChange={e => set('note', e.target.value)} placeholder="Note (e.g. Float for the week)" aria-label="Float note" />
      <label className="fl-date"><span>Date</span><input type="date" value={f.at} min={F.minDay} max={F.today} onChange={e => set('at', e.target.value || F.today)} aria-label="Float date" /></label>
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
    </Sheet>
  );
}

// Finance asks the boss for float (pre-filled with the shortfall when approved requests are more than the balance).
function AskSheet({ F, onClose }) {
  const [f, setF] = useState({ amt: F.shortfall ? String(F.shortfall) : '', note: F.shortfall ? 'Approved requests waiting are more than the float balance' : '' });
  const [err, setErr] = useState('');
  const set = (k, v) => { setErr(''); setF(x => Object.assign({}, x, { [k]: v })); };
  return (
    <Sheet title="Ask the boss for float" sub={F.asked ? 'Already asked: TZS ' + n(F.asked.amt) + ' · ' + F.asked.at : 'Management is told; when they give it, it shows here as “Float received”'} onClose={onClose} label="Ask the boss for float"
      foot={<Btn kind="dark" onClick={() => { const m = F.ask(f); if (m) setErr(m); else onClose(true); }}>Send request</Btn>}>
      <Money value={f.amt} set={v => set('amt', v)} label="Float amount asked" autoFocus />
      <div className="ff-quick">{QUICK.map(v => <button key={v} type="button" onClick={() => set('amt', String(v))}>{v / 1e6}M</button>)}</div>
      <input className="ff-search" value={f.note} onChange={e => set('note', e.target.value)} placeholder="What is it for? (a short sentence)" aria-label="What the float is for" />
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
    </Sheet>
  );
}

function LineSheet({ l, F, onClose, onEdit }) {
  const [why, setWhy] = useState(''); const [voiding, setVoiding] = useState(false); const [err, setErr] = useState('');
  const rows = [['Time', l.time], ['Amount', l.amt], ['What for', l.what], ['Project', l.where], ['Paid to / from', l.who], ['Method', l.method], ['Reference', l.ref], ['Recorded by', l.by]].filter(r => r[1]);
  return (
    <Sheet title={l.what} sub={l.void ? l.voidInfo : l.where} onClose={onClose} label="Line details"
      foot={<>{l.openReq ? <Btn kind="ghost" onClick={l.openReq}>Open the request</Btn> : null}{l.canEdit ? <Btn kind="ghost" onClick={onEdit}>Change</Btn> : null}{l.canVoid && !voiding ? <Btn kind="ghost" onClick={() => setVoiding(true)}>Void</Btn> : null}</>}>
      <dl className="fl-dl">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd className={l.void && k === 'Amount' ? 'is-void' : ''}>{v}</dd></div>)}</dl>
      {l.photo ? <Btn kind="ghost" onClick={l.photo}>View receipt photo</Btn> : null}
      {l.edits.length ? <ul className="fl-edits">{l.edits.map((e, i) => <li key={i}>{e}</li>)}</ul> : null}
      {l.openReq && !l.canEdit ? <p className="k-sub">Request payments are changed on the request, not here.</p> : null}
      {voiding ? <div className="fh-row"><input className="ff-search" autoFocus value={why} onChange={e => setWhy(e.target.value)} placeholder="Why is it void? (required)" aria-label="Reason for voiding" /><Btn kind="dark" onClick={() => { const m = l.doVoid(why); if (m) setErr(m); else onClose(true); }}>Void it</Btn></div> : null}
      {F.sentToday && l.canVoid ? <p className="k-sub">Today’s report was already sent: Management will be told.</p> : null}
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
    </Sheet>
  );
}

function DayPicker({ F, D, set, chips }) {
  return (
    <div className="fl-dp">
      <button type="button" className="fl-arrow" onClick={() => set(F.shift(D, -1))} aria-label="Previous day">‹</button>
      <input type="date" value={D} max={F.today} onChange={e => e.target.value && set(e.target.value)} aria-label="Day" />
      <button type="button" className="fl-arrow" onClick={() => set(F.shift(D, 1))} disabled={D >= F.today} aria-label="Next day">›</button>
      {chips ? <div className="k-chips">{[[F.today, 'Today'], [F.yesterday, 'Yesterday']].map(([k, l]) => <button key={l} type="button" className={D === k ? 'is-on' : ''} onClick={() => set(k)}>{l}</button>)}</div> : null}
    </div>
  );
}

function DayList({ F, D, open }) {
  const d = F.dayView(D);
  return (
    <section className="fh-card fl-day" aria-label="Day list">
      <DayPicker F={F} D={D} set={F.setDay} chips />
      <p className="fl-dsum"><span>Opened <b>{d.open}</b></span> · <span>In <b className="is-green">+{d.in}</b></span> · <span>Out <b className="is-red">−{d.out}</b></span> · <span>Closed <b className={d.neg ? 'is-red' : ''}>{d.close}</b></span>{d.sent ? <span className="fh-ok"> · ✓ report sent</span> : null}</p>
      {d.lines.length ? (
        <ul className="fl-lines">{d.lines.map(l => (
          <li key={l.id}><button type="button" className={'fl-line' + (l.void ? ' is-void' : '')} onClick={() => open(l)}>
            <time>{l.time || '—'}</time><i className={'fl-ic is-' + l.kind}><Icon d={F.ic[l.ic]} size={16} /></i>
            <span className="fl-what"><b>{l.what}</b><small>{[l.where, l.who, l.kind === 'expense' ? l.ref : ''].filter(Boolean).join(' · ')}</small></span>
            <em className={l.dir === 'in' ? 'is-green' : ''}>{l.amt}</em>
          </button></li>
        ))}</ul>
      ) : <Empty>Nothing on {d.label}.</Empty>}
    </section>
  );
}

// The petty cash book, like the Excel sheet: brought forward, a row per line with the running balance,
// carried down. On a computer a line at the bottom adds rows (Enter saves and starts the next).
function CashBook({ F, D, phone, openLine }) {
  const [range, setRange] = useState('day');
  const from = range === 'month' ? F.monthStart : D, to = range === 'month' ? F.today : D;
  const rows = F.book(from, to);
  return (
    <section className="fh-card fl-book" aria-label="Petty cash book">
      <div className="fl-bookhead">
        <h3>Petty cash book</h3>
        <div className="k-chips">{[['day', 'Day'], ['month', 'This month']].map(([k, l]) => <button key={k} type="button" className={range === k ? 'is-on' : ''} onClick={() => setRange(k)}>{l}</button>)}</div>
        <Btn kind="ghost" onClick={() => F.exportBook(from, to)}>Download (Excel)</Btn>
      </div>
      {range === 'day' ? <DayPicker F={F} D={D} set={F.setDay} /> : null}
      {phone ? (
        <ul className="fl-brows">{rows.map(r => (r.bf || r.cd ? <li key={r.id} className="fl-bal-row"><span>{r.what}</span><b className={r.neg ? 'is-red' : ''}>{r.balT}</b></li> : (
          <li key={r.id} className={r.void ? 'is-void' : ''} onClick={() => openLine(r.id, r.at)}><span className="fl-what"><b>{r.what}</b><small>{[r.dayT, r.voucher, r.who, r.where].filter(Boolean).join(' · ')}</small></span><span className="fl-nums"><em className={r.dir === 'in' ? 'is-green' : ''}>{r.amtT}</em><small>{r.balT}</small></span></li>
        )))}</ul>
      ) : (
        <div className="fr-table-wrap"><table className="fr-table fl-table">
          <thead><tr><th>Date</th><th>Voucher</th><th>Paid to</th><th>What for</th><th>Project</th><th className="r">Amount</th><th className="r">Balance</th></tr></thead>
          <tbody>{rows.map(r => (r.bf || r.cd
            ? <tr key={r.id} className="fl-bal-row"><td>{r.dayT}</td><td /><td /><td colSpan={3}><b>{r.what}</b></td><td className={'r' + (r.neg ? ' is-red' : '')}><b>{r.balT}</b></td></tr>
            : <tr key={r.id} className={r.void ? 'is-void' : ''} onClick={() => openLine(r.id, r.at)}><td>{r.dayT}</td><td className="fr-date">{r.voucher || ''}</td><td>{r.who}</td><td>{r.what}</td><td>{r.where}</td><td className={'r' + (r.dir === 'in' ? ' is-green' : '')}>{r.amtT}</td><td className={'r' + (r.neg ? ' is-red' : '')}>{r.balT}</td></tr>))}</tbody>
          {F.canEdit && range === 'day' ? <tfoot><AddRow F={F} D={D} /></tfoot> : null}
        </table></div>
      )}
    </section>
  );
}

// Spreadsheet-style entry: amount, what for, paid to, project, method; Enter saves and starts the next row.
function AddRow({ F, D }) {
  const blank = { amt: '', cat: '', who: '', proj: '', method: 'Cash', settle: '' };
  const [f, setF] = useState(blank); const [err, setErr] = useState(''); const amtRef = useRef(null);
  const set = (k, v) => { setErr(''); setF(x => Object.assign({}, x, { [k]: v })); };
  const person = F.people.find(p => p.l.toLowerCase() === f.who.trim().toLowerCase());
  const reqs = person ? F.staffReqs(person.v) : [];
  const proj = F.projects.find(p => p.l.toLowerCase() === f.proj.trim().toLowerCase());
  const save = async e => {
    e.preventDefault();
    const cat = F.cats.find(c => c.toLowerCase() === f.cat.trim().toLowerCase()) || (f.cat.trim() ? 'Other' : '');
    const m = await F.addExpense({ amt: f.amt, cat, note: cat === 'Other' ? f.cat.trim() : '', who: person ? '' : f.who, payee: person ? person.v : '', p: proj ? proj.v : '', method: f.method, at: D, settle: f.settle });
    if (m) { setErr(m); return; }
    setF(Object.assign({}, blank, { method: f.method })); if (amtRef.current) amtRef.current.focus();
  };
  return (
    <>
      <tr className="fl-add">
        <td colSpan={7}>
          <form onSubmit={save} className="fl-addrow" aria-label="Add a row">
            <input ref={amtRef} inputMode="numeric" value={f.amt ? n(f.amt) : ''} onChange={e => set('amt', digits(e.target.value))} placeholder="Amount" aria-label="Row amount" />
            <input list="fl-cats" value={f.cat} onChange={e => set('cat', e.target.value)} placeholder="What for" aria-label="Row what for" disabled={!!f.settle} />
            <input list="fl-people" value={f.who} onChange={e => set('who', e.target.value)} placeholder="Paid to (staff or other)" aria-label="Row paid to" />
            <input list="fl-projects" value={f.proj} onChange={e => set('proj', e.target.value)} placeholder="Project (empty = Office)" aria-label="Row project" disabled={!!f.settle} />
            <select value={f.method} onChange={e => set('method', e.target.value)} aria-label="Row method">{F.methods.map(m => <option key={m}>{m}</option>)}</select>
            <button type="submit" className="me-save">Add ↵</button>
            <datalist id="fl-cats">{F.cats.map(c => <option key={c} value={c} />)}</datalist>
            <datalist id="fl-people">{F.people.map(p => <option key={p.v} value={p.l} />)}</datalist>
            <datalist id="fl-projects">{F.projects.map(p => <option key={p.v || 'o'} value={p.l} />)}</datalist>
          </form>
          {reqs.length ? <div className="fl-settle fl-settle-row" role="radiogroup" aria-label="Settles a request">{reqs.map(r => <button key={r.id} type="button" role="radio" aria-checked={f.settle === r.id} disabled={!r.can} className={'fl-req' + (f.settle === r.id ? ' is-on' : '') + (r.approved ? '' : ' is-wait')} onClick={() => setF(x => Object.assign({}, x, { settle: x.settle === r.id ? '' : r.id, amt: x.amt || String(r.amt) }))}><span><b>Settles {r.id}</b><small>{r.what} · {r.note}</small></span><em>{r.amtT}</em></button>)}</div> : null}
          {err ? <div className="fm-err" role="alert">{err}</div> : null}
        </td>
      </tr>
    </>
  );
}

// Spending per project. "Requests" is what was paid out; change brought back is its own line and comes off
// the total. On a phone each project is two lines (the name, then the figures), so it fits 360px.
function ByProject({ F, phone }) {
  const [range, setRange] = useState('today');
  const P = F.proj(range);
  const figs = r => [['Requests', r.requests], ['Expenses', r.expenses], ...(r.chargesN ? [['Charges', r.charges]] : [])];
  return (
    <section className="fh-card" aria-label="By project">
      <div className="k-chips">{[['today', 'Today'], ['month', 'This month'], ['all', 'Since start']].map(([k, l]) => <button key={k} type="button" className={range === k ? 'is-on' : ''} onClick={() => setRange(k)}>{l}</button>)}</div>
      {!P.rows.length ? <Empty>No spending in this period.</Empty> : phone ? (
        <ul className="fl-prows">
          {P.rows.map(r => (
            <li key={r.p || 'office'}>
              <b className="fl-pname">{r.name}</b>
              <span className="fl-pfig">{figs(r).map(([k, v]) => <span key={k}>{k} <b>{v}</b></span>)}<span className="fl-ptot">Total <b>{r.total}</b></span></span>
              {r.returned ? <span className="fl-pret">Change returned <b>−{r.returned}</b></span> : null}
            </li>
          ))}
          <li className="fl-ptotal"><b className="fl-pname">All projects</b><span className="fl-pfig"><span>Requests <b>{P.total.requests}</b></span><span>Expenses <b>{P.total.expenses}</b></span>{P.total.returnedN ? <span>Returned <b>−{P.total.returned}</b></span> : null}<span className="fl-ptot">Total <b>{P.total.total}</b></span></span></li>
        </ul>
      ) : (
        <div className="fr-table-wrap"><table className="fr-table fl-ptable">
          <thead><tr><th>Project</th><th className="r">Requests</th><th className="r">Expenses</th><th className="r">Charges</th><th className="r">Total</th></tr></thead>
          <tbody>{P.rows.map(r => [
            <tr key={r.p || 'office'}><td><b>{r.name}</b></td><td className="r">{r.requests}</td><td className="r">{r.expenses}</td><td className="r">{r.charges}</td><td className="r"><b>{r.total}</b></td></tr>,
            r.returned ? <tr key={(r.p || 'office') + '-ret'} className="fl-pret-row"><td>Change returned</td><td /><td /><td /><td className="r">−{r.returned}</td></tr> : null
          ])}</tbody>
          <tfoot><tr><td>Total</td><td className="r">{P.total.requests}</td><td className="r">{P.total.expenses}</td><td className="r">{P.total.charges}</td><td className="r">{P.total.total}</td></tr></tfoot>
        </table></div>
      )}
    </section>
  );
}

const Sec = ({ no, title, extra, children, empty }) => (
  <details className="fl-sec" open={!empty}>
    <summary><span>{no}</span>{title}<em>{extra}</em></summary>
    {empty ? <p className="k-sub">{empty === true ? 'None today.' : empty}</p> : children}
  </details>
);
const Rows = ({ list }) => <ul className="fl-srows">{list.map((r, i) => <li key={i} className={r.void ? 'is-void' : ''}><span><b>{r.t}</b><small>{r.s}</small></span><em>{r.v}</em></li>)}</ul>;

// The daily float report on the phone: the summary and the sections, with Download PDF and Send.
function Report({ F, D }) {
  const R = F.report(D); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
  // Send to boss: the phone's share sheet when there is one (WhatsApp, email…), otherwise WhatsApp with the
  // summary. Either way the report is filed for Management and the GM. The PDF is saved first and attached.
  const send = async () => {
    setBusy(true); let shared = false;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: 'Daily float report · ' + R.short, text: R.text, url: F.shareUrl }); shared = true; } catch (e) { if (e && e.name === 'AbortError') { setBusy(false); return; } }
    }
    const m = await F.send(D, { shared }); setBusy(false); setMsg(m || 'Sent to the boss');
  };
  const T = v => n(v), S = v => (v < 0 ? '−' : '') + n(Math.abs(v)), W = R.waiting;
  return (
    <section className="fh-card fl-report" aria-label="Daily float report">
      <DayPicker F={F} D={D} set={F.setDay} chips />
      <div className="fl-rhead"><b>Daily float report</b><small>{R.ref} · {R.label}</small></div>
      {R.revised ? <p className="bi-ret" role="status">Revised — closing was {S(R.revised.was)} when sent, now {S(R.revised.now)}.</p> : null}
      {R.sentLine ? <p className="mr-recline">✓ {R.sentLine}</p> : null}
      <dl className="fl-sum">
        <div><dt>Opening balance <small>carried down</small></dt><dd>{S(R.open)}</dd></div>
        <div><dt>+ Float received</dt><dd>{T(R.float)}</dd></div>
        <div><dt>+ Change returned</dt><dd>{T(R.returnedT)}</dd></div>
        <div><dt>− Total out</dt><dd>{T(R.out)}</dd></div>
        <div className="is-close"><dt>= Closing balance <small>carried down</small></dt><dd className={R.close < 0 ? 'is-red' : ''}>{S(R.close)}</dd></div>
      </dl>
      <p className="fl-check">{S(R.open)} + {T(R.in)} − {T(R.out)} = {S(R.close)} {R.check ? '✓' : '✗'}</p>
      {R.shortBy ? <p className="bi-ret" role="status">⚠ Approved requests waiting ({T(W.total)}) are more than the closing balance: short {T(R.shortBy)}.</p> : null}
      <div className="fh-row fl-rbtns">
        <Btn kind="ghost" onClick={() => F.print(D)}>Save PDF</Btn>
        {F.canSend ? <Btn kind="dark" disabled={busy} onClick={send}>{R.sent ? 'Send again' : 'Send to boss'}</Btn> : null}
      </div>
      {F.canSend ? <p className="k-sub fl-hint">Attach the PDF you saved.</p> : null}
      {msg ? <p className={msg === 'Sent to the boss' ? 'td-sent' : 'fm-err'} role="status">{msg === 'Sent to the boss' ? '✓ Sent to the boss · attach the PDF you saved' : msg}</p> : null}
      <Sec no={1} title="Float received" extra={R.grants.length ? T(R.float) : ''} empty={!R.grants.length}><Rows list={R.grants.map(g => ({ t: g.from + (g.note ? ' · ' + g.note : ''), s: [g.time, g.method].filter(Boolean).join(' · '), v: T(g.amt) }))} /></Sec>
      <Sec no={2} title="Requests submitted today" extra={R.submitted.length ? R.submitted.length + ' · ' + T(R.submittedT) : ''} empty={!R.submitted.length}><Rows list={R.submitted.map(r => ({ t: r.id + ' · ' + r.who, s: r.where + ' · ' + r.st, v: T(r.amt) }))} /></Sec>
      <Sec no={3} title="Requests paid today" extra={R.paid.length ? R.paid.length + ' · ' + T(R.requestsT) : ''} empty={!R.paid.length}><Rows list={R.paid.map(r => ({ t: r.id + ' · ' + r.who, s: [r.time, r.where, r.method, r.paid < r.asked ? 'asked ' + T(r.asked) : '', r.fee ? 'charges ' + T(r.fee) : ''].filter(Boolean).join(' · '), v: T(r.paid) }))} /></Sec>
      <Sec no={4} title="Daily expenses" extra={R.expenses.length ? R.nExp + ' · ' + T(R.expensesT) : ''} empty={!R.expenses.length}><Rows list={R.expenses.map(e => ({ void: e.void, t: e.cat + (e.what ? ' · ' + e.what : ''), s: [e.time, e.who, e.where, e.method, e.fee ? 'charges ' + T(e.fee) : '', e.voucher, e.void ? 'VOID' : ''].filter(Boolean).join(' · '), v: T(e.amt) }))} /></Sec>
      <Sec no={5} title="Change returned" extra={R.returned.length ? T(R.returnedT) : ''} empty={!R.returned.length}><Rows list={R.returned.map(r => ({ t: r.id + ' · ' + r.who, s: 'Paid ' + T(r.paid) + ' · spent ' + T(r.spent) + ' · ' + r.method, v: T(r.back) }))} /></Sec>
      <Sec no={6} title="Spending by project today" extra={R.out ? T(R.out) : ''} empty={!R.byProject.length && !R.charges}><Rows list={[...R.byProject.map(r => ({ t: r.name, s: 'Requests ' + T(r.requests) + ' · expenses ' + T(r.expenses), v: T(r.total) })), ...(R.charges ? [{ t: 'Transaction charges', s: '', v: T(R.charges) }] : [])]} /></Sec>
      <Sec no={7} title="Waiting for payment" extra={W.list.length ? W.n + ' approved · ' + T(W.total) + (W.pendingN ? ' · ' + W.pendingN + ' in approval · ' + T(W.pendingTotal) : '') : ''} empty={!W.list.length && 'Nothing waiting.'}><Rows list={W.list.map(r => ({ t: r.id + ' · ' + r.who, s: r.where + ' · ' + r.st + (r.days != null ? ' · ' + r.days + ' d' : ''), v: T(r.amt) }))} /></Sec>
      <Sec no={8} title="Paid requests not yet accounted for" extra={R.advances.length ? R.advances.length + ' · ' + T(R.advancesT) : ''} empty={!R.advances.length && 'All accounted for.'}><Rows list={R.advances.map(a => ({ t: a.who + ' · ' + a.id, s: a.where + ' · paid ' + a.paidOn + ' · ' + a.days + ' d · ' + (a.st === 'submitted' ? 'receipts with Finance' : a.st === 'back' ? 'sent back' : a.dueText.toLowerCase()), v: T(a.paid) }))} /></Sec>
    </section>
  );
}

// Approved requests waiting for payment: each one opens the payment confirm sheet.
function WaitingSheet({ F, onClose }) {
  return (
    <Sheet title="Waiting to be paid" sub={F.waiting.n + ' approved · ' + F.waiting.total} onClose={onClose} label="Waiting to be paid">
      {F.waitList.length ? <ul className="fl-srows fl-wait">{F.waitList.map(r => (
        <li key={r.id}><span><b>{r.who} · {r.id}</b><small>{r.what}{r.via ? ' · ' + r.via : ''}</small></span><em>{r.amtT}</em>{F.canPay ? <Btn kind="dark" onClick={r.pay}>Pay</Btn> : null}</li>
      ))}</ul> : <Empty>Nothing waiting to be paid.</Empty>}
    </Sheet>
  );
}

// Receipts to check, and the money staff still have to account for (Finance's Receipts tab).
export function Receipts({ F, compact }) {
  return (
    <>
      <section className="fh-card" id="fl-check" aria-label="Receipts to check">
        <h3>Receipts to check · {F.toCheck.length}</h3>
        {F.toCheck.length ? F.toCheck.map(c => <RecCheck key={c.id} c={c} compact />) : <Empty>No receipts waiting to be checked.</Empty>}
      </section>
      <details className="fh-card fl-adv" id="fl-adv" open={!compact || F.overdueN > 0}>
        <summary><h3>Money to account for · {F.advances.length}</h3></summary>
        {F.advances.length ? <ul className="fl-srows">{F.advances.map(a => <li key={a.id} onClick={a.open}><span><b>{a.who} · {a.id}</b><small>{a.where} · paid {a.paidOn} · {a.days} d · {a.st === 'submitted' ? 'receipts with Finance' : a.st === 'back' ? 'sent back' : a.dueText.toLowerCase()}</small></span><em className={a.overdue ? 'is-red' : ''}>{a.paidT}</em></li>)}</ul> : <Empty>Everyone has accounted for the money they received.</Empty>}
      </details>
    </>
  );
}

// Requests waiting for Finance's Verify step.
function VerifyCard({ F }) {
  const [err, setErr] = useState('');
  return (
    <section className="fh-card fl-verify" aria-label="Requests to verify">
      <h3>Requests to verify · {F.verify.length}</h3>
      <ul className="fl-srows">{F.verify.map(r => (
        <li key={r.id}>
          <span onClick={r.open}><b>{r.who} · {r.amtT}</b><small>{r.id} · {r.what}</small></span>
          <span className="fl-vbtns"><Btn kind="ghost" onClick={() => setErr(r.sendBack())}>Send back</Btn><Btn kind="dark" onClick={r.verify}>Verify</Btn></span>
        </li>
      ))}</ul>
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
    </section>
  );
}

// The Float page: the money from Management, what was paid from it, and the daily report.
export default function FloatPage({ v }) {
  const F = v.FL;
  if (!F) return null;
  const D = F.day, phone = v.phone || (typeof window !== 'undefined' && window.innerWidth < 700);
  const Fx = Object.assign({}, F, { ic: v.ic || {}, sentToday: !!F.dayView(F.today).sent, canPay: !!F.canEdit });
  const sheet = F.sheet, close = force => F.closeSheet(force === true);
  const openLine = l => F.setSheet({ line: l.id, at: l.at || D });
  const lineOf = x => (x ? F.dayView(x.at).lines.find(l => l.id === x.line || l.id === x.edit) : null);
  const openById = (id, at) => { const l = F.dayView(at).lines.find(x => x.id === id); if (l) F.setSheet({ line: id, at }); };
  const lineSheet = sheet && sheet.line ? lineOf(sheet) : null, editSheet = sheet && sheet.edit ? lineOf(sheet) : null;
  const views = [['day', 'Day'], ['book', 'Petty cash book'], ['project', 'By project']];
  // Finance checks receipts on its own Receipts tab; Management and the GM see them here.
  const ownReceipts = F.role === 'finance';
  return (
    <div className="fl">
      {v.floatNudge && F.view !== 'report' ? <button type="button" className="fl-nudge" onClick={v.floatNudge.go}><b>{v.floatNudge.t}</b><small>{v.floatNudge.s}</small></button> : null}
      <section className={'fl-bal' + (F.neg ? ' is-neg' : '')} aria-label="Float balance">
        <span>Float balance</span><b>{F.balance}</b>
        <small><span>Opened today {F.todayLine.open}</span> · <span>In +{F.todayLine.in}</span> · <span>Out −{F.todayLine.out}</span></small>
      </section>
      <div className={'fl-acts' + (F.canEdit ? '' : ' is-view')}>
        {F.canGive ? <button type="button" onClick={() => F.setSheet('grant')}><Icon d={Fx.ic.wallet} size={22} /><b>Give float to Finance</b></button> : null}
        {F.canAsk ? <button type="button" onClick={() => F.setSheet('ask')}><Icon d={Fx.ic.wallet} size={22} /><b>Ask the boss for float</b></button> : null}
        {F.canEdit ? <button type="button" onClick={() => F.setSheet('expense')}><Icon d={Fx.ic.receipt} size={22} /><b>Daily expense</b></button> : null}
        <button type="button" className={F.view === 'report' ? 'is-on' : ''} aria-pressed={F.view === 'report'} onClick={() => F.setView('report')}><Icon d={Fx.ic.fileText} size={22} /><b>Daily report</b></button>
      </div>
      <div className="fl-chips">
        <button type="button" className="fl-chip" onClick={() => F.setSheet('waiting')}>Waiting to be paid · <b>{F.waiting.n}</b> · {F.waiting.total}</button>
        {F.toCheck.length ? (ownReceipts ? <button type="button" className="fl-chip is-gold" onClick={F.goReceipts}>Receipts to check · <b>{F.toCheck.length}</b></button> : <a href="#fl-check" className="fl-chip is-gold">Receipts to check · <b>{F.toCheck.length}</b></a>) : null}
        {F.overdueN ? (ownReceipts ? <button type="button" className="fl-chip is-red" onClick={F.goReceipts}>Not accounted for after {F.accountDays} days · <b>{F.overdueN}</b></button> : <a href="#fl-adv" className="fl-chip is-red">Not accounted for after {F.accountDays} days · <b>{F.overdueN}</b></a>) : null}
      </div>
      {F.verify.length ? <VerifyCard F={Fx} /> : null}
      <div className="rc-smart fl-views" role="tablist">{views.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={F.view === k} className={F.view === k ? 'is-on' : ''} onClick={() => F.setView(k)}><span>{l}</span></button>)}</div>
      {F.view === 'report' ? <Report F={Fx} D={D} /> : F.view === 'project' ? <ByProject F={Fx} phone={phone} /> : F.view === 'book' ? <CashBook F={Fx} D={D} phone={phone} openLine={openById} /> : <DayList F={Fx} D={D} open={openLine} />}
      {!ownReceipts && (F.toCheck.length || F.advances.length) ? <Receipts F={Fx} compact /> : null}
      {sheet === 'expense' ? <ExpenseSheet F={Fx} day={D >= F.minDay && D <= F.today ? D : F.today} onClose={close} /> : null}
      {sheet === 'grant' && F.canGive ? <GrantSheet F={Fx} onClose={close} /> : null}
      {sheet === 'ask' && F.canAsk ? <AskSheet F={Fx} onClose={close} /> : null}
      {sheet === 'waiting' ? <WaitingSheet F={Fx} onClose={close} /> : null}
      {lineSheet ? <LineSheet l={lineSheet} F={Fx} onClose={close} onEdit={() => F.setSheet({ edit: lineSheet.id, at: sheet.at })} /> : null}
      {editSheet ? <ExpenseSheet F={Fx} edit={editSheet} onClose={close} /> : null}
      {v.PAYQ ? <PaySheet key={v.PAYQ.id} P={v.PAYQ} /> : null}
    </div>
  );
}
