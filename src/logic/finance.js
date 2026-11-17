// Finance: the float ledger and invoices.
// Float: Management gives Finance a total. Finance allocates it to projects and office purposes,
// and staff request money against those allocations (the system records; it moves no money).
// Invoices: lines × rate × days × events, admin cost, VAT; signed by the Executive Director or the
// GM, who must approve before the signature and stamp appear; payments (partial allowed) count
// once Finance records them and Management confirms.
// Mixed into TrinityApp, so `this` is the app.
import { dayKey } from './seed';

export const COMPANY = {
  name: 'TRINITY MARK SOLUTIONS LIMITED', tin: '166-830-389', vrn: '40-316653-M', box: 'P.O. Box 15617, Dar es Salaam, Tanzania',
  bank: 'CRDB Bank', acc: '0150000YPBS00', accName: 'TRINITY MARK SOLUTIONS LIMITED',
  line: 'Experiential Marketing | Events Management | Media Investment Management | PR'
};
export const SIGNERS = { ED: { role: 'ceo', t: 'Executive Director' }, GM: { role: 'gm', t: 'General Manager' } };

// Totals of an invoice in TZS. Invoices saved before lines existed carry only a total (in TZS M).
export function invTotals(i) {
  if (!i.lines || !i.lines.length) { const t = Math.round((i.v || 0) * 1e6); return { direct: 0, admin: 0, net: Math.round(t / 1.18), vat: t - Math.round(t / 1.18), total: t, legacy: true }; }
  const direct = i.lines.reduce((a, l) => a + (+l.n || 0) * (+l.rate || 0) * (+l.days || 1) * (+l.events || 1), 0);
  const admin = Math.round(direct * (i.admin == null ? 15 : +i.admin) / 100), net = direct + admin, vat = Math.round(net * (i.vat == null ? 18 : +i.vat) / 100);
  return { direct, admin, net, vat, total: net + vat };
}
const paidOf = i => (i.payments || []).filter(p => p.ok).reduce((a, p) => a + p.amt, 0);

