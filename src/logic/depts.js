// Departments: who belongs where, who leads them, who may assign tasks to whom, design briefs
// from Client Service to Creative, and each department's dashboard.
// Mixed into TrinityApp, so `this` is the app.
import { DEPTS, OLD_DEPT } from './constants';
import { dayKey } from './seed';

export const BRIEF = { todo: 'New', prog: 'In design', review: 'With client', done: 'Approved' };
const BRIEF_NEXT = { todo: ['prog', 'Start design'], prog: ['review', 'Send to client'], review: ['done', 'Client approved'] };

export const deptMethods = {
  // A person's department: from the staff list, or from the portal their key belongs to.
  deptOf(k) {
    const p = (this.state.staff || []).find(x => x.k === k);
    const d = p ? (DEPTS[p.dept] ? p.dept : OLD_DEPT[p.dept]) : null;
    if (d) return d;
    const r = Object.keys(this.ROLES).find(role => this.ROLES[role].k === k);
    return r && DEPTS[r] ? r : null;
  },
  managerOf(dept) { const c = this.state.company || {}; return (c.managers || {})[dept] || (DEPTS[dept] || {}).mgr || null; },
  myDept() { const role = this.state.role || 'ceo'; return DEPTS[role] ? role : this.deptOf(this.me().k); },
  isManagerOf(dept) { return !!dept && this.managerOf(dept) === this.me().k; },
  isTop() { return ['ceo', 'gm'].includes(this.state.role || 'ceo'); },
  teamOf(dept) {
    const ks = (this.state.staff || []).filter(p => this.deptOf(p.k) === dept).map(p => p.k);
    const m = this.managerOf(dept);
    return [...new Set([m, ...ks].filter(Boolean))];
  },
  everyone() { return [...new Set([...Object.keys(this.PPL), ...Object.keys(this.people || {})])]; },
  // Management and the GM assign to anyone, a manager to their own team, everyone else only to themselves.
  assignable() {
    if (this.isTop()) return this.everyone();
    const d = this.myDept();
    return d && this.isManagerOf(d) ? this.teamOf(d) : [this.me().k];
  },

  createTask(f) {
    const who = f.who || this.me().k, P = this.proj(f.p);
    this.setState(x => ({ tasks: [{ id: 'T' + Date.now(), t: f.t, p: f.p, who, due: f.due || 'This week', st: 'todo', pri: f.pri || 'med', by: this.me().k }, ...x.tasks] }));
    if (who !== this.me().k) this.remind(who, 'New task: ' + f.t, 'tasks', 'checkSquare', 'From ' + this.me().n + (P.client ? ' · ' + P.client : '') + ' · due ' + (f.due || 'this week'));
    this.toast('Task created and assigned to ' + this.av(who).n);
    this.log('checkSquare', 'purple', 'Task created · ' + f.t, (P.client || 'Company') + ' · assigned to ' + this.av(who).first);
  },

  // Client Service → Creative: the brief lands with the Creative lead, who can pass it to a designer.
  createBrief(f) {
    const to = this.managerOf('creative'), P = this.proj(f.p);
    const brief = { id: 'B' + Date.now().toString(36), kind: 'brief', t: f.t, p: f.p, who: to, from: this.me().k, place: f.place || 'Indoor event', note: (f.note || '').trim(), due: f.due || 'This week', st: 'todo', pri: f.pri || 'med' };
    this.setState(x => ({ tasks: [brief, ...x.tasks] }));
    this.remind(to, 'New design brief: ' + f.t, 'dept', 'clipboard', 'From ' + this.me().n + (P.client ? ' · ' + P.client : '') + ' · ' + brief.place);
    this.toast('Brief sent to Creative · ' + this.av(to).n);
    this.log('clipboard', 'purple', 'Brief sent to Creative · ' + f.t, (P.client || '') + ' · ' + brief.place);
  },
  moveBrief(id) {
    const b = (this.state.tasks || []).find(t => t.id === id); if (!b || !BRIEF_NEXT[b.st]) return;
    const [st] = BRIEF_NEXT[b.st];
    this.setState(x => ({ tasks: x.tasks.map(t => (t.id === id ? Object.assign({}, t, { st }) : t)) }));
    // Client Service hears when artwork goes to the client and when it is approved.
    if (b.from && st !== 'prog') this.remind(b.from, (st === 'review' ? 'Artwork ready for the client: ' : 'Client approved: ') + b.t, 'dept', 'clipboard', 'From ' + this.me().n);
    this.toast(b.t + ' · ' + BRIEF[st]);
  },
  assignBrief(id, who) {
    const b = (this.state.tasks || []).find(t => t.id === id); if (!b || b.who === who) return;
    this.setState(x => ({ tasks: x.tasks.map(t => (t.id === id ? Object.assign({}, t, { who }) : t)) }));
    this.remind(who, 'Design brief assigned to you: ' + b.t, 'dept', 'clipboard', 'From ' + this.me().n + ' · due ' + b.due);
    this.toast(b.t + ' → ' + this.av(who).n);
  },

  // "Send my day" goes to the person's manager (a manager's day goes to the General Manager).
  sendDayToManager(k, done, plan) {
    const d = this.deptOf(k), m = d ? this.managerOf(d) : null;
    const to = m && m !== k ? m : this.ROLES.gm.k;
    if (!to || to === k) return;
    this.notify({ to, ic: 'checkSquare', t: this.av(k).n + '’s day: ' + done.length + ' done, ' + plan.length + ' planned', s: done.slice(0, 3).map(i => '✓ ' + i.t).join(' · ') || 'Nothing finished yet', go: 'today' });
  }
};

