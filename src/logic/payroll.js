// Payroll (Tanzania mainland). The GM keeps the employee pay records and prepares the monthly run;
// the GM approves, then Management; Finance pays it. Paying records the net salaries in the cash
// book and the PAYE/SDL, NSSF and WCF amounts become this month's obligations. Each employee sees
// their own payslip.
// Mixed into TrinityApp, so `this` is the app.
const dayKey = (o = 0) => { const d = new Date(); d.setDate(d.getDate() + o); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

// PAYE on monthly taxable pay (gross less the employee's NSSF), Tanzania mainland bands.
export function paye(taxable) {
  const t = Math.max(0, taxable);
  if (t <= 270000) return 0;
  if (t <= 520000) return Math.round((t - 270000) * 0.08);
  if (t <= 760000) return Math.round(20000 + (t - 520000) * 0.20);
  if (t <= 1000000) return Math.round(68000 + (t - 760000) * 0.25);
  return Math.round(128000 + (t - 1000000) * 0.30);
}
export const RATES = { nssfEmp: 0.10, nssfEr: 0.10, sdl: 0.035, wcf: 0.005, heslb: 0.15 };

// One employee's pay for the month.
export function payLine(e, other = 0) {
  const basic = Math.round(+e.basic || 0), allow = Math.round(+e.allow || 0), gross = basic + allow;
  const nssf = Math.round(gross * RATES.nssfEmp), taxable = gross - nssf, tax = paye(taxable);
  const heslb = e.heslb ? Math.round(basic * RATES.heslb) : 0, adv = Math.round(+other || 0);
  return { basic, allow, gross, nssf, taxable, paye: tax, heslb, other: adv, net: gross - nssf - tax - heslb - adv,
    erNssf: Math.round(gross * RATES.nssfEr), sdl: Math.round(gross * RATES.sdl), wcf: Math.round(gross * RATES.wcf) };
}
const sumBy = (lines, k) => lines.reduce((a, l) => a + (l[k] || 0), 0);
export const monthLabel = m => { const [y, mo] = m.split('-').map(Number); return new Date(y, mo - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }); };

