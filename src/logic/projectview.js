// A project as each person sees it. Every department sees the header (what, for whom, stage, due)
// and then only the part it adds: Client Service the client and proposal, Creative the designs,
// Operations the PM, team and internal budget, Finance and Management the money.
// Mixed into TrinityApp, so `this` is the app.
import { ST } from './constants';

export function projectVals(s) {
  const P = (s.projects || []).find(p => p.id === s.projectId);
  if (!P || !this.visibleProjects().some(p => p.id === P.id)) return { PV: { none: true, back: () => this.go('projects') } };
  const me = this.me().k, can = this.projectParts(P), stage = this.stageOf(P), pm = this.av(P.pm);
  const face = k => { const a = this.av(k); return { k, n: a.n, i: a.i, c: a.c }; };
  const st = ST[P.st] || ST.on;
  const V = {
    id: P.id, name: P.name, client: P.client, due: P.due, prog: P.prog || 0, st: { l: st.l, bg: st.bg, fg: st.fg },
    pm: P.pm ? pm.n : 'Not chosen yet', pmSet: !!P.pm, can,
    stages: this.STAGES.map((l, i) => ({ l, done: i + 1 < stage || P.st === 'done', cur: i + 1 === stage && P.st !== 'done' })),
    stageLabel: this.STAGES[stage - 1], back: () => this.go('projects')
  };

  if (can.client) {
    const lead = (s.leads || []).find(l => l.job === P.id) || (s.leads || []).find(l => l.c === P.client && this.leadStage(l) === 5);
    const cust = (s.customers || []).find(c => c.n === P.client);
    V.clientPart = {
      owner: lead ? this.av(lead.owner).n : cust ? this.av(cust.owner).n : '—',
      src: lead ? lead.src || '' : '', contact: (cust && [cust.contact, cust.phone].filter(Boolean).join(' · ')) || (lead && lead.contact) || '',
      value: this.canSeeValues() ? this.fmtM(P.val) : '',
      proposal: lead && lead.proposal ? { name: lead.proposal.name, open: () => this.openDoc({ n: lead.proposal.name, url: lead.proposal.url, path: lead.proposal.path }) } : null,
      openLead: lead ? () => this.setState({ page: 'clients', leadSel: lead.id }) : null
    };
  }
  if (can.creative) {
    const briefs = (s.tasks || []).filter(t => t.kind === 'brief' && t.p === P.id);
    const mineOnly = this.myDept() === 'creative' && !this.isManagerOf('creative') && !this.isTop();
    V.briefs = briefs.filter(b => !mineOnly || b.who === me).map(b => this.briefRow(b));
    V.designers = this.isManagerOf('creative') || this.isTop() ? this.teamOf('creative').map(face).map(f => ({ v: f.k, l: f.n, i: f.i, c: f.c })) : null;
    V.newBrief = can.canBrief ? () => this.openModal('brief', { p: P.id }) : null;
  }

  // Delivery: everyone sees who runs it; the Operations Manager chooses the Project Manager.
  V.team = [...new Set([P.pm, ...(P.team || [])].filter(Boolean))].map(face);
  if (can.canPM) {
    V.pmOpts = [...new Set([...this.teamOf('operations'), P.pm].filter(Boolean))].map(face);
    V.setPM = k => {
      if (k === P.pm) return;
      this.setState(x => ({ projects: x.projects.map(p => (p.id === P.id ? Object.assign({}, p, { pm: k, team: [...new Set([k, ...(p.team || [])])] }) : p)) }));
      if (k !== me) this.remind(k, 'You are Project Manager · ' + P.name, 'project', 'folder', P.client + ' · chosen by ' + this.me().n);
      this.toast(this.av(k).n + ' is Project Manager');
      this.log('folder', 'purple', 'Project Manager chosen · ' + P.name, this.av(k).n);
    };
  }
  if (can.canAdvance && P.st !== 'done') {
    V.advance = () => {
      const last = this.STAGES.length, ns = Math.min(last, stage + 1);
      this.setState(x => ({ projects: x.projects.map(p => (p.id === P.id ? Object.assign({}, p, { stage: ns, sv: 2, prog: Math.max(p.prog || 0, Math.round(ns / last * 100)), st: ns === last ? 'done' : p.st }) : p)) }));
      this.toast(ns === last ? P.name + ' closed' : 'Moved to ' + this.STAGES[ns - 1]);
      this.log('folder', 'purple', P.client + ' · ' + this.STAGES[ns - 1], P.name);
    };
    V.nextStage = stage < this.STAGES.length ? this.STAGES[stage] : '';
  }
  if (can.budget) {
    const u = P.bud ? P.spent / P.bud : 0;
    V.budget = { bud: this.fmtM(P.bud || 0), spent: this.fmtM(P.spent || 0), left: this.fmtM(Math.max(0, (P.bud || 0) - (P.spent || 0))), pct: Math.round(u * 100), over: u > 1 };
  }

  // Tasks: the PM, the Operations Manager and the top see all; everyone else sees their own.
  const tasks = (s.tasks || []).filter(t => t.p === P.id && t.kind !== 'brief' && (can.allTasks || t.who === me || t.by === me));
  V.tasks = tasks.map(t => ({ id: t.id, t: t.t, who: this.av(t.who).n, wi: face(t.who), due: t.due, done: t.st === 'done', mine: t.who === me,
    toggle: () => this.toggleTask(t.id) }));
  V.tasksTitle = can.allTasks ? 'Tasks' : 'Your tasks on this project';
  V.addTask = can.canTask ? () => this.openModal('task', { p: P.id }) : null;

  // Money requests: your own, or all of them for the PM, Operations, Finance and the top.
  const reqs = (s.reqs || []).filter(r => r.p === P.id && (can.allReqs || r.who === me));
  V.reqs = reqs.map(r => ({ id: r.id, what: this.reqWhat(r), who: this.av(r.who).n, amt: this.fmtT(r.amt), status: this.reqStatus(r), tone: this.reqTone(r),
    open: () => this.go('requests', { reqSel: r.id, reqFilter: 'all' }) }));
  V.reqsTitle = can.allReqs ? 'Money requests' : 'Your requests on this project';
  V.reqMoney = () => this.openModal('reqProject', { p: P.id });

  if (can.money) {
    const inv = (s.invoices || []).filter(i => i.p === P.id), invoiced = inv.reduce((a, b) => a + b.v, 0);
    V.money = { val: this.fmtM(P.val), invoiced: this.fmtM(invoiced), margin: (P.val ? Math.round((P.val - Math.max(P.bud, P.spent)) / P.val * 100) : 0) + '%',
      invoices: inv.map(i => ({ id: i.id, v: this.fmtM(i.v), st: i.st, due: i.due })), invoice: () => this.openModal('invoice', { p: P.id }) };
  }
  return { PV: V };
}

