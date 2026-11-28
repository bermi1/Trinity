// The float: the money Management gives Finance, and everything Finance pays from it.
// There is no separate cash box: requests paid, daily expenses (water, transport, printing…) and their
// transaction charges all come out of the float; change brought back on accepted advances goes back in.
// The book is derived from the records (see floatBook in finance.js). Each evening Finance sends
// Management a branded daily float report; the closing balance is carried down to the next day.
// Advances: whoever receives money for a request accounts for it (what was spent, receipts, the change);
// Finance accepts it or sends it back.
// Mixed into TrinityApp, so `this` is the app.
import { tzDay, tzTime, tzHour, parseFee, DOC_CSS, FIT_JS, COMPANY } from './finance';

export const EXP_CATS = ['Water', 'Transport', 'Printing', 'Airtime', 'Courier', 'Refreshments', 'Fuel', 'Other'];
export const METHODS = ['Cash', 'M-Pesa', 'Tigo Pesa', 'Airtel Money', 'Bank'];
// How the change on an advance comes back to Finance.
export const BACK_VIA = [['Cash', 'Cash to Finance'], ['M-Pesa', 'M-Pesa'], ['Not yet', 'Not yet']];

const num = v => Math.round(+String(v == null ? '' : v).replace(/[^0-9.]/g, '') || 0);
const n0 = v => Math.round(+v || 0).toLocaleString('en-US');
const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const utc = k => { const [y, m, d] = String(k).split('-').map(Number); return Date.UTC(y, m - 1, d); };
export const daysBetween = (a, b) => Math.round((utc(b) - utc(a)) / 864e5);
export const shiftDay = (k, n) => new Date(utc(k) + n * 864e5).toISOString().slice(0, 10);
export const dayLabel = (k, year) => new Date(utc(k)).toLocaleDateString('en-GB', Object.assign({ day: 'numeric', month: 'short', timeZone: 'UTC' }, year === false ? {} : { year: 'numeric' }));
const longDay = k => new Date(utc(k)).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

// The words for an advance's due date: "Due today" on the day, "Overdue" only from the next day.
export const dueText = (today, due) => (today === due ? 'Due today' : today > due ? 'Overdue' : 'Due ' + dayLabel(due, false));

