// Departments: who belongs where, who leads them, who may assign tasks to whom, design briefs
// from Client Service to Creative, and each department's dashboard.
// Mixed into TrinityApp, so `this` is the app.
import { DEPTS, OLD_DEPT } from './constants';
import { dayKey } from './seed';

// Design briefs: New → In design (designer uploads) → With Creative Manager → Approved.
// Approved designs go to the GM, Management and the Client Service person who sent the brief.
export const BRIEF = { todo: 'New', prog: 'In design', review: 'With Creative Manager', done: 'Approved' };
const BRIEF_NEXT = { todo: ['prog', 'Start design'], prog: ['review', 'Send to Creative Manager'], review: ['done', 'Approve design'] };

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
    const d = this.myDept(), me = this.me().k;
    const own = d && this.isManagerOf(d) ? this.teamOf(d) : [me];
    // A Project Manager (or the Operations Manager) tasks the department heads, who task their own people.
    const pm = this.isManagerOf('operations') || (this.state.projects || []).some(p => p.pm === me && this.flowOf(p) === 'execution');
    return pm ? [...new Set([...own, ...['clientservice', 'creative', 'operations', 'finance', 'production', 'reception'].map(x => this.managerOf(x)).filter(Boolean)])] : own;
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
    this.afterBrief(f.p);
    this.toast('Brief sent to Creative · ' + this.av(to).n);
    this.log('clipboard', 'purple', 'Brief sent to Creative · ' + f.t, (P.client || '') + ' · ' + brief.place);
  },
  moveBrief(id) {
    const b = (this.state.tasks || []).find(t => t.id === id); if (!b || !BRIEF_NEXT[b.st]) return;
    const [st] = BRIEF_NEXT[b.st], cm = this.managerOf('creative'), me = this.me().k;
    if (st === 'review' && !(b.files || []).length) { this.toast('Upload the design first'); return; }
    if (st === 'done' && !(this.isManagerOf('creative') || this.isTop())) { this.toast('Only the Creative Manager approves designs'); return; }
    this.setState(x => ({ tasks: x.tasks.map(t => (t.id === id ? Object.assign({}, t, { st, ret: st === 'review' ? '' : t.ret }) : t)) }));
    if (st === 'review' && cm && cm !== me) this.remind(cm, 'Design to approve: ' + b.t, 'dept', 'clipboard', 'From ' + this.me().n + ' · ' + (b.files || []).length + ' file(s)');
    if (st === 'done') {
      [this.ROLES.gm.k, this.ROLES.ceo.k, b.from, b.who].filter((k, i, a) => k && k !== me && a.indexOf(k) === i)
        .forEach(k => this.remind(k, 'Design approved: ' + b.t, 'project', 'clipboard', (this.proj(b.p).client || '') + ' · approved by ' + this.me().n));
    }
    if (st === 'done') setTimeout(() => this.afterDesignApproved(b.p), 0);
    this.toast(b.t + ' · ' + BRIEF[st]);
    this.log('clipboard', st === 'done' ? 'green' : 'purple', 'Design · ' + BRIEF[st], b.t);
  },
  // A designer (or the Creative Manager) uploads design files to a brief.
  async addDesign(id, file) {
    const b = (this.state.tasks || []).find(t => t.id === id); if (!b) return '';
    try {
      const info = await this.storeFile(file), me = this.me().k;
      const item = Object.assign({ by: me, at: dayKey(0) }, info);
      this.setState(x => ({ tasks: x.tasks.map(t => (t.id === id ? Object.assign({}, t, { files: [...(t.files || []), item], st: t.st === 'todo' ? 'prog' : t.st }) : t)) }));
      this.toast('Design uploaded · ' + file.name);
      return '';
    } catch (e) { return 'Upload failed · ' + (e.message || e); }
  },
  // The Creative Manager sends a design back with a comment.
  returnBrief(id, note) {
    const b = (this.state.tasks || []).find(t => t.id === id); if (!b) return;
    this.setState(x => ({ tasks: x.tasks.map(t => (t.id === id ? Object.assign({}, t, { st: 'prog', ret: note || 'Please revise' }) : t)) }));
    if (b.who !== this.me().k) this.remind(b.who, 'Design returned: ' + b.t, 'dept', 'clipboard', note || 'Please revise');
    this.toast('Returned to ' + this.av(b.who).n);
  },
  // One design brief as the pages show it, with what the person looking may do with it.
  briefRow(b) {
    const me = this.me().k, P = this.proj(b.p), cm = this.isManagerOf('creative') || this.isTop();
    const mineB = b.who === me, n = BRIEF_NEXT[b.st];
    const canNext = n && (b.st === 'review' ? cm : mineB || cm);
    return { id: b.id, t: b.t, client: P.client || '', proj: P.name || '', place: b.place, note: b.note, due: b.due, st: b.st, stl: BRIEF[b.st], who: this.av(b.who).n, whoK: b.who, from: this.av(b.from).n,
      ret: b.st === 'prog' ? b.ret || '' : '',
      files: (b.files || []).map((f, i) => ({ i, name: f.name, by: this.av(f.by).n, at: f.at, img: /^image\//.test(f.mime || '') && f.url ? f.url : '', open: () => this.openDoc({ n: f.name, url: f.url, path: f.path }) })),
      canUpload: b.st !== 'done' && (mineB || cm), upload: f => this.addDesign(b.id, f),
      next: canNext ? n[1] : '', move: () => this.moveBrief(b.id),
      canReturn: b.st === 'review' && cm, giveBack: note => this.returnBrief(b.id, note),
      assign: k => this.assignBrief(b.id, k) };
  },
  // What a person may see of projects. Management, the GM and Finance see every project; the
  // Operations Manager and Client Service Manager see all projects; everyone else sees only the
  // projects they work on (PM, team, a task or a design brief on it, or the client lead they own).
  involvedIn(p, k) {
    k = k || this.me().k;
    return p.pm === k || p.cs === k || (p.team || []).includes(k) || (this.state.tasks || []).some(t => t.p === p.id && (t.who === k || t.from === k)) ||
      (this.state.leads || []).some(l => l.job === p.id && l.owner === k);
  },
  seesAllProjects() {
    const role = this.state.role || 'ceo';
    return ['ceo', 'gm', 'finance'].includes(role) || this.isManagerOf('operations') || this.isManagerOf('clientservice') || (role === 'creative' && this.isManagerOf('creative'));
  },
  visibleProjects() {
    const all = this.state.projects || [];
    if (this.seesAllProjects()) {
      if ((this.state.role || 'ceo') === 'creative') return all.filter(p => (this.state.tasks || []).some(t => t.kind === 'brief' && t.p === p.id) || this.involvedIn(p));
      return all;
    }
    return all.filter(p => this.involvedIn(p));
  },
  // Which parts of a project a person sees: each department sees what it adds.
  projectParts(p) {
    // Management, the GM and Finance see the whole project. The Operations Manager and the
    // project's PM also see the internal budget. Invoices stay with Management, the GM and Finance.
    const role = this.state.role || 'ceo', me = this.me().k, top = ['ceo', 'gm', 'finance'].includes(role), fin = false;
    const isPM = p.pm === me, ops = this.isManagerOf('operations') || isPM;
    const dept = this.myDept();
    return {
      client: top || dept === 'clientservice',
      creative: top || dept === 'clientservice' || dept === 'creative',
      delivery: true,
      budget: top || fin || ops,
      money: top || fin,
      allTasks: top || ops,
      allReqs: top || fin || ops,
      canPM: ['ceo', 'gm'].includes(role) || this.isManagerOf('operations'),
      canAdvance: ['ceo', 'gm'].includes(role) || ops,
      canTask: ['ceo', 'gm'].includes(role) || ops || this.assignable().length > 1,
      canBrief: top || dept === 'clientservice'
    };
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
  const briefRow = b => this.briefRow(b);
  const briefs = s.tasks.filter(t => t.kind === 'brief');
  const V = { has: true, dept, label: D.l, isMgr, mgrName: this.av(this.managerOf(dept)).n, first: this.me().n.split(' ')[0], team, myTasks,
    newTask: () => this.openModal('task'), canAssign: isMgr };

  if (dept === 'clientservice') {
    const st = l => this.leadStage(l), won = s.leads.filter(l => st(l) === 5).reduce((a, b) => a + (b.v || 0), 0), target = +((s.company || {}).csTarget) || 0;
    const clients = {};
    s.projects.forEach(p => { const c = clients[p.client] || (clients[p.client] = { n: p.client, projects: 0, active: 0, leads: 0 }); c.projects++; if (p.st !== 'done') c.active++; });
    s.leads.forEach(l => { const c = clients[l.c] || (clients[l.c] = { n: l.c, projects: 0, active: 0, leads: 0 }); if (st(l) < 5) c.leads++; });
    V.kpis = [
      { l: 'Target this month', v: fmtM(target), n: target ? Math.round(won / target * 100) + '% achieved' : 'set by Management' },
      { l: 'Won', v: fmtM(won) }, { l: 'Open leads', v: String(s.leads.filter(l => st(l) < 5).length) },
      { l: 'Proposals with clients', v: String(s.leads.filter(l => st(l) === 3 || st(l) === 4).length) }
    ];
    V.targetPct = target ? Math.min(100, Math.round(won / target * 100)) : 0;
    V.clients = Object.values(clients).sort((a, b) => b.active - a.active || a.n.localeCompare(b.n)).slice(0, 12);
    V.flowTodo = [
      ...s.projects.filter(p => this.flowOf(p) === 'brief').map(p => ({ t: p.client + ' · ' + p.name, s: 'Send the design brief to Creative', go: () => this.go('project', { projectId: p.id }) })),
      ...s.projects.filter(p => this.flowOf(p) === 'proposal').map(p => ({ t: p.client + ' · ' + p.name, s: 'Designs approved · upload the proposal', go: () => this.go('project', { projectId: p.id }) }))
    ];
    V.followUps = [
      ...s.projects.filter(p => p.st === 'risk' || p.st === 'late').map(p => ({ t: p.client + ' · ' + p.name, s: (p.st === 'late' ? 'Delayed' : 'At risk') + ' · due ' + p.due, go: () => this.go('project', { projectId: p.id }) })),
      ...s.leads.filter(l => st(l) < 5 && (st(l) >= 3 || l.next === 'Today')).map(l => ({ t: l.c + ' · ' + l.t, s: (st(l) >= 3 ? 'Proposal with the client' : 'Follow up today') + ' · ' + this.av(l.owner).n, go: () => this.setState({ page: 'clients', leadSel: l.id }) }))
    ].slice(0, 8);
    V.briefs = briefs.filter(b => b.st !== 'done').map(briefRow);
    V.actions = { lead: () => this.openModal('work'), project: () => this.openModal('project'), brief: () => this.openModal('brief'), proposals: () => this.go('clients') };
  }
  if (dept === 'creative') {
    const mine = isMgr ? briefs : briefs.filter(b => b.who === me);
    V.kpis = Object.keys(BRIEF).map(k => ({ l: BRIEF[k], v: String(mine.filter(b => b.st === k).length) }));
    V.briefs = mine.filter(b => b.st !== 'done').map(briefRow).concat(mine.filter(b => b.st === 'done').slice(0, 3).map(briefRow));
    V.designers = this.teamOf('creative').map(k => { const a = this.av(k); return { v: k, l: a.n, i: a.i, c: a.c }; });
  }
  if (dept === 'operations') {
    const live = s.projects.filter(p => this.flowOf(p) === 'execution'), toBudget = s.projects.filter(p => this.flowOf(p) === 'budget'), waiting = s.projects.filter(p => this.flowOf(p) === 'approval');
    V.toBudget = toBudget.map(p => ({ id: p.id, t: p.client + ' · ' + p.name, s: (p.budget && p.budget.st === 'returned' ? 'Sent back: ' + p.budget.note : 'Proposal in · prepare PM and internal budget'), go: () => this.go('project', { projectId: p.id }) }));
    V.waitingAppr = waiting.map(p => ({ id: p.id, t: p.client + ' · ' + p.name, s: p.budget && p.budget.st === 'mgmt' ? 'Waiting for Management' : 'Waiting for the GM', go: () => this.go('project', { projectId: p.id }) }));
    V.kpis = [
      { l: 'Budgets to prepare', v: String(toBudget.length), warn: toBudget.length > 0 },
      { l: 'In execution', v: String(live.length) },
      { l: 'Delayed', v: String(s.projects.filter(p => p.st === 'late').length), warn: s.projects.some(p => p.st === 'late') },
      { l: 'Open team tasks', v: String(this.teamOf('operations').reduce((a, k) => a + openTasks(k), 0)) }
    ];
    V.delivering = live.map(p => ({ id: p.id, t: p.name, client: p.client, pm: this.av(p.pm).n, due: p.due, stage: p.pm ? 'PM ' + this.av(p.pm).first : 'No PM', late: p.st === 'late', risk: p.st === 'risk', go: () => this.go('project', { projectId: p.id }) }));
    V.request = () => this.openModal('req');
  }
  return { DP: V };
}
