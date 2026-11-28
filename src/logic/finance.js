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
// Dar es Salaam time (EAT, UTC+3 all year, no daylight saving): the float's days and times use it,
// whatever the phone's own clock zone is.
const EAT = 3 * 36e5;
export const tzDay = (d = new Date()) => new Date(d.getTime() + EAT).toISOString().slice(0, 10);
export const tzTime = (d = new Date()) => new Date(d.getTime() + EAT).toISOString().slice(11, 16);
export const tzHour = (d = new Date()) => new Date(d.getTime() + EAT).getUTCHours();
// The branded one-A4 look shared by the invoice and the daily float report: logo, band, boxes, tables,
// footer, and a script that scales the content down when it is taller than one page.
export const DOC_CSS = `*{box-sizing:border-box}body{margin:0;font:13px/1.5 Inter,Arial,sans-serif;color:#17152A;background:#EEEAF4}
.page{width:210mm;height:297mm;margin:16px auto;background:#fff;padding:12mm 13mm 18mm;position:relative;overflow:hidden}
.fit{transform-origin:top left}
.top{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}.top img{height:54px}
.band{height:5px;background:linear-gradient(90deg,#2B1459,#6D3CC2 60%,#B49A5A);border-radius:3px;margin:14px 0 20px}
.grid{display:grid;grid-template-columns:1.2fr 1fr;gap:18px}.box{background:#F7F5FB;border-radius:10px;padding:12px 14px}
.lbl{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#8A7239;font-weight:700;margin-bottom:4px}
.kv{display:grid;grid-template-columns:auto 1fr;gap:2px 12px}.kv span{color:#6E6A7C}
table{width:100%;border-collapse:collapse;margin-top:6px}th{background:#2B1459;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:.06em;padding:9px 8px;text-align:left}
th:first-child{border-radius:8px 0 0 8px}th:last-child{border-radius:0 8px 8px 0}td{padding:9px 8px;border-bottom:1px solid #EEEAF4}.r{text-align:right}
.foot{position:absolute;left:13mm;right:13mm;bottom:7mm;padding-top:8px;display:flex;justify-content:space-between;gap:14px;border-top:1px solid #EEEAF4;font-size:10.5px;color:#6E6A7C}
.bar{position:fixed;top:12px;right:12px}.bar button{font:600 13px Inter;padding:9px 16px;border:none;border-radius:9px;background:#2B1459;color:#fff;cursor:pointer}
@page{size:A4;margin:0}
@media print{html,body{background:#fff;width:210mm;height:297mm}.page{margin:0;box-shadow:none;page-break-after:avoid;break-after:avoid}.bar{display:none}}`;
// Reports (daily float report, money report): normal reading size on A4, running onto more pages when
// needed — no shrinking to one page. Table headings repeat on each page; rows never split.
export const REPORT_CSS = `body{font-size:13px;line-height:1.45;font-variant-numeric:tabular-nums}
.page{height:auto;min-height:297mm;overflow:visible;padding:15mm 15mm 16mm}
.foot{position:static;margin-top:22px}
.band{margin:12px 0 16px!important}
table{font-size:11.5px!important;border-collapse:separate!important;border-spacing:0;margin-top:6px!important}
th{font-size:10px!important;padding:7px 9px!important;letter-spacing:.06em}
td{padding:6px 9px!important;border-bottom:1px solid #EFEBF5!important}
tbody tr:nth-child(even) td{background:#FAF9FC}
thead{display:table-header-group}tr{break-inside:avoid;page-break-inside:avoid}
tfoot td{font-weight:800;border-top:1.5px solid #2B1459!important;background:#fff!important}
h2{display:flex!important;align-items:center!important;gap:8px!important;font-size:12.5px!important;letter-spacing:.08em!important;text-transform:uppercase;color:#2B1459;margin:20px 0 6px!important;break-after:avoid;page-break-after:avoid}
h2 span{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#2B1459;color:#fff;font-size:10.5px;letter-spacing:0}
h2 em{margin-left:auto;font-style:normal;font-weight:600;color:#6E6A7C;letter-spacing:0;text-transform:none;font-size:11.5px}
.box{padding:14px 16px!important}.sum .box div.l{font-size:13px;padding:4px 0!important}.kp{gap:12px!important;margin:0 0 6px!important}.kp div{padding:11px 13px!important}.kp b{font-size:17px!important}.lbl{font-size:10.5px}
.sign{break-inside:avoid;page-break-inside:avoid;margin-top:26px!important}
@page{size:A4;margin:12mm 0}
@media print{html,body{height:auto}.page{width:210mm;min-height:0;padding:0 15mm;margin:0}}`;
// Reference numbers and dates never break at their hyphens in reports (REQ-0414, PCV-261128-01, 2026-11-28).
export const keepCodes = html => html.replace(/\b(REQ|PCV|INV|PRJ|DFR|MR)-[\dA-Z-]+|\b\d{4}-\d{2}-\d{2}\b/g, m => m.replace(/-/g, '\u2011'));
export const FIT_JS = `// One A4 page, always: when the content is taller than the page (many items), it is scaled down to fit.
function fit(){var p=document.querySelector('.page'),f=document.querySelector('.fit');if(!p||!f)return;f.style.transform='';f.style.width='';
var cs=getComputedStyle(p),avail=p.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom),h=f.scrollHeight;
if(h>avail){var z=Math.max(.4,avail/h);f.style.width=(100/z).toFixed(2)+'%';h=f.scrollHeight;z=Math.max(.4,avail/h);f.style.width=(100/z).toFixed(2)+'%';f.style.transform='scale('+z.toFixed(4)+')';f.dataset.scale=z.toFixed(3);}}
fit();addEventListener('load',fit);addEventListener('beforeprint',fit);if(document.fonts)document.fonts.ready.then(fit);
`;
export const SIGNERS = { ED: { role: 'ceo', t: 'Executive Director' }, GM: { role: 'gm', t: 'General Manager' } };

// Totals of an invoice in TZS. Invoices saved before lines existed carry only a total (in TZS M).
export function invTotals(i) {
  if (!i.lines || !i.lines.length) { const t = Math.round((i.v || 0) * 1e6); return { direct: 0, admin: 0, net: Math.round(t / 1.18), vat: t - Math.round(t / 1.18), total: t, legacy: true }; }
  const direct = i.lines.reduce((a, l) => a + (+l.n || 0) * (+l.rate || 0) * (+l.days || 1) * (+l.events || 1), 0);
  const admin = Math.round(direct * (i.admin == null ? 15 : +i.admin) / 100), net = direct + admin, vat = Math.round(net * (i.vat == null ? 18 : +i.vat) / 100);
  return { direct, admin, net, vat, total: net + vat };
}
const paidOf = i => (i.payments || []).filter(p => p.ok).reduce((a, p) => a + p.amt, 0);
// A cancelled invoice keeps its number (it is not reused) but no longer counts anywhere:
// not owed, not overdue, not in reports or the company goal; it cannot be signed, sent, edited or paid.
export const isCancelled = i => !!i && i.st === 'cancelled';
const ST_NAME = { draft: 'Draft', sent: 'Sent', partial: 'Part paid', overdue: 'Overdue', paid: 'Paid' };