export const floatMethods = {
  nowDate() { return new Date(); },
  fToday() { return tzDay(this.nowDate()); },
  canFloat() { return ['finance', 'ceo'].includes(this.state.role || 'ceo'); },
  seesFloat() { return ['finance', 'ceo', 'gm'].includes(this.state.role || 'ceo'); },
  // Days after payment by which an advance must be accounted for.
  accountDays() { return +((this.state.company || {}).accountDays) || 3; },
  // A record's date: today by default, up to 7 days back, never in the future.
  floatDate(at) {
    const t = this.fToday(); if (!at || at === t) return { at: t };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(at)) return { error: 'Choose the date' };
    if (at > t) return { error: 'The date cannot be in the future' };
    if (daysBetween(at, t) > 7) return { error: 'Up to 7 days back only' };
    return { at };
  },
  floatMinDay() { return shiftDay(this.fToday(), -7); },
  // What the person who received the money sees: the amount, the due date and the items to fill in.
  accountInfo(r) {
    const paid = r.paidAmt || r.amt, today = this.fToday(), due = shiftDay(r.paidOn || today, this.accountDays());
    const its = Array.isArray(r.items) && r.items.length ? r.items : [{ d: r.purpose || r.cat || '', amt: paid }];
    const items = its.map(x => ({ d: x.d || r.purpose || '', amt: String(its.length === 1 ? Math.min(paid, x.amt) : x.amt), asked: +x.qty > 1 ? 'Asked ' + this.reqItemCalc(x) : '' }));
    const open = !r.rec || r.rec.st === 'back';
    // "Due today" on the due date; overdue only from the next day.
    return { paid, paidT: this.fmtT(paid), due, dueLabel: dayLabel(due), dueToday: open && today === due, overdue: open && today > due, dueText: dueText(today, due), open, items, backNote: r.rec && r.rec.st === 'back' ? r.rec.backNote || '' : '', backVia: BACK_VIA };
  },
  floatBalance() { return this.floatDay(this.fToday()).close; },
  floatSent(D) { return (this.fl().closes || {})[D] || null; },
  projLabel(p) { if (!p) return 'Office'; const P = this.proj(p); return P.id ? P.client + ' · ' + P.name : 'Office'; },
  // Management hears when a day already reported to them changes, and when the float goes below zero.
  floatRevised(D, what) {
    if (!this.floatSent(D)) return;
    this.notify({ to: this.ROLES.ceo.k, ic: 'wallet', t: 'Float report revised · ' + dayLabel(D), s: what + ' · by ' + this.me().n, go: 'finance' });
  },
  floatCheckBelowZero(what) {
    const b = this.floatBalance(); if (b >= 0) return '';
    this.notify({ to: this.ROLES.ceo.k, ic: 'alert', t: 'Float below zero · −' + this.fmtT(-b), s: what + ' · by ' + this.me().n, go: 'finance' });
    return ' · ⚠ float is below zero, Management told';
  },

  // Money from the boss: only Management gives it, and that IS the float's "Float received" — Finance does
  // not record it again (the same money would count twice). Finance and the GM are told. Finance asks for
  // float instead (askFloat).
  receiveFloat(f) {
    if ((this.state.role || 'ceo') !== 'ceo') return (this.state.role || 'ceo') === 'finance' ? 'Only Management gives float · ask the boss for float instead' : 'Only Management gives float';
    const amt = num(f.amt); if (amt <= 0) return 'Enter the amount';
    const d = this.floatDate(f.at); if (d.error) return d.error;
    const me = this.me(), fl = this.fl();
    const g = { id: 'FG' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + me.k, amt, note: String(f.note || '').trim(), method: METHODS.includes(f.method) ? f.method : 'Cash', from: 'Management', by: me.k, at: d.at, time: tzTime(this.nowDate()) };
    this.setFloat({ grants: [g, ...fl.grants], asks: fl.asks.map(a => (a.st === 'open' ? Object.assign({}, a, { st: 'given' }) : a)) });
    [this.ROLES.finance && this.ROLES.finance.k, this.ROLES.gm && this.ROLES.gm.k].filter(k => k && k !== me.k).forEach(k => this.remind(k, 'Float received · ' + this.fmtT(amt) + ' from ' + me.n, 'float', 'wallet', (g.note ? g.note + ' · ' : '') + 'Balance ' + this.fmtT(this.floatBalance())));
    if (d.at !== this.fToday()) this.floatRevised(d.at, 'Float received ' + this.fmtT(amt) + ' added');
    this.toast('Float given to Finance · ' + this.fmtT(amt) + ' · balance ' + this.fmtT(this.floatBalance()));
    return '';
  },

  // A daily expense paid from the float, linked to a project or the office.
  expenseCheck(f) {
    const amt = num(f.amt); if (amt <= 0) return { error: 'Enter the amount' };
    if (!f.cat) return { error: 'Choose what it was for' };
    const what = String(f.note || '').trim(); if (f.cat === 'Other' && !what) return { error: 'Say what it was for' };
    const method = METHODS.includes(f.method) ? f.method : 'Cash';
    const fee = method === 'Cash' ? 0 : parseFee(f.fee); if (fee < 0) return { error: 'Charges must be a number' };
    if (f.p && !(this.state.projects || []).some(x => x.id === f.p)) return { error: 'Choose the project' };
    return { amt, cat: f.cat, what, method, fee, p: f.p || '', who: String(f.who || '').trim() };
  },
  // A row of the petty cash book. When it is paid to a staff member and settles one of their requests,
  // it IS that request's payment (payReq): counted once, under "Requests paid", never as an extra expense.
  async addExpense(f) {
    if (!this.canFloat()) return 'Only Finance and Management record expenses';
    if (f.settle) return this.settleFromBook(f);
    const c = this.expenseCheck(f); if (c.error) return c.error;
    if (f.payee && f.payee !== 'other') c.who = this.av(f.payee).n;
    const d = this.floatDate(f.at); if (d.error) return d.error;
    let photo = null;
    if (f.photo) { try { photo = await this.storeFile(f.photo); } catch (e) { return 'Receipt upload failed · ' + (e.message || e); } }
    const me = this.me(), list = this.pt().entries, pre = 'PCV-' + d.at.slice(2).replace(/-/g, '') + '-';
    let k = list.filter(e => (e.voucher || '').indexOf(pre) === 0).length + 1, voucher;
    do { voucher = pre + String(k++).padStart(2, '0'); } while (list.some(e => e.voucher === voucher));
    const e = Object.assign({ id: 'PC' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + me.k, at: d.at, time: tzTime(this.nowDate()), dir: 'out', amt: c.amt, cat: c.cat, what: c.what, who: c.who, p: c.p, method: c.method, voucher, by: me.k }, f.payee && f.payee !== 'other' ? { whoK: f.payee } : {}, c.fee ? { fee: c.fee } : {}, photo ? { photo } : {});
    this.setState(x => ({ petty: Object.assign({ open: 0, entries: [], counts: [] }, x.petty || {}, { entries: [e, ...((x.petty || {}).entries || [])] }) }));
    if (d.at !== this.fToday()) this.floatRevised(d.at, 'Expense ' + voucher + ' ' + this.fmtT(c.amt) + ' added');
    const warn = this.floatCheckBelowZero('Expense ' + voucher + ' · ' + c.cat + ' ' + this.fmtT(c.amt));
    this.toast(voucher + ' · ' + this.fmtT(c.amt) + ' · ' + c.cat + (c.fee ? ' + ' + this.fmtT(c.fee) + ' charges' : '') + warn);
    return '';
  },
  // Requests of a staff member that a book row could settle: approved ones can be paid; pending ones show,
  // waiting for approval (only Management may pay those directly, after a confirm).
  floatStaffReqs(k) {
    const ceo = (this.state.role || 'ceo') === 'ceo';
    return (this.state.reqs || []).filter(r => r.who === k && (r.st === 'approved' || r.st === 'pending')).map(r => ({ id: r.id, amt: r.amt, amtT: this.fmtT(r.amt), where: this.projLabel(r.p), p: r.p || '', what: (r.cat || 'Request') + (r.purpose ? ' · ' + (r.purpose.length > 48 ? r.purpose.slice(0, 46) + '…' : r.purpose) : ''), purpose: r.purpose || '', approved: r.st === 'approved', can: r.st === 'approved' || ceo, note: r.st === 'approved' ? 'Approved · ready to pay' : 'Waiting for approval · at ' + (this.CHAIN[r.step] || 'approval'), method: r.pay && METHODS.includes(r.pay.by) ? r.pay.by : '' }));
  },
  settleFromBook(f) {
    const r = (this.state.reqs || []).find(x => x.id === f.settle); if (!r) return 'Request not found';
    if (r.st === 'paid') return r.id + ' is already paid';
    if (r.st !== 'approved') {
      if (r.st !== 'pending') return r.id + ' cannot be paid';
      if ((this.state.role || 'ceo') !== 'ceo') return r.id + ' is waiting for approval · it can be paid once approved';
      if (!this.confirm('Pay ' + r.id + ' (' + this.fmtT(r.amt) + ') now? It has not finished its approvals.')) return 'Not paid';
    }
    const amt = num(f.amt) || r.amt, method = METHODS.includes(f.method) ? f.method : 'Cash';
    return this.payReq(r, String(amt), method === 'Cash' ? '' : f.fee, { method, date: f.at }) || '';
  },
  // The petty cash book, as in the Excel sheet: balance brought forward, one row per line (oldest first)
  // with the float's running balance after it, and the balance carried down.
  pettyBook(from, to) {
    to = to || from;
    const book = this.floatBook(), open = this.floatDay(from, book).open, rows = [{ id: 'bf', bf: true, at: from, what: 'Balance brought forward', bal: open }];
    let bal = open;
    book.filter(l => l.at >= from && l.at <= to).forEach(l => {
      if (!l.void) bal += (l.dir === 'in' ? 1 : -1) * l.amt;
      rows.push({ id: l.id, at: l.at, time: l.time, voucher: l.kind === 'expense' || (l.kind === 'charge' && l.src === 'petty') ? l.ref : l.kind === 'float' ? '' : l.ref, who: l.kind === 'float' ? 'From ' + l.who : l.who,
        what: l.kind === 'float' ? 'Float received' + (l.ref ? ' · ' + l.ref : '') : l.kind === 'request' ? 'Request ' + l.ref + ' · ' + l.cat : l.kind === 'charge' ? 'Transaction charges' : l.kind === 'returned' ? 'Change returned · ' + l.ref : l.cat + (l.what ? ' · ' + l.what : ''),
        where: l.kind === 'float' ? '' : this.projLabel(l.p), dir: l.dir, amt: l.amt, bal, void: !!l.void, kind: l.kind });
    });
    rows.push({ id: 'cd', cd: true, at: to, what: 'Balance carried down', bal });
    return rows;
  },
  pettyBookSheet(from, to) {
    return [['Date', 'Voucher', 'Paid to', 'What for', 'Project', 'Amount (TZS)', 'Balance (TZS)'],
      ...this.pettyBook(from, to).map(r => [r.at, r.voucher || '', r.who || '', r.what + (r.void ? ' (VOID)' : ''), r.where || '', r.bf || r.cd ? '' : r.void ? 0 : (r.dir === 'in' ? 1 : -1) * r.amt, r.bal])];
  },
  // Download the book for a day or a month as a real Excel file.
  async exportPettyBook(from, to) {
    const rows = this.pettyBookSheet(from, to), name = 'Trinity petty cash book ' + (from === to ? from : from + ' to ' + to) + '.xlsx';
    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.aoa_to_sheet(rows); ws['!cols'] = [{ wch: 11 }, { wch: 15 }, { wch: 22 }, { wch: 38 }, { wch: 30 }, { wch: 14 }, { wch: 14 }];
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Petty cash book');
      XLSX.writeFile(wb, name);
    } catch (e) { this.toast('Could not create the Excel file'); return rows; }
    return rows;
  },
  // Same-day correction, with a reason; the earlier values are kept on the record.
  editExpense(id, f) {
    if (!this.canFloat()) return 'Only Finance and Management change expenses';
    const e = this.pt().entries.find(x => x.id === id); if (!e) return 'Expense not found';
    if (e.void) return 'This expense is void';
    if (e.at !== this.fToday()) return 'Only today’s expenses can be changed · void it instead';
    const reason = String(f.reason || '').trim(); if (!reason) return 'Give the reason for the change';
    const c = this.expenseCheck(f); if (c.error) return c.error;
    const was = { amt: e.amt, cat: e.cat, what: e.what || '', who: e.who || '', p: e.p || '', method: e.method || 'Cash', fee: e.fee || 0 };
    const patch = { amt: c.amt, cat: c.cat, what: c.what, who: c.who, p: c.p, method: c.method, fee: c.fee, edits: [...(e.edits || []), { by: this.me().k, at: this.fToday() + ' ' + tzTime(this.nowDate()), reason, was }] };
    this.setState(x => ({ petty: Object.assign({}, x.petty, { entries: x.petty.entries.map(y => (y.id === id ? Object.assign({}, y, patch) : y)) }) }));
    this.floatRevised(e.at, 'Expense ' + e.voucher + ' changed · ' + reason);
    const warn = this.floatCheckBelowZero('Expense ' + e.voucher + ' changed to ' + this.fmtT(c.amt));
    this.toast(e.voucher + ' updated' + warn);
    return '';
  },
  // Never deleted: a voided expense stays in the list, struck through, and no longer counts.
  voidExpense(id, reason) {
    if (!this.canFloat()) return 'Only Finance and Management void expenses';
    const e = this.pt().entries.find(x => x.id === id); if (!e) return 'Expense not found';
    if (e.void) return 'Already void';
    reason = String(reason || '').trim(); if (!reason) return 'Give the reason for voiding it';
    const v = { by: this.me().k, at: this.fToday(), time: tzTime(this.nowDate()), reason };
    this.setState(x => ({ petty: Object.assign({}, x.petty, { entries: x.petty.entries.map(y => (y.id === id ? Object.assign({}, y, { void: v }) : y)) }) }));
    if (this.floatSent(e.at)) this.notify({ to: this.ROLES.ceo.k, ic: 'x', t: 'Expense voided after the report · ' + e.voucher, s: dayLabel(e.at) + ' · ' + this.fmtT(e.amt) + ' ' + e.cat + ' · ' + reason + ' · by ' + this.me().n, go: 'finance' });
    this.toast(e.voucher + ' voided');
    return '';
  },

  // Approved requests not yet paid (and those still in approval).
  floatWaiting(D) {
    const today = D || this.fToday(), reqs = this.state.reqs || [];
    const row = r => ({ id: r.id, who: this.av(r.who).n, where: this.projLabel(r.p), amt: r.amt, st: r.st === 'approved' ? 'Approved · to pay' : 'At ' + (this.CHAIN[r.step] || 'approval'), approved: r.st === 'approved', days: r.at ? Math.max(0, daysBetween(r.at, today)) : null });
    const ap = reqs.filter(r => r.st === 'approved'), pe = reqs.filter(r => r.st === 'pending');
    const tot = l => l.reduce((a, r) => a + r.amt, 0);
    const list = [...ap, ...pe].map(row);
    const ages = list.filter(x => x.days != null).map(x => x.days);
    return { list, n: ap.length, total: tot(ap), pendingN: pe.length, pendingTotal: tot(pe), oldest: ages.length ? Math.max(...ages) : null };
  },
  // Money paid out on requests that is not yet accounted for (as it stood at the end of day D).
  floatAdvances(D) {
    const day = D || this.fToday(), due = this.accountDays();
    return (this.state.reqs || []).filter(r => r.st === 'paid' && r.paidOn && r.paidOn <= day && !(r.rec && r.rec.st === 'ok' && (r.rec.okAt || '') <= day))
      .map(r => { const days = Math.max(0, daysBetween(r.paidOn, day)), st = r.rec && r.rec.st !== 'ok' ? r.rec.st : 'none';
        const dueOn = shiftDay(r.paidOn, due);
        return { id: r.id, whoK: r.who, who: this.av(r.who).n, p: r.p || '', where: this.projLabel(r.p), paidOn: r.paidOn, paid: r.paidAmt || r.amt, days, dueOn, overdue: st !== 'submitted' && days > due, dueToday: st !== 'submitted' && days === due, dueText: dueText(day, dueOn), st }; })
      .sort((a, b) => b.days - a.days);
  },
  // Spending per project (and the office) between two days. With net, change returned on accepted
  // advances is taken off: a project's spending is what was really spent.
  floatByProject(from, to, net) {
    const m = {};
    this.floatBook().filter(l => !l.void && l.at >= from && l.at <= to && l.kind !== 'float').forEach(l => {
      const r = m[l.p] || (m[l.p] = { p: l.p, requests: 0, expenses: 0, charges: 0, returned: 0 });
      if (l.kind === 'request') r.requests += l.amt; else if (l.kind === 'expense') r.expenses += l.amt; else if (l.kind === 'charge') r.charges += l.amt; else if (l.kind === 'returned') r.returned += l.amt;
    });
    // Requests are the amounts paid (never negative); change returned is its own line, taken off the total.
    return Object.values(m).map(r => Object.assign(r, { name: this.projLabel(r.p), net: r.requests - (net ? r.returned : 0), total: r.requests - (net ? r.returned : 0) + r.expenses + r.charges }))
      .filter(r => r.requests || r.expenses || r.charges || r.returned)
      .sort((a, b) => (!a.p) - (!b.p) || b.total - a.total);
  },

  // Everything the daily float report shows for day D.
  dailyFloat(D) {
    D = D || this.fToday();
    const book = this.floatBook(), d = this.floatDay(D, book), ok = d.lines.filter(l => !l.void), reqs = this.state.reqs || [];
    const req = id => reqs.find(r => r.id === id) || {};
    const grants = ok.filter(l => l.kind === 'float').map(l => ({ time: l.time, from: l.who, note: l.ref, method: l.method, amt: l.amt }));
    const submitted = reqs.filter(r => r.at === D).map(r => ({ id: r.id, who: this.av(r.who).n, where: this.projLabel(r.p), amt: r.amt, st: r.st === 'paid' ? 'Paid' : r.st === 'approved' ? 'Approved' : r.st === 'rejected' ? 'Rejected' : 'At ' + (this.CHAIN[r.step] || 'approval') }));
    const paid = ok.filter(l => l.kind === 'request').map(l => { const r = req(l.ref); return { time: l.time, id: l.ref, who: l.who, where: this.projLabel(l.p), asked: r.amt || l.amt, paid: l.amt, fee: r.payFee || 0, method: l.method }; });
    const expenses = d.lines.filter(l => l.kind === 'expense').map(l => ({ id: l.id, time: l.time, cat: l.cat, what: l.what, who: l.who, where: this.projLabel(l.p), amt: l.amt, fee: l.fee || 0, method: l.method, voucher: l.ref, void: !!l.void }));
    const returned = ok.filter(l => l.kind === 'returned').map(l => ({ id: l.ref, who: l.who, where: this.projLabel(l.p), paid: l.paid, spent: l.spent, back: l.amt, method: l.method }));
    const pm = {};
    ok.filter(l => l.kind === 'request' || l.kind === 'expense').forEach(l => { const r = pm[l.p] || (pm[l.p] = { p: l.p, name: this.projLabel(l.p), requests: 0, expenses: 0 }); r[l.kind === 'request' ? 'requests' : 'expenses'] += l.amt; });
    const byProject = Object.values(pm).map(r => Object.assign(r, { total: r.requests + r.expenses })).sort((a, b) => (!a.p) - (!b.p) || b.total - a.total);
    const waiting = this.floatWaiting(D), advances = this.floatAdvances(D), sent = this.floatSent(D);
    const fin = this.ROLES.finance.k;
    return { D, ref: 'DFR-' + D.replace(/-/g, ''), label: longDay(D), short: dayLabel(D, false), open: d.open, in: d.in, out: d.out, close: d.close, float: d.float, returnedT: d.returned,
      requestsT: d.requests, expensesT: d.expenses, charges: d.charges, check: d.open + d.in - d.out === d.close,
      grants, submitted, submittedT: submitted.reduce((a, r) => a + r.amt, 0), paid, expenses, returned, byProject, waiting, advances, advancesT: advances.reduce((a, x) => a + x.paid, 0),
      shortBy: Math.max(0, waiting.total - d.close), sent, revised: sent && (sent.close !== d.close || sent.out !== d.out || sent.in !== d.in) ? { was: sent.close, now: d.close } : null,
      preparedBy: this.av(sent ? sent.by : fin).n, preparedAt: sent ? sent.sentAt : '', nExp: expenses.filter(x => !x.void).length };
  },
  floatSummaryText(R) {
    return 'Trinity · Float ' + R.short + ': Open ' + n0(R.open) + ' | In ' + n0(R.in) + ' | Out ' + n0(R.out) + ' (' + R.paid.length + ' paid req, ' + R.nExp + ' expenses) | Close ' + (R.close < 0 ? '−' : '') + n0(Math.abs(R.close)) +
      ' | Waiting ' + R.waiting.n + ' = ' + n0(R.waiting.total) + (R.shortBy ? ' ⚠ short ' + n0(R.shortBy) : '') + (R.advances.length ? ' | Not accounted ' + R.advances.length + ' = ' + n0(R.advancesT) : '');
  },
  // The branded one-page A4 report (the invoice's look).
  floatReportHtml(R) {
    const T = v => n0(v), sg = v => (v < 0 ? '−' : '') + n0(Math.abs(v)), origin = typeof location !== 'undefined' ? location.origin : '';
    const none = '<p class=none>None today.</p>';
    const table = (head, rows, foot) => `<table><thead><tr>${head.map(h => `<th${/^[>]/.test(h) ? ' class=r' : ''}>${esc(h.replace(/^>/, ''))}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody>${foot ? `<tfoot><tr>${foot.map((c, i) => `<td${i && /^[0-9−,]/.test(c) ? ' class=r' : ''}>${esc(c)}</td>`).join('')}</tr></tfoot>` : ''}</table>`;
    const tr = (cells, cls) => `<tr${cls ? ' class=' + cls : ''}>${cells.map(c => (typeof c === 'object' && c ? `<td class=r>${esc(c.r)}</td>` : `<td>${esc(c)}</td>`)).join('')}</tr>`;
    const R0 = v => ({ r: T(v) });
    const sec = (no, title, extra, body) => `<h2><span>${no}</span>${esc(title)}${extra ? `<em>${esc(extra)}</em>` : ''}</h2>${body}`;
    const W = R.waiting;
    const html = `<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>${esc(R.ref)} · Daily float report</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel=stylesheet>
<style>
${DOC_CSS}
.inv{text-align:right}.inv h1{margin:0;font-size:24px;letter-spacing:.14em;color:#2B1459}.inv b{color:#8A7239}
.sum{display:grid;grid-template-columns:1.25fr 1fr;gap:14px;margin-bottom:6px}.sum .box div.l{display:flex;justify-content:space-between;gap:12px;padding:3px 0;white-space:nowrap}.sum .cl{border-top:2px solid #2B1459;margin-top:4px;padding-top:6px!important;font-size:15px;font-weight:800;color:#2B1459}
.chk{font-size:11px;color:#1F7549;margin-top:4px}.warn{margin-top:8px;padding:7px 10px;border:1.5px solid #B23A46;border-radius:8px;background:#FBEDEE;color:#8E2A35;font-size:11.5px;font-weight:700}
.rev{margin:0 0 8px;padding:7px 10px;border:1.5px solid #D89B2B;border-radius:8px;background:#FBF6EA;color:#8A6414;font-size:11.5px;font-weight:700}
h2{display:flex;align-items:baseline;gap:8px;margin:12px 0 2px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#2B1459}h2 span{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;background:#2B1459;color:#fff;font-size:10px;letter-spacing:0}h2 em{font-style:normal;font-weight:600;color:#6E6A7C;letter-spacing:0;text-transform:none;font-size:11px;margin-left:auto}
table{font-size:10.5px;margin-top:3px}th{padding:5px 6px;font-size:9.5px}td{padding:4px 6px;vertical-align:top}td.r,th.r{white-space:nowrap}tfoot td{font-weight:800;border-top:1.5px solid #2B1459;border-bottom:none}
tr.void td{text-decoration:line-through;color:#A9A3B8}.none{margin:2px 0 0;color:#6E6A7C;font-style:italic;font-size:11px}
.sign{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:20px}.sig{border-top:1px solid #CFC8DD;padding-top:6px;font-size:11px;color:#6E6A7C;min-height:56px;display:flex;flex-direction:column;justify-content:flex-end}.sig b{color:#17152A}
</style></head><body><div class=bar><button onclick="print()">Download PDF</button></div><div class=page><div class=fit>
<div class=top><img src="${origin}/brand/trinity-logo-full.png" alt="Trinity Mark"><div class=inv><h1>DAILY FLOAT REPORT</h1><div><b>${esc(R.ref)}</b></div><div>${esc(R.label)}</div></div></div>
<div class=band></div>
${R.revised ? `<div class=rev>Revised — closing was ${sg(R.revised.was)} when sent, now ${sg(R.revised.now)}.</div>` : ''}
<div class=sum><div class=box><div class=lbl>Summary (TZS)</div>
<div class=l><span>Opening balance (carried down from ${esc(dayLabel(shiftDay(R.D, -1), false))})</span><b>${sg(R.open)}</b></div>
<div class=l><span>+ Float received</span><b>${T(R.float)}</b></div>
<div class=l><span>+ Change returned</span><b>${T(R.returnedT)}</b></div>
<div class=l><span>− Total out</span><b>${T(R.out)}</b></div>
<div class="l cl"><span>= CLOSING BALANCE (carried down)</span><span>${sg(R.close)}</span></div>
<div class=chk>${sg(R.open)} + ${T(R.in)} − ${T(R.out)} = ${sg(R.close)} ${R.check ? '✓' : '✗'}</div>
${R.shortBy ? `<div class=warn>⚠ Approved requests waiting (${T(W.total)}) are more than the closing balance: short ${T(R.shortBy)}.</div>` : ''}
</div><div class=box><div class=lbl>Out today</div>
<div class=l><span>Requests paid (${R.paid.length})</span><b>${T(R.requestsT)}</b></div>
<div class=l><span>Daily expenses (${R.nExp})</span><b>${T(R.expensesT)}</b></div>
<div class=l><span>Transaction charges</span><b>${T(R.charges)}</b></div>
<div class=l style="margin-top:6px"><span>Waiting for payment (${W.n})</span><b>${T(W.total)}</b></div>
<div class=l><span>Not yet accounted for (${R.advances.length})</span><b>${T(R.advancesT)}</b></div>
</div></div>
${sec(1, 'Float received', R.grants.length ? T(R.float) : '', R.grants.length ? table(['Time', 'From', 'Note', 'Method', '>Amount'], R.grants.map(g => tr([g.time, g.from, g.note, g.method, R0(g.amt)]))) : none)}
${sec(2, 'Requests submitted today', R.submitted.length ? R.submitted.length + ' · ' + T(R.submittedT) : '', R.submitted.length ? table(['Request', 'Requested by', 'Project', '>Amount', 'Status'], R.submitted.map(r => tr([r.id, r.who, r.where, R0(r.amt), r.st]))) : none)}
${sec(3, 'Requests paid today', R.paid.length ? R.paid.length + ' · ' + T(R.requestsT) : '', R.paid.length ? table(['Time', 'Request', 'Paid to', 'Project', '>Asked', '>Paid', '>Charges', 'Method'], R.paid.map(r => tr([r.time, r.id, r.who, r.where, R0(r.asked), R0(r.paid), R0(r.fee), r.method]))) : none)}
${sec(4, 'Daily expenses', R.expenses.length ? R.nExp + ' · ' + T(R.expensesT) : '', R.expenses.length ? table(['Time', 'What for', 'Paid to', 'Project', '>Amount', '>Charges', 'Method', 'Voucher'], R.expenses.map(e => tr([e.time, e.cat + (e.what ? ' · ' + e.what : ''), e.who, e.where, R0(e.amt), R0(e.fee), e.method, e.voucher + (e.void ? ' (void)' : '')], e.void ? 'void' : ''))) : none)}
${sec(5, 'Change returned', R.returned.length ? T(R.returnedT) : '', R.returned.length ? table(['Request', 'From', 'Project', '>Advance', '>Spent', '>Returned', 'Method'], R.returned.map(r => tr([r.id, r.who, r.where, R0(r.paid), R0(r.spent), R0(r.back), r.method]))) : none)}
${sec(6, 'Spending by project today', '', R.byProject.length || R.charges ? table(['Project', '>Requests', '>Expenses', '>Total'], [...R.byProject.map(r => tr([r.name, R0(r.requests), R0(r.expenses), R0(r.total)])), ...(R.charges ? [tr(['Transaction charges', '', '', R0(R.charges)])] : [])], ['Total out', '', '', T(R.out)]) : none)}
${sec(7, 'Waiting for payment', W.list.length ? W.n + ' approved · ' + T(W.total) + (W.pendingN ? ' · ' + W.pendingN + ' in approval · ' + T(W.pendingTotal) : '') + (W.oldest != null ? ' · oldest ' + W.oldest + ' d' : '') : '', W.list.length ? table(['Request', 'Who', 'Project', '>Amount', 'Status / step', '>Days'], W.list.map(r => tr([r.id, r.who, r.where, R0(r.amt), r.st, r.days == null ? '' : { r: String(r.days) }]))) : '<p class=none>Nothing waiting.</p>')}
${sec(8, 'Advances not yet accounted for', R.advances.length ? R.advances.length + ' · ' + T(R.advancesT) : '', R.advances.length ? table(['Who', 'Request', 'Project', 'Paid on', '>Amount', '>Days', 'Status'], R.advances.map(a => tr([a.who, a.id, a.where, a.paidOn, R0(a.paid), { r: String(a.days) }, a.st === 'submitted' ? 'Receipts with Finance' : a.st === 'back' ? 'Sent back' : a.dueText])), ['Total', '', '', '', T(R.advancesT), '', '']) : '<p class=none>All advances are accounted for.</p>')}
<div class=sign><div class=sig><span>Prepared by (Finance)</span><b>${esc(R.preparedBy)}</b><span>Sign · ${esc(R.preparedAt || 'time')}</span></div><div class=sig><span>Received by Management</span><b>&nbsp;</b><span>Sign · date</span></div></div>
</div>
<div class=foot><span>${COMPANY.box}</span><span>${esc(R.ref)} · Trinity Mark 360</span></div>
</div><script>${FIT_JS}</script></body></html>`;
    return html;
  },
  // Download PDF: the printable page in a new tab (Print → Save as PDF; works on phones too).
  printDailyFloat(D) {
    const html = this.floatReportHtml(this.dailyFloat(D));
    let w = null; try { w = window.open('', '_blank'); } catch (e) { w = null; }
    if (!w) { this.toast('Allow pop-ups to open the report'); return html; }
    w.document.open(); w.document.write(html); w.document.close();
    return html;
  },
  // Send to the boss: keep a snapshot of the day, file the report in Reports for Management (with a
  // notification) and open WhatsApp with a short summary.
  // With opts.shared the phone's share sheet already sent the text (navigator.share), so WhatsApp is not opened.
  async sendDailyFloat(D, opts) {
    if ((this.state.role || 'ceo') !== 'finance') return 'Finance sends the daily float report';
    D = D || this.fToday();
    const R0 = this.dailyFloat(D), text = this.floatSummaryText(R0);
    if (!(opts && opts.shared)) { try { window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener'); } catch (e) { /* pop-up blocked */ } }
    const me = this.me();
    this.setFloat({ closes: Object.assign({}, this.fl().closes || {}, { [D]: { open: R0.open, in: R0.in, out: R0.out, close: R0.close, sentAt: this.fToday() + ' ' + tzTime(this.nowDate()), by: me.k } }) });
    const html = this.floatReportHtml(this.dailyFloat(D));
    let file = null; try { if (typeof File !== 'undefined') file = new File([html], 'Daily float report ' + D + '.html', { type: 'text/html' }); } catch (e) { file = null; }
    // Management and the General Manager both receive it (a notification each, and the report in Reports).
    return this.sendReport({ to: [this.ROLES.ceo.k, ...(this.ROLES.gm && this.ROLES.gm.k !== this.ROLES.ceo.k ? [this.ROLES.gm.k] : [])], kind: 'daily', title: 'Daily float report · ' + dayLabel(D), summary: text, file });
  },

  // ---- Advances: the person accounts for the money; Finance accepts or sends it back.
  sendBackRec(id, note) {
    if (!this.canFloat()) return 'Only Finance checks receipts';
    const r = (this.state.reqs || []).find(x => x.id === id); if (!r || !r.rec) return 'Nothing to check';
    if (r.rec.st !== 'submitted') return 'These receipts are not waiting to be checked';
    note = String(note || '').trim(); if (!note) return 'Say what needs fixing';
    this.setState(x => ({ reqs: x.reqs.map(q => (q.id === id ? Object.assign({}, q, { rec: Object.assign({}, q.rec, { st: 'back', backNote: note, backBy: this.me().k, backAt: this.fToday() }) }) : q)) }));
    this.notify({ to: r.who, ic: 'receipt', t: 'Receipts sent back · ' + r.id, s: note + ' · from ' + this.me().n, go: 'request:' + r.id });
    this.toast('Sent back to ' + this.av(r.who).n);
    return '';
  },
  // Reminders on day 3 after payment and every day after, until the advance is accounted for.
  // Finance's app sends them for everyone; anyone else's app only for their own.
  accountReminders() {
    const today = this.fToday(), due = this.accountDays(), me = this.me().k, fin = (this.state.role || 'ceo') === 'finance';
    const list = (this.state.reqs || []).filter(r => r.st === 'paid' && r.paidOn && (!r.rec || r.rec.st === 'back') && daysBetween(r.paidOn, today) >= due && r.remindOn !== today && (fin || r.who === me));
    if (!list.length) return 0;
    list.forEach(r => this.notify({ to: r.who, ic: 'receipt', t: 'Account for ' + r.id + ' · ' + this.fmtT(r.paidAmt || r.amt) + ' · ' + (daysBetween(r.paidOn, today) > due ? 'overdue' : 'due today'), s: 'Paid ' + dayLabel(r.paidOn) + ' · add what you spent, the receipts and the change', go: 'request:' + r.id }));
    const ids = list.map(r => r.id);
    this.setState(x => ({ reqs: x.reqs.map(q => (ids.includes(q.id) ? Object.assign({}, q, { remindOn: today }) : q)) }));
    return list.length;
  },
  // What Finance (and the person) see of an advance's accounting.
  recView(r) {
    const rc = r && r.rec; if (!rc) return null;
    const paid = r.paidAmt || r.amt, files = rc.files && rc.files.length ? rc.files : rc.file ? [rc.file] : [];
    return { id: r.id, who: this.av(r.who).n, where: this.projLabel(r.p), paid: this.fmtT(paid), spent: this.fmtT(rc.spent), back: this.fmtT(rc.back || 0), backN: rc.back || 0,
      backVia: rc.backVia || '', over: rc.over > 0 ? this.fmtT(rc.over) : '', short: rc.short > 0 ? this.fmtT(rc.short) : '', at: rc.at || '',
      items: (rc.items || []).map(x => ({ d: x.d, amt: this.fmtT(x.amt) })), files: files.map(f => ({ name: f.name, open: () => this.openDoc({ n: f.name, url: f.url, path: f.path }) })),
      st: rc.st, stl: ({ submitted: 'Receipts to check', back: 'Sent back', ok: 'Accepted' })[rc.st] || rc.st, note: rc.backNote || '',
      okLine: rc.st === 'ok' ? 'Accepted ' + (rc.okAt || '') + (rc.by ? ' · ' + this.av(rc.by).n : '') + (rc.back > 0 ? ' · change ' + this.fmtT(rc.back) + ' by ' + (rc.backVia || 'Cash') : '') : '',
      canOk: rc.st === 'submitted' && this.canFloat(), ok: via => this.confirmRec(r.id, { backVia: via }), sendBack: n => this.sendBackRec(r.id, n) };
  }
};

// Values for the Float page (Finance and Management record; the GM views).
export function floatVals(s) {
  const role = s.role || 'ceo';
  if (!['finance', 'ceo', 'gm'].includes(role)) return { FL: null, floatNudge: null, PAYQ: null };
  const today = this.fToday(), book = this.floatBook(), td = this.floatDay(today, book), f = this.fmtT.bind(this);
  const sg = v => (v < 0 ? '−' : '') + f(Math.abs(v));
  const canEdit = this.canFloat(), entries = this.pt().entries;
  const ICON = { float: 'wallet', request: 'banknote', expense: 'receipt', charge: 'pie', returned: 'refresh' };
  const line = l => {
    const e = l.kind === 'expense' ? entries.find(x => x.id === l.id) : null;
    return { id: l.id, kind: l.kind, time: l.time || '', dir: l.dir, amt: (l.dir === 'in' ? '+' : '−') + f(l.amt), raw: l.amt, void: !!l.void, ic: ICON[l.kind] || 'wallet',
      what: l.kind === 'float' ? 'Float received from Management' : l.kind === 'request' ? (l.cat || 'Request') + ' · ' + l.ref : l.kind === 'charge' ? 'Charges · ' + l.ref : l.kind === 'returned' ? 'Change returned · ' + l.ref : l.cat + (l.what ? ' · ' + l.what : ''),
      where: l.kind === 'float' ? (l.ref || '') : this.projLabel(l.p), who: l.who || '', method: l.method || '', ref: l.ref || '', by: l.by ? this.av(l.by).n : '', p: l.p || '',
      photo: e && e.photo ? () => this.openDoc({ n: e.photo.name, url: e.photo.url, path: e.photo.path }) : null,
      voidInfo: e && e.void ? 'Void · ' + e.void.reason + ' · ' + this.av(e.void.by).n + ' ' + e.void.at : '',
      edits: e && e.edits ? e.edits.map(x => x.at + ' · ' + this.av(x.by).first + ' · ' + x.reason + ' (was ' + f(x.was.amt) + ')') : [],
      expense: e ? { amt: String(e.amt), cat: e.cat, note: e.what || '', p: e.p || '', who: e.who || '', method: e.method || 'Cash', fee: e.fee ? String(e.fee) : '', at: e.at } : null,
      canEdit: canEdit && !!e && !e.void && e.at === today, canVoid: canEdit && !!e && !e.void,
      edit: x => this.editExpense(l.id, x), doVoid: r => this.voidExpense(l.id, r),
      openReq: l.src === 'req' ? () => this.openReq(l.ref) : null };
  };
  const dayView = D => { const d = this.floatDay(D, book); return { D, label: dayLabel(D), isToday: D === today, open: sg(d.open), in: f(d.in), out: f(d.out), close: sg(d.close), neg: d.close < 0, lines: d.lines.slice().reverse().map(line), sent: !!this.floatSent(D) }; };
  const W = this.floatWaiting(), adv = this.floatAdvances();
  const reqs = s.reqs || [], toCheck = reqs.filter(r => r.st === 'paid' && r.rec && r.rec.st === 'submitted');
  const monthStart = today.slice(0, 8) + '01', start = book.length ? book[0].at : today;
  const proj = range => { const [a, b] = range === 'month' ? [monthStart, today] : range === 'all' ? [start, today] : [today, today];
    const rows = this.floatByProject(a, b, true), t = k => rows.reduce((x, r) => x + r[k], 0);
    // Requests = what was paid out; change returned shows on its own line; the total is net of it.
    return { rows: rows.map(r => ({ p: r.p, name: r.name, requests: f(r.requests), expenses: f(r.expenses), charges: f(r.charges), chargesN: r.charges, total: f(r.total), returned: r.returned ? f(r.returned) : '', returnedN: r.returned })),
      total: { requests: f(t('requests')), expenses: f(t('expenses')), charges: f(t('charges')), returned: f(t('returned')), returnedN: t('returned'), total: f(t('total')) } }; };
  const report = D => { const R = this.dailyFloat(D); return Object.assign({}, R, { text: this.floatSummaryText(R), sentLine: R.sent ? 'Sent to Management ' + R.sent.sentAt + ' · ' + this.av(R.sent.by).n : '' }); };
  const nudge = role === 'finance' && this.fl().grants.length && tzHour(this.nowDate()) >= 18 && !this.floatSent(today)
    ? { t: 'Send today’s float report', s: 'Closing balance ' + sg(td.close) + ' · it goes to Management with the PDF', go: () => this.go('float', { flView: 'report', flDay: today }) } : null;
  // Approved requests waiting for payment: each opens the payment confirm sheet.
  const waitList = reqs.filter(r => r.st === 'approved').map(r => ({ id: r.id, who: this.av(r.who).n, what: this.reqWhat(r), where: this.projLabel(r.p), amtT: f(r.amt), via: r.pay && r.pay.by ? r.pay.by : '', pay: () => this.setState({ floatSheet: null, paySheet: r.id }) }));
  // Requests waiting for Finance's Verify step (Finance only): Verify sends them on, Send back returns them with a reason.
  const verify = role !== 'finance' ? [] : this.visibleReqs(s).filter(r => r.st === 'pending' && r.step === 3).map(r => ({ id: r.id, who: this.av(r.who).n, what: this.reqWhat(r), amtT: f(r.amt),
    verify: () => this.decide(r, true), open: () => this.openReq(r.id),
    sendBack: () => { let why = ''; try { why = window.prompt('Send ' + r.id + ' back to ' + this.av(r.who).first + ': what needs fixing?', ''); } catch (e) { why = ''; } why = String(why || '').trim(); if (!why) return 'Say what needs fixing'; this.decide(r, false, why); return ''; } }));
  // The open sheet lives in the app state, so the phone's back button closes it (see onPopState).
  const closeSheet = force => { if (!force && this._floatDirty && !this.confirm('Discard this expense? What you typed is not saved.')) return false; this._floatDirty = false; this.setState({ floatSheet: null }); return true; };
  return {
    floatNudge: nudge,
    PAYQ: this.payVals(s),
    FL: {
      sheet: s.floatSheet || null, setSheet: x => { this._floatDirty = false; this.setState({ floatSheet: x }); }, closeSheet, setDirty: d => { this._floatDirty = !!d; },
      waitList, verify, verifyN: verify.length, goReceipts: () => this.go('receipts'),
      role, canEdit, canSend: role === 'finance', today, yesterday: shiftDay(today, -1), minDay: shiftDay(today, -7), start,
      view: s.flView || 'day', setView: k => this.setState({ flView: k }), day: s.flDay && s.flDay <= today ? s.flDay : today, setDay: k => this.setState({ flDay: k > today ? today : k }), shift: shiftDay,
      balance: sg(td.close), balanceN: td.close, neg: td.close < 0, todayLine: { open: sg(td.open), in: f(td.in), out: f(td.out) },
      dayView, line, proj, report, dayLabel,
      waiting: { n: W.n, total: f(W.total), go: () => this.go('requests', { reqFilter: 'approved' }) },
      advances: adv.map(a => Object.assign({}, a, { paidT: f(a.paid), open: () => this.openReq(a.id) })), overdueN: adv.filter(a => a.overdue).length, accountDays: this.accountDays(),
      toCheck: toCheck.map(r => this.recView(r)),
      cats: EXP_CATS, methods: METHODS, backVia: BACK_VIA,
      projects: [{ v: '', l: 'Office' }, ...(s.projects || []).filter(p => p.st !== 'done').map(p => ({ v: p.id, l: p.client + ' · ' + p.name }))],
      people: this.everyone().map(k => { const a = this.av(k); return { v: k, l: a.n, i: a.i, c: a.c, ph: a.ph }; }).sort((x, y) => x.l.localeCompare(y.l)),
      staffReqs: k => this.floatStaffReqs(k),
      book: (a, b) => this.pettyBook(a, b).map(r => Object.assign({}, r, { amtT: r.bf || r.cd ? '' : (r.dir === 'in' ? '+' : '−') + n0(r.amt), balT: (r.bal < 0 ? '−' : '') + n0(Math.abs(r.bal)), neg: r.bal < 0, dayT: dayLabel(r.at, false) })),
      exportBook: (a, b) => this.exportPettyBook(a, b), monthStart,
      addExpense: x => this.addExpense(x), receive: x => this.receiveFloat(x), canGive: role === 'ceo', canAsk: role === 'finance',
      ask: x => this.askFloat(num(x.amt), x.note), shortfall: Math.max(0, W.total - td.close), asked: this.fl().asks.find(a => a.st === 'open') || null,
      print: D => this.printDailyFloat(D), send: (D, o) => this.sendDailyFloat(D, o), shareUrl: typeof location !== 'undefined' ? location.origin + '/?go=float' : ''
    }
  };
}

// The payment confirm sheet (Float's "Waiting to be paid" list and the Requests page's "Mark paid"): the
// amount (editable, up to what was asked), how it is paid (from the request), the charges and the day.
export function payVals(s) {
  const r = s.paySheet ? (s.reqs || []).find(x => x.id === s.paySheet) : null;
  if (!r || r.st !== 'approved' || !this.canPay()) return null;
  const by = r.pay && r.pay.by, method = METHODS.includes(by) ? by : by ? (r.pay.bank || /bank/i.test(by) ? 'Bank' : 'M-Pesa') : 'Cash';
  return { id: r.id, who: this.av(r.who).n, first: this.av(r.who).first, what: this.reqWhat(r), where: this.projLabel(r.p), asked: r.amt, askedT: this.fmtT(r.amt),
    payTo: r.pay ? [r.pay.by, r.pay.bank, r.pay.name, r.pay.no].filter(Boolean).join(' · ') : '', method, methods: METHODS, today: this.fToday(), minDay: this.floatMinDay(),
    floatLeft: this.fl().grants.length ? this.floatBalance() : null,
    pay: x => { const m = this.payReq(r, x.amt, x.method === 'Cash' ? '' : x.fee, { method: x.method, date: x.at }); if (!m) this.setState({ paySheet: null }); return m; },
    close: () => this.setState({ paySheet: null }) };
}
