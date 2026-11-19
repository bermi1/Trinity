// The finance officer's daily money work: the petty cash book and the month's obligations.
// Petty cash: cash kept in the office box. Top-ups come from the bank; small payments go out with a
// numbered voucher; a cash count compares what is in the box with what the book says.
// Obligations: salaries and statutory payments due each month, marked paid from the cash book.
// Mixed into TrinityApp, so `this` is the app.
import { dayKey } from './seed';

export const PETTY_CATS = ['Transport', 'Office supplies', 'Refreshments', 'Courier', 'Repairs', 'Airtime', 'Other'];
// Tanzania: PAYE and SDL by the 7th, VAT return by the 20th, NSSF and WCF by the end of the following month.
export const OBLIGATIONS = [
  { k: 'sal', l: 'Salaries', cat: 'Salaries', day: 28 },
  { k: 'paye', l: 'PAYE & SDL (TRA)', cat: 'Statutory (NSSF, PAYE)', day: 7, match: /PAYE|SDL|TRA/i },
  { k: 'nssf', l: 'NSSF contributions', cat: 'Statutory (NSSF, PAYE)', day: 30, match: /NSSF/i },
  { k: 'wcf', l: 'WCF contribution', cat: 'Statutory (NSSF, PAYE)', day: 30, match: /WCF/i },
  { k: 'vat', l: 'VAT return & payment (TRA)', cat: 'Tax (VAT, WHT)', day: 20 },
  { k: 'rent', l: 'Office rent', cat: 'Rent', day: 5 }
];

export const pettyMethods = {
  pt() { return Object.assign({ open: 0, entries: [], counts: [] }, this.state.petty || {}); },
  pettyBalance() { const p = this.pt(); return p.open + p.entries.reduce((a, e) => a + (e.dir === 'in' ? 1 : -1) * e.amt, 0); },
  addPetty(f) {
    if (!['finance', 'ceo'].includes(this.state.role || 'ceo')) return 'Finance keeps the petty cash book';
    const amt = Math.round(+f.amt || 0); if (amt <= 0) return 'Enter the amount';
    const dir = f.dir === 'in' ? 'in' : 'out', p = this.pt();
    if (dir === 'out' && !f.cat) return 'Choose what it was for';
    if (dir === 'out' && !(f.who || '').trim()) return 'Enter who received the cash';
    if (dir === 'out' && amt > this.pettyBalance()) return 'Only ' + this.fmtT(this.pettyBalance()) + ' is in the cash box';
    const n = p.entries.filter(e => e.dir === 'out').length + 1;
    const e = { id: 'PC' + Date.now().toString(36), at: f.at || dayKey(0), dir, amt, cat: dir === 'in' ? 'Top-up from bank' : f.cat, what: (f.what || '').trim(), who: (f.who || '').trim(), voucher: dir === 'out' ? 'PCV-' + String(n).padStart(4, '0') : '', by: this.me().k };
    this.setState(x => ({ petty: Object.assign({}, this.pt(), { entries: [e, ...this.pt().entries] }) }));
    this.toast(dir === 'in' ? 'Top-up recorded · ' + this.fmtT(amt) : e.voucher + ' · ' + this.fmtT(amt) + ' paid to ' + e.who);
    return '';
  },
  countPetty(counted, note) {
    const c = Math.round(+counted); if (!(c >= 0) || counted === '') return 'Enter the cash counted';
    const expected = this.pettyBalance(), diff = c - expected;
    const rec = { at: dayKey(0) + ' ' + this.now(), counted: c, expected, diff, note: (note || '').trim(), by: this.me().k };
    this.setState(x => ({ petty: Object.assign({}, this.pt(), { counts: [rec, ...this.pt().counts] }) }));
    if (diff !== 0) this.notify({ to: this.ROLES.ceo.k, ic: 'wallet', t: 'Petty cash ' + (diff < 0 ? 'short' : 'over') + ' by ' + this.fmtT(Math.abs(diff)), s: 'Counted ' + this.fmtT(c) + ', book ' + this.fmtT(expected) + (rec.note ? ' · ' + rec.note : ''), go: 'finance' });
    this.toast(diff === 0 ? 'Cash count matches the book' : 'Cash count ' + (diff < 0 ? 'short' : 'over') + ' by ' + this.fmtT(Math.abs(diff)) + ' · Management told');
    return '';
  },
  // An obligation is paid this month when the cash book has a matching payment this month.
  obligationPaid(o) {
    const m = dayKey(0).slice(0, 7);
    return (this.state.ledger || []).find(l => l.dir === 'out' && (l.at || '').slice(0, 7) === m && l.cat === o.cat && (!o.match || o.match.test((l.party || '') + ' ' + (l.ref || '')))) || null;
  },
  payObligation(k, amt, ref) {
    const o = OBLIGATIONS.find(x => x.k === k); if (!o) return 'Unknown';
    return this.addEntry({ dir: 'out', amt, cat: o.cat, party: o.l, ref: ref || o.l, method: 'Bank' });
  }
};

export function pettyVals(s) {
  const role = s.role || 'ceo';
  if (!['finance', 'ceo'].includes(role)) return { PT: null };
  const p = this.pt(), today = new Date().getDate();
  let run = this.pettyBalance();
  const book = p.entries.map(e => { const r = Object.assign({}, e, { bal: run }); run -= (e.dir === 'in' ? 1 : -1) * e.amt; return r; });
  const month = dayKey(0).slice(0, 7), spentM = p.entries.filter(e => e.dir === 'out' && e.at.slice(0, 7) === month).reduce((a, e) => a + e.amt, 0);
  return {
    PT: {
      balance: this.fmtT(this.pettyBalance()), balanceN: this.pettyBalance(), spentMonth: this.fmtT(spentM), cats: PETTY_CATS,
      lastCount: p.counts[0] ? { at: p.counts[0].at, diff: p.counts[0].diff, t: p.counts[0].diff === 0 ? 'Matched' : (p.counts[0].diff < 0 ? 'Short ' : 'Over ') + this.fmtT(Math.abs(p.counts[0].diff)) } : null,
      book: book.map(e => ({ id: e.id, at: e.at, dir: e.dir, amt: this.fmtT(e.amt), cat: e.cat, what: e.what, who: e.who, voucher: e.voucher, bal: this.fmtT(e.bal), by: this.av(e.by).first })),
      add: f => this.addPetty(f), count: (c, n) => this.countPetty(c, n),
      obligations: OBLIGATIONS.map(o => { const paid = this.obligationPaid(o), last = ((this.state.payroll || {}).runs || []).find(r => r.st === 'paid'), due = last && last.due ? ({ sal: null, paye: last.due.paye, nssf: last.due.nssf, wcf: last.due.wcf })[o.k] : null;
        return { k: o.k, l: o.l, expect: due ? this.fmtT(due) + ' from the ' + last.month + ' payroll' : '', expectN: due || 0, day: o.day, due: o.day >= today ? 'Due by the ' + o.day + 'th' : 'Was due on the ' + o.day + 'th', late: !paid && o.day < today, paid: paid ? this.fmtT(paid.amt) + ' · ' + paid.at : '', pay: (a, r) => this.payObligation(o.k, a, r) }; })
    }
  };
}
