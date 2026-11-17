import { useState } from 'react';
import { PageHead, Btn, Pill, Empty } from '../../ui/kit';
import { Reports, CashBook, CashChart, Periods } from './FinanceReports';

const ST = { draft: ['Draft', '#F1EEF6', '#6E6A7C'], sent: ['Sent', '#E9EFFA', '#3559A8'], partial: ['Part paid', '#FBF1DD', '#8A6414'], overdue: ['Overdue', '#FBEDEE', '#B23A46'], paid: ['Paid', '#E6F4EC', '#1F7549'] };
const n = v => Math.round(+v || 0).toLocaleString('en-US');
const digits = v => String(v || '').replace(/\D/g, '');

function Kpis({ items }) {
  return <div className="fh-kpis">{items.map(k => <div key={k.l} className={'fh-kpi is-' + k.tone}>{k.pct != null ? <i className="ring" style={{ '--p': k.pct }}><em>{k.pct}%</em></i> : null}<span>{k.l}</span><b>{k.v}</b><small>{k.n}</small></div>)}</div>;
}

function Amount({ value, set, label, placeholder }) {
  return (
    <label className="fh-amt"><span>TZS</span>
      <input inputMode="numeric" value={value ? n(value) : ''} onChange={e => set(digits(e.target.value))} placeholder={placeholder || '0'} aria-label={label} />
    </label>
  );
}

// Record a payment against an invoice (partial payments allowed).
function PayForm({ i, onDone }) {
  const [a, setA] = useState(''); const [r, setR] = useState(''); const [e, setE] = useState('');
  return (
    <div className="fh-pay">
      <Amount value={a} set={setA} label="Amount received" placeholder={n(i.due)} />
      <input className="ff-search" value={r} onChange={x => setR(x.target.value)} placeholder="Bank reference (e.g. CRDB TT 88213)" aria-label="Reference" />
      <div className="fh-row"><Btn kind="dark" onClick={() => { const m = i.pay(a, r); if (m) setE(m); else onDone(); }}>Record payment</Btn><Btn kind="ghost" onClick={() => setA(String(i.due))}>Full balance</Btn></div>
      {e ? <div className="fm-err" role="alert">{e}</div> : null}
    </div>
  );
}