export const financeMethods = {
  isMoneyTop() { return ['ceo', 'finance'].includes(this.state.role || 'ceo'); },
  canInvoice() { return ['ceo', 'gm', 'finance'].includes(this.state.role || 'ceo'); },
  fl() { return Object.assign({ grants: [], allocs: [], asks: [] }, this.state.float || {}); },
  setFloat(ch) { this.setState(x => ({ float: Object.assign({ grants: [], allocs: [], asks: [] }, x.float || {}, ch) })); },

  // Management gives Finance a float (or answers Finance's request for one). It is the float's "Float
  // received": Finance never records it again (see receiveFloat).
  giveFloat(amt, note, opts) { return this.receiveFloat(Object.assign({ amt, note }, opts || {})); },
  // Who a grant came from: the boss by name; grants Finance recorded itself (before this rule) say so.
  grantFrom(g) { const ceo = this.ROLES.ceo && this.ROLES.ceo.k; return g.by && ceo && g.by !== ceo ? 'Recorded by Finance' : g.by ? this.av(g.by).n : g.from || 'Management'; },
  // Finance asks the boss for float: Management is told in the app and on WhatsApp, with the balance now,
  // the amount asked and the balance it would make. Management approves (it becomes "Float received") or declines.
  askFloat(amt, note) {
    amt = Math.round(+amt || 0); if (amt <= 0) return 'Enter the amount';
    if (String(note || '').trim().length < 10) return 'Describe what the float is for (at least a short sentence)';
    const f = this.fl(), bal = this.floatBalance ? this.floatBalance() : 0, boss = this.ROLES.ceo.k;
    const ask = { id: 'FA' + Date.now().toString(36), amt, note: (note || '').trim(), by: this.me().k, at: dayKey(0), time: this.now(), st: 'open', balBefore: bal };
    this.setFloat({ asks: [ask, ...f.asks] });
    const line = 'Balance now ' + this.fmtT(bal) + ' · asked ' + this.fmtT(amt) + ' · new balance ' + this.fmtT(bal + amt);
    this.notify({ to: boss, ic: 'wallet', t: 'Float request · ' + this.fmtT(amt) + ' from ' + this.me().n, s: line + ' · ' + ask.note, go: 'float' });
    if (this.waOpen) this.waOpen(boss, 'Float request from ' + this.me().n + ' (Finance)\n' +
      'Balance now: ' + this.fmtT(bal) + '\nAmount requested: ' + this.fmtT(amt) + '\nNew balance after approval: ' + this.fmtT(bal + amt) +
      '\nFor: ' + ask.note + '\nPlease approve in Trinity Mark 360.');
    this.toast('Float request sent to the boss · ' + this.fmtT(amt));
    return '';
  },
  // Management approves a float request: it is given straight away (Float received), Finance is told.
  approveFloatAsk(id, amt) {
    if ((this.state.role || 'ceo') !== 'ceo') return 'Only Management approves float';
    const a = this.fl().asks.find(x => x.id === id && x.st === 'open'); if (!a) return 'This request is no longer open';
    const give = Math.round(+String(amt == null ? a.amt : amt).replace(/[^0-9]/g, '') || 0); if (give <= 0) return 'Enter the amount to give';
    const m = this.receiveFloat({ amt: give, note: 'Float request approved' + (give !== a.amt ? ' (asked ' + this.fmtT(a.amt) + ')' : '') + ' · ' + a.note });
    if (m) return m;
    this.setFloat({ asks: this.fl().asks.map(x => (x.id === id ? Object.assign({}, x, { st: 'given', gave: give, okBy: this.me().k, okAt: dayKey(0) }) : x)) });
    return '';
  },
  declineFloatAsk(id, reason) {
    if ((this.state.role || 'ceo') !== 'ceo') return 'Only Management declines float';
    const a = this.fl().asks.find(x => x.id === id && x.st === 'open'); if (!a) return 'This request is no longer open';
    const why = String(reason || '').trim(); if (!why) return 'Give the reason';
    this.setFloat({ asks: this.fl().asks.map(x => (x.id === id ? Object.assign({}, x, { st: 'declined', why, okBy: this.me().k, okAt: dayKey(0) }) : x)) });
    if (a.by && a.by !== this.me().k) this.notify({ to: a.by, ic: 'x', t: 'Float request declined · ' + this.fmtT(a.amt), s: why + ' · ' + this.me().n, go: 'float' });
    this.toast('Float request declined');
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
    const used = reqs.filter(r => r.st === 'paid').reduce((x, r) => x + (r.paidAmt || r.amt), 0), waiting = reqs.filter(r => r.st === 'pending' || r.st === 'approved').reduce((x, r) => x + r.amt, 0);
    return { used, waiting, left: a.amt - used - waiting };
  },

  // ---- The float book: every shilling of the float, derived from the records (nothing stored twice).
  // In: float given by Management, change returned on accepted advances. Out: paid requests (what was
  // actually paid), daily expenses and the transaction charges on both. Voided expenses stay in the list,
  // struck through, but do not count. The book starts on the day of the first float: what was paid
  // before that came from elsewhere. Old petty cash top-ups, its opening balance and cash counts are not
  // part of it (there is no separate cash box: the float is the money Finance spends).
  floatBook() {
    const s = this.state, f = this.fl(), L = [], name = k => (k ? this.av(k).n : '');
    if (!f.grants.length) return L;
    // Lists are stored newest first; the book reads them oldest first (ties keep that order).
    f.grants.slice().reverse().forEach(g => L.push({ id: g.id, at: g.at, time: g.time || '', dir: 'in', amt: g.amt, kind: 'float', p: '', cat: 'Float received from Management', who: this.grantFrom(g), method: g.method || '', ref: g.note || '', by: g.by, src: 'grant' }));
    (s.reqs || []).forEach(r => {
      if (r.st !== 'paid' || !r.paidOn) return;
      const paid = r.paidAmt || r.amt, cat = r.cat || (r.alloc ? String(r.alloc).replace(/^office:/, '') : 'Request');
      L.push(Object.assign({ id: r.id, at: r.paidOn, time: r.paidAt || '', dir: 'out', amt: paid, asked: r.amt, kind: 'request', p: r.p || '', cat, who: name(r.who), whoK: r.who, method: r.paidVia || (r.pay && r.pay.by) || '', ref: r.id, by: r.paidBy || '', src: 'req' }, r.paidFrom ? { voucher: r.paidFrom.voucher || '' } : {}));
      if (r.payFee > 0) L.push({ id: r.id + '-fee', at: r.paidOn, time: r.paidAt || '', dir: 'out', amt: r.payFee, kind: 'charge', p: r.p || '', cat: CHARGES, who: (r.pay && r.pay.by) || 'Bank / mobile money', method: r.paidVia || (r.pay && r.pay.by) || '', ref: r.id, by: r.paidBy || '', src: 'req' });
      const rc = r.rec;
      if (rc && rc.st === 'ok' && rc.back > 0) L.push({ id: r.id + '-back', at: rc.okAt || rc.at || r.paidOn, time: rc.okTime || '', dir: 'in', amt: rc.back, kind: 'returned', p: r.p || '', cat: 'Change returned', who: name(r.who), whoK: r.who, method: rc.backVia || 'Cash', ref: r.id, by: rc.by || '', src: 'req', paid, spent: rc.spent });
    });
    // An expense that became a request's payment (payFromBook) is that request's line: counted once.
    ((s.petty || {}).entries || []).slice().reverse().forEach(e => {
      if (e.dir !== 'out' || e.req) return;
      const v = !!e.void;
      L.push({ id: e.id, at: e.at, time: e.time || '', dir: 'out', amt: e.amt, kind: 'expense', p: e.p || '', cat: e.cat, what: e.what || '', who: e.who || '', method: e.method || 'Cash', ref: e.voucher || '', by: e.by, src: 'petty', void: v, fee: e.fee || 0, photo: e.photo || null });
      if (e.fee > 0) L.push({ id: e.id + '-fee', at: e.at, time: e.time || '', dir: 'out', amt: e.fee, kind: 'charge', p: e.p || '', cat: CHARGES, who: e.method || '', method: e.method || '', ref: e.voucher || '', by: e.by, src: 'petty', void: v });
    });
    const start = f.grants.reduce((m, g) => (g.at < m ? g.at : m), f.grants[0].at);
    return L.filter(l => l.at >= start).sort((a, b) => (a.at + ' ' + a.time).localeCompare(b.at + ' ' + b.time));
  },
  // One day of the float: opening (carried down from the day before), in, out and closing.
  floatDay(D, book) {
    const L = book || this.floatBook(), ok = L.filter(l => !l.void), sg = l => (l.dir === 'in' ? 1 : -1) * l.amt;
    const open = ok.filter(l => l.at < D).reduce((a, l) => a + sg(l), 0), day = ok.filter(l => l.at === D);
    const sum = (k, d) => day.filter(l => (!k || l.kind === k) && (!d || l.dir === d)).reduce((a, l) => a + l.amt, 0);
    const inn = sum('', 'in'), out = sum('', 'out');
    return { D, open, in: inn, out, close: open + inn - out, lines: L.filter(l => l.at === D), float: sum('float'), returned: sum('returned'), requests: sum('request'), expenses: sum('expense'), charges: sum('charge') };
  },

  // ---- Invoices
  saveInvoice(d) {
    if (d.id && isCancelled((this.state.invoices || []).find(x => x.id === d.id))) return 'This invoice is cancelled and cannot be edited';
    if (!d.c) return 'Choose the client';
    const no = String(d.no || '').trim();
    if (no.length > 40) return 'The invoice number is too long';
    if (no && (this.state.invoices || []).some(x => x.id !== d.id && invNo(x).toLowerCase() === no.toLowerCase())) return 'Invoice number ' + no + ' is already used';
    if (!d.lines || !d.lines.some(l => l.item && +l.rate > 0)) return 'Add at least one item with a rate';
    const lines = d.lines.filter(l => l.item && +l.rate > 0).map(l => ({ item: l.item.trim(), n: +l.n || 1, rate: Math.round(+l.rate), days: +l.days || 1, events: +l.events || 1 }));
    const cust = (this.state.customers || []).find(c => c.n === d.c) || {};
    const base = { c: d.c, tin: d.tin || cust.tin || '', vrn: d.vrn || cust.vrn || '', addr: [cust.box, cust.address, cust.city].filter(Boolean).join(', '), p: d.p || '', title: (d.title || '').trim(), lines, admin: d.admin == null ? 15 : +d.admin, vat: 18, signer: d.signer || 'ED', due: d.due || '30 days', by: this.me().k };
    base.v = invTotals(base).total / 1e6;
    if (d.id) {
      if (no) base.no = no;
      this.setState(x => ({ invoices: x.invoices.map(i => (i.id === d.id ? Object.assign({}, i, base, { signed: null, st: (i.payments || []).some(p => p.ok) ? 'partial' : i.st === 'draft' ? 'draft' : 'sent' }) : i)) }));
      { const sk = this.ROLES[SIGNERS[base.signer].role].k; if (sk !== this.me().k) this.remind(sk, 'Edited invoice to sign again · ' + d.id, 'finance', 'fileText', d.c); }
      this.toast((no || d.id) + ' saved'); return '';
    }
    const id = this.nextId('INV', this.state.invoices);
    base.no = no || id;
    this.setState(x => ({ invoices: [Object.assign({ id, st: 'draft', at: dayKey(0), payments: [] }, base), ...x.invoices], invSel: id }));
    const sk = this.ROLES[SIGNERS[base.signer].role].k;
    if (sk !== this.me().k) this.remind(sk, 'Invoice to sign · ' + id, 'finance', 'fileText', d.c + ' · ' + this.fmtT(invTotals(base).total));
    this.toast('Invoice ' + base.no + ' created · waiting for ' + SIGNERS[base.signer].t + ' to sign');
    this.log('fileText', 'blue', 'Invoice created · ' + d.c, id);
    return '';
  },
  canSign(i) { const r = this.state.role || 'ceo'; return !isCancelled(i) && !i.signed && SIGNERS[i.signer || 'ED'].role === r; },
  signInvoice(id) {
    const i = this.state.invoices.find(x => x.id === id); if (!i || !this.canSign(i)) return;
    this.setState(x => ({ invoices: x.invoices.map(y => (y.id === id ? Object.assign({}, y, { signed: { by: this.me().k, name: this.me().n, at: dayKey(0) } }) : y)) }));
    this.toast(invNo(i) + ' signed and stamped');
    if (i.by && i.by !== this.me().k) this.remind(i.by, 'Invoice signed · ' + id, 'finance', 'fileText', 'Ready to send to ' + i.c);
  },
  sendInvoice(id) {
    const i = this.state.invoices.find(x => x.id === id); if (!i) return;
    if (isCancelled(i)) { this.toast('This invoice is cancelled'); return; }
    if (i.lines && !i.signed) { this.toast('The invoice must be signed first'); return; }
    this.setState(x => ({ invoices: x.invoices.map(y => (y.id === id ? Object.assign({}, y, { st: 'sent', sentAt: dayKey(0) }) : y)) }));
    this.toast(invNo(i) + ' marked as sent to ' + i.c);
  },
  // Finance records a payment; Management confirms it. Only confirmed payments count.
  recordPayment(id, amt, ref) {
    amt = Math.round(+amt || 0); if (amt <= 0) return 'Enter the amount received';
    const i = this.state.invoices.find(x => x.id === id); if (!i) return 'Invoice not found';
    if (isCancelled(i)) return 'This invoice is cancelled · no payments can be recorded on it';
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
    if (isCancelled((this.state.invoices || []).find(x => x.id === id))) { this.toast('This invoice is cancelled'); return; }
    this.setState(x => ({ invoices: x.invoices.map(y => (y.id === id ? this.withPayState(Object.assign({}, y, { payments: (y.payments || []).map(p => (p.id === pid ? Object.assign({}, p, { ok: this.me().k }) : p)) })) : y)) }));
    this.toast('Payment confirmed');
  },
  // Cancel an invoice (Management, the GM, Finance), with a reason. Refused once money was confirmed on it:
  // that needs a refund or a credit note. Unconfirmed payment entries stay on it but no longer count.
  // Its number stays used. The previous status is kept so Management can restore it.
  cancelBlock(i) {
    if (!i) return 'Invoice not found';
    if (isCancelled(i)) return 'This invoice is already cancelled';
    const paid = paidOf(i);
    if (paid > 0) return this.fmtT(paid) + ' has been received and confirmed on this invoice. Record a refund / credit note first';
    return '';
  },
  cancelInvoice(id, reason) {
    if (!this.canInvoice()) return 'Only Management, the GM and Finance can cancel invoices';
    const i = (this.state.invoices || []).find(x => x.id === id);
    const b = this.cancelBlock(i); if (b) return b;
    reason = String(reason || '').trim(); if (!reason) return 'Give the reason for cancelling';
    if (!this.confirm('Cancel invoice ' + invNo(i) + ' (' + i.c + ')? It will no longer count as owed or in the reports. Its number stays used.')) return 'Not cancelled';
    const me = this.me(), c = { by: me.k, at: dayKey(0), reason, prevSt: i.st };
    this.setState(x => ({ invoices: x.invoices.map(y => (y.id === id ? Object.assign({}, y, { st: 'cancelled', cancelled: c }) : y)) }));
    const tell = new Set();
    if (i.by && i.by !== me.k) tell.add(i.by);
    if ((this.state.role || 'ceo') === 'finance' && this.ROLES.ceo.k !== me.k) tell.add(this.ROLES.ceo.k);
    tell.forEach(k => this.remind(k, 'Invoice cancelled · ' + invNo(i), 'finance', 'x', i.c + ' · ' + reason + ' · by ' + me.n));
    this.log('x', 'red', 'Invoice cancelled · ' + i.c, invNo(i) + ' · ' + reason);
    this.toast('Invoice ' + invNo(i) + ' cancelled');
    return '';
  },
  // Management can undo a cancellation: the invoice goes back to its previous status.
  restoreInvoice(id) {
    if ((this.state.role || 'ceo') !== 'ceo') return 'Only Management can restore a cancelled invoice';
    const i = (this.state.invoices || []).find(x => x.id === id);
    if (!isCancelled(i)) return 'This invoice is not cancelled';
    const st = (i.cancelled && i.cancelled.prevSt) || (i.lines && !i.signed ? 'draft' : 'sent');
    this.setState(x => ({ invoices: x.invoices.map(y => (y.id === id ? Object.assign({}, y, { st, cancelled: null, restored: { by: this.me().k, at: dayKey(0), was: y.cancelled || null } }) : y)) }));
    if (i.by && i.by !== this.me().k) this.remind(i.by, 'Invoice restored · ' + invNo(i), 'finance', 'fileText', i.c + ' · back to ' + (ST_NAME[st] || st));
    this.log('fileText', 'blue', 'Invoice restored · ' + i.c, invNo(i));
    this.toast('Invoice ' + invNo(i) + ' restored · ' + (ST_NAME[st] || st));
    return '';
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
    // The purchase order comes from the project (recorded by Management or the PA); older invoices kept their own.
    const PO = P.po ? P.po : { no: i.po || '', date: i.poDate || '', vendor: i.vendor || '' };
    const SIG = (((this.state.company || {}).signatures || {})[i.signer || 'ED'] || {}).url || '';
    const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const origin = location.origin;
    const rows = (i.lines && i.lines.length ? i.lines : [{ item: P.name || 'Services as agreed', n: 1, rate: T.net, days: 1, events: 1 }])
      .map((l, k) => `<tr><td>${k + 1}</td><td>${esc(l.item)}</td><td class=r>${l.n}</td><td class=r>${n(l.rate)}</td><td class=r>${l.days}</td><td class=r>${l.events}</td><td class=r>${n(l.n * l.rate * l.days * l.events)}</td></tr>`).join('');
    const paid = paidOf(i);
    const NO = invNo(i);
    const CX = isCancelled(i) ? (i.cancelled || {}) : null;
    const html = `<!doctype html><html><head><meta charset=utf-8><title>${esc(NO)} · ${esc(i.c)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Caveat:wght@600&display=swap" rel=stylesheet>
<style>
${DOC_CSS}
.inv{text-align:right}.inv h1{margin:0;font-size:30px;letter-spacing:.18em;color:#2B1459}.inv b{color:#8A7239}
.title{margin:18px 0 8px;font-size:16px;font-weight:700}
.tot{margin-left:auto;width:390px;margin-top:12px}.tot div{display:flex;justify-content:space-between;gap:16px;padding:5px 0}.tot span,.tot b{white-space:nowrap}.tot .g{border-top:2px solid #2B1459;margin-top:4px;padding-top:9px;font-size:16px;font-weight:800;color:#2B1459}
.sign{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:28px;align-items:end}.sig{border-top:1px solid #CFC8DD;padding-top:6px;font-size:11.5px;color:#6E6A7C;min-height:96px;position:relative;display:flex;flex-direction:column;justify-content:flex-end}
.sigimg{max-height:56px;max-width:190px;object-fit:contain;margin-bottom:4px}.sigline{display:block;height:46px}.po{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:12px;padding:10px 14px;border:1px solid #E4DFEE;border-radius:10px}.po span{display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#8A7239;font-weight:700}.stamp{position:absolute;right:-6px;bottom:18px;width:118px;opacity:.88;transform:rotate(-8deg)}
.void{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;font-size:110px;font-weight:800;color:rgba(178,58,70,.22);transform:rotate(-24deg);letter-spacing:.08em;z-index:2}
.cnote{margin:-2px 0 10px;padding:8px 12px;border:1.5px solid #B23A46;border-radius:8px;background:#FBEDEE;color:#8E2A35;font-size:12.5px}.cnote b{color:#B23A46;letter-spacing:.08em}
.draft{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;font-size:88px;font-weight:800;color:rgba(178,58,70,.09);transform:rotate(-24deg);letter-spacing:.1em}
</style></head><body><div class=bar><button onclick="print()">Print / Save PDF</button></div><div class=page>
${CX ? '<div class=void>CANCELLED</div>' : i.signed ? '' : '<div class=draft>DRAFT</div>'}<div class=fit>
<div class=top><img src="${origin}/brand/trinity-logo-full.png" alt="Trinity Mark"><div class=inv><h1>INVOICE</h1><div><b>${esc(NO)}</b></div><div>Date: ${esc(i.at || dayKey(0))}</div></div></div>
<div class=band></div>
<div class=grid><div class=box><div class=lbl>Bill to</div><b style="font-size:15px">${esc(i.c)}</b>${i.addr ? `<div style="color:#6E6A7C;margin-top:2px">${esc(i.addr)}</div>` : ''}<div class=kv style="margin-top:4px">${i.tin ? `<span>TIN</span><b>${esc(i.tin)}</b>` : ''}${i.vrn ? `<span>VRN</span><b>${esc(i.vrn)}</b>` : ''}</div></div>
<div class=box><div class=lbl>From</div><b>${COMPANY.name}</b><div class=kv style="margin-top:4px"><span>TIN</span><b>${COMPANY.tin}</b><span>VRN</span><b>${COMPANY.vrn}</b></div></div></div>
${PO.no ? `<div class=po><div><span>PO number</span><b>${esc(PO.no)}</b></div><div><span>PO date</span><b>${esc(PO.date || '')}</b></div><div><span>Vendor number</span><b>${esc(PO.vendor || '')}</b></div></div>` : ''}
<div class=title>${esc(i.title || P.name || '')}</div>
${CX ? `<div class=cnote><b>CANCELLED</b> · ${esc(CX.at || '')}${CX.by ? ' · by ' + esc(this.av(CX.by).n) : ''}${CX.reason ? ' · Reason: ' + esc(CX.reason) : ''}</div>` : ''}
<table><thead><tr><th>No</th><th>Item</th><th class=r>Number</th><th class=r>Rate (TZS)</th><th class=r>Days</th><th class=r>Events</th><th class=r>Total (TZS)</th></tr></thead><tbody>${rows}</tbody></table>
<div class=tot>${T.legacy ? '' : `<div><span>Total direct cost</span><b>${n(T.direct)}</b></div><div><span>Administrative cost ${i.admin == null ? 15 : i.admin}%</span><b>${n(T.admin)}</b></div>`}
<div><span>Total direct cost VAT exclusive</span><b>${n(T.net)}</b></div><div><span>VAT amount ${i.vat == null ? 18 : i.vat}%</span><b>${n(T.vat)}</b></div><div class=g><span>Total direct cost VAT inclusive</span><span>TZS ${n(T.total)}</span></div>
${paid ? `<div><span>Paid</span><b>${n(paid)}</b></div><div><span>Balance due</span><b>${n(T.total - paid)}</b></div>` : ''}</div>
<div class=box style="margin-top:18px"><div class=lbl>Payment details</div><div class=kv><span>Bank</span><b>${COMPANY.bank}</b><span>Account name</span><b>${COMPANY.accName}</b><span>Account no</span><b>${COMPANY.acc}</b></div></div>
<div class=sign>
<div class=sig>${i.signed ? (SIG ? `<img class=sigimg src="${SIG}" alt="Signature">` : '<span class=sigline></span>') + `<img class=stamp src="${origin}/brand/company-stamp.png" alt="">` : '<i style="color:#B23A46">Awaiting approval</i>'}<span>Approved by</span><b style="color:#17152A">${S.t}</b><span>${i.signed ? esc(i.signed.at) : ''}</span></div>
<div></div>
<div class=sig><span>Client approval</span><span style="margin-top:28px">Name, sign &amp; date</span></div></div>
</div>
<div class=foot><span>${COMPANY.box}</span><span>${COMPANY.line}</span></div>
</div>
<script>${FIT_JS}</script></body></html>`;
    const w = window.open('', '_blank'); if (!w) { this.toast('Allow pop-ups to open the invoice'); return; }
    w.document.open(); w.document.write(html); w.document.close();
  }
};