export const financeMethods = {
  isMoneyTop() { return ['ceo', 'finance'].includes(this.state.role || 'ceo'); },
  canInvoice() { return ['ceo', 'gm', 'finance'].includes(this.state.role || 'ceo'); },
  fl() { return Object.assign({ grants: [], allocs: [], asks: [] }, this.state.float || {}); },
  setFloat(ch) { this.setState(x => ({ float: Object.assign({ grants: [], allocs: [], asks: [] }, x.float || {}, ch) })); },

  // Management gives Finance a float (or answers Finance's request for one).
  giveFloat(amt, note) {
    amt = Math.round(+amt || 0); if (amt <= 0) return 'Enter the amount';
    const f = this.fl();
    this.setFloat({ grants: [{ id: 'FG' + Date.now().toString(36), amt, note: (note || '').trim(), by: this.me().k, at: dayKey(0) }, ...f.grants], asks: f.asks.map(a => (a.st === 'open' ? Object.assign({}, a, { st: 'given' }) : a)) });
    const fk = this.ROLES.finance.k; if (fk !== this.me().k) this.remind(fk, 'Float received · ' + this.fmtT(amt), 'finance', 'wallet', 'From ' + this.me().n + (note ? ' · ' + note : ''));
    this.toast('Float given · ' + this.fmtT(amt));
    return '';
  },
  askFloat(amt, note) {
    amt = Math.round(+amt || 0); if (amt <= 0) return 'Enter the amount';
    const f = this.fl();
    this.setFloat({ asks: [{ id: 'FA' + Date.now().toString(36), amt, note: (note || '').trim(), by: this.me().k, at: dayKey(0), st: 'open' }, ...f.asks] });
    this.remind(this.ROLES.ceo.k, 'Finance asks for float · ' + this.fmtT(amt), 'finance', 'wallet', note || 'From ' + this.me().n);
    this.toast('Float request sent to Management');
    return '';
  },
  // Finance sets aside part of the float for a project or an office purpose.
  allocate(to, amt) {
    amt = Math.round(+amt || 0); if (amt <= 0) return 'Enter the amount';
    if (!to) return 'Choose a project or an office purpose';
    const left = this.floatLeft(); if (amt > left) return 'Only ' + this.fmtT(left) + ' of the float is not yet allocated';
    const f = this.fl(), ex = f.allocs.find(a => a.to === to);
    const allocs = ex ? f.allocs.map(a => (a.to === to ? Object.assign({}, a, { amt: a.amt + amt }) : a)) : [{ id: 'FL' + Date.now().toString(36), to, amt, at: dayKey(0), by: this.me().k }, ...f.allocs];
    this.setFloat({ allocs });
    this.toast(this.fmtT(amt) + ' allocated · ' + this.allocName(to));
    return '';
  },
  allocName(to) { return to.indexOf('PRJ') === 0 ? this.proj(to).client + ' · ' + this.proj(to).name : to.replace(/^office:/, 'Office · '); },
  floatTotal() { return this.fl().grants.reduce((a, g) => a + g.amt, 0); },
  floatLeft() { return this.floatTotal() - this.fl().allocs.reduce((a, b) => a + b.amt, 0); },
  // Money requested against an allocation: project requests for that project, office requests for office purposes.
  allocUse(a) {
    const reqs = (this.state.reqs || []).filter(r => (a.to.indexOf('PRJ') === 0 ? r.p === a.to : r.alloc === a.to));
    const used = reqs.filter(r => r.st === 'paid').reduce((x, r) => x + r.amt, 0), waiting = reqs.filter(r => r.st === 'pending' || r.st === 'approved').reduce((x, r) => x + r.amt, 0);
    return { used, waiting, left: a.amt - used - waiting };
  },

  // ---- Invoices
  saveInvoice(d) {
    if (!d.c) return 'Choose the client';
    if (!d.lines || !d.lines.some(l => l.item && +l.rate > 0)) return 'Add at least one item with a rate';
    const lines = d.lines.filter(l => l.item && +l.rate > 0).map(l => ({ item: l.item.trim(), n: +l.n || 1, rate: Math.round(+l.rate), days: +l.days || 1, events: +l.events || 1 }));
    const cust = (this.state.customers || []).find(c => c.n === d.c) || {};
    const base = { c: d.c, tin: d.tin || cust.tin || '', vrn: d.vrn || '', p: d.p || '', title: (d.title || '').trim(), po: d.po || '', poDate: d.poDate || '', vendor: d.vendor || '', lines, admin: d.admin == null ? 15 : +d.admin, vat: 18, signer: d.signer || 'ED', due: d.due || '30 days', by: this.me().k };
    base.v = invTotals(base).total / 1e6;
    if (d.id) {
      this.setState(x => ({ invoices: x.invoices.map(i => (i.id === d.id ? Object.assign({}, i, base, { signed: null, st: 'draft' }) : i)) }));
      this.toast(d.id + ' saved'); return '';
    }
    const id = this.nextId('INV', this.state.invoices);
    this.setState(x => ({ invoices: [Object.assign({ id, st: 'draft', at: dayKey(0), payments: [] }, base), ...x.invoices], invSel: id }));
    const sk = this.ROLES[SIGNERS[base.signer].role].k;
    if (sk !== this.me().k) this.remind(sk, 'Invoice to sign · ' + id, 'finance', 'fileText', d.c + ' · ' + this.fmtT(invTotals(base).total));
    this.toast('Invoice ' + id + ' created · waiting for ' + SIGNERS[base.signer].t + ' to sign');
    this.log('fileText', 'blue', 'Invoice created · ' + d.c, id);
    return '';
  },
  canSign(i) { const r = this.state.role || 'ceo'; return !i.signed && SIGNERS[i.signer || 'ED'].role === r; },
  signInvoice(id) {
    const i = this.state.invoices.find(x => x.id === id); if (!i || !this.canSign(i)) return;
    this.setState(x => ({ invoices: x.invoices.map(y => (y.id === id ? Object.assign({}, y, { signed: { by: this.me().k, name: this.me().n, at: dayKey(0) } }) : y)) }));
    this.toast(id + ' signed and stamped');
    if (i.by && i.by !== this.me().k) this.remind(i.by, 'Invoice signed · ' + id, 'finance', 'fileText', 'Ready to send to ' + i.c);
  },
  sendInvoice(id) {
    const i = this.state.invoices.find(x => x.id === id); if (!i) return;
    if (i.lines && !i.signed) { this.toast('The invoice must be signed first'); return; }
    this.setState(x => ({ invoices: x.invoices.map(y => (y.id === id ? Object.assign({}, y, { st: 'sent', sentAt: dayKey(0) }) : y)) }));
    this.toast(id + ' marked as sent to ' + i.c);
  },
  // Finance records a payment; Management confirms it. Only confirmed payments count.
  recordPayment(id, amt, ref) {
    amt = Math.round(+amt || 0); if (amt <= 0) return 'Enter the amount received';
    const i = this.state.invoices.find(x => x.id === id); if (!i) return 'Invoice not found';
    const due = invTotals(i).total - paidOf(i); if (amt > due) return 'Only ' + this.fmtT(due) + ' is still due';
    const p = { id: 'PY' + Date.now().toString(36), amt, ref: (ref || '').trim(), at: dayKey(0), rec: this.me().k, ok: null };
    if (this.state.role === 'ceo') p.ok = this.me().k; // Management recording also confirms; Finance still sees it
    this.setState(x => ({ invoices: x.invoices.map(y => (y.id === id ? this.withPayState(Object.assign({}, y, { payments: [...(y.payments || []), p] })) : y)) }));
    const other = this.state.role === 'ceo' ? this.ROLES.finance.k : this.ROLES.ceo.k;
    this.remind(other, (p.ok ? 'Payment recorded · ' : 'Confirm payment · ') + id, 'finance', 'wallet', i.c + ' · ' + this.fmtT(amt));
    this.toast(p.ok ? 'Payment recorded and confirmed' : 'Payment recorded · waiting for Management to confirm');
    return '';
  },
  confirmPayment(id, pid) {
    if ((this.state.role || 'ceo') !== 'ceo') return;
    this.setState(x => ({ invoices: x.invoices.map(y => (y.id === id ? this.withPayState(Object.assign({}, y, { payments: (y.payments || []).map(p => (p.id === pid ? Object.assign({}, p, { ok: this.me().k }) : p)) })) : y)) }));
    this.toast('Payment confirmed');
  },
  withPayState(i) {
    const paid = paidOf(i), total = invTotals(i).total;
    if (paid >= total && total > 0) return Object.assign(i, { st: 'paid', due: 'Paid ' + dayKey(0) });
    if (paid > 0) return Object.assign(i, { st: 'partial' });
    return i;
  },

  // A printable invoice: modern layout, the CRDB invoice's content, stamp and signature only once signed.
  printInvoice(id) {
    const i = this.state.invoices.find(x => x.id === id); if (!i) return;
    const T = invTotals(i), n = v => Math.round(v).toLocaleString('en-US'), P = this.proj(i.p), S = SIGNERS[i.signer || 'ED'];
    const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const origin = location.origin;
    const rows = (i.lines && i.lines.length ? i.lines : [{ item: P.name || 'Services as agreed', n: 1, rate: T.net, days: 1, events: 1 }])
      .map((l, k) => `<tr><td>${k + 1}</td><td>${esc(l.item)}</td><td class=r>${l.n}</td><td class=r>${n(l.rate)}</td><td class=r>${l.days}</td><td class=r>${l.events}</td><td class=r>${n(l.n * l.rate * l.days * l.events)}</td></tr>`).join('');
    const paid = paidOf(i);
    const html = `<!doctype html><html><head><meta charset=utf-8><title>${esc(i.id)} · ${esc(i.c)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Caveat:wght@600&display=swap" rel=stylesheet>
<style>
*{box-sizing:border-box}body{margin:0;font:13px/1.5 Inter,Arial,sans-serif;color:#17152A;background:#EEEAF4}
.page{width:210mm;min-height:297mm;margin:16px auto;background:#fff;padding:18mm 16mm 14mm;position:relative;display:flex;flex-direction:column}
.top{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}.top img{height:54px}
.inv{text-align:right}.inv h1{margin:0;font-size:30px;letter-spacing:.18em;color:#2B1459}.inv b{color:#8A7239}
.band{height:5px;background:linear-gradient(90deg,#2B1459,#6D3CC2 60%,#B49A5A);border-radius:3px;margin:14px 0 20px}
.grid{display:grid;grid-template-columns:1.2fr 1fr;gap:18px}.box{background:#F7F5FB;border-radius:10px;padding:12px 14px}
.lbl{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#8A7239;font-weight:700;margin-bottom:4px}
.kv{display:grid;grid-template-columns:auto 1fr;gap:2px 12px}.kv span{color:#6E6A7C}
.title{margin:18px 0 8px;font-size:16px;font-weight:700}
table{width:100%;border-collapse:collapse;margin-top:6px}th{background:#2B1459;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:.06em;padding:9px 8px;text-align:left}
th:first-child{border-radius:8px 0 0 8px}th:last-child{border-radius:0 8px 8px 0}td{padding:9px 8px;border-bottom:1px solid #EEEAF4}.r{text-align:right}
.tot{margin-left:auto;width:300px;margin-top:12px}.tot div{display:flex;justify-content:space-between;padding:5px 0}.tot .g{border-top:2px solid #2B1459;margin-top:4px;padding-top:9px;font-size:16px;font-weight:800;color:#2B1459}
.sign{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:28px;align-items:end}.sig{border-top:1px solid #CFC8DD;padding-top:6px;font-size:11.5px;color:#6E6A7C;min-height:96px;position:relative;display:flex;flex-direction:column;justify-content:flex-end}
.hand{font:600 30px Caveat,cursive;color:#1B2A7A;line-height:1;margin-bottom:4px}.stamp{position:absolute;right:-6px;bottom:18px;width:118px;opacity:.88;transform:rotate(-8deg)}
.draft{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;font-size:88px;font-weight:800;color:rgba(178,58,70,.09);transform:rotate(-24deg);letter-spacing:.1em}
.foot{margin-top:auto;padding-top:18px;display:flex;justify-content:space-between;gap:14px;border-top:1px solid #EEEAF4;font-size:11px;color:#6E6A7C}
.bar{position:fixed;top:12px;right:12px}.bar button{font:600 13px Inter;padding:9px 16px;border:none;border-radius:9px;background:#2B1459;color:#fff;cursor:pointer}
@media print{body{background:#fff}.page{margin:0;width:auto;min-height:auto}.bar{display:none}}
</style></head><body><div class=bar><button onclick="print()">Print / Save PDF</button></div><div class=page>
${i.signed ? '' : '<div class=draft>DRAFT</div>'}
<div class=top><img src="${origin}/brand/trinity-logo-full.png" alt="Trinity Mark"><div class=inv><h1>INVOICE</h1><div><b>${esc(i.id)}</b></div><div>Date: ${esc(i.at || dayKey(0))}</div></div></div>
<div class=band></div>
<div class=grid><div class=box><div class=lbl>Bill to</div><b style="font-size:15px">${esc(i.c)}</b><div class=kv style="margin-top:4px">${i.tin ? `<span>TIN</span><b>${esc(i.tin)}</b>` : ''}${i.vrn ? `<span>VRN</span><b>${esc(i.vrn)}</b>` : ''}</div></div>
<div class=box><div class=lbl>From</div><b>${COMPANY.name}</b><div class=kv style="margin-top:4px"><span>TIN</span><b>${COMPANY.tin}</b><span>VRN</span><b>${COMPANY.vrn}</b>${i.po ? `<span>PO No</span><b>${esc(i.po)}</b>` : ''}${i.poDate ? `<span>PO Date</span><b>${esc(i.poDate)}</b>` : ''}${i.vendor ? `<span>Vendor No</span><b>${esc(i.vendor)}</b>` : ''}</div></div></div>
<div class=title>${esc(i.title || P.name || '')}</div>
<table><thead><tr><th>No</th><th>Item</th><th class=r>Number</th><th class=r>Rate (TZS)</th><th class=r>Days</th><th class=r>Events</th><th class=r>Total (TZS)</th></tr></thead><tbody>${rows}</tbody></table>
<div class=tot>${T.legacy ? '' : `<div><span>Total direct costs</span><b>${n(T.direct)}</b></div><div><span>Administrative cost ${i.admin == null ? 15 : i.admin}%</span><b>${n(T.admin)}</b></div>`}
<div><span>Total VAT exclusive</span><b>${n(T.net)}</b></div><div><span>VAT 18%</span><b>${n(T.vat)}</b></div><div class=g><span>Total VAT inclusive</span><span>TZS ${n(T.total)}</span></div>
${paid ? `<div><span>Paid</span><b>${n(paid)}</b></div><div><span>Balance due</span><b>${n(T.total - paid)}</b></div>` : ''}</div>
<div class=box style="margin-top:18px"><div class=lbl>Payment details</div><div class=kv><span>Bank</span><b>${COMPANY.bank}</b><span>Account name</span><b>${COMPANY.accName}</b><span>Account no</span><b>${COMPANY.acc}</b></div></div>
<div class=sign>
<div class=sig><span>Prepared by</span><b style="color:#17152A">${esc(this.av(i.by || this.ROLES.finance.k).n)}</b><span>Accountant</span></div>
<div class=sig>${i.signed ? `<div class=hand>${esc(i.signed.name)}</div><img class=stamp src="${origin}/brand/company-stamp.png" alt="">` : '<i style="color:#B23A46">Awaiting signature</i>'}<span>Approved by</span><b style="color:#17152A">${i.signed ? esc(i.signed.name) : ''}</b><span>${S.t}${i.signed ? ' · ' + esc(i.signed.at) : ''}</span></div>
<div class=sig><span>Client approval</span><span style="margin-top:28px">Name, sign &amp; date</span></div></div>
<div class=foot><span>${COMPANY.box}</span><span>${COMPANY.line}</span></div>
</div></body></html>`;
    const w = window.open('', '_blank'); if (!w) { this.toast('Allow pop-ups to open the invoice'); return; }
    w.document.open(); w.document.write(html); w.document.close();
  }
};

