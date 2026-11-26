// Team & departments: Management and the General Manager place each staff member in a department
// and see who is where. Departments drive memos, reports, the Monday briefing and team targets.
import { DEPTS, OLD_DEPT } from './constants';
import { supabase } from '../lib/supabase';

export const TEAM_DEPTS = ['clientservice', 'creative', 'operations', 'production', 'finance', 'reception'];

export const teamMethods = {
  canManageTeam() { return ['ceo', 'gm'].includes(this.state.role || 'ceo'); },
  // Phone numbers live on the person's account (profiles.phone).
  async setPhone(k, phone) {
    if (!this.canManageTeam() && k !== this.me().k) return 'Only Management or the General Manager can change someone else’s number';
    const ph = String(phone || '').replace(/[^0-9+ ]/g, '').trim(), digits = ph.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 13) return 'Enter a valid phone number';
    if (this.state.db) { const { error } = await supabase.rpc('set_phone', { p_person_key: k, p_phone: ph }); if (error) return String(error.message || error).replace(/^.*?ERROR:\s*/, ''); }
    this.phones = Object.assign({}, this.phones || {}, { [k]: ph });
    this.setState(x => ({ phoneRev: (x.phoneRev || 0) + 1 }));
    this.toast('Phone saved · ' + this.av(k).first);
    return '';
  },
  // WhatsApp: a click-to-chat link to a person's saved number, with the message already written.
  waNumber(k) {
    const d = String((this.phones || {})[k] || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.startsWith('255') && d.length === 12) return d;
    if (d.startsWith('0') && d.length === 10) return '255' + d.slice(1);
    if (d.length === 9) return '255' + d;
    return d.length >= 11 ? d : '';
  },
  waOpen(k, text) {
    const n = this.waNumber(k), a = this.av(k);
    if (!n) { this.toast(a.first + ' has not added a WhatsApp number yet'); return false; }
    try { window.open('https://wa.me/' + n + '?text=' + encodeURIComponent(text + '\n\n- ' + this.me().n + ', Trinity Mark 360'), '_blank', 'noopener'); } catch (e) { /* pop-up blocked */ }
    return true;
  },
  setStaffDept(k, dept) {
    if (!this.canManageTeam()) return 'Only Management or the General Manager assigns departments';
    if (!DEPTS[dept]) return 'Choose a department';
    const p = (this.state.staff || []).find(x => x.k === k);
    if (!p) return 'Not on the staff list';
    if ((DEPTS[p.dept] ? p.dept : OLD_DEPT[p.dept]) === dept) return '';
    this.setState(x => ({ staff: x.staff.map(y => (y.k === k ? Object.assign({}, y, { dept }) : y)) }));
    if (k !== this.me().k) this.notify({ to: k, ic: 'users', t: 'Your department · ' + DEPTS[dept].l, s: 'Set by ' + this.me().n, go: 'today' });
    this.log('user', 'purple', this.av(k).n + ' · ' + DEPTS[dept].l, 'Department set by ' + this.me().n);
    this.toast(this.av(k).first + ' is now in ' + DEPTS[dept].l);
    return '';
  }
};

export function teamVals(s) {
  // Everyone keeps their own WhatsApp number (used for reminders and SMS).
  const meK = this.me().k, WA = { phone: (this.phones || {})[meK] || '', save: ph => this.setPhone(meK, ph), rev: s.phoneRev || 0 };
  if (!this.canManageTeam()) return { TEAM: null, WA };
  const staff = (s.staff || []).map(p => {
    const a = this.av(p.k), d = DEPTS[p.dept] ? p.dept : OLD_DEPT[p.dept] || '';
    return { k: p.k, n: a.n, i: a.i, c: a.c, ph: a.ph, title: p.role || '', dept: d, deptL: (DEPTS[d] || {}).l || 'No department', head: !!d && this.managerOf(d) === p.k, phone: (this.phones || {})[p.k] || '', setPhone: ph => this.setPhone(p.k, ph), move: to => this.setStaffDept(p.k, to) };
  }).sort((a, b) => a.n.localeCompare(b.n));
  const counts = TEAM_DEPTS.map(d => ({ d, l: DEPTS[d].l, n: staff.filter(p => p.dept === d).length }));
  const lead = ['ceo', 'gm'].map(r => { const R = this.ROLES[r] || {}; return { role: r === 'ceo' ? 'Management' : 'General Manager', n: R.n, t: R.t, i: R.k, c: this.av(R.k).c, phone: (this.phones || {})[R.k] || '', setPhone: ph => this.setPhone(R.k, ph) }; });
  return { WA, TEAM: { staff, counts, lead, depts: TEAM_DEPTS.map(d => ({ d, l: DEPTS[d].l })), none: staff.filter(p => !p.dept).length, goTargets: () => this.go('dashboard') } };
}