// Values for the Finance hub.
export function financeVals(s) {
  const role = s.role || 'ceo', moneyTop = ['ceo', 'finance'].includes(role);
  const inv = (s.invoices || []).map(i => {
    const T = invTotals(i), paid = paidOf(i), wait = (i.payments || []).filter(p => !p.ok), cx = isCancelled(i), C = i.cancelled || {};
    return { cancelled: cx, cancelInfo: cx ? { reason: C.reason || '', by: C.by ? this.av(C.by).n : '', at: C.at || '', was: ST_NAME[C.prevSt] || '' } : null,
      canCancel: !cx && this.canInvoice(), cancelBlock: cx ? '' : this.cancelBlock(i), doCancel: r => this.cancelInvoice(i.id, r),
      canRestore: cx && role === 'ceo', restore: () => this.restoreInvoice(i.id), canEdit: !cx && i.st !== 'paid' && this.canInvoice(), id: i.id, no: invNo(i), c: i.c, proj: this.proj(i.p).name || '', st: i.st, total: T.total, totalT: this.fmtT(T.total), paid, paidT: this.fmtT(paid), due: T.total - paid, dueT: this.fmtT(T.total - paid), dueOn: i.due, at: i.at || '',
      pct: T.total ? Math.round(paid / T.total * 100) : 0, signer: SIGNERS[i.signer || 'ED'].t, signed: !!i.signed || !i.lines, needsSign: !cx && !!i.lines && !i.signed,
      canSign: !!i.lines && this.canSign(i), sign: () => this.signInvoice(i.id), send: () => this.sendInvoice(i.id), print: () => this.printInvoice(i.id),
      canPay: moneyTop && !cx && i.st !== 'paid' && i.st !== 'draft', pay: (a, r) => this.recordPayment(i.id, a, r),
      payments: (i.payments || []).map(p => ({ id: p.id, amt: this.fmtT(p.amt), at: p.at, ref: p.ref, rec: this.av(p.rec).n, ok: !!p.ok, okBy: p.ok ? this.av(p.ok).n : '', canOk: !cx && !p.ok && role === 'ceo', confirm: () => this.confirmPayment(i.id, p.id) })),
      waitOk: wait.length, edit: () => this.setState({ invEdit: i.id }), open: () => this.setState({ invSel: s.invSel === i.id ? null : i.id }), sel: s.invSel === i.id };
  });
  const unpaid = inv.filter(i => i.st !== 'paid' && i.st !== 'draft' && !i.cancelled);
  const month = dayKey(0).slice(0, 7);
  const collected = (s.invoices || []).reduce((a, i) => a + (i.payments || []).filter(p => p.ok && (p.at || '').slice(0, 7) === month).reduce((x, p) => x + p.amt, 0), 0);
  const F = {
    tab: ({ invoices: 'invoices', cashbook: 'cash', freports: 'reports', float: 'float', petty: 'float', receipts: 'receipts' })[s.page] || (role === 'finance' ? 'overview' : s.finTab || 'overview'), showTabs: role !== 'finance', setTab: k => this.setState({ finTab: k, invSel: null }), moneyTop, isCeo: role === 'ceo', isFin: role === 'finance',
    kpis: [
      { l: 'Owed by clients', v: this.fmtT(unpaid.reduce((a, b) => a + b.due, 0)), n: unpaid.length + ' invoices open', tone: 'dark', pct: Math.round(unpaid.reduce((a, b) => a + b.paid, 0) / Math.max(1, unpaid.reduce((a, b) => a + b.total, 0)) * 100) },
      { l: 'Overdue', v: this.fmtT(inv.filter(i => i.st === 'overdue').reduce((a, b) => a + b.due, 0)), n: inv.filter(i => i.st === 'overdue').length + ' invoices', tone: 'red', pct: Math.round(inv.filter(i => i.st === 'overdue').length / Math.max(1, unpaid.length) * 100) },
      { l: 'Collected this month', v: this.fmtT(collected), n: 'confirmed payments', tone: 'green', pct: Math.min(100, Math.round(collected / Math.max(1, collected + unpaid.reduce((a, b) => a + b.due, 0)) * 100)) },
      ...(moneyTop ? [(d => ({ l: 'Float balance', v: (d.close < 0 ? '−' : '') + this.fmtT(Math.abs(d.close)), n: 'Opened today ' + this.fmtT(d.open) + ' · out ' + this.fmtT(d.out), tone: d.close < 0 ? 'red' : 'gold' }))(this.floatDay(tzDay(this.nowDate())))] : [{ l: 'Waiting for signature', v: String(inv.filter(i => i.needsSign).length), n: 'invoices', tone: 'gold' }])
    ],
    attention: [
      ...inv.filter(i => i.canSign).map(i => ({ t: 'Sign ' + i.id + ' · ' + i.c, s: i.totalT, act: 'Sign', on: i.sign })),
      ...(role === 'ceo' ? inv.filter(i => i.payments.some(p => p.canOk)).map(i => ({ t: 'Confirm payment · ' + i.id, s: i.c + ' · ' + i.payments.filter(p => p.canOk).map(p => p.amt).join(', '), act: 'Review', on: () => this.finGo('invoices', { invSel: i.id }) })) : []),
      ...inv.filter(i => i.st === 'overdue').map(i => ({ t: i.c + ' · ' + i.id + ' overdue', s: i.dueT + ' · ' + i.dueOn, act: 'Open', on: () => this.finGo('invoices', { invSel: i.id }) })),
      ...(role === 'ceo' ? this.fl().asks.filter(a => a.st === 'open').map(a => ({ t: 'Float request · ' + this.fmtT(a.amt), s: 'Balance ' + this.fmtT(a.balBefore || 0) + ' → ' + this.fmtT((a.balBefore || 0) + a.amt) + ' · ' + (a.note || ''), act: 'Approve', on: () => { if (this.confirm('Give ' + this.fmtT(a.amt) + ' float to Finance?')) this.approveFloatAsk(a.id); } })) : [])
    ].slice(0, 8),
    invoices: inv, filter: s.invFilter || 'open', setFilter: k => this.setState({ invFilter: k }),
    canInvoice: this.canInvoice(), newInvoice: () => this.setState({ invEdit: 'new' }), nextNo: this.nextId('INV', s.invoices || []),
    editing: s.invEdit || null, closeEdit: () => this.setState({ invEdit: null }),
    draft: (() => { const i = s.invEdit && s.invEdit !== 'new' ? s.invoices.find(x => x.id === s.invEdit) : null; if (!i) return null;
      if (i.lines && i.lines.length) return Object.assign({}, i, { no: invNo(i) });
      const T = invTotals(i); return Object.assign({}, i, { no: invNo(i), admin: 0, lines: [{ item: this.proj(i.p).name || 'Services as agreed', n: 1, rate: T.net, days: 1, events: 1 }] }); })(),
    save: d => { const e = this.saveInvoice(d); if (!e) { this.setState({ invEdit: null }); if (s.page !== 'invoices') this.finGo('invoices'); } return e; },
    customers: (s.customers || []).map(c => ({ v: c.n, l: c.n, tin: c.tin || '', vrn: c.vrn || '' })),
    poFor: pid => { const P = s.projects.find(p => p.id === pid); return P && P.po ? P.po.no + ' · ' + P.po.date + (P.po.vendor ? ' · vendor ' + P.po.vendor : '') : ''; },
    projects: s.projects.filter(p => p.st !== 'done').map(p => ({ v: p.id, l: p.client + ' · ' + p.name, c: p.client })),
    totals: invTotals
  };
  return { FH: F };
}

