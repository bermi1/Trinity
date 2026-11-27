import { useState } from 'react';
import { PageHead, Btn, Pill, Empty } from '../../ui/kit';
import { Reports, CashBook, CashChart, Periods } from './FinanceReports';
import { Obligations } from './Obligations';
import FloatPage from './FloatPage';

const ST = { draft: ['Draft', '#F1EEF6', '#6E6A7C'], sent: ['Sent', '#E9EFFA', '#3559A8'], partial: ['Part paid', '#FBF1DD', '#8A6414'], overdue: ['Overdue', '#FBEDEE', '#B23A46'], paid: ['Paid', '#E6F4EC', '#1F7549'], cancelled: ['Cancelled', '#EDEBF0', '#6E6A7C'] };
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

// Cancel an invoice: the reason is required, then a confirmation.
function CancelForm({ i, onDone }) {
  const [r, setR] = useState(''); const [e, setE] = useState('');
  const go = () => { const m = i.doCancel(r); if (m === 'Not cancelled') return; if (m) setE(m); else onDone(); };
  return (
    <div className="fh-pay" data-cancel-form>
      <label className="ff"><span className="ff-l">Why is this invoice cancelled?<em>*</em></span>
        <input className="ff-search" value={r} onChange={x => { setR(x.target.value); setE(''); }} placeholder="e.g. Issued to the wrong client · replaced by a new invoice" aria-label="Reason for cancelling" autoFocus /></label>
      <div className="fh-row"><Btn kind="dark" onClick={go}>Cancel invoice</Btn><Btn kind="ghost" onClick={onDone}>Keep it</Btn></div>
      {e ? <div className="fm-err" role="alert">{e}</div> : null}
    </div>
  );
}