// Values for the department dashboard (page 'dept').
export function deptVals(s) {
  const dept = this.myDept(), D = DEPTS[dept];
  if (!D) return { DP: { has: false } };
  const me = this.me().k, isMgr = this.isManagerOf(dept), today = dayKey(0), todos = s.todos || [];
  const fmtM = v => this.fmtM(v), proj = p => this.proj(p);
  const openTasks = k => s.tasks.filter(t => t.who === k && t.st !== 'done').length;
  const team = isMgr ? this.teamOf(dept).filter(k => k !== me).map(k => {
    const a = this.av(k), p = (s.staff || []).find(x => x.k === k) || {};
    return { k, n: a.n, i: a.i, c: a.c, role: p.role || '', done: todos.filter(i => i.k === k && i.st === 'done' && i.doneOn === today).length,
      plan: todos.filter(i => i.k === k && i.st === 'todo').length, sent: !!(s.reportsToday || {})[k], open: openTasks(k),
      assign: () => this.openModal('task', { who: k }), remind: () => { this.remind(k, 'Please add today’s to-do: what you did and what you plan', 'today', 'checkSquare'); this.toast('Reminder sent to ' + a.n); } };
  }) : [];
  const myTasks = s.tasks.filter(t => t.who === me && t.st !== 'done' && t.kind !== 'brief').slice(0, 6).map(t => ({ id: t.id, t: t.t, due: t.due, client: proj(t.p).client || '', done: () => this.setState(x => ({ tasks: x.tasks.map(y => (y.id === t.id ? Object.assign({}, y, { st: 'done' }) : y)) })) }));
  const briefRow = b => ({ id: b.id, t: b.t, client: proj(b.p).client || '', proj: proj(b.p).name || '', place: b.place, note: b.note, due: b.due, st: b.st, stl: BRIEF[b.st], who: this.av(b.who).n, whoK: b.who, from: this.av(b.from).n,
    next: BRIEF_NEXT[b.st] ? BRIEF_NEXT[b.st][1] : '', move: () => this.moveBrief(b.id), assign: k => this.assignBrief(b.id, k) });
  const briefs = s.tasks.filter(t => t.kind === 'brief');
  const V = { has: true, dept, label: D.l, isMgr, mgrName: this.av(this.managerOf(dept)).n, first: this.me().n.split(' ')[0], team, myTasks,
    newTask: () => this.openModal('task'), canAssign: isMgr };

  if (dept === 'clientservice') {
    const won = s.leads.filter(l => l.s === 4).reduce((a, b) => a + b.v, 0), target = +((s.company || {}).csTarget) || 0;
    const clients = {};
    s.projects.forEach(p => { const c = clients[p.client] || (clients[p.client] = { n: p.client, projects: 0, active: 0, leads: 0 }); c.projects++; if (p.st !== 'done') c.active++; });
    s.leads.forEach(l => { const c = clients[l.c] || (clients[l.c] = { n: l.c, projects: 0, active: 0, leads: 0 }); if (l.s < 4) c.leads++; });
    V.kpis = [
      { l: 'Target this month', v: fmtM(target), n: target ? Math.round(won / target * 100) + '% achieved' : 'set by Management' },
      { l: 'Won', v: fmtM(won) }, { l: 'Open leads', v: String(s.leads.filter(l => l.s < 4).length) },
      { l: 'Proposals with clients', v: String(s.proposals.filter(p => p.s >= 3 && p.s < 6 && !p.rej).length) }
    ];
    V.targetPct = target ? Math.min(100, Math.round(won / target * 100)) : 0;
    V.clients = Object.values(clients).sort((a, b) => b.active - a.active || a.n.localeCompare(b.n)).slice(0, 12);
    V.followUps = [
      ...s.projects.filter(p => p.st === 'risk' || p.st === 'late').map(p => ({ t: p.client + ' · ' + p.name, s: (p.st === 'late' ? 'Delayed' : 'At risk') + ' · due ' + p.due, go: () => this.go('project', { projectId: p.id }) })),
      ...s.proposals.filter(p => (p.s === 3 || p.s === 4) && !p.rej).map(p => ({ t: p.c + ' · ' + p.t, s: 'Proposal with the client · follow up', go: () => this.go('proposals') }))
    ].slice(0, 8);
    V.briefs = briefs.filter(b => b.st !== 'done').map(briefRow);
    V.actions = { lead: () => this.openModal('lead'), project: () => this.openModal('project'), brief: () => this.openModal('brief'), proposals: () => this.go('proposals') };
  }
  if (dept === 'creative') {
    const mine = isMgr ? briefs : briefs.filter(b => b.who === me);
    V.kpis = Object.keys(BRIEF).map(k => ({ l: BRIEF[k], v: String(mine.filter(b => b.st === k).length) }));
    V.briefs = mine.filter(b => b.st !== 'done').map(briefRow).concat(mine.filter(b => b.st === 'done').slice(0, 3).map(briefRow));
    V.designers = this.teamOf('creative').map(k => ({ v: k, l: this.av(k).n }));
  }
  if (dept === 'operations') {
    const live = s.projects.filter(p => p.st !== 'done' && [3, 4].includes(this.stageOf(p)));
    V.kpis = [
      { l: 'In production', v: String(s.projects.filter(p => p.st !== 'done' && this.stageOf(p) === 3).length) },
      { l: 'On site', v: String(s.projects.filter(p => p.st !== 'done' && this.stageOf(p) === 4).length) },
      { l: 'Delayed', v: String(s.projects.filter(p => p.st === 'late').length), warn: s.projects.some(p => p.st === 'late') },
      { l: 'Open team tasks', v: String(this.teamOf('operations').reduce((a, k) => a + openTasks(k), 0)) }
    ];
    V.delivering = live.map(p => ({ id: p.id, t: p.name, client: p.client, pm: this.av(p.pm).n, due: p.due, stage: this.STAGES[this.stageOf(p) - 1], late: p.st === 'late', risk: p.st === 'risk', go: () => this.go('project', { projectId: p.id }) }));
    V.request = () => this.openModal('req');
  }
  return { DP: V };
}
