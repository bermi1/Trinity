// Daily to-do: each person lists what they did today and what they plan to do, in a few taps.
// Managers see the whole team. Also the company setup (small-request limit, sections on/off).
// Mixed into TrinityApp, so `this` is the app.
import { dayKey } from './seed';
import { PARKED } from './constants';

// Sections the administrator can switch off. Home pages, approvals, tasks, projects,
// notifications, settings and accounts always stay.
export const SECTIONS = [
  ['today', 'Daily to-do'], ['briefing', 'Monday Briefing'], ['calendar', 'Calendar'], ['crm', 'CRM / Client enquiries'],
  ['proposals', 'Sales & Proposals'], ['finance', 'Finance & Invoices'],
  ['staff', 'Staff & Reports'], ['rooms', 'Meeting rooms'],
  ['field', 'Field capture app'], ['ceomobile', 'Mobile apps preview']
];

const dayName = key => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

export const todoMethods = {
  today() { return dayKey(0); },
  isOff(page) { const c = this.state.company || {}; return PARKED.includes(page) || (Array.isArray(c.off) && c.off.includes(page)); },
  // Administrators set up the company; in the demo, Management can.
  canSetup() { return this.state.db ? this.isAdmin() : (this.state.role || 'ceo') === 'ceo'; },

  addTodo(text, done) {
    const t = String(text || '').trim();
    if (!t) return false;
    const k = this.me().k, today = this.today();
    const item = { id: 'TD-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), k, t: t.slice(0, 200), st: done ? 'done' : 'todo', d: today };
    if (done) item.doneOn = today;
    this.setState(x => ({ todos: [item, ...(x.todos || [])] }));
    return true;
  },
  toggleTodo(id) {
    const today = this.today();
    this.setState(x => ({ todos: (x.todos || []).map(i => (i.id !== id ? i : i.st === 'done' ? Object.assign({}, i, { st: 'todo', doneOn: '' }) : Object.assign({}, i, { st: 'done', doneOn: today }))) }));
  },
  removeTodo(id) { this.setState(x => ({ todos: (x.todos || []).filter(i => i.id !== id) })); },

  // Text of a person's day, for WhatsApp.
  dayText(k, day) {
    const list = this.state.todos || [], a = this.av(k);
    const done = list.filter(i => i.k === k && i.st === 'done' && i.doneOn === day), plan = list.filter(i => i.k === k && i.st === 'todo');
    return [a.n + ' · ' + dayName(day), '', 'Done:', ...(done.length ? done.map(i => '✓ ' + i.t) : ['—']), '', 'Plan:', ...(plan.length ? plan.map(i => '• ' + i.t) : ['—'])].join('\n');
  },
  shareDay() {
    const url = 'https://wa.me/?text=' + encodeURIComponent(this.dayText(this.me().k, this.today()));
    try { window.open(url, '_blank', 'noopener'); } catch (e) { /* pop-up blocked */ }
  },
  // Marks today's daily report as sent (Staff & Reports sees it).
  sendDay() {
    const k = this.me().k, list = this.state.todos || [], today = this.today();
    const n = list.filter(i => i.k === k && i.st === 'done' && i.doneOn === today).length;
    this.submitReport(k, n + ' done today');
  },

  setCompany(changes) {
    this.setState(x => ({ company: Object.assign({ smallLimit: 200000, off: [] }, x.company || {}, changes) }));
  },
  toggleSection(page) {
    const off = ((this.state.company || {}).off || []).slice(), i = off.indexOf(page);
    if (i >= 0) off.splice(i, 1); else off.push(page);
    this.setCompany({ off });
    this.toast((SECTIONS.find(s => s[0] === page) || [page, page])[1] + (i >= 0 ? ' switched on' : ' switched off'));
  }
};

// Values for the Daily to-do and Company setup pages.
export function todayVals(s) {
  const me = this.me().k, today = this.today(), yesterday = dayKey(-1), list = s.todos || [];
  const item = i => ({ id: i.id, t: i.t, done: i.st === 'done', since: i.st === 'todo' && i.d < today ? 'since ' + dayName(i.d) : '',
    toggle: () => this.toggleTodo(i.id), remove: () => this.removeTodo(i.id) });
  const mine = list.filter(i => i.k === me);
  const day = s.teamDay === 'yesterday' ? yesterday : today;
  // Everyone on the staff list, plus anyone else who has written a to-do.
  const keys = [...new Set([...(s.staff || []).map(p => p.k), ...list.map(i => i.k)])];
  const team = keys.map(k => {
    const a = this.av(k), done = list.filter(i => i.k === k && i.st === 'done' && i.doneOn === day), plan = list.filter(i => i.k === k && i.st === 'todo');
    return { k, n: a.n, i: a.i, c: a.c, done: done.map(item), plan: plan.map(item), empty: !done.length && !plan.length, sent: !!(s.reportsToday || {})[k],
      remind: () => { this.remind(k, 'Please add today’s to-do: what you did and what you plan', 'today', 'checkSquare'); this.toast('Reminder sent to ' + a.n); } };
  }).sort((x, y) => (x.empty - y.empty) || x.n.localeCompare(y.n));
  const company = Object.assign({ smallLimit: 200000, off: [] }, s.company || {});
  return {
    TD: {
      dayLabel: dayName(today), isTeam: s.todoTab === 'team', canTeam: ['ceo', 'gm'].includes(s.role || 'ceo'),
      showMine: () => this.setState({ todoTab: 'mine' }), showTeam: () => this.setState({ todoTab: 'team' }),
      done: mine.filter(i => i.st === 'done' && i.doneOn === today).map(item),
      plan: mine.filter(i => i.st === 'todo').sort((a, b) => (a.d < b.d ? 1 : -1)).map(item),
      add: (text, done) => this.addTodo(text, done),
      fromTasks: s.tasks.filter(t => t.who === me && t.st !== 'done' && !mine.some(i => i.st === 'todo' && i.t === t.t)).slice(0, 4).map(t => ({ t: t.t, add: () => this.addTodo(t.t, false) })),
      sent: !!(s.reportsToday || {})[me], send: () => this.sendDay(), share: () => this.shareDay(),
      team, teamDay: s.teamDay === 'yesterday' ? 'yesterday' : 'today', setTeamDay: d => this.setState({ teamDay: d }),
      teamDone: team.filter(p => !p.empty).length, teamTotal: team.length
    },
    CO: {
      can: this.canSetup(), limit: company.smallLimit, setLimit: n => { this.setCompany({ smallLimit: Math.max(0, Math.round(+n || 0)) }); this.toast(+n > 0 ? 'Small requests: up to ' + this.fmtT(Math.round(+n)) : 'Every request now takes all approval steps'); },
      sections: SECTIONS.map(([k, l]) => ({ k, l, on: !company.off.includes(k), toggle: () => this.toggleSection(k) }))
    }
  };
}