export const payrollMethods = {
  pr() { return Object.assign({ emp: {}, runs: [] }, this.state.payroll || {}); },
  canPayrollAdmin() { return ['gm', 'ceo'].includes(this.state.role || 'ceo'); },
  canSeePayroll() { return ['gm', 'ceo', 'finance'].includes(this.state.role || 'ceo'); },
  setEmployee(k, f) {
    if (!this.canPayrollAdmin()) return 'The GM keeps the pay records';
    if (!(+f.basic > 0)) return 'Enter the basic salary';
    const P = this.pr();
    this.setState({ payroll: Object.assign({}, P, { emp: Object.assign({}, P.emp, { [k]: { basic: Math.round(+f.basic), allow: Math.round(+f.allow || 0), heslb: !!f.heslb, bank: (f.bank || '').trim(), acc: (f.acc || '').trim(), nssfNo: (f.nssfNo || '').trim(), tin: (f.tin || '').trim(), active: f.active !== false } }) }) });
    this.toast('Pay record saved · ' + this.av(k).n);
    return '';
  },
  // The GM prepares the month's run from the pay records.
  prepareRun(month) {
    if (!this.canPayrollAdmin()) return 'The GM prepares the payroll';
    const P = this.pr(); month = month || dayKey(0).slice(0, 7);
    if (P.runs.some(r => r.month === month)) return monthLabel(month) + ' payroll already exists';
    const lines = Object.keys(P.emp).filter(k => P.emp[k].active !== false).map(k => Object.assign({ k }, payLine(P.emp[k])));
    if (!lines.length) return 'Add pay records first';
    const run = { id: 'PAY' + month.replace('-', ''), month, lines, st: 'draft', by: this.me().k, at: dayKey(0) };
    this.setState({ payroll: Object.assign({}, P, { runs: [run, ...P.runs] }) });
    this.toast(monthLabel(month) + ' payroll prepared · ' + lines.length + ' employees');
    return '';
  },
  setDeduction(runId, k, amt) {
    const P = this.pr(), run = P.runs.find(r => r.id === runId); if (!run || run.st !== 'draft') return;
    const lines = run.lines.map(l => (l.k === k ? Object.assign({ k }, payLine(P.emp[k] || l, amt)) : l));
    this.setState({ payroll: Object.assign({}, P, { runs: P.runs.map(r => (r.id === runId ? Object.assign({}, r, { lines }) : r)) }) });
  },
  updateRun(runId, patch) { const P = this.pr(); this.setState({ payroll: Object.assign({}, P, { runs: P.runs.map(r => (r.id === runId ? Object.assign({}, r, patch) : r)) }) }); },
  // GM approves and sends to Management; Management approves; Finance pays.
  approveRun(runId) {
    const role = this.state.role || 'ceo', run = this.pr().runs.find(r => r.id === runId); if (!run) return 'Not found';
    const at = { by: this.me().k, at: dayKey(0) + ' ' + this.now() }, net = this.fmtT(sumBy(run.lines, 'net'));
    if (run.st === 'draft' && role === 'gm') {
      this.updateRun(runId, { st: 'mgmt', gm: at });
      this.remind(this.ROLES.ceo.k, 'Payroll to approve · ' + monthLabel(run.month), 'payroll', 'wallet', run.lines.length + ' employees · net ' + net);
      this.toast('Approved · sent to Management'); return '';
    }
    if ((run.st === 'mgmt' || run.st === 'draft') && role === 'ceo') {
      this.updateRun(runId, { st: 'approved', gm: run.gm || at, mgmt: at });
      this.remind(this.ROLES.finance.k, 'Payroll approved: pay salaries · ' + monthLabel(run.month), 'payroll', 'wallet', 'Net ' + net);
      this.toast('Payroll approved · Finance told to pay'); return '';
    }
    return 'Not waiting for you';
  },
  returnRun(runId, note) {
    const run = this.pr().runs.find(r => r.id === runId); if (!run) return 'Not found';
    if ((this.state.role || 'ceo') !== 'ceo' || run.st !== 'mgmt') return 'Not waiting for you';
    if (!(note || '').trim()) return 'Say what should change';
    this.updateRun(runId, { st: 'draft', note: note.trim(), gm: null });
    this.remind(this.ROLES.gm.k, 'Payroll sent back · ' + monthLabel(run.month), 'payroll', 'wallet', note.trim());
    this.toast('Sent back to the GM'); return '';
  },
  // Finance pays: net salaries go into the cash book; statutory amounts become this month's payments due.
  payRun(runId, ref) {
    const run = this.pr().runs.find(r => r.id === runId); if (!run) return 'Not found';
    if ((this.state.role || 'ceo') !== 'finance') return 'Finance pays the salaries';
    if (run.st !== 'approved') return 'The payroll must be approved by the GM and Management first';
    if (!(ref || '').trim()) return 'Enter the bank reference';
    const net = sumBy(run.lines, 'net'), today = dayKey(0);
    this.setState(x => ({ ledger: [{ id: 'LG' + Date.now().toString(36), at: today, dir: 'out', amt: net, cat: 'Salaries', party: 'Staff payroll · ' + monthLabel(run.month), p: '', method: 'Bank', ref: ref.trim(), by: this.me().k }, ...(x.ledger || [])] }));
    const due = { paye: sumBy(run.lines, 'paye') + sumBy(run.lines, 'sdl'), nssf: sumBy(run.lines, 'nssf') + sumBy(run.lines, 'erNssf'), wcf: sumBy(run.lines, 'wcf'), heslb: sumBy(run.lines, 'heslb') };
    this.updateRun(runId, { st: 'paid', paid: { by: this.me().k, at: today, ref: ref.trim() }, due });
    run.lines.forEach(l => { if (l.k !== this.me().k) this.notify({ to: l.k, ic: 'wallet', t: 'Salary paid · ' + monthLabel(run.month), s: 'Net ' + this.fmtT(l.net) + ' · your payslip is ready', go: 'payslips' }); });
    [this.ROLES.gm.k, this.ROLES.ceo.k].forEach(k => this.remind(k, 'Salaries paid · ' + monthLabel(run.month), 'payroll', 'check', 'Net ' + this.fmtT(net) + ' · ref ' + ref.trim()));
    this.toast('Salaries paid · ' + this.fmtT(net) + ' recorded in the cash book');
    return '';
  },
  // A printable payslip.
  printPayslip(runId, k) {
    const run = this.pr().runs.find(r => r.id === runId), l = run && run.lines.find(x => x.k === k); if (!l) return;
    const e = this.pr().emp[k] || {}, st = (this.state.staff || []).find(p => p.k === k) || {}, n = v => Math.round(v).toLocaleString('en-US');
    const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const row = (a, b, strong) => `<tr${strong ? ' class=s' : ''}><td>${a}</td><td class=r>${b}</td></tr>`;
    const html = `<!doctype html><html><head><meta charset=utf-8><title>Payslip · ${esc(this.av(k).n)} · ${monthLabel(run.month)}</title>
<style>body{font:13px/1.5 Arial,sans-serif;color:#17152A;background:#EEEAF4;margin:0}.p{width:180mm;margin:16px auto;background:#fff;padding:14mm}h1{margin:0;color:#2B1459;font-size:22px;letter-spacing:.1em}
.top{display:flex;justify-content:space-between;align-items:center}.top img{height:42px}.g{display:grid;grid-template-columns:1fr 1fr;gap:4px 20px;margin:16px 0;padding:12px;background:#F7F5FB;border-radius:8px}
.g span{color:#6E6A7C}table{width:100%;border-collapse:collapse;margin-top:8px}td{padding:7px 4px;border-bottom:1px solid #EEEAF4}.r{text-align:right}.s td{font-weight:700;border-top:2px solid #2B1459}
h3{margin:18px 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#8A7239}.net{margin-top:16px;padding:14px;border-radius:10px;background:#2B1459;color:#fff;display:flex;justify-content:space-between;font-size:18px;font-weight:800}
.bar{position:fixed;top:12px;right:12px}.bar button{padding:9px 16px;border:none;border-radius:9px;background:#2B1459;color:#fff;font-weight:600}@media print{.bar{display:none}body{background:#fff}.p{margin:0}}</style></head><body>
<div class=bar><button onclick="print()">Print / Save PDF</button></div><div class=p>
<div class=top><img src="${location.origin}/brand/trinity-logo-full.png" alt=""><div><h1>PAYSLIP</h1><div>${monthLabel(run.month)}</div></div></div>
<div class=g><span>Employee</span><b>${esc(this.av(k).n)}</b><span>Position</span><b>${esc(st.role || '')}</b><span>NSSF no.</span><b>${esc(e.nssfNo || '—')}</b><span>TIN</span><b>${esc(e.tin || '—')}</b><span>Bank</span><b>${esc([e.bank, e.acc].filter(Boolean).join(' · ') || '—')}</b><span>Paid on</span><b>${esc(run.paid ? run.paid.at : '')}</b></div>
<h3>Earnings</h3><table>${row('Basic salary', n(l.basic))}${row('Allowances', n(l.allow))}${row('Gross pay', n(l.gross), true)}</table>
<h3>Deductions</h3><table>${row('NSSF (10%)', n(l.nssf))}${row('PAYE', n(l.paye))}${l.heslb ? row('HESLB loan (15%)', n(l.heslb)) : ''}${l.other ? row('Salary advance / other', n(l.other)) : ''}${row('Total deductions', n(l.nssf + l.paye + l.heslb + l.other), true)}</table>
<div class=net><span>Net pay</span><span>TZS ${n(l.net)}</span></div>
<p style="color:#6E6A7C;font-size:11px;margin-top:14px">TRINITY MARK SOLUTIONS LIMITED · P.O. Box 15617, Dar es Salaam</p></div></body></html>`;
    const w = window.open('', '_blank'); if (!w) { this.toast('Allow pop-ups to open the payslip'); return; }
    w.document.open(); w.document.write(html); w.document.close();
  }
};