function InvoiceRow({ i, F }) {
  const [paying, setPaying] = useState(false);
  const s = ST[i.st] || ST.sent;
  return (
    <li className={'fh-inv' + (i.sel ? ' is-open' : '')} data-invoice={i.id}>
      <button type="button" className="fh-inv-row" onClick={i.open} aria-expanded={i.sel}>
        <span className="fh-inv-id">{i.id}</span>
        <span className="fh-inv-c"><b>{i.c}</b><small>{i.proj || '—'}</small></span>
        <span className="fh-inv-bar" aria-hidden="true"><i style={{ width: i.pct + '%' }} /></span>
        <span className="fh-inv-amt"><b>{i.totalT}</b><small>{i.paid ? i.dueT + ' due' : i.dueOn}</small></span>
        <Pill l={i.needsSign ? 'To sign' : s[0]} bg={i.needsSign ? '#FBF6EA' : s[1]} fg={i.needsSign ? '#8A6414' : s[2]} />
      </button>
      {i.sel ? (
        <div className="fh-inv-detail">
          <div className="fh-row">
            <Btn kind="ghost" onClick={i.print}>Open PDF</Btn>
            {i.canSign ? <Btn kind="dark" onClick={i.sign}>Sign &amp; stamp</Btn> : null}
            {i.st === 'draft' && i.signed ? <Btn kind="dark" onClick={i.send}>Mark as sent</Btn> : null}
            {i.st === 'draft' && F.canInvoice ? <Btn kind="ghost" onClick={i.edit}>Edit</Btn> : null}
            {i.canPay && !paying ? <Btn kind="dark" onClick={() => setPaying(true)}>Record payment</Btn> : null}
          </div>
          {i.needsSign ? <p className="k-sub">Waiting for the {i.signer} to sign. The signature and company stamp appear on the PDF only after signing.</p> : null}
          {paying ? <PayForm i={i} onDone={() => setPaying(false)} /> : null}
          {i.payments.length ? (
            <ol className="fh-pays">
              {i.payments.map(p => (
                <li key={p.id} className={p.ok ? 'is-ok' : ''}>
                  <span><b>{p.amt}</b><small>{p.at} · {p.ref || 'no reference'} · recorded by {p.rec}</small></span>
                  {p.ok ? <span className="fh-ok">✓ Confirmed by {p.okBy}</span> : p.canOk ? <Btn kind="dark" onClick={p.confirm}>Confirm</Btn> : <span className="fh-wait">Waiting for Management</span>}
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

const EMPTY_LINE = { item: '', n: '1', rate: '', days: '1', events: '1' };

// Invoice editor: the CRDB invoice's content, laid out for a phone.
function Editor({ F }) {
  const d = F.draft;
  const [f, setF] = useState(() => d ? Object.assign({}, d, { lines: d.lines.map(l => ({ item: l.item, n: String(l.n), rate: String(l.rate), days: String(l.days), events: String(l.events) })) })
    : { c: '', tin: '', vrn: '', p: '', title: '', po: '', poDate: '', vendor: '', signer: 'ED', due: '30 days', admin: 15, lines: [Object.assign({}, EMPTY_LINE)] });
  const [err, setErr] = useState('');
  const set = (k, v) => setF(x => Object.assign({}, x, { [k]: v }));
  const setLine = (i, k, v) => setF(x => Object.assign({}, x, { lines: x.lines.map((l, j) => (j === i ? Object.assign({}, l, { [k]: v }) : l)) }));
  const T = F.totals({ lines: f.lines.map(l => ({ n: +l.n || 0, rate: +l.rate || 0, days: +l.days || 1, events: +l.events || 1 })), admin: f.admin, vat: 18 });
  const pickClient = c => { const cu = F.customers.find(x => x.v === c); setF(x => Object.assign({}, x, { c, tin: x.tin || (cu ? cu.tin : '') })); };
  return (
    <div className="fm-back" onClick={F.closeEdit}>
      <div className="fm fh-ed" role="dialog" aria-label={d ? 'Edit ' + d.id : 'New invoice'} onClick={e => e.stopPropagation()}>
        <header className="fm-head"><div><h2>{d ? 'Edit ' + d.id : 'New invoice'}</h2><p>Signed by the person you choose. Their signature and the stamp appear once they approve.</p></div><button type="button" className="fm-x" onClick={F.closeEdit} aria-label="Close">×</button></header>
        <div className="fm-body">
          <div className="ff" data-field="Client"><span className="ff-l">Client<em>*</em></span>
            <div className="ff-chips">{F.customers.map(c => <button key={c.v} type="button" className={f.c === c.v ? 'is-on' : ''} onClick={() => pickClient(c.v)}>{c.l}</button>)}</div>
          </div>
          <div className="fh-two">
            <label className="ff"><span className="ff-l">Client TIN</span><input value={f.tin} onChange={e => set('tin', e.target.value)} placeholder="100-000-000" /></label>
            <label className="ff"><span className="ff-l">Client VRN</span><input value={f.vrn} onChange={e => set('vrn', e.target.value)} placeholder="10-000000-X" /></label>
          </div>
          <div className="ff" data-field="Project"><span className="ff-l">Project</span>
            <div className="ff-chips">{F.projects.filter(p => !f.c || p.c === f.c).map(p => <button key={p.v} type="button" className={f.p === p.v ? 'is-on' : ''} onClick={() => set('p', f.p === p.v ? '' : p.v)}>{p.l}</button>)}</div>
          </div>
          <label className="ff"><span className="ff-l">Event / title</span><input value={f.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Brand Launch Gala · Serena Hotel" /></label>
          <div className="fh-three">
            <label className="ff"><span className="ff-l">PO No</span><input value={f.po} onChange={e => set('po', e.target.value)} /></label>
            <label className="ff"><span className="ff-l">PO Date</span><input type="date" value={f.poDate} onChange={e => set('poDate', e.target.value)} /></label>
            <label className="ff"><span className="ff-l">Vendor No</span><input value={f.vendor} onChange={e => set('vendor', e.target.value)} /></label>
          </div>

          <div className="ff"><span className="ff-l">Items</span>
            <div className="fh-lines">
              {f.lines.map((l, i) => (
                <div key={i} className="fh-line">
                  <input className="fh-line-item" value={l.item} onChange={e => setLine(i, 'item', e.target.value)} placeholder={'Item ' + (i + 1) + ' · e.g. Brand ambassadors'} aria-label={'Item ' + (i + 1)} />
                  <label><small>Number</small><input inputMode="numeric" value={l.n} onChange={e => setLine(i, 'n', digits(e.target.value))} /></label>
                  <label className="fh-rate"><small>Rate (TZS)</small><input inputMode="numeric" value={l.rate ? n(l.rate) : ''} onChange={e => setLine(i, 'rate', digits(e.target.value))} placeholder="0" aria-label={'Rate ' + (i + 1)} /></label>
                  <label><small>Days</small><input inputMode="numeric" value={l.days} onChange={e => setLine(i, 'days', digits(e.target.value))} /></label>
                  <label><small>Events</small><input inputMode="numeric" value={l.events} onChange={e => setLine(i, 'events', digits(e.target.value))} /></label>
                  <b className="fh-line-tot">{n((+l.n || 0) * (+l.rate || 0) * (+l.days || 1) * (+l.events || 1))}</b>
                  {f.lines.length > 1 ? <button type="button" className="td-x" onClick={() => setF(x => Object.assign({}, x, { lines: x.lines.filter((_, j) => j !== i) }))} aria-label={'Remove item ' + (i + 1)}>×</button> : null}
                </div>
              ))}
              <button type="button" className="fh-addline" onClick={() => setF(x => Object.assign({}, x, { lines: [...x.lines, Object.assign({}, EMPTY_LINE)] }))}>+ Add item</button>
            </div>
          </div>

          <div className="fh-sum">
            <div><span>Total direct costs</span><b>{n(T.direct)}</b></div>
            <div><span>Administrative cost
              <span className="fh-adm">{[0, 10, 15].map(a => <button key={a} type="button" className={+f.admin === a ? 'is-on' : ''} onClick={() => set('admin', a)}>{a}%</button>)}</span></span><b>{n(T.admin)}</b></div>
            <div><span>VAT 18%</span><b>{n(T.vat)}</b></div>
            <div className="fh-grand"><span>Total VAT inclusive</span><b>TZS {n(T.total)}</b></div>
          </div>

          <div className="ff" data-field="Signed by"><span className="ff-l">Signed by</span>
            <div className="ff-chips" role="radiogroup" aria-label="Signed by">
              {[['ED', 'Executive Director'], ['GM', 'General Manager']].map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={f.signer === k} className={f.signer === k ? 'is-on' : ''} onClick={() => set('signer', k)}>{l}</button>)}
            </div>
          </div>
          <div className="ff"><span className="ff-l">Payment due</span>
            <div className="ff-chips">{['On receipt', '15 days', '30 days', '45 days'].map(x => <button key={x} type="button" className={f.due === x ? 'is-on' : ''} onClick={() => set('due', x)}>{x}</button>)}</div>
          </div>
          {err ? <div className="fm-err" role="alert">{err}</div> : null}
        </div>
        <footer className="fm-foot">
          <Btn kind="ghost" onClick={F.closeEdit}>Cancel</Btn>
          <Btn kind="dark" onClick={() => { const e = F.save(f); if (e) setErr(e); }}>{d ? 'Save invoice' : 'Create invoice'}</Btn>
        </footer>
      </div>
    </div>
  );
}

function FloatTab({ F }) {
  const L = F.float;
  const [amt, setAmt] = useState(''); const [note, setNote] = useState(''); const [to, setTo] = useState(''); const [aAmt, setAAmt] = useState(''); const [err, setErr] = useState(''); const [ok, setOk] = useState('');
  const run = (fn, reset) => { const m = fn(); setErr(m); setOk(m ? '' : 'Done'); if (!m) reset(); };
  return (
    <div className="fh-float">
      <section className="fh-card fh-floathead">
        <div className="fh-ring" style={{ '--p': L.pct }}><b>{L.pct}%</b><small>allocated</small></div>
        <dl>
          <div><dt>Float given by Management</dt><dd>{L.total}</dd></div>
          <div><dt>Allocated</dt><dd>{L.allocated}</dd></div>
          <div><dt>Not yet allocated</dt><dd className="is-gold">{L.left}</dd></div>
        </dl>
      </section>

      <section className="fh-card">
        <h3>{F.isCeo ? 'Give float to Finance' : 'Ask Management for float'}</h3>
        {F.isCeo && L.asks.length ? <div className="fh-asks">{L.asks.map(a => <button key={a.id} type="button" onClick={() => { setAmt(String(a.raw)); setNote(a.note); }}>Finance asked {a.amt}{a.note ? ' · ' + a.note : ''}</button>)}</div> : null}
        <Amount value={amt} set={setAmt} label="Float amount" />
        <div className="ff-quick">{[1e6, 5e6, 10e6, 20e6].map(v => <button key={v} type="button" onClick={() => setAmt(String(v))}>{v / 1e6}M</button>)}</div>
        <input className="ff-search" value={note} onChange={e => setNote(e.target.value)} placeholder="Note (e.g. December float)" aria-label="Float note" />
        <Btn kind="dark" onClick={() => run(() => (F.isCeo ? L.give(amt, note) : L.ask(amt, note)), () => { setAmt(''); setNote(''); })}>{F.isCeo ? 'Give float' : 'Send request'}</Btn>
      </section>

      {F.isFin || F.isCeo ? (
        <section className="fh-card fh-wide">
          <h3>Allocate to a project or office purpose</h3>
          <div className="ff-chips fh-targets">{L.targets.map(t => <button key={t.v} type="button" className={to === t.v ? 'is-on' : ''} onClick={() => setTo(t.v)}><b>{t.l}</b><small>{t.s}</small></button>)}</div>
          <div className="fh-row"><Amount value={aAmt} set={setAAmt} label="Allocation amount" /><Btn kind="dark" onClick={() => run(() => L.allocate(to, aAmt), () => setAAmt(''))}>Allocate</Btn></div>
          <span className="k-sub">{L.left} not yet allocated. Staff request money against these amounts.</span>
        </section>
      ) : null}
      {err ? <div className="fm-err fh-wide" role="alert">{err}</div> : ok ? <div className="td-sent fh-wide">✓ Saved</div> : null}

      <section className="fh-card fh-wide">
        <h3>Allocations</h3>
        {L.allocs.length ? (
          <ul className="fh-allocs">
            {L.allocs.map(a => (
              <li key={a.id}>
                <span className="fh-al-name"><b>{a.name}</b><small>{a.office ? 'Office' : 'Project'} · {a.amt}</small></span>
                <span className="fh-al-bar"><i style={{ width: a.pct + '%', background: a.over ? '#D9535F' : undefined }} /></span>
                <span className="fh-al-nums"><small>Paid {a.used} · waiting {a.waiting}</small><b className={a.over ? 'is-red' : ''}>{a.left} left</b></span>
              </li>
            ))}
          </ul>
        ) : <Empty>Nothing allocated yet.</Empty>}
      </section>

      <section className="fh-card fh-wide">
        <h3>Float received</h3>
        {L.grants.length ? <ul className="mr-list">{L.grants.map(g => <li key={g.id}><button type="button"><span><b>{g.amt}</b><small>{g.note || 'Float'} · {g.by}</small></span><span className="k-sub">{g.at}</span></button></li>)}</ul> : <Empty>No float given yet.</Empty>}
      </section>
    </div>
  );
}

// Finance: the overview, invoices (create, sign, send, payments) and the float ledger.
export default function FinanceHub({ v }) {
  const F = v.FH, R = v.REP;
  const tabs = [['overview', 'Overview'], ...(R ? [['cash', 'Cash book'], ['reports', 'Reports']] : []), ['invoices', 'Invoices'], ...(F.float ? [['float', 'Float']] : [])];
  const list = F.invoices.filter(i => (F.filter === 'open' ? i.st !== 'paid' : F.filter === 'paid' ? i.st === 'paid' : F.filter === 'sign' ? i.needsSign : true));
  return (
    <>
      <PageHead kicker="Finance" title="Finance" sub="Money in and out every day, who owes us, invoices and the float, in one place.">
        {F.canInvoice ? <Btn kind="dark" onClick={F.newInvoice}>New invoice</Btn> : null}
      </PageHead>
      <div className="rc-smart fh-tabs" role="tablist">{tabs.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={F.tab === k} className={F.tab === k ? 'is-on' : ''} onClick={() => F.setTab(k)}><span>{l}</span></button>)}</div>

      {F.tab === 'overview' ? (
        <>
          <Kpis items={F.kpis} />
          {R ? <><Periods R={R} /><CashChart R={R} /></> : null}
          <section className="fh-card">
            <h3>Needs attention</h3>
            {F.attention.length ? <ul className="fh-att">{F.attention.map((a, i) => <li key={i}><span><b>{a.t}</b><small>{a.s}</small></span><Btn kind="ghost" onClick={a.on}>{a.act}</Btn></li>)}</ul> : <Empty>All clear.</Empty>}
          </section>
        </>
      ) : null}

      {F.tab === 'cash' && R ? <CashBook R={R} canAdd={F.moneyTop} /> : null}
      {F.tab === 'reports' && R ? <Reports R={R} /> : null}
      {F.tab === 'invoices' ? (
        <section className="fh-card">
          <div className="k-chips fh-filter">{[['open', 'Open'], ['sign', 'To sign'], ['paid', 'Paid'], ['all', 'All']].map(([k, l]) => <button key={k} type="button" className={F.filter === k ? 'is-on' : ''} onClick={() => F.setFilter(k)}>{l}</button>)}</div>
          {list.length ? <ul className="fh-invs">{list.map(i => <InvoiceRow key={i.id} i={i} F={F} />)}</ul> : <Empty>No invoices here.</Empty>}
        </section>
      ) : null}

      {F.tab === 'float' && F.float ? <FloatTab F={F} /> : null}
      {F.editing ? <Editor key={F.editing} F={F} /> : null}
    </>
  );
}
