// A project as each person sees it. Every department sees the header (what, for whom, stage, due)
// and then only the part it adds: Client Service the client and proposal, Creative the designs,
// Operations the PM, team and internal budget, Finance and Management the money.
// Mixed into TrinityApp, so `this` is the app.
import { ST } from './constants';
import { tzTime } from './finance';
import { FLOW, FLOW_L, FLOW_OWNER, sumLines, eventFields, fmtDay } from './flow';

export function projectVals(s) {
  const P = (s.projects || []).find(p => p.id === s.projectId);
  if (!P || !this.visibleProjects().some(p => p.id === P.id)) return { PV: { none: true, back: () => this.go('projects') } };
  const me = this.me().k, can = this.projectParts(P), stage = this.stageOf(P), pm = this.av(P.pm);
  const face = k => { const a = this.av(k); return { k, n: a.n, i: a.i, c: a.c, ph: a.ph }; };
  const st = ST[P.st] || ST.on;
  const V = {
    id: P.id, name: P.name, client: P.client, due: P.due, prog: P.prog || 0, st: { l: st.l, bg: st.bg, fg: st.fg },
    pm: P.pm ? pm.n : 'Not chosen yet', pmSet: !!P.pm, can,
    stages: this.STAGES.map((l, i) => ({ l, done: i + 1 < stage || P.st === 'done', cur: i + 1 === stage && P.st !== 'done' })),
    stageLabel: this.STAGES[stage - 1], back: () => this.go('projects')
  };
  // GM / Management: set the stage directly and the agreed value and budget.
  V.manage = this.canManageProject() ? {
    stage: FLOW.indexOf(this.flowOf(P)),
    stages: FLOW.map((k, i) => ({ k, l: k === 'execution' ? 'Ongoing' : k === 'closed' ? 'Completed' : FLOW_L[i], on: k === this.flowOf(P) })),
    val: String(Math.round(this.projectValue(P) || 0)), bud: String(Math.round((+P.bud || 0) * 1e6)),
    setStage: (to, c) => this.setProjectStage(P.id, to, c), saveMoney: f => this.setProjectMoney(P.id, f)
  } : null;
  // The event: venue, setup date and pax. Those who manage the project can change them.
  const E = eventFields(P);
  V.event = { venue: E.venue, setupDate: E.setupDate, setup: fmtDay(E.setupDate), pax: E.pax ? E.pax.toLocaleString('en-US') : '', paxN: E.pax,
    empty: !E.venue && !E.setupDate && !E.pax, canEdit: this.canEditProject(P), save: f => this.editProjectEvent(P.id, f) };

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
  // The execution team: the PM, the Operations Manager or Management pick who works on the job.
  const canTeam = this.isTop() || this.isManagerOf('operations') || (P.pm && P.pm === me);
  V.teamPick = canTeam ? { on: P.team || [], people: [...new Set([...this.teamOf('operations'), ...this.teamOf('production'), ...this.teamOf('creative'), ...this.teamOf('clientservice')].filter(k => k && k !== P.pm))].map(face), toggle: k => this.toggleTeam(P.id, k) } : null;
  // Memos about this project and the work attached through them.
  V.memos = this.memoVals(s).MEMO.forProject(P.id);
  V.files = (P.files || []).map(f => ({ name: f.name, by: this.av(f.by).n, at: f.at, dept: f.dept || '', img: /^image\//.test(f.mime || '') && f.url ? f.url : '', open: () => this.openDoc({ n: f.name, url: f.url, path: f.path, mime: f.mime }) }));
  V.canMemo = !!this.myDept() || this.isTop() || (s.role || 'ceo') === 'pa';
  // What happens now: the current step, who is responsible, and the action for the person looking.
  const flow = this.flowOf(P), B = P.budget || {}, role = s.role || 'ceo';
  const briefs = (s.tasks || []).filter(t => t.kind === 'brief' && t.p === P.id);
  const openTasks = (s.tasks || []).filter(t => t.p === P.id && t.kind !== 'brief' && t.st !== 'done').length;
  const nx = this.flowNext(P);
  const N = { flow, title: FLOW_L[FLOW.indexOf(flow)], owner: FLOW_OWNER[flow], next: nx ? FLOW_L[FLOW.indexOf(nx)] : '' };
  // Brief and Design can also be moved on by hand, with a comment (see advanceProject).
  if (['brief', 'design'].includes(flow) && this.canMoveOn(P)) N.move = c => this.advanceProject(P.id, c);
  if (flow === 'brief') { N.text = 'Client Service sends the design brief to Creative.'; if (this.canCS()) N.brief = () => this.openModal('brief', { p: P.id }); }
  if (flow === 'design') {
    const done = briefs.filter(b => b.st === 'done').length; N.text = 'Creative is designing · ' + done + ' of ' + briefs.length + ' design(s) approved by the Creative Manager.'; N.goDesigns = () => this.setState({ pvTab: 'designs' }); if (this.canCS()) N.brief = () => this.openModal('brief', { p: P.id });
    if (N.move && done < briefs.length) N.moveBlock = 'Approve every design first (' + (briefs.length - done) + ' open)';
  }
  if (flow === 'proposal') { N.text = 'Designs approved. Client Service uploads the proposal; it then goes to Operations for the budget.'; if (this.canCS()) N.upload = (f, note) => this.uploadProposal(P.id, f, note); }
  if (flow === 'budget') {
    N.text = B.st === 'returned' ? 'Sent back: ' + B.note : 'Operations chooses the Project Manager and prepares the internal budget and the project value.';
    N.returned = B.st === 'returned';
    if (this.canOps()) N.budgetForm = { pm: P.pm || '', lines: (B.lines || []).map(l => ({ item: l.item, qty: String(l.qty), cost: String(l.cost) })), value: B.value ? String(B.value) : '', file: B.file || null,
      people: [...new Set([...this.teamOf('operations'), ...this.teamOf('clientservice'), P.pm].filter(Boolean))].map(face),
      save: b => this.saveBudget(P.id, b), submit: (b, c) => this.submitBudget(P.id, b, c), attach: f => this.attachBudgetFile(P.id, f) };
  }
  if (flow === 'approval') {
    N.text = B.st === 'gm' ? 'Waiting for the General Manager to approve the budget.' : 'Approved by the GM · waiting for Management.';
    if (this.canApproveBudget(P)) { N.approve = c => this.approveBudget(P.id, c); N.gmStep = B.st === 'gm' && role === 'gm'; N.sendBack = note => this.returnBudget(P.id, note); }
  }
  if (flow === 'execution') {
    N.text = openTasks ? openTasks + ' task(s) open. Heads and the PM assign work; people finish tasks with a short report.' : 'All tasks done. The PM can close the project.';
    const canRun = this.isTop() || P.pm === me || this.isManagerOf('operations') || (this.myDept() && this.isManagerOf(this.myDept()));
    if (canRun) N.assign = () => this.openModal('task', { p: P.id });
    if (this.canClose(P)) { N.close = c => this.closeProject(P.id, c); if (openTasks) N.closeBlock = 'Finish the ' + openTasks + ' open task(s) first'; }
  }
  if (flow === 'closed') N.text = 'Closed.';
  V.now = N;
  // The record's buttons follow the step: briefs before execution, tasks, money and invoices in execution.
  const exec = flow === 'execution' || flow === 'closed';
  if (!['brief', 'design'].includes(flow)) V.newBrief = null;
  if (flow !== 'execution') V.addTask = null;
  if (!exec) { V.reqMoney = null; if (V.money) V.money.invoice = null; }
  if (V.clientPart && !(P.val > 0)) V.clientPart.value = 'Set in the budget';
  // The budget as Operations prepared it (for those who see money).
  if (can.budget && B.lines) {
    const internal = sumLines(B.lines);
    V.budgetSheet = { lines: B.lines.map(l => ({ item: l.item, qty: l.qty, cost: this.fmtT(l.cost), total: this.fmtT(l.qty * l.cost) })), internal: this.fmtT(internal), value: this.fmtT(B.value || 0), margin: B.value ? Math.round((B.value - internal) / B.value * 100) + '%' : '—',
      st: { draft: 'Draft', gm: 'Waiting for the GM', mgmt: 'Waiting for Management', approved: 'Approved', returned: 'Sent back' }[B.st] || '', gm: B.gm ? this.av(B.gm.by).n + ' · ' + B.gm.at : '', mgmt: B.mgmt ? this.av(B.mgmt.by).n + ' · ' + B.mgmt.at : '',
      file: B.file ? { name: B.file.name, open: () => this.openDoc({ n: B.file.name, url: B.file.url, path: B.file.path }) } : null };
  }
  const PO = P.po || null;
  V.po = { has: !!PO, no: PO ? PO.no : '', vendor: PO ? PO.vendor : '', date: PO ? PO.date : '', by: PO ? this.av(PO.by).n : '',
    file: PO && PO.file ? { name: PO.file.name, open: () => this.openDoc({ n: PO.file.name, url: PO.file.url, path: PO.file.path }) } : null,
    can: this.canPO(), save: f => this.recordPO(P.id, f), early: !PO && flow === 'execution' };
  V.proposalFile = P.proposal ? { name: P.proposal.name, by: this.av(P.proposal.by).n, at: P.proposal.at, note: P.proposal.note || '', open: () => this.openDoc({ n: P.proposal.name, url: P.proposal.url, path: P.proposal.path }) } : null;
  if (can.budget && P.bud) {
    const u = P.bud ? P.spent / P.bud : 0;
    V.budget = { bud: this.fmtM(P.bud || 0), spent: this.fmtM(P.spent || 0), left: this.fmtM(Math.max(0, (P.bud || 0) - (P.spent || 0))), pct: Math.round(u * 100), over: u > 1 };
  }

  // Tasks: the PM, the Operations Manager and the top see all; everyone else sees their own.
  const tasks = (s.tasks || []).filter(t => t.p === P.id && t.kind !== 'brief' && (can.allTasks || t.who === me || t.by === me));
  V.tasks = tasks.map(t => ({ id: t.id, t: t.t, who: this.av(t.who).n, wi: face(t.who), due: t.due, done: t.st === 'done', mine: t.who === me,
    toggle: () => this.toggleTask(t.id) }));
  V.tasksTitle = can.allTasks ? 'Tasks' : 'Your tasks on this project';
  V.addTask = can.canTask ? () => this.openModal('task', { p: P.id }) : null;

  // Money requests on this project, as far as this person may see them (see canSeeReq): all of them for
  // Management, the GM and the PA; otherwise your own and the ones waiting for you (Finance: what it handles).
  const reqs = this.visibleReqs(s).filter(r => r.p === P.id);
  V.reqs = reqs.map(r => ({ id: r.id, what: this.reqWhat(r), who: this.av(r.who).n, amt: this.fmtT(r.amt), items: this.reqItemsView(r).map(x => x.text).join(' · '), status: this.moneyStatus(r), tone: this.reqTone(r),
    open: () => this.go('requests', { reqSel: r.id, reqFilter: 'all' }) }));
  V.reqsTitle = can.allReqs ? 'Money requests' : 'Your requests on this project';
  V.reqMoney = () => this.openModal('reqProject', { p: P.id });

  if (can.money) {
    const inv = (s.invoices || []).filter(i => i.p === P.id), invoiced = inv.filter(i => i.st !== 'cancelled').reduce((a, b) => a + b.v, 0);
    V.money = { val: this.fmtM(P.val), invoiced: this.fmtM(invoiced), margin: can.profit ? (P.val ? Math.round((P.val - Math.max(P.bud, P.spent)) / P.val * 100) : 0) + '%' : '',
      invoices: inv.map(i => ({ id: i.id, v: this.fmtM(i.v), st: i.st, due: i.due })), invoice: () => this.openModal('invoice', { p: P.id }) };
  }
  // Activity: what each department added, newest first, plus notes people log on the project.
  const ev = [];
  const lead = (s.leads || []).find(l => l.job === P.id);
  if (lead && can.client) (lead.hist || []).forEach(h => ev.push({ at: h.at, who: h.by, t: 'Lead · ' + (['New', 'Contacted', 'Meeting', 'Proposal sent', 'Negotiation', 'Won', 'Lost'][h.s] || ''), s: h.note || '', tone: 'blue' }));
  if (can.creative) (s.tasks || []).filter(t => t.kind === 'brief' && t.p === P.id).forEach(b => {
    ev.push({ at: '', who: b.from, t: 'Design brief sent · ' + b.t, s: b.place || '', tone: 'purple' });
    (b.files || []).forEach(f => ev.push({ at: f.at, who: f.by, t: 'Design uploaded', s: f.name, tone: 'purple' }));
    if (b.st === 'done') ev.push({ at: '', who: this.managerOf('creative'), t: 'Design approved · ' + b.t, s: 'Sent to GM, Management and Client Service', tone: 'green' });
  });
  tasks.filter(t => t.st === 'done').forEach(t => ev.push({ at: t.doneOn || '', who: t.who, t: 'Task done', s: t.t, tone: 'green' }));
  reqs.forEach(r => ev.push({ at: '', who: r.who, t: 'Money request · ' + this.fmtT(r.amt), s: this.moneyStatus(r), tone: 'amber' }));
  (P.notes || []).forEach(n => ev.push({ at: n.at, who: n.by, t: n.step ? 'Step · ' + (FLOW_L[FLOW.indexOf(n.step)] || '') : 'Note', s: n.t, tone: n.step ? 'purple' : 'dark', note: true }));
  V.feed = ev.sort((a, b) => (b.at || '').localeCompare(a.at || '')).slice(0, 30).map(e => Object.assign({}, e, { w: face(e.who) }));
  V.addNote = t => {
    const text = String(t || '').trim(); if (!text) return false;
    this.setState(x => ({ projects: x.projects.map(p => (p.id === P.id ? Object.assign({}, p, { notes: [...(p.notes || []), { by: me, at: this.today(), t: text.slice(0, 500) }] }) : p)) }));
    return true;
  };
  // Smart buttons: how much of each part there is; a tap opens that tab.
  V.tab = s.pvTab || 'overview';
  V.setTab = k => this.setState({ pvTab: k });
  V.tabs = [
    ['overview', 'Overview', ''],
    ...(V.briefs ? [['designs', 'Designs', String(V.briefs.length)]] : []),
    ['tasks', can.allTasks ? 'Tasks' : 'My tasks', String(V.tasks.filter(t => !t.done).length)],
    ['money', can.allReqs ? 'Requests' : 'My requests', String(V.reqs.length)],
    ...(V.money ? [['invoices', 'Invoices', String(V.money.invoices.length)]] : [])
  ].map(([k, l, n]) => ({ k, l, n }));
  return { PV: V };
}

const WAIT = ['Sent', 'Project Manager', 'General Manager', 'Finance', 'Management', 'Finance to pay'];
export const projectMethods = {
  // A request's status in plain words.
  moneyStatus(r) {
    if (r.st === 'rejected') return 'Rejected';
    if (r.st === 'paid') return 'Paid ' + this.fmtT(r.paidAmt || r.amt);
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

// Questions on a request, and reconciling a paid request with receipts.
export const reqFlowMethods = {
  askReq(id, text) {
    const t = String(text || '').trim(); if (!t) return 'Write your question';
    const r = this.state.reqs.find(x => x.id === id); if (!r) return 'Request not found';
    this.setState(x => ({ reqs: x.reqs.map(q => (q.id === id ? Object.assign({}, q, { info: 'asked', thread: [...(q.thread || []), { by: this.me().k, t, at: this.today() + ' ' + this.now() }] }) : q)) }));
    if (r.who !== this.me().k) this.notify({ to: r.who, ic: 'message', t: this.me().n + ' asks about ' + r.id, s: t, go: 'request:' + r.id });
    this.toast('Question sent to ' + this.av(r.who).n);
    return '';
  },
  // The requester corrects their own request: a reply to a question, new payment details, and, for a request
  // that was not approved, sending it back into the approval chain from the start.
  fixReq(id, f) {
    const r = this.state.reqs.find(x => x.id === id); if (!r) return 'Request not found';
    if (r.who !== this.me().k) return 'Only the person who asked for the money can correct it';
    if (!['pending', 'rejected'].includes(r.st)) return 'This request can no longer be changed';
    const pi = this.payInfo(f); if (pi.error) return pi.error;
    // Before anyone has approved it, the requester may also change the amount, title and purpose.
    const untouched = r.st === 'pending' && this.reqUntouched(r), edits = {};
    if (untouched) {
      if (Array.isArray(f.items)) {
        // Items: the amount becomes their sum. A lone item without its own description takes the purpose.
        const it = this.reqItems(f.items, f.purpose != null ? f.purpose : r.purpose); if (it.error) return it.error;
        if (it.amt !== r.amt) edits.amt = it.amt;
        const was = (r.items || [{ d: String(f.purpose != null ? f.purpose : r.purpose || '').trim(), amt: r.amt }]).map(x => this.reqItemNorm(x));
        if (JSON.stringify(it.items) !== JSON.stringify(was)) edits.items = it.items;
      } else if (f.amt != null && String(f.amt).trim() !== '') { const a = Math.round(+f.amt || 0); if (a <= 0) return 'Enter an amount above 0'; if (a !== r.amt) edits.amt = a; }
      if (f.purpose != null) { const t = String(f.purpose).trim(); if (!t) return 'Write what the money is for'; if (t !== r.purpose) edits.purpose = t; }
      if (f.title != null && String(f.title).trim() !== (r.title || '')) edits.title = String(f.title).trim();
    }
    const reply = String(f.reply || '').trim(), at = this.today() + ' ' + this.now();
    const changed = JSON.stringify(pi.pay) !== JSON.stringify(r.pay || null), edited = Object.keys(edits).length > 0;
    if (!reply && !changed && !edited && r.st !== 'rejected') return 'Change something, or write a reply';
    const note = [reply, edits.amt ? 'Amount: ' + this.fmtT(r.amt) + ' → ' + this.fmtT(edits.amt) : '', edits.items && (edits.items.length > 1 || (r.items || []).length > 1) ? 'Items: ' + edits.items.map(x => this.reqItemText(x)).join(' · ') : '', edits.purpose ? 'Purpose changed' : '', edits.title ? 'Title: ' + edits.title : '', changed ? 'Payment details: ' + [pi.pay.by, pi.pay.bank, pi.pay.name, pi.pay.no].filter(Boolean).join(' · ') : ''].filter(Boolean).join('\n');
    // A new amount can change who needs to approve (small amounts skip Management): rebuild the start of the chain.
    if (untouched && edits.amt) { const st0 = this.nextStep(Object.assign({}, r, edits), 0); Object.assign(edits, { step: st0, log: [r.log[0], ...Array.from({ length: Math.max(0, st0 - 1) }, () => 'Not needed')] }); }
    const resubmit = r.st === 'rejected', step = resubmit ? this.nextStep(r, 0) : r.step;
    const patch = Object.assign({}, edits, { pay: pi.pay, thread: [...(r.thread || []), ...(note || resubmit ? [{ by: this.me().k, t: (resubmit ? 'Corrected and resubmitted. ' : '') + note, at }] : [])] },
      resubmit ? { st: 'pending', step, info: '', log: [...(r.log || []).slice(0, 1), ...Array.from({ length: Math.max(0, step - 1) }, () => 'Not needed')], resubmitted: at } : (r.info === 'asked' ? { info: 'answered' } : {}));
    this.setState(x => ({ reqs: x.reqs.map(q => (q.id === id ? Object.assign({}, q, patch) : q)) }));
    if (!resubmit && edited) {
      const to = this.approverAt(Object.assign({}, r, patch), patch.step != null ? patch.step : r.step);
      this.remind(to, r.id + ' was changed before approval', 'request:' + r.id, 'banknote', note.replace(/\n/g, ' · ').slice(0, 120));
      this.toast(r.id + ' updated');
      return '';
    }
    if (resubmit) {
      const to = this.approverAt(Object.assign({}, r, patch), step);
      this.remind(to, r.id + ' was corrected and needs your approval', 'request:' + r.id, 'banknote', this.av(r.who).n + ' · ' + this.fmtT(r.amt));
      this.smsTo(to, r.id + ' was corrected and needs your approval. ' + this.av(r.who).n + ' requests ' + this.fmtT(r.amt) + '. Open the system to act.');
      this.toast(r.id + ' resubmitted');
    } else {
      const asker = [...(r.thread || [])].reverse().find(m => m.by !== r.who), to = asker ? asker.by : this.approverAt(r, r.step);
      this.notify({ to, ic: 'message', t: this.me().n + ' updated ' + r.id, s: note.slice(0, 120), go: 'request:' + r.id });
      this.toast(r.id + ' updated');
    }
    return '';
  },
  // Nobody has approved it yet: only the creation time and skipped steps are in its log.
  reqUntouched(r) { return (r.log || []).slice(1).every(x => x === 'Not needed'); },
  answerReq(id, text) {
    const t = String(text || '').trim(); if (!t) return 'Write your answer';
    const r = this.state.reqs.find(x => x.id === id); if (!r) return 'Request not found';
    const asker = [...(r.thread || [])].reverse().find(m => m.by !== r.who);
    this.setState(x => ({ reqs: x.reqs.map(q => (q.id === id ? Object.assign({}, q, { info: 'answered', thread: [...(q.thread || []), { by: this.me().k, t, at: this.today() + ' ' + this.now() }] }) : q)) }));
    if (asker) this.notify({ to: asker.by, ic: 'message', t: this.me().n + ' answered on ' + r.id, s: t, go: 'request:' + r.id });
    this.toast('Answer sent');
    return '';
  },
  // The person who received the money accounts for it: what was spent (per item), the receipts and the
  // change (computed as paid − spent, editable) and how it comes back. Spending more than was given is
  // allowed and marked, so Finance can decide (a top-up is a new request). Old callers pass (spent, file).
  async reconcileReq(id, spent, file) {
    const r = this.state.reqs.find(x => x.id === id); if (!r) return 'Request not found';
    if (r.st !== 'paid') return 'This request is not paid yet';
    if (r.rec && (r.rec.st === 'submitted' || r.rec.st === 'ok')) return 'Already sent to Finance';
    const paid = r.paidAmt || r.amt, toN = v => Math.round(+String(v == null ? '' : v).replace(/[^0-9.]/g, '') || 0);
    let amt, items = null, files = [], backVia = '', back;
    if (spent && typeof spent === 'object') {
      items = (spent.items || []).map(x => ({ d: String(x.d || '').trim(), amt: toN(x.amt) })).filter(x => x.d || x.amt);
      if (items.some(x => x.amt > 0 && !x.d)) return 'Say what each amount was for';
      items = items.filter(x => x.amt > 0);
      amt = items.reduce((a, x) => a + x.amt, 0);
      files = (spent.files || []).filter(Boolean);
      backVia = spent.backVia || '';
      if (spent.back != null && String(spent.back).trim() !== '') back = toN(spent.back);
    } else { amt = Math.round(+spent || 0); if (file) files = [file]; }
    if (amt <= 0) return 'Enter the amount spent';
    const over = Math.max(0, amt - paid), left = Math.max(0, paid - amt);
    if (back == null) back = left;
    if (back > left) return 'The change cannot be more than ' + this.fmtT(left);
    if (back > 0 && items && !backVia) return 'Say how the change comes back to Finance';
    const up = [];
    for (const f of files) { try { up.push(await this.storeFile(f)); } catch (e) { return 'Receipt upload failed · ' + (e.message || e); } }
    const rec = Object.assign({ spent: amt, back, file: up[0] || null, at: this.fToday(), time: tzTime(this.nowDate()), st: 'submitted', paid }, items ? { items } : {}, up.length > 1 ? { files: up } : {}, backVia ? { backVia } : {}, over ? { over } : {}, left - back > 0 ? { short: left - back } : {}, r.rec && r.rec.st === 'back' ? { prev: r.rec } : {});
    this.setState(x => ({ reqs: x.reqs.map(q => (q.id === id ? Object.assign({}, q, { rec }) : q)) }));
    this.notify({ to: this.ROLES.finance.k, ic: 'receipt', t: 'Receipts to check · ' + r.id, s: this.av(r.who).n + ' spent ' + this.fmtT(amt) + (over ? ' · spent more than given (' + this.fmtT(over) + ')' : back ? ' · returns ' + this.fmtT(back) + (backVia ? ' (' + backVia + ')' : '') : ''), go: 'float' });
    this.toast('Sent to Finance to check');
    return '';
  },
  // Finance accepts the accounting: the advance closes (the person's float goes down by what was paid)
  // and the change goes back into the float on the day of acceptance, with how it came back.
  confirmRec(id, opts) {
    if (!['finance', 'ceo'].includes(this.state.role || 'ceo')) return 'Only Finance accepts receipts';
    const r = this.state.reqs.find(x => x.id === id); if (!r || !r.rec) return 'Nothing to accept';
    if (r.rec.st !== 'submitted') return r.rec.st === 'ok' ? 'Already accepted' : 'Waiting for ' + this.av(r.who).n + ' to send it again';
    const paid = r.paidAmt || r.amt, back = r.rec.back || 0;
    const via = (opts && opts.backVia) || r.rec.backVia || 'Cash';
    if (back > 0 && via === 'Not yet') return 'The change (' + this.fmtT(back) + ') has not come back yet · choose how it was returned';
    const ok = { st: 'ok', by: this.me().k, okAt: this.fToday(), okTime: tzTime(this.nowDate()) };
    if (back > 0) ok.backVia = via;
    this.setState(x => ({ reqs: x.reqs.map(q => (q.id === id ? Object.assign({}, q, { rec: Object.assign({}, q.rec, ok) }) : q)), staff: x.staff.map(p => (p.k === r.who ? Object.assign({}, p, { fl: Math.max(0, (p.fl || 0) - paid) }) : p)) }));
    if (r.who !== this.me().k) this.notify({ to: r.who, ic: 'check', t: 'Receipts accepted · ' + r.id, s: 'Your advance for this request is closed' + (back > 0 ? ' · change ' + this.fmtT(back) + ' received' : ''), go: 'request:' + r.id });
    this.toast('Receipts accepted · ' + r.id + (back > 0 ? ' · ' + this.fmtT(back) + ' back in the float' : ''));
    return '';
  }
};
