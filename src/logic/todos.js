// Daily to-do: each person lists what they did today and what they plan to do, in a few taps.
// Managers see the whole team. Also the company setup (small-request limit, sections on/off).
// Mixed into TrinityApp, so `this` is the app.
import { dayKey } from './seed';
import { PARKED, DEPTS } from './constants';

// Sections the administrator can switch off. Home pages, approvals, tasks, projects,
// notifications, settings and accounts always stay.
export const SECTIONS = [
  ['today', 'My work'], ['briefing', 'Monday Briefing'], ['calendar', 'Calendar'], ['clients', 'Clients & leads'],
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
  // Status of your own to-do: to do → working on it → done.
  setTodoStatus(id, st) {
    const today = this.today();
    this.setState(x => ({ todos: (x.todos || []).map(i => (i.id !== id ? i : Object.assign({}, i, { st, doneOn: st === 'done' ? today : '' }))) }));
  },
  // A short update (or the manager's comment) on a to-do or a task; the owner and their head are told.
  postItem(kind, id, text) {
    const t = String(text || '').trim(); if (!t) return 'Write the update';
    const me = this.me().k, at = this.today() + ' ' + this.now(), post = { by: me, t: t.slice(0, 400), at };
    const coll = kind === 'task' ? 'tasks' : 'todos';
    const item = (this.state[coll] || []).find(x => x.id === id); if (!item) return 'Not found';
    this.setState(x => ({ [coll]: (x[coll] || []).map(y => (y.id === id ? Object.assign({}, y, { posts: [...(y.posts || []), post] }) : y)) }));
    const owner = kind === 'task' ? item.who : item.k, head = this.managerOf(this.deptOf(owner));
    [owner, head, kind === 'task' ? item.by : null].filter((k, i, a) => k && k !== me && a.indexOf(k) === i)
      .forEach(k => this.notify({ to: k, ic: 'message', t: this.me().n + ' on “' + (item.t || '').slice(0, 50) + '”', s: t, go: 'today' }));
    return '';
  },
  // The head's end-of-day report: everything the team finished and is working on, ready to send up.
  deptDayReport() {
    const d = this.myDept(), me = this.me().k, today = this.today(); if (!d) return;
    const team = this.teamOf(d), name = k => this.av(k).first, last = x => (x.posts && x.posts.length ? ' (' + x.posts[x.posts.length - 1].t + ')' : '');
    const done = [], doing = [], issues = [];
    team.forEach(k => {
      (this.state.tasks || []).filter(t => t.who === k && t.kind !== 'brief').forEach(t => {
        if (t.st === 'done' && t.doneOn === today) done.push('✓ ' + name(k) + ': ' + t.t + (t.report ? ' · ' + t.report : ''));
        else if (t.st === 'prog' || t.st === 'review') doing.push('• ' + name(k) + ': ' + t.t + last(t));
      });
      (this.state.todos || []).filter(i => i.k === k).forEach(i => {
        if (i.st === 'done' && i.doneOn === today) done.push('✓ ' + name(k) + ': ' + i.t);
        else if (i.st === 'prog') doing.push('• ' + name(k) + ': ' + i.t + last(i));
      });
      if (!(this.state.todos || []).some(i => i.k === k && (i.d === today || i.doneOn === today)) && !(this.state.tasks || []).some(t => t.who === k && t.doneOn === today) && k !== me) issues.push(this.av(k).n + ' has not written their day');
    });
    const draft = { kind: 'daily', title: (DEPTS[d] || {}).l + ' · day report ' + today, summary: done.length ? done.join('\n') : 'Nothing finished today.', issues: issues.join('\n'), next: doing.join('\n') };
    this.setState({ rptDraft: draft, rptTab: 'new' });
    this.go('reporting');
  },
  removeTodo(id) { this.setState(x => ({ todos: (x.todos || []).filter(i => i.id !== id) })); },

  // Text of a person's day, for WhatsApp.
  dayText(k, day) {
    const list = this.state.todos || [], a = this.av(k);
    const tk = (this.state.tasks || []).filter(t => t.who === k && t.kind !== 'brief');
    const done = [...tk.filter(t => t.st === 'done' && t.doneOn === day), ...list.filter(i => i.k === k && i.st === 'done' && i.doneOn === day)], plan = [...tk.filter(t => t.st !== 'done'), ...list.filter(i => i.k === k && i.st === 'todo')];
    return [a.n + ' · ' + dayName(day), '', 'Done:', ...(done.length ? done.map(i => '✓ ' + i.t) : ['—']), '', 'Plan:', ...(plan.length ? plan.map(i => '• ' + i.t) : ['—'])].join('\n');
  },
  shareDay() {
    const url = 'https://wa.me/?text=' + encodeURIComponent(this.dayText(this.me().k, this.today()));
    try { window.open(url, '_blank', 'noopener'); } catch (e) { /* pop-up blocked */ }
  },
  // Marks today's daily report as sent (Staff & Reports sees it).
  sendDay() {
    const k = this.me().k, list = this.state.todos || [], today = this.today();
    const tk = (this.state.tasks || []).filter(t => t.who === k && t.kind !== 'brief');
    const done = [...tk.filter(t => t.st === 'done' && t.doneOn === today), ...list.filter(i => i.k === k && i.st === 'done' && i.doneOn === today)], plan = [...tk.filter(t => t.st !== 'done'), ...list.filter(i => i.k === k && i.st === 'todo')];
    this.submitReport(k, done.length + ' done today');
    this.sendDayToManager(k, done, plan);
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
  const postsOf = x => (x.posts || []).slice(-3).map(p => ({ who: this.av(p.by).first, t: p.t, at: p.at, mine: p.by === me }));
  const item = i => ({ id: i.id, t: i.t, done: i.st === 'done', started: i.st === 'prog', since: i.st !== 'done' && i.d < today ? 'since ' + dayName(i.d) : '',
    toggle: () => this.toggleTodo(i.id), remove: () => this.removeTodo(i.id), start: () => this.setTodoStatus(i.id, i.st === 'prog' ? 'todo' : 'prog'),
    posts: postsOf(i), post: t => this.postItem('todo', i.id, t) });
  const mine = list.filter(i => i.k === me);
  const PRI = { high: 'High', med: '', low: '' };
  // Tasks someone gave you sit in the same list as your own to-dos.
  const taskItem = t => { const P = this.proj(t.p); return { id: t.id, t: t.t, task: true, done: t.st === 'done', started: t.st === 'prog' || t.st === 'review',
    from: t.by && t.by !== t.who ? this.av(t.by).n : '', where: P.id ? P.client : '', due: t.due || '', pri: PRI[t.pri] || '', since: '',
    go: P.id ? () => this.go('project', { projectId: P.id }) : null, toggle: () => this.toggleTask(t.id), report: r => this.reportTask(t.id, r), start: () => this.startTask(t.id), reported: t.report || '', posts: postsOf(t), post: x => this.postItem('task', t.id, x) }; };
  const myTasks = s.tasks.filter(t => t.who === me && t.kind !== 'brief');
  const given = s.tasks.filter(t => t.by === me && t.who !== me && t.kind !== 'brief');
  const day = s.teamDay === 'yesterday' ? yesterday : today;
  // Everyone on the staff list, plus anyone else who has written a to-do.
  // Management and the GM see everyone; a department manager sees their own team.
  const dept = this.myDept(), mgr = !this.isTop() && this.isManagerOf(dept);
  const keys = mgr ? this.teamOf(dept).filter(k => k !== me) : [...new Set([...(s.staff || []).map(p => p.k), ...list.map(i => i.k)])];
  const team = keys.map(k => {
    const a = this.av(k), tk = s.tasks.filter(t => t.who === k && t.kind !== 'brief');
    const done = [...tk.filter(t => t.st === 'done' && t.doneOn === day).map(taskItem), ...list.filter(i => i.k === k && i.st === 'done' && i.doneOn === day).map(item)];
    const plan = [...tk.filter(t => t.st !== 'done').map(taskItem), ...list.filter(i => i.k === k && i.st !== 'done').map(item)];
    return { k, n: a.n, i: a.i, c: a.c, ph: a.ph, done, plan, empty: !done.length && !plan.length, sent: !!(s.reportsToday || {})[k],
      working: plan.filter(x => x.started).length, assign: () => this.openModal('task', { who: k }),
      remind: () => { this.remind(k, 'Please add today’s to-do: what you did and what you plan', 'today', 'checkSquare'); this.toast('Reminder sent to ' + a.n); } };
  }).sort((x, y) => (x.empty - y.empty) || x.n.localeCompare(y.n));
  const company = Object.assign({ smallLimit: 200000, off: [] }, s.company || {});
  return {
    TD: {
      dayLabel: dayName(today), isTeam: s.todoTab === 'team', canTeam: this.isTop() || mgr, canDayReport: mgr, dayReport: () => this.deptDayReport(),
      showMine: () => this.setState({ todoTab: 'mine' }), showTeam: () => this.setState({ todoTab: 'team' }),
      done: [...myTasks.filter(t => t.st === 'done' && t.doneOn === today).map(taskItem), ...mine.filter(i => i.st === 'done' && i.doneOn === today).map(item)],
      plan: mine.filter(i => i.st !== 'done').sort((a, b) => (a.d < b.d ? 1 : -1)).map(item),
      assigned: myTasks.filter(t => t.st !== 'done').sort((a, b) => (a.pri === 'high' ? -1 : 0) - (b.pri === 'high' ? -1 : 0)).map(taskItem),
      given: given.map(t => { const a = this.av(t.who); return { id: t.id, t: t.t, who: a.n, wi: a.i, wc: a.c, due: t.due, done: t.st === 'done', st: this.tst(t.st)[0],
        nudge: () => { this.remind(t.who, 'Reminder: ' + t.t, 'today', 'checkSquare', 'From ' + this.me().n + ' · due ' + t.due); this.toast('Reminder sent to ' + a.n); } }; }),
      canGive: this.assignable().length > 1, give: () => this.openModal('task'),
      isGiven: s.todoTab === 'given', showGiven: () => this.setState({ todoTab: 'given' }),
      add: (text, done) => this.addTodo(text, done),
      sent: !!(s.reportsToday || {})[me], send: () => this.sendDay(), share: () => this.shareDay(),
      team, teamDay: s.teamDay === 'yesterday' ? 'yesterday' : 'today', setTeamDay: d => this.setState({ teamDay: d }),
      teamDone: team.filter(p => !p.empty).length, teamTotal: team.length
    },
    CO: {
      can: this.canSetup(), limit: company.smallLimit, setLimit: n => { this.setCompany({ smallLimit: Math.max(0, Math.round(+n || 0)) }); this.toast(+n > 0 ? 'Small requests: up to ' + this.fmtT(Math.round(+n)) : 'Every request now takes all approval steps'); },
      sections: SECTIONS.map(([k, l]) => ({ k, l, on: !company.off.includes(k), toggle: () => this.toggleSection(k) })),
      csTarget: company.csTarget == null ? 500 : company.csTarget, setTarget: n => { this.setCompany({ csTarget: Math.max(0, +n || 0) }); this.toast('Client Service target: ' + this.fmtM(Math.max(0, +n || 0)) + ' a month'); },
      depts: ['clientservice', 'creative', 'operations', 'production', 'finance', 'reception'].map(d => ({ d, l: DEPTS[d].l, mgr: this.managerOf(d),
        set: k => { this.setCompany({ managers: Object.assign({}, company.managers || {}, { [d]: k }) }); this.toast(DEPTS[d].l + ' manager: ' + this.av(k).n); } })),
      people: this.everyone().map(k => ({ v: k, l: this.av(k).n })).sort((a, b) => a.l.localeCompare(b.l)),
      notify: Object.assign({ wa: true, sms: false, email: false, events: { clients: true, approvals: true, designs: true, payments: true, tasks: false } }, company.notify || {}),
      setNotify: ch => { const cur = Object.assign({ wa: true, sms: false, email: false, events: {} }, company.notify || {}); this.setCompany({ notify: Object.assign({}, cur, ch, ch.events ? { events: Object.assign({}, cur.events, ch.events) } : {}) }); },
      phones: this.everyone().map(k => ({ k, n: this.av(k).n, phone: (company.phones || {})[k] || '' })).sort((a, b) => (b.phone ? 1 : 0) - (a.phone ? 1 : 0) || a.n.localeCompare(b.n)),
      setPhone: (k, ph) => this.setCompany({ phones: Object.assign({}, company.phones || {}, { [k]: ph.trim() }) }),
      outbox: (s.outbox || []).slice(0, 15).map(m => ({ id: m.id, to: this.av(m.to).n, phone: m.phone, text: m.text, st: m.st, at: m.at, ch: m.ch,
        send: () => { const num = m.phone.replace(/\D/g, ''); try { window.open('https://wa.me/' + num + '?text=' + encodeURIComponent(m.text), '_blank', 'noopener'); } catch (e) { /* blocked */ } this.setState(x => ({ outbox: x.outbox.map(o => (o.id === m.id ? Object.assign({}, o, { st: 'sent by hand' }) : o)) })); } })),
      signatures: [['ED', 'Executive Director'], ['GM', 'General Manager']].map(([k, l]) => ({ k, l, url: ((company.signatures || {})[k] || {}).url || '' })),
      setSig: (k, url, name) => { this.setCompany({ signatures: Object.assign({}, company.signatures || {}, { [k]: url ? { url, name } : null }) }); this.toast(url ? 'Signature saved · it appears on invoices once signed' : 'Signature removed'); },
      test: () => { this.notify({ to: this.ROLES.clientservice.k, ic: 'users', t: 'Test alert: new client enquiry', s: 'This is how Client Service alerts arrive on WhatsApp', go: 'clients' }); this.toast('Test alert queued for ' + this.av(this.ROLES.clientservice.k).n); }
    }
  };
}