export function payrollVals(s) {
  const P = this.pr(), role = s.role || 'ceo', me = this.me().k, f = this.fmtT.bind(this);
  const mySlips = P.runs.filter(r => r.st === 'paid' && r.lines.some(l => l.k === me)).map(r => { const l = r.lines.find(x => x.k === me); return { id: r.id, month: monthLabel(r.month), net: f(l.net), gross: f(l.gross), open: () => this.printPayslip(r.id, me) }; });
  if (!this.canSeePayroll()) return { PAY: { slipsOnly: true, mySlips } };
  const staff = (s.staff || []).filter(p => p.k !== this.ROLES.ceo.k);
  const keys = [...new Set([this.ROLES.gm.k, ...staff.map(p => p.k), ...Object.keys(P.emp)])].filter(k => k !== this.ROLES.ceo.k);
  const emps = keys.map(k => { const e = P.emp[k], a = this.av(k), st = (s.staff || []).find(p => p.k === k) || {}; const l = e ? payLine(e) : null;
    return { k, n: a.n, i: a.i, c: a.c, ph: a.ph, role: st.role || (k === this.ROLES.gm.k ? 'General Manager' : ''), has: !!e, e: e || { basic: '', allow: '', heslb: false, bank: '', acc: '', nssfNo: '', tin: '' }, gross: l ? f(l.gross) : '—', net: l ? f(l.net) : '—', save: x => this.setEmployee(k, x) }; });
  const runs = P.runs.map(r => {
    const T = k => sumBy(r.lines, k);
    return { id: r.id, month: monthLabel(r.month), st: r.st, stl: { draft: 'Draft · GM', mgmt: 'Waiting for Management', approved: 'Approved · Finance to pay', paid: 'Paid' }[r.st], note: r.note || '',
      gm: r.gm ? this.av(r.gm.by).n + ' · ' + r.gm.at : '', mgmt: r.mgmt ? this.av(r.mgmt.by).n + ' · ' + r.mgmt.at : '', paid: r.paid ? this.av(r.paid.by).n + ' · ' + r.paid.at + ' · ref ' + r.paid.ref : '',
      totals: { gross: f(T('gross')), nssf: f(T('nssf')), paye: f(T('paye')), heslb: f(T('heslb')), other: f(T('other')), net: f(T('net')), erNssf: f(T('erNssf')), sdl: f(T('sdl')), wcf: f(T('wcf')), cost: f(T('gross') + T('erNssf') + T('sdl') + T('wcf')) },
      lines: r.lines.map(l => Object.assign({ n: this.av(l.k).n, i: this.av(l.k).i, c: this.av(l.k).c }, Object.fromEntries(['basic', 'allow', 'gross', 'nssf', 'paye', 'heslb', 'other', 'net'].map(k => [k + 'T', f(l[k])])), { k: l.k, otherN: l.other, setOther: a => this.setDeduction(r.id, l.k, a), slip: () => this.printPayslip(r.id, l.k) })),
      canEdit: r.st === 'draft' && this.canPayrollAdmin(),
      canApprove: (r.st === 'draft' && role === 'gm') || ((r.st === 'mgmt' || r.st === 'draft') && role === 'ceo'), canReturn: r.st === 'mgmt' && role === 'ceo', canPay: r.st === 'approved' && role === 'finance',
      approve: () => this.approveRun(r.id), sendBack: n => this.returnRun(r.id, n), pay: ref => this.payRun(r.id, ref) };
  });
  const month = dayKey(0).slice(0, 7);
  return { PAY: { admin: this.canPayrollAdmin(), emps, runs, mySlips, thisMonth: monthLabel(month), hasThisMonth: P.runs.some(r => r.month === month), prepare: () => this.prepareRun(month), missing: emps.filter(e => !e.has).length } };
}
