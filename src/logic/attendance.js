// Staff attendance: people check in when they arrive and check out when they leave, on the reception
// screen. Each check-in or check-out can carry a small photo taken by the reception camera, so the GM
// sees who actually came in. One record per person per day: { id, k, date, in, out, inPhoto, outPhoto }.
import { dayKey } from './seed';

export const LATE_AFTER = '08:30';

export const attendanceMethods = {
  canSeeAttendance() { return ['ceo', 'gm', 'pa'].includes(this.state.role || 'ceo'); },
  canRunKiosk() { return ['reception', 'ceo', 'gm', 'pa'].includes(this.state.role || 'ceo'); },
  attendanceOf(k, date) { return (this.state.attendance || []).find(a => a.k === k && a.date === (date || dayKey(0))) || null; },
  clock(k, photo) {
    if (!this.canRunKiosk()) return { error: 'Check-in runs on the reception screen' };
    if (!(this.state.staff || []).some(p => p.k === k) && !Object.values(this.ROLES).some(r => r.k === k)) return { error: 'Not on the staff list' };
    const date = dayKey(0), time = this.now(), cur = this.attendanceOf(k, date), name = this.av(k).n;
    if (cur && cur.out) return { error: name + ' already checked out today at ' + cur.out };
    if (!cur) {
      const rec = { id: 'AT' + date.replace(/-/g, '') + k, k, date, in: time, out: '', inPhoto: photo || '', outPhoto: '' };
      this.setState(x => ({ attendance: [rec, ...(x.attendance || [])].slice(0, 3000) }));
      const late = time > LATE_AFTER;
      if (late && this.ROLES.gm && this.ROLES.gm.k !== k) this.notify({ to: this.ROLES.gm.k, ic: 'clock', t: 'Late arrival · ' + name, s: 'Checked in at ' + time, go: 'team' });
      return { kind: 'in', time, name, late };
    }
    this.setState(x => ({ attendance: (x.attendance || []).map(a => (a.id === cur.id ? Object.assign({}, a, { out: time, outPhoto: photo || '' }) : a)) }));
    return { kind: 'out', time, name, since: cur.in };
  }
};

const mins = t => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + m; };
const dur = (a, b) => { const d = Math.max(0, mins(b) - mins(a)); return Math.floor(d / 60) + 'h ' + String(d % 60).padStart(2, '0') + 'm'; };

export function attendanceVals(s) {
  const kiosk = this.canRunKiosk(), see = this.canSeeAttendance();
  if (!kiosk && !see) return { ATT: null };
  const today = dayKey(0), recs = (s.attendance || []).filter(a => a.date === today);
  const people = [...new Map([...(s.staff || []).map(p => p.k), ...['ceo', 'gm'].map(r => this.ROLES[r] && this.ROLES[r].k)].filter(Boolean).map(k => [k, k])).keys()]
    .map(k => { const a = this.av(k), r = recs.find(x => x.k === k); return { k, n: a.n, first: a.first, i: a.i, c: a.c, ph: a.ph, st: !r ? 'out' : r.out ? 'left' : 'in', in: r ? r.in : '', out: r ? r.out : '', late: !!r && r.in > LATE_AFTER, hours: r ? dur(r.in, r.out || this.now()) : '', inPhoto: r ? r.inPhoto : '', outPhoto: r ? r.outPhoto : '' }; })
    .sort((a, b) => a.n.localeCompare(b.n));
  const feed = recs.flatMap(r => [{ k: r.k, t: r.in, kind: 'in', photo: r.inPhoto }, ...(r.out ? [{ k: r.k, t: r.out, kind: 'out', photo: r.outPhoto }] : [])])
    .sort((a, b) => b.t.localeCompare(a.t)).map(e => Object.assign(e, { n: this.av(e.k).n, late: e.kind === 'in' && e.t > LATE_AFTER }));
  return { ATT: { kiosk, see, today, people, feed, lateAfter: LATE_AFTER,
    counts: { in: people.filter(p => p.st === 'in').length, left: people.filter(p => p.st === 'left').length, out: people.filter(p => p.st === 'out').length, late: people.filter(p => p.late).length },
    clock: (k, photo) => this.clock(k, photo) } };
}