const WAIT = ['Sent', 'Project Manager', 'General Manager', 'Finance', 'Management', 'Finance to pay'];
export const projectMethods = {
  // A request's status in plain words.
  reqStatus(r) {
    if (r.st === 'rejected') return 'Rejected';
    if (r.st === 'paid') return 'Paid';
    if (r.st === 'approved' || r.step >= 5) return 'Approved · Finance to pay';
    return 'Waiting for ' + (WAIT[r.step] || 'approval');
  },
  reqTone(r) { return r.st === 'rejected' ? 'red' : r.st === 'paid' ? 'green' : r.st === 'approved' ? 'blue' : 'amber'; },
  // Ticks a task done (or back to open), remembering the day it was finished.
  toggleTask(id) {
    const t = (this.state.tasks || []).find(x => x.id === id); if (!t) return;
    const done = t.st !== 'done', today = this.today();
    this.setState(x => ({ tasks: x.tasks.map(y => (y.id === id ? Object.assign({}, y, { st: done ? 'done' : 'todo', doneOn: done ? today : '' }) : y)) }));
    if (done) {
      this.toast('Done · ' + t.t);
      this.log('check', 'green', this.me().first + ' finished a task', t.t);
      if (t.by && t.by !== this.me().k) this.notify({ to: t.by, ic: 'check', t: this.me().n + ' finished: ' + t.t, s: this.proj(t.p).client || 'Task', go: 'today' });
    }
  },
  startTask(id) { this.setState(x => ({ tasks: x.tasks.map(y => (y.id === id && y.st === 'todo' ? Object.assign({}, y, { st: 'prog' }) : y)) })); }
};
