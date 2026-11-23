// Team & departments: Management and the General Manager place each staff member in a department
// and see who is where. Departments drive memos, reports, the Monday briefing and team targets.
import { DEPTS, OLD_DEPT } from './constants';

export const TEAM_DEPTS = ['clientservice', 'creative', 'operations', 'production', 'finance', 'reception'];

export const teamMethods = {
  canManageTeam() { return ['ceo', 'gm'].includes(this.state.role || 'ceo'); },
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
  if (!this.canManageTeam()) return { TEAM: null };
  const staff = (s.staff || []).map(p => {
    const a = this.av(p.k), d = DEPTS[p.dept] ? p.dept : OLD_DEPT[p.dept] || '';
    return { k: p.k, n: a.n, i: a.i, c: a.c, ph: a.ph, title: p.role || '', dept: d, deptL: (DEPTS[d] || {}).l || 'No department', head: !!d && this.managerOf(d) === p.k, move: to => this.setStaffDept(p.k, to) };
  }).sort((a, b) => a.n.localeCompare(b.n));
  const counts = TEAM_DEPTS.map(d => ({ d, l: DEPTS[d].l, n: staff.filter(p => p.dept === d).length }));
  const lead = ['ceo', 'gm'].map(r => { const R = this.ROLES[r] || {}; return { role: r === 'ceo' ? 'Management' : 'General Manager', n: R.n, t: R.t, i: R.k, c: this.av(R.k).c, phone: (this.phones || {})[R.k] || '' }; });
  return { TEAM: { staff, counts, lead, depts: TEAM_DEPTS.map(d => ({ d, l: DEPTS[d].l })), none: staff.filter(p => !p.dept).length, goTargets: () => this.go('dashboard') } };
}