// ---- Reports: every shilling in and out, by day, week, month and year.
const pad = n => String(n).padStart(2, '0');
const key = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parse = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function periodRange(p, now = new Date(), from, to) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (p === 'custom' && from && to && from <= to) { const days = Math.round((parse(to) - parse(from)) / 864e5) + 1; return { from, to, label: from + ' → ' + to, unit: days > 93 ? 'month' : 'day', custom: true }; }
  if (p === 'today') return { from: key(d), to: key(d), label: 'Today', unit: 'day' };
  if (p === 'week') { const m = new Date(d); m.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const e = new Date(m); e.setDate(m.getDate() + 6); return { from: key(m), to: key(e), label: 'This week', unit: 'day' }; }
  if (p === 'lastmonth') { const a = new Date(d.getFullYear(), d.getMonth() - 1, 1), b = new Date(d.getFullYear(), d.getMonth(), 0); return { from: key(a), to: key(b), label: MON[a.getMonth()] + ' ' + a.getFullYear(), unit: 'day' }; }
  if (p === 'year') return { from: d.getFullYear() + '-01-01', to: d.getFullYear() + '-12-31', label: String(d.getFullYear()), unit: 'month' };
  const a = new Date(d.getFullYear(), d.getMonth(), 1), b = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { from: key(a), to: key(b), label: MON[a.getMonth()] + ' ' + a.getFullYear(), unit: 'day' };
}
function prevRange(r) {
  const a = parse(r.from), b = parse(r.to), days = Math.round((b - a) / 864e5) + 1;
  if (r.unit === 'month') return { from: (a.getFullYear() - 1) + '-01-01', to: (a.getFullYear() - 1) + '-12-31' };
  const pb = new Date(a); pb.setDate(a.getDate() - 1); const pa = new Date(pb); pa.setDate(pb.getDate() - days + 1);
  return { from: key(pa), to: key(pb) };
}