function InvoiceRow({ i }) {
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [err, setErr] = useState('');
  const s = ST[i.st] || ST.sent;
  return (
    <li className={'fh-inv' + (i.sel ? ' is-open' : '') + (i.cancelled ? ' is-cancelled' : '')} data-invoice={i.id}>
      <button type="button" className="fh-inv-row" onClick={i.open} aria-expanded={i.sel} style={i.cancelled ? { opacity: 0.6 } : undefined}>
        <span className="fh-inv-id">{i.no}</span>
        <span className="fh-inv-c"><b>{i.c}</b><small>{i.proj || '—'}</small></span>
        <span className="fh-inv-bar" aria-hidden="true"><i style={{ width: i.pct + '%' }} /></span>
        <span className="fh-inv-amt"><b style={i.cancelled ? { textDecoration: 'line-through' } : undefined}>{i.totalT}</b><small>{i.cancelled ? 'Cancelled ' + i.cancelInfo.at : i.paid ? i.dueT + ' due' : i.dueOn}</small></span>
        <Pill l={i.needsSign ? 'To sign' : s[0]} bg={i.needsSign ? '#FBF6EA' : s[1]} fg={i.needsSign ? '#8A6414' : s[2]} />
      </button>
      {i.sel ? (
        <div className="fh-inv-detail">
          {i.cancelled ? (
            <p className="bi-ret" data-cancelled-note><b>Cancelled</b> · {i.cancelInfo.at}{i.cancelInfo.by ? ' · by ' + i.cancelInfo.by : ''} · Reason: {i.cancelInfo.reason}. It no longer counts as owed or in the reports; its number {i.no} stays used.</p>
          ) : null}
          <div className="fh-row">
            <Btn kind="ghost" onClick={i.print}>Open PDF</Btn>
            {i.canSign ? <Btn kind="dark" onClick={i.sign}>Sign &amp; stamp</Btn> : null}
            {i.st === 'draft' && i.signed ? <Btn kind="dark" onClick={i.send}>Mark as sent</Btn> : null}
            {i.needsSign && !i.canSign ? <span className="k-sub">Edited or new · waiting for signature</span> : null}
            {i.canEdit ? <Btn kind="ghost" onClick={i.edit}>Edit</Btn> : null}
            {i.canPay && !paying ? <Btn kind="dark" onClick={() => setPaying(true)}>Record payment</Btn> : null}
            {i.canCancel && !cancelling ? <Btn kind="ghost" onClick={() => { if (i.cancelBlock) setErr(i.cancelBlock); else { setPaying(false); setCancelling(true); } }}>Cancel invoice</Btn> : null}
            {i.canRestore ? <Btn kind="ghost" onClick={() => { const m = i.restore(); if (m) setErr(m); }}>Restore{i.cancelInfo.was ? ' (back to ' + i.cancelInfo.was + ')' : ''}</Btn> : null}
          </div>
          {err ? <div className="fm-err" role="alert">{err}</div> : null}
          {cancelling ? <CancelForm i={i} onDone={() => setCancelling(false)} /> : null}
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
    : { no: '', c: '', tin: '', vrn: '', p: '', title: '', po: '', poDate: '', vendor: '', signer: 'ED', due: '30 days', admin: 15, lines: [Object.assign({}, EMPTY_LINE)] });
  const [err, setErr] = useState('');
  const set = (k, v) => setF(x => Object.assign({}, x, { [k]: v }));
  const setLine = (i, k, v) => setF(x => Object.assign({}, x, { lines: x.lines.map((l, j) => (j === i ? Object.assign({}, l, { [k]: v }) : l)) }));
  const T = F.totals({ lines: f.lines.map(l => ({ n: +l.n || 0, rate: +l.rate || 0, days: +l.days || 1, events: +l.events || 1 })), admin: f.admin, vat: 18 });
  const pickClient = c => { const cu = F.customers.find(x => x.v === c); setF(x => Object.assign({}, x, { c, tin: cu ? cu.tin : x.tin, vrn: cu ? cu.vrn : x.vrn })); };
  return (
    <div className="fm-back" onClick={F.closeEdit}>
      <div className="fm fh-ed" role="dialog" aria-label={d ? 'Edit ' + d.id : 'New invoice'} onClick={e => e.stopPropagation()}>
        <header className="fm-head"><div><h2>{d ? 'Edit ' + (d.no || d.id) : 'New invoice'}</h2><p>Signed by the person you choose. Their signature and the stamp appear once they approve.</p></div><button type="button" className="fm-x" onClick={F.closeEdit} aria-label="Close">×</button></header>
        <div className="fm-body">
          <label className="ff"><span className="ff-l">Invoice number</span><input value={f.no || ''} onChange={e => set('no', e.target.value)} placeholder={d ? d.id : F.nextNo} aria-label="Invoice number" /><small className="k-sub">Leave empty to use {d ? d.id : F.nextNo}. Use your own numbering if you need to (e.g. TMS/2026/045).</small></label>
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
          {F.poFor(f.p) ? <p className="k-sub">Purchase order on the project: <b>{F.poFor(f.p)}</b> · it prints under the client details.</p> : f.p ? <p className="bi-ret">No purchase order recorded on this project yet. Management or the PA adds it on the project.</p> : null}

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
            <div><span>Total direct cost</span><b>{n(T.direct)}</b></div>
            <div><span>Administrative cost {+f.admin}%
              <span className="fh-adm">{[0, 10, 15].map(a => <button key={a} type="button" className={+f.admin === a ? 'is-on' : ''} onClick={() => set('admin', a)}>{a}%</button>)}</span></span><b>{n(T.admin)}</b></div>
            <div><span>Total direct cost VAT exclusive</span><b>{n(T.net)}</b></div>
            <div><span>VAT amount 18%</span><b>{n(T.vat)}</b></div>
            <div className="fh-grand"><span>Total direct cost VAT inclusive</span><b>TZS {n(T.total)}</b></div>
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

// Finance: the overview, invoices (create, sign, send, payments) and the float ledger.
export default function FinanceHub({ v }) {
  const F = v.FH, R = v.REP;
  const HEAD = { overview: ['Finance', 'Money in and out, who owes us and what needs attention.'], invoices: ['Invoices', 'Create, sign, send and record payments.'], cash: ['Cash book', 'Every shilling in and out, with a running balance.'], reports: ['Reports', 'Income and spending by period, category, client and project.'], float: ['Float', 'The money from Management: what was paid from it, what is left, and the daily report.'] }[F.tab];
  const openInv = F.invoices.filter(i => i.st !== 'paid' && !i.cancelled).slice(0, 6);
  // Cancelled invoices have their own filter; in "All" they come last, greyed.
  const list = F.invoices.filter(i => (F.filter === 'open' ? i.st !== 'paid' && !i.cancelled : F.filter === 'paid' ? i.st === 'paid' : F.filter === 'sign' ? i.needsSign : F.filter === 'cancelled' ? i.cancelled : true))
    .sort((a, b) => (a.cancelled ? 1 : 0) - (b.cancelled ? 1 : 0));
  return (
    <>
      <PageHead kicker="Finance" title={F.showTabs ? 'Finance & Invoices' : HEAD[0]} sub={F.showTabs ? 'Money in and out, invoices, the cash book, reports and the float.' : HEAD[1]}>
        {F.canInvoice && (F.tab === 'overview' || F.tab === 'invoices') ? <Btn kind="dark" onClick={F.newInvoice}>New invoice</Btn> : null}
      </PageHead>
      {F.showTabs ? <div className="rc-smart fh-tabs" role="tablist">{[['overview', 'Overview'], ['invoices', 'Invoices'], ...(R ? [['cash', 'Cash book'], ['reports', 'Reports']] : []), ...(v.FL ? [['float', 'Float']] : [])].map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={F.tab === k} className={F.tab === k ? 'is-on' : ''} onClick={() => F.setTab(k)}><span>{l}</span></button>)}</div> : null}

      {v.floatNudge && F.tab !== 'float' ? <button type="button" className="fl-nudge" onClick={v.floatNudge.go}><b>{v.floatNudge.t}</b><small>{v.floatNudge.s}</small></button> : null}
      {F.tab === 'overview' ? (
        <>
          <Kpis items={F.kpis} />
          {v.PT ? <Obligations P={v.PT} /> : null}
          {R ? <><Periods R={R} /><CashChart R={R} /></> : null}
          <section className="fh-card">
            <h3>Needs attention</h3>
            {F.attention.length ? <ul className="fh-att">{F.attention.map((a, i) => <li key={i}><span><b>{a.t}</b><small>{a.s}</small></span><Btn kind="ghost" onClick={a.on}>{a.act}</Btn></li>)}</ul> : <Empty>All clear.</Empty>}
          </section>
          <section className="fh-card">
            <h3>Open invoices</h3>
            {openInv.length ? <ul className="fh-invs">{openInv.map(i => <InvoiceRow key={i.id} i={i} />)}</ul> : <Empty>No open invoices.</Empty>}
          </section>
        </>
      ) : null}

      {F.tab === 'cash' && R ? <CashBook R={R} canAdd={F.moneyTop} /> : null}
      {F.tab === 'reports' && R ? <Reports R={R} /> : null}
      {F.tab === 'invoices' ? (
        <section className="fh-card">
          <div className="k-chips fh-filter">{[['open', 'Open'], ['sign', 'To sign'], ['paid', 'Paid'], ['cancelled', 'Cancelled'], ['all', 'All']].map(([k, l]) => <button key={k} type="button" className={F.filter === k ? 'is-on' : ''} onClick={() => F.setFilter(k)}>{l}</button>)}</div>
          {list.length ? <ul className="fh-invs">{list.map(i => <InvoiceRow key={i.id} i={i} />)}</ul> : <Empty>No invoices here.</Empty>}
        </section>
      ) : null}

      {F.tab === 'float' && v.FL ? <FloatPage v={v} /> : null}
      {F.editing ? <Editor key={F.editing} F={F} /> : null}
    </>
  );
}