// Values for the Finance hub.
export function financeVals(s) {
  const role = s.role || 'ceo', moneyTop = ['ceo', 'finance'].includes(role);
  const inv = (s.invoices || []).map(i => {
    const T = invTotals(i), paid = paidOf(i), wait = (i.payments || []).filter(p => !p.ok);
    return { id: i.id, c: i.c, proj: this.proj(i.p).name || '', st: i.st, total: T.total, totalT: this.fmtT(T.total), paid, paidT: this.fmtT(paid), due: T.total - paid, dueT: this.fmtT(T.total - paid), dueOn: i.due, at: i.at || '',
      pct: T.total ? Math.round(paid / T.total * 100) : 0, signer: SIGNERS[i.signer || 'ED'].t, signed: !!i.signed || !i.lines, needsSign: !!i.lines && !i.signed,
      canSign: !!i.lines && this.canSign(i), sign: () => this.signInvoice(i.id), send: () => this.sendInvoice(i.id), print: () => this.printInvoice(i.id),
      canPay: moneyTop && i.st !== 'paid' && i.st !== 'draft', pay: (a, r) => this.recordPayment(i.id, a, r),
      payments: (i.payments || []).map(p => ({ id: p.id, amt: this.fmtT(p.amt), at: p.at, ref: p.ref, rec: this.av(p.rec).n, ok: !!p.ok, okBy: p.ok ? this.av(p.ok).n : '', canOk: !p.ok && role === 'ceo', confirm: () => this.confirmPayment(i.id, p.id) })),
      waitOk: wait.length, edit: () => this.setState({ invEdit: i.id }), open: () => this.setState({ invSel: s.invSel === i.id ? null : i.id }), sel: s.invSel === i.id };
  });
  const unpaid = inv.filter(i => i.st !== 'paid' && i.st !== 'draft');
  const month = dayKey(0).slice(0, 7);
  const collected = (s.invoices || []).reduce((a, i) => a + (i.payments || []).filter(p => p.ok && (p.at || '').slice(0, 7) === month).reduce((x, p) => x + p.amt, 0), 0);
  const F = {
    tab: s.finTab || 'overview', setTab: k => this.setState({ finTab: k, invSel: null }), moneyTop, isCeo: role === 'ceo', isFin: role === 'finance',
    kpis: [
      { l: 'Owed by clients', v: this.fmtT(unpaid.reduce((a, b) => a + b.due, 0)), n: unpaid.length + ' invoices open', tone: 'dark' },
      { l: 'Overdue', v: this.fmtT(inv.filter(i => i.st === 'overdue').reduce((a, b) => a + b.due, 0)), n: inv.filter(i => i.st === 'overdue').length + ' invoices', tone: 'red' },
      { l: 'Collected this month', v: this.fmtT(collected), n: 'confirmed payments', tone: 'green' },
      ...(moneyTop ? [{ l: 'Float not allocated', v: this.fmtT(this.floatLeft()), n: 'of ' + this.fmtT(this.floatTotal()) + ' given', tone: 'gold' }] : [{ l: 'Waiting for signature', v: String(inv.filter(i => i.needsSign).length), n: 'invoices', tone: 'gold' }])
    ],
    attention: [
      ...inv.filter(i => i.canSign).map(i => ({ t: 'Sign ' + i.id + ' · ' + i.c, s: i.totalT, act: 'Sign', on: i.sign })),
      ...(role === 'ceo' ? inv.filter(i => i.payments.some(p => p.canOk)).map(i => ({ t: 'Confirm payment · ' + i.id, s: i.c + ' · ' + i.payments.filter(p => p.canOk).map(p => p.amt).join(', '), act: 'Review', on: () => this.setState({ finTab: 'invoices', invSel: i.id }) })) : []),
      ...inv.filter(i => i.st === 'overdue').map(i => ({ t: i.c + ' · ' + i.id + ' overdue', s: i.dueT + ' · ' + i.dueOn, act: 'Open', on: () => this.setState({ finTab: 'invoices', invSel: i.id }) })),
      ...(role === 'ceo' ? this.fl().asks.filter(a => a.st === 'open').map(a => ({ t: 'Finance asks for float · ' + this.fmtT(a.amt), s: a.note || '', act: 'Give', on: () => this.setState({ finTab: 'float' }) })) : [])
    ].slice(0, 8),
    invoices: inv, filter: s.invFilter || 'open', setFilter: k => this.setState({ invFilter: k }),
    canInvoice: this.canInvoice(), newInvoice: () => this.setState({ invEdit: 'new' }),
    editing: s.invEdit || null, closeEdit: () => this.setState({ invEdit: null }),
    draft: s.invEdit && s.invEdit !== 'new' ? (s.invoices.find(i => i.id === s.invEdit) || null) : null,
    save: d => { const e = this.saveInvoice(d); if (!e) this.setState({ invEdit: null, finTab: 'invoices' }); return e; },
    customers: (s.customers || []).map(c => ({ v: c.n, l: c.n, tin: c.tin || '' })),
    projects: s.projects.filter(p => p.st !== 'done').map(p => ({ v: p.id, l: p.client + ' · ' + p.name, c: p.client })),
    totals: invTotals
  };
  if (moneyTop) {
    const f = this.fl();
    F.float = {
      total: this.fmtT(this.floatTotal()), left: this.fmtT(this.floatLeft()), leftN: this.floatLeft(), allocated: this.fmtT(this.floatTotal() - this.floatLeft()),
      pct: this.floatTotal() ? Math.round((this.floatTotal() - this.floatLeft()) / this.floatTotal() * 100) : 0,
      grants: f.grants.map(g => ({ id: g.id, amt: this.fmtT(g.amt), at: g.at, note: g.note, by: this.av(g.by).n })),
      asks: f.asks.filter(a => a.st === 'open').map(a => ({ id: a.id, amt: this.fmtT(a.amt), raw: a.amt, note: a.note, at: a.at })),
      allocs: f.allocs.map(a => { const u = this.allocUse(a); return { id: a.id, name: this.allocName(a.to), office: a.to.indexOf('office:') === 0, amt: this.fmtT(a.amt), used: this.fmtT(u.used), waiting: this.fmtT(u.waiting), left: this.fmtT(u.left), over: u.left < 0, pct: a.amt ? Math.min(100, Math.round((u.used + u.waiting) / a.amt * 100)) : 0 }; }),
      give: (a, n) => this.giveFloat(a, n), ask: (a, n) => this.askFloat(a, n), allocate: (to, a) => this.allocate(to, a),
      targets: [...s.projects.filter(p => p.st !== 'done').map(p => ({ v: p.id, l: p.client, s: p.name })), ...['Office running', 'Transport', 'Utilities', 'Staff welfare'].map(o => ({ v: 'office:' + o, l: o, s: 'Office' }))]
    };
  }
  return { FH: F };
}