export const reportMethods = {
  // All money in and out as one list: confirmed invoice payments, paid requests and Finance's own entries.
  cashEntries() {
    const s = this.state, out = [];
    (s.invoices || []).forEach(i => (i.payments || []).filter(p => p.ok && /^\d{4}-/.test(p.at || '')).forEach(p => out.push({ id: p.id, at: p.at, dir: 'in', amt: p.amt, cat: 'Client payment', party: i.c, p: i.p || '', ref: i.id + (p.ref ? ' · ' + p.ref : ''), src: 'invoice' })));
    // A paid request is what was actually paid (it can be less than asked), plus the transaction charges of
    // sending it (bank or mobile money fee), which are company costs, not part of the person's float.
    (s.reqs || []).filter(r => r.st === 'paid' && r.paidOn).forEach(r => {
      out.push({ id: r.id, at: r.paidOn, dir: 'out', amt: r.paidAmt || r.amt, cat: 'Staff requests · ' + (r.cat || 'Other'), party: this.av(r.who).n, p: r.p || '', ref: r.id, src: 'request' });
      if (r.payFee > 0) out.push({ id: r.id + '-fee', at: r.paidOn, dir: 'out', amt: r.payFee, cat: CHARGES, party: (r.pay && r.pay.by) || 'Bank / mobile money', p: r.p || '', ref: 'Charges · ' + r.id, src: 'request' });
    });
    (s.ledger || []).forEach(l => {
      out.push(Object.assign({ src: 'ledger' }, l));
      if (l.fee > 0) out.push({ id: l.id + '-fee', at: l.at, dir: 'out', amt: l.fee, cat: CHARGES, party: l.method || 'Bank', p: l.p || '', ref: 'Charges · ' + (l.ref || l.party || l.cat), src: 'ledger' });
    });
    // Daily expenses paid from the float are company spending too (old petty cash top-ups were only cash
    // moving from the bank to the box). Voided expenses do not count.
    ((s.petty || {}).entries || []).filter(e => e.dir === 'out' && !e.void && !e.req).forEach(e => {
      out.push({ id: e.id, at: e.at, dir: 'out', amt: e.amt, cat: 'Daily expense · ' + e.cat, party: e.who || e.what || '', p: e.p || '', ref: e.voucher, src: 'petty' });
      if (e.fee > 0) out.push({ id: e.id + '-fee', at: e.at, dir: 'out', amt: e.fee, cat: CHARGES, party: e.method || 'Mobile money', p: e.p || '', ref: 'Charges · ' + e.voucher, src: 'petty' });
    });
    // Change brought back on an accepted advance: money back in (a project's spending is what was really spent).
    (s.reqs || []).filter(r => r.st === 'paid' && r.rec && r.rec.st === 'ok' && r.rec.back > 0).forEach(r => out.push({ id: r.id + '-back', at: r.rec.okAt || r.rec.at || r.paidOn, dir: 'in', amt: r.rec.back, cat: 'Change returned', party: this.av(r.who).n, p: r.p || '', ref: 'Change · ' + r.id, src: 'return' }));
    return out.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  },
  // Money in or out recorded by Finance. Transaction charges (bank or mobile money fee) are optional and
  // show in the cash book as their own "Transaction charges" line.
  addEntry(f) {
    const amt = Math.round(+f.amt || 0); if (amt <= 0) return 'Enter the amount';
    if (!f.cat) return 'Choose what it is for';
    const fee = parseFee(f.fee); if (fee < 0) return 'Transaction charges must be a number';
    const e = Object.assign({ id: 'LG' + Date.now().toString(36), at: f.at || dayKey(0), dir: f.dir === 'in' ? 'in' : 'out', amt, cat: f.cat, party: (f.party || '').trim(), p: f.p || '', method: f.method || 'Bank', ref: (f.ref || '').trim(), by: this.me().k }, fee ? { fee } : {});
    this.setState(x => ({ ledger: [e, ...(x.ledger || [])] }));
    this.toast((e.dir === 'in' ? 'Money in' : 'Money out') + ' recorded · ' + this.fmtT(amt) + (fee ? ' + ' + this.fmtT(fee) + ' charges' : ''));
    this.log(e.dir === 'in' ? 'trendUp' : 'wallet', e.dir === 'in' ? 'green' : 'amber', (e.dir === 'in' ? 'Money in · ' : 'Money out · ') + e.cat, this.fmtT(amt));
    return '';
  },
  // The money report as a branded one-page A4 PDF (the invoice's look): the period's money in and out,
  // where it went, where it came from, what clients owe, projects and the cash book lines.
  moneyReportHtml(D) {
    const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const shortDay = d => (/^\d{4}-\d{2}-\d{2}$/.test(d || '') ? +d.slice(8) + ' ' + MON[+d.slice(5, 7) - 1] : d || '');
    const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const origin = typeof location !== 'undefined' ? location.origin : '';
    const ref = 'MR-' + dayKey(0).replace(/-/g, '');
    const table = (head, rows) => `<table><thead><tr>${head.map(h => `<th${h[0] === '>' ? ' class=r' : ''}>${esc(h.replace(/^>/, ''))}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
    const tr = cells => `<tr>${cells.map(c => (c && typeof c === 'object' ? `<td class=r>${esc(c.r)}</td>` : `<td>${esc(c)}</td>`)).join('')}</tr>`;
    const none = t => `<p class=none>${esc(t)}</p>`;
    const MAX = 1000, lines = D.book.slice(0, MAX);
    return keepCodes(`<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>${esc(ref)} · Money report · ${esc(D.label)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel=stylesheet>
<style>
${DOC_CSS}
.inv{text-align:right}.inv h1{margin:0;font-size:24px;letter-spacing:.14em;color:#2B1459}.inv b{color:#8A7239}
.kp{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:8px}.kp div{background:#F7F5FB;border-radius:10px;padding:8px 10px}.kp span{display:block;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#8A7239;font-weight:700}.kp b{font-size:15px;white-space:nowrap}.kp .g b{color:#1F7549}.kp .r b{color:#B23A46}
.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
h2{margin:12px 0 2px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#2B1459}
table{font-size:10.5px;margin-top:3px}th{padding:5px 6px;font-size:9.5px}td{padding:4px 6px;vertical-align:top}td.r,th.r{white-space:nowrap}
.half{max-width:60%}.nw td:first-child{white-space:nowrap}
.none{margin:2px 0 0;color:#6E6A7C;font-style:italic;font-size:11px}.more{font-size:10.5px;color:#6E6A7C;margin-top:4px}
.sign{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:18px}.sig{border-top:1px solid #CFC8DD;padding-top:6px;font-size:11px;color:#6E6A7C;min-height:50px;display:flex;flex-direction:column;justify-content:flex-end}
${REPORT_CSS}
</style></head><body><div class=bar><button onclick="print()">Save PDF</button></div><div class=page><div class=fit>
<div class=top><img src="${origin}/brand/trinity-logo-full.png" alt="Trinity Mark"><div class=inv><h1>MONEY REPORT</h1><div><b>${esc(ref)}</b></div><div>${esc(D.label)}</div></div></div>
<div class=band></div>
<div class=kp>${D.kpis.map(k => `<div class="${k.tone === 'green' ? 'g' : k.tone === 'red' ? 'r' : ''}"><span>${esc(k.l)}</span><b>${esc(k.v)}</b></div>`).join('')}</div>
<div class=two><div><h2><span>1</span>Where the money went</h2>${D.outCat.length ? table(['What for', '>%', '>Amount (TZS)'], D.outCat.map(x => tr([x.l, { r: x.pct + '%' }, { r: x.t.replace(/^TZS /, '') }]))) : none('No spending in this period.')}</div>
<div><h2><span>2</span>Where the money came from</h2>${D.inCli.length ? table(['From', '>%', '>Amount (TZS)'], D.inCli.map(x => tr([x.l, { r: x.pct + '%' }, { r: x.t.replace(/^TZS /, '') }]))) : none('No money in this period.')}</div></div>
<h2><span>3</span>What clients owe us</h2><div class=half>${table(['Age', '>Invoices', '>Amount (TZS)'], D.aging.map(a => tr([a.l, { r: a.n }, { r: a.t.replace(/^TZS /, '') }])))}</div>
<h2><span>4</span>Projects</h2>${D.projects.length ? table(['Project', '>Invoiced (TZS)', '>Received', '>Spent'].concat(D.showProfit ? ['>Profit'] : []), D.projects.map(p => tr([p.c + ' · ' + p.n, { r: p.invoiced.replace(/TZS /, '') }, { r: p.got.replace(/TZS /, '') }, { r: p.spent.replace(/TZS /, '') }].concat(D.showProfit ? [{ r: p.profit.replace(/TZS /, '') }] : [])))) : none('No projects.')}
<h2><span>5</span>Money in and out<em>${esc(D.label)} · ${D.book.length} lines</em></h2>${lines.length ? '<div class=nw>' + table(['Date', 'Details', '>In', '>Out', '>Balance'], lines.map(e => tr([shortDay(e.at), e.cat + [e.party, e.proj, e.ref].filter(Boolean).map(x => ' · ' + x).join(''), { r: e.dir === 'in' ? e.amt.replace(/^TZS /, '') : '' }, { r: e.dir === 'out' ? e.amt.replace(/^TZS /, '') : '' }, { r: e.run.replace(/TZS /, '') }]))) + '</div>' : none('Nothing recorded in this period.')}
${D.book.length > MAX ? `<p class=more>Showing the latest ${MAX} of ${D.book.length} lines · the full list is in the Excel download.</p>` : ''}
<div class=sign><div class=sig><span>Prepared by (Finance)</span><b>${esc(D.by)}</b><span>Sign · date</span></div><div class=sig><span>Received by Management</span><span>Sign · date</span></div></div>
</div>
<div class=foot><span>${COMPANY.box}</span><span>${esc(ref)} · Trinity Mark 360</span></div>
</div></body></html>`);
  },
  printMoneyReport(D) {
    const html = this.moneyReportHtml(D);
    let w = null; try { w = window.open('', '_blank'); } catch (e) { w = null; }
    if (!w) { this.toast('Allow pop-ups to open the report'); return html; }
    w.document.open(); w.document.write(html); w.document.close();
    return html;
  },
  exportCash(rows, label) {
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const csv = [['Date', 'In/Out', 'Category', 'Paid to / from', 'Project', 'Reference', 'Amount (TZS)'].map(q).join(',')]
      .concat(rows.map(e => [e.at, e.dir === 'in' ? 'In' : 'Out', e.cat, e.party, e.p ? this.proj(e.p).name : '', e.ref, (e.dir === 'in' ? 1 : -1) * e.amt].map(q).join(','))).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'Trinity cash book · ' + label + '.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
};

// The number printed on an invoice: Finance can set its own (e.g. to follow the company's invoice book);
// otherwise the system's id. The id stays the record's key.
export const invNo = i => (i && i.no) || (i && i.id) || '';
export const IN_CATS = ['Client payment', 'Other income', 'Loan / capital'];
// Bank and mobile money fees on payments.
export const CHARGES = 'Transaction charges';
// Transaction charges typed by Finance: '' = none, a negative number = not a number.
export function parseFee(v) { const t = String(v == null ? '' : v).replace(/[,\s]/g, ''); if (!t) return 0; const n = Math.round(+t); return isFinite(n) && n >= 0 ? n : -1; }
export const OUT_CATS = ['Suppliers & production', 'Salaries', 'Statutory (NSSF, PAYE)', 'Rent', 'Utilities', 'Internet & phone', 'Fuel & transport', 'Office supplies', 'Tax (VAT, WHT)', 'Bank charges', 'Transaction charges', 'Other'];

export function reportVals(s) {
  if (!this.canInvoice()) return { REP: null };
  const per = s.repPeriod || 'month', R = periodRange(per, new Date(), s.repFrom, s.repTo), P = prevRange(R), all = this.cashEntries();
  const inR = e => e.at >= R.from && e.at <= R.to, inP = e => e.at >= P.from && e.at <= P.to;
  const rows = all.filter(inR), prev = all.filter(inP);
  const sum = (l, d) => l.filter(e => e.dir === d).reduce((a, e) => a + e.amt, 0);
  const tin = sum(rows, 'in'), tout = sum(rows, 'out'), pin = sum(prev, 'in'), pout = sum(prev, 'out');
  const delta = (a, b) => (b ? Math.round((a - b) / b * 100) : null);
  // Buckets for the chart: days (week, month) or months (year).
  const buckets = [];
  if (R.unit === 'month') { const a = parse(R.from), b = parse(R.to); for (let d = new Date(a.getFullYear(), a.getMonth(), 1); d <= b; d.setMonth(d.getMonth() + 1)) buckets.push({ k: d.getFullYear() + '-' + pad(d.getMonth() + 1), l: MON[d.getMonth()] }); }
  else { const a = parse(R.from), b = parse(R.to); for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) buckets.push({ k: key(d), l: per === 'week' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] : String(d.getDate()) }); }
  const bk = e => (R.unit === 'month' ? e.at.slice(0, 7) : e.at);
  const chart = buckets.map(b => { const l = rows.filter(e => bk(e) === b.k); return { l: b.l, k: b.k, in: sum(l, 'in'), out: sum(l, 'out'), items: l.map(e => ({ id: e.id + e.at, at: e.at, dir: e.dir, cat: e.cat, party: e.party, amt: this.fmtT(e.amt) })) }; });
  const peak = Math.max(1, ...chart.map(c => Math.max(c.in, c.out)));
  // A round scale: 1, 2 or 5 × 10ⁿ steps, four of them.
  const step = (() => { const raw = peak / 4, p = Math.pow(10, Math.floor(Math.log10(raw))); return [1, 2, 5, 10].map(m => m * p).find(v => v >= raw); })(), max = step * 4;
  const short = v => (v >= 1e6 ? (v / 1e6).toFixed(v % 1e6 ? 1 : 0) + 'M' : v >= 1e3 ? Math.round(v / 1e3) + 'K' : String(v));
  const group = (l, d, f) => { const m = {}; l.filter(e => e.dir === d).forEach(e => { const k = f(e); m[k] = (m[k] || 0) + e.amt; }); return Object.keys(m).map(k => ({ l: k, v: m[k] })).sort((a, b) => b.v - a.v); };
  const outCat = group(rows, 'out', e => e.cat.replace(/^Staff requests · .*/, 'Staff requests (floats)')), inCli = group(rows.filter(e => e.src !== 'return'), 'in', e => e.party || e.cat);
  // Projects: what each brought in and cost, all time.
  const projects = (s.projects || []).map(p => {
    const inv = (s.invoices || []).filter(i => i.p === p.id && !isCancelled(i)), invoiced = inv.reduce((a, i) => a + invTotals(i).total, 0);
    const got = all.filter(e => e.p === p.id && e.dir === 'in' && e.src !== 'return').reduce((a, e) => a + e.amt, 0), spent = all.filter(e => e.p === p.id && e.dir === 'out').reduce((a, e) => a + e.amt, 0) - all.filter(e => e.p === p.id && e.src === 'return').reduce((a, e) => a + e.amt, 0);
    return { id: p.id, n: p.name, c: p.client, value: Math.round((p.val || 0) * 1e6), invoiced, got, spent, profit: got - spent };
  }).filter(p => p.invoiced || p.got || p.spent).sort((a, b) => b.value - a.value);
  // How long clients have owed us.
  const today = parse(dayKey(0)), ageOf = i => { if (i.at) return Math.round((today - parse(i.at)) / 864e5); const m = /(\d+) days late/.exec(i.due || ''); return m ? 30 + +m[1] : 10; };
  const aging = [['0–30 days', 0, 30], ['31–60 days', 31, 60], ['61–90 days', 61, 90], ['Over 90 days', 91, 1e9]].map(([l, a, b]) => {
    const list = (s.invoices || []).filter(i => i.st !== 'paid' && i.st !== 'draft' && !isCancelled(i) && ageOf(i) >= a && ageOf(i) <= b);
    return { l, n: list.length, v: list.reduce((x, i) => x + invTotals(i).total - (i.payments || []).filter(p => p.ok).reduce((y, p) => y + p.amt, 0), 0) };
  });
  let run = 0;
  const book = rows.slice().reverse().map(e => { run += (e.dir === 'in' ? 1 : -1) * e.amt; return Object.assign({}, e, { run, proj: e.p && this.proj(e.p).client !== e.party ? this.proj(e.p).client : '' }); }).reverse();
  const f = this.fmtT.bind(this);
  return {
    REP: {
      per, label: R.label, setPer: k => this.setState({ repPeriod: k }), from: s.repFrom || R.from, to: s.repTo || R.to, setRange: (a, b) => this.setState({ repPeriod: 'custom', repFrom: a, repTo: b }),
      periods: [['today', 'Today'], ['week', 'This week'], ['month', 'This month'], ['lastmonth', 'Last month'], ['year', 'This year'], ['custom', 'Custom']],
      kpis: [
        { l: 'Money in', v: f(tin), d: delta(tin, pin), good: true, tone: 'green' },
        { l: 'Money out', v: f(tout), d: delta(tout, pout), good: false, tone: 'red' },
        { l: 'Net cash', v: (tin - tout < 0 ? '−' : '') + f(Math.abs(tin - tout)), tone: tin - tout < 0 ? 'red' : 'dark' },
        { l: 'Daily average spend', v: f(tout / Math.max(1, Math.min(Math.round((parse(R.to) - parse(R.from)) / 864e5) + 1, Math.round((parse(dayKey(0)) - parse(R.from)) / 864e5) + 1))), tone: 'gold' }
      ],
      chart: chart.map(c => Object.assign(c, { hi: Math.round(c.in / max * 100), ho: Math.round(c.out / max * 100), tin: f(c.in), tout: f(c.out) })), maxT: f(peak), ticks: [4, 3, 2, 1, 0].map(i => ({ l: short(step * i), pct: i * 25 })), showEvery: chart.length > 16 ? 5 : 1,
      outCat: outCat.map(x => Object.assign(x, { t: f(x.v), pct: tout ? Math.round(x.v / tout * 100) : 0 })),
      inCli: inCli.slice(0, 8).map(x => Object.assign(x, { t: f(x.v), pct: tin ? Math.round(x.v / tin * 100) : 0 })),
      showProfit: (s.role || 'ceo') !== 'finance',
      projects: projects.map(p => ({ id: p.id, n: p.n, c: p.c, value: f(p.value), invoiced: f(p.invoiced), got: f(p.got), spent: f(p.spent), profit: (p.profit < 0 ? '−' : '') + f(Math.abs(p.profit)), neg: p.profit < 0, margin: p.got ? Math.round(p.profit / p.got * 100) + '%' : '—' })),
      aging: aging.map(a => Object.assign(a, { t: f(a.v) })), agingMax: Math.max(1, ...aging.map(a => a.v)),
      book: book.slice(0, 200).map(e => ({ id: e.id, at: e.at, dir: e.dir, cat: e.cat, party: e.party, proj: e.proj, ref: e.ref, amt: f(e.amt), run: (e.run < 0 ? '−' : '') + f(Math.abs(e.run)),
        // Finance's own entries: transaction charges can be added or corrected.
        feeN: e.src === 'ledger' && !/-fee$/.test(e.id) ? (e.fee || 0) : null, setFee: e.src === 'ledger' && !/-fee$/.test(e.id) && this.canFloat && this.canFloat() ? v => this.setCharges('ledger', e.id, v) : null })),
      bookCount: book.length,
      export: () => this.exportCash(rows, R.label), add: e => this.addEntry(e),
      pdf: () => { const V = reportVals.call(this, this.state).REP; return this.printMoneyReport({ label: R.label, kpis: V.kpis, outCat: V.outCat, inCli: V.inCli, aging: V.aging, projects: V.projects, showProfit: V.showProfit, book: V.book, by: this.me().n }); },
      inCats: IN_CATS, outCats: OUT_CATS, projOpts: (s.projects || []).filter(p => p.st !== 'done').map(p => ({ v: p.id, l: p.client }))
    }
  };
}
