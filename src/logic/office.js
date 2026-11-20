// Meetings and the reception desk.
// Meetings: Management (or a manager) invites everyone, an office or chosen people. A client
// meeting also asks Reception to welcome the guest at that time.
// Reception desk: a touch screen at the front door replaces the visitors' book.
// Mixed into TrinityApp, so `this` is the app.
import { dayKey } from './seed';
import { DEPTS } from './constants';

const OFFICES = ['clientservice', 'creative', 'operations', 'finance', 'production', 'reception'];
const dayLabel = k => { if (k === dayKey(0)) return 'Today'; if (k === dayKey(1)) return 'Tomorrow'; const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); };

const MON = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
// Project due dates are written like "10 Oct": read them as this year (or next, if already well past).
const dueKey = due => { const m = /^(\d{1,2})\s+([A-Z][a-z]{2})/.exec(due || ''); if (!m || MON[m[2]] == null) return ''; const now = new Date(); const d = new Date(now.getFullYear(), MON[m[2]], +m[1]); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
export const CAL_KINDS = ['Staff meeting', 'Presentation', 'Event', 'Holiday', 'Deadline', 'Other'];

export const officeMethods = {
  addCal(f) {
    if (!(f.title || '').trim()) return 'Give it a title';
    if (!f.date) return 'Choose the day';
    const e = { id: 'CE' + Date.now().toString(36), title: f.title.trim(), date: f.date, time: f.time || '', kind: f.kind || 'Event', by: this.me().k };
    this.setState(x => ({ cal: [e, ...(x.cal || [])] }));
    this.toast('Added to the calendar · ' + e.title);
    return '';
  },
  removeCal(id) { this.setState(x => ({ cal: (x.cal || []).filter(e => e.id !== id) })); },
  canCreateMeeting() { const d = this.myDept(); return this.isTop() || ['finance', 'pa'].includes(this.state.role) || (d && this.isManagerOf(d)) || this.state.role === 'reception'; },
  meetingPeople(m) {
    const t = m.to || {}, out = new Set(t.people || []);
    if (t.all) this.everyone().forEach(k => out.add(k));
    (t.depts || []).forEach(d => this.teamOf(d).forEach(k => out.add(k)));
    out.add(m.by);
    return [...out];
  },
  createMeeting(f) {
    if (!(f.title || '').trim()) return 'Give the meeting a title';
    if (!f.date || !f.time) return 'Choose the day and time';
    const to = { all: !!f.all, depts: f.depts || [], people: f.people || [] };
    if (!to.all && !to.depts.length && !to.people.length && f.kind !== 'client') return 'Choose who is invited';
    if (f.kind === 'client' && !(f.guest || '').trim()) return 'Enter the guest’s name';
    const me = this.me().k, id = 'MT' + Date.now().toString(36);
    const m = { id, title: f.title.trim(), date: f.date, time: f.time, place: f.place || 'Boardroom', kind: f.kind === 'client' ? 'client' : 'internal', to, guest: f.kind === 'client' ? { name: f.guest.trim(), co: (f.co || '').trim(), phone: (f.phone || '').trim() } : null, by: me, at: dayKey(0) };
    const visitor = m.guest ? { id: 'V' + Date.now().toString(36), name: m.guest.name, co: m.guest.co, phone: m.guest.phone, purpose: m.title, host: me, date: m.date, time: m.time, st: 'expected', meeting: id } : null;
    this.setState(x => ({ meetings: [m, ...(x.meetings || [])], visitors: visitor ? [visitor, ...(x.visitors || [])] : x.visitors }));
    const when = dayLabel(m.date) + ' ' + m.time;
    this.meetingPeople(m).filter(k => k !== me).forEach(k => this.notify({ to: k, ic: 'calendar', t: 'Meeting: ' + m.title, s: when + ' · ' + m.place + ' · from ' + this.me().n, go: 'meetings' }));
    if (m.guest) { const rk = this.ROLES.reception.k; if (rk !== me) this.notify({ to: rk, ic: 'users', t: 'Please welcome ' + m.guest.name + (m.guest.co ? ' from ' + m.guest.co : ''), s: when + ' · ' + m.title + ' · host ' + this.me().n, go: 'reception' }); }
    this.toast('Meeting sent · ' + when);
    this.log('calendar', 'purple', 'Meeting · ' + m.title, when);
    return '';
  },
  cancelMeeting(id) {
    const m = (this.state.meetings || []).find(x => x.id === id); if (!m) return;
    this.setState(x => ({ meetings: x.meetings.filter(y => y.id !== id), visitors: (x.visitors || []).filter(v => v.meeting !== id || v.st !== 'expected') }));
    this.meetingPeople(m).filter(k => k !== this.me().k).forEach(k => this.notify({ to: k, ic: 'calendar', t: 'Cancelled: ' + m.title, s: dayLabel(m.date) + ' ' + m.time, go: 'meetings' }));
    this.toast('Meeting cancelled');
  },

  // Anyone can register a visitor they expect: it goes to the front desk, Reception is told,
  // and the GM and Management see it on the calendar.
  addAppointment(f) {
    if (!(f.name || '').trim()) return 'Enter the visitor’s name';
    if (!f.date || !f.time) return 'Choose the day and time';
    const me = this.me().k, id = 'V' + Date.now().toString(36);
    const v = { id, name: f.name.trim(), co: (f.co || '').trim(), phone: (f.phone || '').trim(), purpose: (f.purpose || '').trim() || 'Appointment', host: me, date: f.date, time: f.time, st: 'expected', appt: true };
    this.setState(x => ({ visitors: [v, ...(x.visitors || [])] }));
    const rk = this.ROLES.reception.k, when = dayLabel(v.date) + ' ' + v.time;
    if (rk !== me) this.notify({ to: rk, ic: 'users', t: 'Expected visitor: ' + v.name + (v.co ? ' from ' + v.co : ''), s: when + ' · for ' + this.me().n + ' · ' + v.purpose, go: 'reception' });
    this.toast('Front desk told · ' + v.name + ' · ' + when);
    return '';
  },
  // Reception: a guest signs in at the front desk; the person or office they visit is told.
  checkIn(f) {
    if (!(f.name || '').trim()) return 'Enter the guest’s name';
    if (!f.dept && !f.host) return 'Choose who they are visiting';
    const host = f.host || this.managerOf(f.dept);
    const v = { id: 'V' + Date.now().toString(36), name: f.name.trim(), co: (f.co || '').trim(), phone: (f.phone || '').trim(), purpose: f.purpose || 'Meeting', host, dept: f.dept || '', date: dayKey(0), time: this.now(), st: 'in' };
    this.setState(x => ({ visitors: [v, ...(x.visitors || [])] }));
    if (host && host !== this.me().k) this.notify({ to: host, ic: 'users', t: 'Your guest has arrived: ' + v.name, s: (v.co ? v.co + ' · ' : '') + v.purpose + ' · at reception', go: 'reception' });
    this.toast('Welcome, ' + v.name.split(' ')[0] + ' · ' + this.av(host).n + ' has been told');
    return '';
  },
  arrived(id) {
    const v = (this.state.visitors || []).find(x => x.id === id); if (!v) return;
    this.setState(x => ({ visitors: x.visitors.map(y => (y.id === id ? Object.assign({}, y, { st: 'in', time: this.now(), date: dayKey(0) }) : y)) }));
    if (v.host && v.host !== this.me().k) this.notify({ to: v.host, ic: 'users', t: 'Your guest has arrived: ' + v.name, s: (v.co ? v.co + ' · ' : '') + v.purpose, go: 'reception' });
    this.toast(v.name + ' checked in · ' + this.av(v.host).n + ' told');
  },
  checkOut(id) { this.setState(x => ({ visitors: x.visitors.map(y => (y.id === id ? Object.assign({}, y, { st: 'out', outAt: this.now() }) : y)) })); }
};

export function officeVals(s) {
  const me = this.me().k, today = dayKey(0);
  const face = k => { const a = this.av(k); return { v: k, l: a.n, i: a.i, c: a.c, ph: a.ph }; };
  const mine = (s.meetings || []).filter(m => m.date >= today && (this.isTop() || (s.role || 'ceo') === 'pa' || this.meetingPeople(m).includes(me))).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const days = [], end = dayKey(45);
  const dayOf = k => { let d = days.find(x => x.k === k); if (!d) days.push(d = { k, l: dayLabel(k), items: [] }); return d; };
  (s.cal || []).filter(e => e.date >= today && e.date <= end).forEach(e => dayOf(e.date).items.push({ id: e.id, time: e.time || 'All day', title: e.title, place: e.kind, kind: 'cal', who: 'Everyone', by: this.av(e.by).n, canCancel: e.by === me || this.isTop(), cancel: () => this.removeCal(e.id) }));
  this.visibleProjects().filter(p => p.st !== 'done').forEach(p => { const k = dueKey(p.due); if (k && k >= today && k <= end) dayOf(k).items.push({ id: 'due' + p.id, time: 'Due', title: p.client + ' · ' + p.name, place: 'Project deadline', kind: 'due', who: 'PM ' + (p.pm ? this.av(p.pm).n : 'not chosen'), by: '', go: () => this.go('project', { projectId: p.id }) }); });
  const seeAllVisits = this.isTop() || ['reception', 'pa'].includes(s.role || 'ceo');
  (s.visitors || []).filter(v => v.st === 'expected' && !v.meeting && (v.date || today) >= today && (v.date || today) <= end && (seeAllVisits || v.host === me))
    .forEach(v => dayOf(v.date || today).items.push({ id: 'v' + v.id, time: v.time || '', title: 'Visitor: ' + v.name + (v.co ? ' · ' + v.co : ''), place: 'Front desk', kind: 'client', who: 'For ' + this.av(v.host).n, by: '', guest: v.purpose || '' }));
  mine.forEach(m => { const d = dayOf(m.date);
    const t = m.to || {};
    d.items.push({ id: m.id, time: m.time, title: m.title, place: m.place, client: m.kind === 'client', guest: m.guest ? m.guest.name + (m.guest.co ? ' · ' + m.guest.co : '') : '',
      who: t.all ? 'Everyone' : [...(t.depts || []).map(x => DEPTS[x].l), ...(t.people || []).map(k => this.av(k).first)].join(', ') || 'Client visit', by: this.av(m.by).n,
      kind: m.kind === 'client' ? 'client' : 'meet', canCancel: m.by === me || this.isTop(), cancel: () => this.cancelMeeting(m.id) }); });
  days.sort((a, b) => a.k.localeCompare(b.k)); days.forEach(d => d.items.sort((a, b) => String(a.time).localeCompare(String(b.time))));
  const vis = s.visitors || [], isToday = v => !v.date || v.date === today;
  const vrow = v => ({ id: v.id, name: v.name, co: v.co || '', phone: v.phone || '', purpose: v.purpose || '', host: this.av(v.host).n, time: v.time || '', out: v.outAt || '',
    arrive: () => this.arrived(v.id), leave: () => this.checkOut(v.id) });
  return {
    MT: { days, can: this.canCreateMeeting(), create: f => this.createMeeting(f), addCal: f => this.addCal(f), kinds: CAL_KINDS, addAppt: f => this.addAppointment(f),
      offices: OFFICES.map(d => ({ v: d, l: DEPTS[d].l })), people: this.everyone().map(face).sort((a, b) => a.l.localeCompare(b.l)),
      dates: [0, 1, 2, 3, 4, 5, 6].map(o => ({ v: dayKey(o), l: dayLabel(dayKey(o)) })) },
    RD: { inside: vis.filter(v => v.st === 'in' && isToday(v)).map(vrow), expected: vis.filter(v => v.st === 'expected' && (v.date || today) === today).sort((a, b) => (a.time || '').localeCompare(b.time || '')).map(vrow),
      later: vis.filter(v => v.st === 'expected' && v.date > today).map(vrow), left: vis.filter(v => v.st === 'out' && isToday(v)).map(vrow),
      offices: OFFICES.map(d => ({ v: d, l: DEPTS[d].l, people: this.teamOf(d).map(face) })), checkIn: f => this.checkIn(f),
      today: new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) }
  };
}
