// The finance officer's monthly obligations: salaries and statutory payments due each month, marked paid
// from the cash book. (The old petty cash box is gone: daily expenses are paid from the float, see float.js;
// `pt()` still reads the stored 'petty' collection, where those expenses are kept.)
// Mixed into TrinityApp, so `this` is the app.
import { dayKey } from './seed';

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
  // An obligation is paid this month when the cash book has a matching payment this month.
  obligationPaid(o) {
    const m = dayKey(0).slice(0, 7);
    return (this.state.ledger || []).find(l => l.dir === 'out' && (l.at || '').slice(0, 7) === m && l.cat === o.cat && (!o.match || o.match.test((l.party || '') + ' ' + (l.ref || '')))) || null;
  },
  payObligation(k, amt, ref, fee) {
    const o = OBLIGATIONS.find(x => x.k === k); if (!o) return 'Unknown';
    return this.addEntry({ dir: 'out', amt, cat: o.cat, party: o.l, ref: ref || o.l, method: 'Bank', fee });
  }
};

export function pettyVals(s) {
  const role = s.role || 'ceo';
  if (!['finance', 'ceo'].includes(role)) return { PT: null };
  const today = new Date().getDate();
  return {
    PT: {
      obligations: OBLIGATIONS.map(o => { const paid = this.obligationPaid(o), last = ((this.state.payroll || {}).runs || []).find(r => r.st === 'paid'), due = last && last.due ? ({ sal: null, paye: last.due.paye, nssf: last.due.nssf, wcf: last.due.wcf })[o.k] : null;
        return { k: o.k, l: o.l, expect: due ? this.fmtT(due) + ' from the ' + last.month + ' payroll' : '', expectN: due || 0, day: o.day, due: o.day >= today ? 'Due by the ' + o.day + 'th' : 'Was due on the ' + o.day + 'th', late: !paid && o.day < today, paid: paid ? this.fmtT(paid.amt) + ' · ' + paid.at : '', pay: (a, r, fee) => this.payObligation(o.k, a, r, fee) }; })
    }
  };
}
