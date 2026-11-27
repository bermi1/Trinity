// The project flow: every step is an action by the responsible department, which moves the project on
// and tells the next person.
//   brief      Client Service sends the design brief to Creative
//   design     the designer uploads, the Creative Manager approves (GM, Management, Client Service told)
//   proposal   Client Service uploads the proposal
//   budget     the Operations Manager chooses the Project Manager and prepares the internal budget and value
//   approval   the GM approves, then Management (either can send it back with a reason)
//   execution  heads and the PM assign tasks; people finish them with a short report, routed up
//   closed     the PM closes it when every task is done
// Mixed into TrinityApp, so `this` is the app.
import { dayKey } from './seed';

export const FLOW = ['brief', 'design', 'proposal', 'budget', 'approval', 'execution', 'closed'];
export const FLOW_L = ['Brief', 'Design', 'Proposal', 'Budget', 'Approval', 'Execution', 'Closed'];
// Who is responsible at each step (department key, or role).
export const FLOW_OWNER = { brief: 'Client Service', design: 'Creative', proposal: 'Client Service', budget: 'Operations', approval: 'General Manager, then Management', execution: 'Project Manager and teams', closed: '' };

const sumLines = lines => (lines || []).reduce((a, l) => a + (+l.qty || 0) * (+l.cost || 0), 0);

// The event's details, shared with leads (same names on both): where it is held, the setup date and
// how many people. Normalised: trimmed venue, a real 'YYYY-MM-DD' date or '', pax a whole number ≥ 0.
export const validDay = d => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) return false;
  const [y, m, n] = d.split('-').map(Number), t = new Date(Date.UTC(y, m - 1, n));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === n;
};
export function eventFields(f) {
  f = f || {};
  const venue = String(f.venue == null ? '' : f.venue).replace(/\s+/g, ' ').trim().slice(0, 200);
  const d = String(f.setupDate == null ? '' : f.setupDate).trim();
  const n = parseFloat(String(f.pax == null ? '' : f.pax).replace(/[,\s]/g, ''));
  return { venue, setupDate: validDay(d) ? d : '', pax: Number.isFinite(n) && n > 0 ? Math.floor(n) : 0 };
}
// '2026-12-12' → '12 Dec 2026'.
export const fmtDay = d => {
  if (!validDay(d)) return '';
  const [y, m, n] = d.split('-').map(Number);
  return new Date(y, m - 1, n).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
// Venue · setup date · pax, for cards and notifications ('' when nothing is set).
export const eventLine = p => { const e = eventFields(p); return [e.venue, fmtDay(e.setupDate), e.pax ? e.pax.toLocaleString('en-US') + ' pax' : ''].filter(Boolean).join(' · '); };
const said = c => String(c == null ? '' : c).replace(/\s+/g, ' ').trim().slice(0, 500);

export const flowMethods = {
  flowOf(p) {
    if (p.flow && FLOW.includes(p.flow)) return p.flow;
    if (p.st === 'done') return 'closed';
    return 'execution';
  },
  setProject(id, patch) { this.setState(x => ({ projects: x.projects.map(p => (p.id === id ? Object.assign({}, p, typeof patch === 'function' ? patch(p) : patch) : p)) })); },
  toggleTeam(pid, k) {
    const p = this.state.projects.find(x => x.id === pid); if (!p) return;
    const on = (p.team || []).includes(k);
    this.setProject(pid, { team: on ? p.team.filter(x => x !== k) : [...(p.team || []), k] });
    this.pnote(pid, (on ? 'Removed from' : 'Added to') + ' the team: ' + this.av(k).n);
    if (!on && k !== this.me().k) this.notify({ to: k, ic: 'users', t: 'You are on the team · ' + p.client, s: p.name + ' · added by ' + this.me().n, go: 'project:' + pid });
    this.toast((on ? 'Removed ' : 'Added ') + this.av(k).n.split(' ')[0]);
  },
  pnote(id, t, extra) { this.setProject(id, p => ({ notes: [...(p.notes || []), Object.assign({ by: this.me().k, at: dayKey(0), t, sys: true }, extra || {})] })); },
  // A step change goes in the project's notes: "Moved to Design · what happened · comment · by Name".
  // Returns the comment, cleaned, so the caller can pass it on in the notification.
  stepNote(id, to, what, comment) {
    const c = said(comment), back = FLOW.indexOf(to) < FLOW.indexOf(this.flowOf(this.state.projects.find(p => p.id === id) || {}));
    this.pnote(id, [(back ? 'Moved back to ' : 'Moved to ') + FLOW_L[FLOW.indexOf(to)], what, c, 'by ' + this.me().n].filter(Boolean).join(' · '), { step: to, comment: c });
    return c;
  },
  // Who may change a project's details: Management, the Operations and Client Service managers, the
  // project's PM and its Client Service owner.
  canEditProject(p) {
    const me = this.me().k;
    return !!p && (this.isTop() || this.isManagerOf('operations') || this.isManagerOf('clientservice') || (!!p.pm && p.pm === me) || (!!p.cs && p.cs === me));
  },
  // Venue, setup date and pax: saved, and the change noted on the project.
  editProjectEvent(pid, f) {
    const p = this.state.projects.find(x => x.id === pid); if (!p) return 'Project not found';
    if (!this.canEditProject(p)) return 'Only Management, the PM or the project’s Client Service can change the event details';
    const raw = String((f || {}).setupDate == null ? '' : f.setupDate).trim();
    if (raw && !validDay(raw)) return 'Enter the setup date as a date';
    const pax = String((f || {}).pax == null ? '' : f.pax).replace(/[,\s]/g, '');
    if (pax && !(/^\d+$/.test(pax))) return 'Pax is a whole number of people';
    const e = eventFields(f), was = eventFields(p), ch = [];
    if (e.venue !== was.venue) ch.push('Venue: ' + (e.venue || '—'));
    if (e.setupDate !== was.setupDate) ch.push('Setup: ' + (fmtDay(e.setupDate) || '—'));
    if (e.pax !== was.pax) ch.push('Pax: ' + (e.pax || '—'));
    if (!ch.length) { this.toast('No changes'); return ''; }
    this.setProject(pid, e);
    this.pnote(pid, 'Event details changed · ' + ch.join(' · ') + ' · by ' + this.me().n);
    this.toast('Event details saved');
    return '';
  },
  canCS() { return this.isTop() || this.myDept() === 'clientservice'; },
  canOps() { return this.isTop() || this.isManagerOf('operations'); },

  // A new project starts at the brief. Its value is not known yet: Operations sets it in the budget.
  newProject(f) {
    const client = (f.client || '').trim(), name = (f.name || '').trim();
    if (!client || !name) return 'Enter the client and the project name';
    const id = this.nextId('PRJ', this.state.projects);
    const p = Object.assign({ id, name, client, pm: '', st: 'on', prog: 0, val: 0, bud: 0, spent: 0, flow: 'brief', due: f.due || 'TBC', team: [], cs: f.cs || this.me().k, lead: f.lead || '', at: dayKey(0) }, eventFields(f));
    this.setState(x => ({ projects: [p, ...x.projects] }));
    if (p.cs !== this.me().k) this.remind(p.cs, 'New project: send the design brief · ' + client, 'project', 'folder', name);
    this.toast('Project ' + id + ' created · next: send the design brief to Creative');
    this.log('folder', 'purple', 'Project created · ' + client, name);
    return id;
  },
  // Brief sent: the project moves to Design.
  afterBrief(pid, comment) {
    const p = this.state.projects.find(x => x.id === pid); if (!p) return;
    if (this.flowOf(p) === 'brief') { this.stepNote(pid, 'design', 'Design brief sent to Creative', comment); this.setProject(pid, { flow: 'design' }); }
  },
  // Every brief of the project approved: Client Service uploads the proposal.
  afterDesignApproved(pid) {
    const p = this.state.projects.find(x => x.id === pid); if (!p || this.flowOf(p) !== 'design') return;
    const briefs = this.state.tasks.filter(t => t.kind === 'brief' && t.p === pid);
    if (briefs.length && briefs.every(b => b.st === 'done')) {
      this.stepNote(pid, 'proposal', 'All designs approved · Client Service to upload the proposal');
      this.setProject(pid, { flow: 'proposal' });
      const cs = p.cs || this.managerOf('clientservice');
      if (cs && cs !== this.me().k) this.remind(cs, 'Designs approved: upload the proposal · ' + p.client, 'project', 'fileText', p.name);
    }
  },
  async uploadProposal(pid, file, note) {
    const p = this.state.projects.find(x => x.id === pid); if (!p) return 'Project not found';
    if (!this.canCS()) return 'Client Service uploads the proposal';
    if (this.flowOf(p) !== 'proposal') return 'The proposal comes after the designs are approved';
    if (!file) return 'Attach the proposal file';
    let info; try { info = await this.storeFile(file); } catch (e) { return 'Upload failed · ' + (e.message || e); }
    const c = this.stepNote(pid, 'budget', 'Proposal uploaded · ' + file.name + ' · sent to Operations for the budget', note);
    this.setProject(pid, { flow: 'budget', proposal: Object.assign({ by: this.me().k, at: dayKey(0), note: c }, info) });
    const om = this.managerOf('operations');
    if (om && om !== this.me().k) this.remind(om, 'Budget needed: choose the PM and prepare the internal budget · ' + p.client, 'project', 'wallet', p.name + (c ? ' · ' + c : ''));
    this.toast('Proposal uploaded · sent to Operations for the budget');
    return '';
  },

  // The internal budget can also be attached as a file (Excel or PDF prepared by Operations).
  async attachBudgetFile(pid, file) {
    if (!this.canOps()) return 'The Operations Manager prepares the budget';
    let info; try { info = await this.storeFile(file); } catch (e) { return 'Upload failed · ' + (e.message || e); }
    this.setProject(pid, x => ({ budget: Object.assign({ lines: [], value: 0, st: 'draft' }, x.budget || {}, { file: Object.assign({ by: this.me().k, at: dayKey(0) }, info) }) }));
    this.pnote(pid, 'Internal budget file attached · ' + file.name);
    return '';
  },
  // Operations: Project Manager, internal budget lines and the project value.
  saveBudget(pid, b) {
    const p = this.state.projects.find(x => x.id === pid); if (!p) return 'Project not found';
    if (!this.canOps()) return 'The Operations Manager prepares the budget';
    const lines = (b.lines || []).filter(l => (l.item || '').trim() && +l.cost > 0).map(l => ({ item: l.item.trim(), qty: +l.qty || 1, cost: Math.round(+l.cost) }));
    this.setProject(pid, x => ({ pm: b.pm != null ? b.pm : x.pm, team: b.pm ? [...new Set([b.pm, ...(x.team || [])])] : x.team, budget: Object.assign({}, x.budget || {}, { lines, value: Math.round(+b.value || 0), st: 'draft', by: this.me().k, at: dayKey(0) }) }));
    return '';
  },
  submitBudget(pid, b, comment) {
    const e = this.saveBudget(pid, b); if (e) return e;
    const p = this.state.projects.find(x => x.id === pid), lines = (b.lines || []).filter(l => (l.item || '').trim() && +l.cost > 0);
    if (!b.pm) return 'Choose the Project Manager';
    if (!lines.length) return 'Add at least one budget line';
    if (!(+b.value > 0)) return 'Enter the project value (what the client pays)';
    const c = this.stepNote(pid, 'approval', 'Budget submitted · internal ' + this.fmtT(sumLines(lines)) + ' · value ' + this.fmtT(+b.value) + ' · waiting for the GM', comment);
    this.setProject(pid, x => ({ flow: 'approval', budget: Object.assign({}, x.budget, { st: 'gm', note: '' }) }));
    this.remind(this.ROLES.gm.k, 'Budget to approve · ' + p.client, 'project', 'wallet', p.name + ' · ' + this.fmtT(+b.value) + (c ? ' · ' + c : ''));
    if (b.pm !== this.me().k) this.remind(b.pm, 'You are Project Manager · ' + p.client, 'project', 'folder', p.name);
    this.toast('Budget sent to the GM for approval');
    return '';
  },
  canApproveBudget(p) {
    const b = p.budget || {}, role = this.state.role || 'ceo';
    return this.flowOf(p) === 'approval' && ((b.st === 'gm' && (role === 'gm' || role === 'ceo')) || (b.st === 'mgmt' && role === 'ceo'));
  },
  approveBudget(pid, comment) {
    const p = this.state.projects.find(x => x.id === pid); if (!p || !this.canApproveBudget(p)) return 'Not waiting for you';
    const b = p.budget, role = this.state.role || 'ceo', me = this.me().k, at = dayKey(0);
    if (b.st === 'gm' && role === 'gm') {
      const c = said(comment);
      this.setProject(pid, x => ({ budget: Object.assign({}, x.budget, { st: 'mgmt', gm: { by: me, at } }) }));
      this.pnote(pid, ['Budget approved by the GM · waiting for Management', c, 'by ' + this.me().n].filter(Boolean).join(' · '), c ? { comment: c } : null);
      this.remind(this.ROLES.ceo.k, 'Budget to approve · ' + p.client, 'project', 'wallet', p.name + ' · approved by the GM' + (c ? ' · ' + c : ''));
      this.toast('Approved · sent to Management');
      return '';
    }
    // Management's approval (it also covers the GM step when Management acts first).
    const internal = sumLines(b.lines);
    const c = this.stepNote(pid, 'execution', 'Budget approved by Management · project is in execution', comment);
    this.setProject(pid, x => ({ flow: 'execution', val: +(b.value / 1e6).toFixed(2), bud: +(internal / 1e6).toFixed(2), budget: Object.assign({}, x.budget, { st: 'approved', gm: x.budget.gm || { by: me, at }, mgmt: { by: me, at } }) }));
    [p.pm, this.managerOf('operations'), p.cs, this.ROLES.finance.k, this.ROLES.gm.k].filter((k, i, a) => k && k !== me && a.indexOf(k) === i)
      .forEach(k => this.remind(k, 'Approved, start execution · ' + p.client, 'project', 'check', p.name + (k === this.ROLES.finance.k ? ' · value ' + this.fmtT(b.value) + ', ready to invoice' : '') + (c ? ' · ' + c : '')));
    this.toast('Budget approved · project moves to execution');
    return '';
  },
  returnBudget(pid, note) {
    const p = this.state.projects.find(x => x.id === pid); if (!p || !this.canApproveBudget(p)) return 'Not waiting for you';
    if (!(note || '').trim()) return 'Say what should change';
    this.stepNote(pid, 'budget', 'Budget sent back', note);
    this.setProject(pid, x => ({ flow: 'budget', budget: Object.assign({}, x.budget, { st: 'returned', note: note.trim(), gm: null }) }));
    const om = this.managerOf('operations'); if (om && om !== this.me().k) this.remind(om, 'Budget sent back · ' + p.client, 'project', 'wallet', note.trim());
    this.toast('Sent back to Operations');
    return '';
  },

  // "Move to <next step>" from the project page, with an optional comment. Brief and Design can be moved
  // by hand (a brief given in a meeting, designs done outside the system); the later steps keep their
  // own action, because each needs something (the proposal file, the budget, the approvals, tasks done).
  flowNext(p) { const i = FLOW.indexOf(this.flowOf(p)); return i >= 0 && i < FLOW.length - 1 ? FLOW[i + 1] : ''; },
  canMoveOn(p) {
    const f = this.flowOf(p);
    if (f === 'brief') return this.canCS();
    if (f === 'design') return this.canCS() || this.isManagerOf('creative');
    if (f === 'approval') return this.canApproveBudget(p);
    if (f === 'execution') return this.canClose(p);
    return false;
  },
  advanceProject(pid, comment) {
    const p = this.state.projects.find(x => x.id === pid); if (!p) return 'Project not found';
    const f = this.flowOf(p), to = this.flowNext(p);
    if (!to) return 'This project is closed';
    if (f === 'proposal') return 'Upload the proposal to move to Budget';
    if (f === 'budget') return 'Submit the budget to move to Approval';
    if (f === 'approval') return this.approveBudget(pid, comment);
    if (f === 'execution') return this.closeProject(pid, comment);
    if (!this.canMoveOn(p)) return f === 'brief' ? 'Client Service moves the project to Design' : 'Client Service or the Creative Manager moves the project to Proposal';
    if (f === 'design') {
      const open = this.state.tasks.filter(t => t.kind === 'brief' && t.p === pid && t.st !== 'done').length;
      if (open) return open + ' design(s) not approved yet';
    }
    const c = this.stepNote(pid, to, '', comment);
    this.setProject(pid, { flow: to });
    const sub = p.name + (c ? ' · ' + c : '') + ' · by ' + this.me().n;
    if (to === 'design') { const cm = this.managerOf('creative'); if (cm && cm !== this.me().k) this.remind(cm, 'Project moved to Design · ' + p.client, 'project:' + pid, 'clipboard', sub); }
    if (to === 'proposal') { const cs = p.cs || this.managerOf('clientservice'); if (cs && cs !== this.me().k) this.remind(cs, 'Designs done: upload the proposal · ' + p.client, 'project:' + pid, 'fileText', sub); }
    this.toast('Moved to ' + FLOW_L[FLOW.indexOf(to)]);
    this.log('folder', 'purple', p.client + ' · moved to ' + FLOW_L[FLOW.indexOf(to)], p.name + (c ? ' · ' + c : ''));
    return '';
  },

  // Purchase order from the client: Management or the PA records it (number, vendor number, date, the
  // PO file). Work may start before it arrives; Finance needs it to invoice.
  canPO() { return ['ceo', 'gm', 'pa'].includes(this.state.role || 'ceo'); },
  async recordPO(pid, f) {
    const p = this.state.projects.find(x => x.id === pid); if (!p) return 'Project not found';
    if (!this.canPO()) return 'Management or the PA records the purchase order';
    if (!(f.no || '').trim()) return 'Enter the PO number';
    if (!f.date) return 'Enter the PO date';
    let file = (p.po || {}).file || null;
    if (f.file) { try { file = await this.storeFile(f.file); } catch (e) { return 'Upload failed · ' + (e.message || e); } }
    const po = { no: f.no.trim(), vendor: (f.vendor || '').trim(), date: f.date, file, by: this.me().k, at: dayKey(0) };
    this.setProject(pid, { po });
    this.pnote(pid, 'Purchase order received · ' + po.no + (po.vendor ? ' · vendor no. ' + po.vendor : ''));
    [this.ROLES.finance.k, this.ROLES.ceo.k, p.pm].filter((k, i, a) => k && k !== this.me().k && a.indexOf(k) === i)
      .forEach(k => this.remind(k, 'PO received · ' + p.client, 'project', 'fileText', po.no + ' · ' + p.name + (k === this.ROLES.finance.k ? ' · ready to invoice' : '')));
    this.toast('Purchase order saved · ' + po.no);
    return '';
  },
  // A task finished with a short report: the person who gave it and the PM are told; the project keeps it.
  reportTask(id, report) {
    const t = this.state.tasks.find(x => x.id === id); if (!t) return;
    const r = (report || '').trim(), today = dayKey(0), me = this.me().k;
    this.setState(x => ({ tasks: x.tasks.map(y => (y.id === id ? Object.assign({}, y, { st: 'done', doneOn: today, report: r }) : y)) }));
    const P = this.proj(t.p);
    if (P.id) this.setProject(P.id, p => ({ notes: [...(p.notes || []), { by: me, at: today, t: 'Done: ' + t.t + (r ? ' · ' + r : ''), report: true }] }));
    [t.by, P.pm].filter((k, i, a) => k && k !== me && a.indexOf(k) === i).forEach(k => this.notify({ to: k, ic: 'check', t: this.me().n + ' finished: ' + t.t, s: r || (P.client || 'Task done'), go: P.id ? 'project' : 'today' }));
    this.toast('Done · ' + t.t);
    this.log('check', 'green', this.me().first + ' finished a task', t.t + (r ? ' · ' + r : ''));
  },
  // ---- Management and the GM run a project directly, without the full procedure: some projects come in
  // already agreed or are already running. They can put a project at any step (e.g. Ongoing = execution,
  // Completed = closed), and set the agreed value and the budget. The PA then adds the PO as usual.
  canManageProject() { return this.isTop(); },
  setProjectStage(pid, to, comment) {
    const p = this.state.projects.find(x => x.id === pid); if (!p) return 'Project not found';
    if (!this.canManageProject()) return 'Only the GM or Management can set the stage directly';
    if (!FLOW.includes(to)) return 'Choose a stage';
    const from = this.flowOf(p); if (from === to) return '';
    const who = (this.state.role || 'ceo') === 'gm' ? 'the GM' : 'Management';
    const skipped = FLOW.indexOf(to) - FLOW.indexOf(from) > 1 ? ' (steps skipped)' : '';
    const c = this.stepNote(pid, to, 'Set directly by ' + who + skipped, comment);
    const closedAt = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    this.setProject(pid, x => Object.assign({ flow: to },
      to === 'closed' ? { st: 'done', prog: 100, closedAt } : { st: x.st === 'done' ? 'on' : x.st, closedAt: null },
      // Set straight to execution with a budget still waiting: it counts as approved.
      to === 'execution' && x.budget && x.budget.st && x.budget.st !== 'approved' ? { budget: Object.assign({}, x.budget, { st: 'approved', mgmt: { by: this.me().k, at: dayKey(0), direct: true } }) } : {}));
    const L = FLOW_L[FLOW.indexOf(to)], label = to === 'execution' ? 'Ongoing (execution)' : to === 'closed' ? 'Completed' : L;
    const tell = to === 'closed' ? [this.ROLES.ceo.k, this.ROLES.gm.k, this.ROLES.finance.k, p.pm, p.cs]
      : to === 'execution' ? [p.pm, this.managerOf('operations'), p.cs, this.ROLES.finance.k, this.ROLES.pa && this.ROLES.pa.k, this.ROLES.ceo.k, this.ROLES.gm.k] : [p.cs, p.pm, this.ROLES.ceo.k, this.ROLES.gm.k];
    tell.filter((k, i, a) => k && k !== this.me().k && a.indexOf(k) === i).forEach(k => this.remind(k, p.client + ' · ' + label, 'project', to === 'closed' ? 'check' : 'folder',
      p.name + ' · set by ' + this.me().n + (to === 'execution' && !p.po && k === (this.ROLES.pa && this.ROLES.pa.k) ? ' · please add the PO' : '') + (c ? ' · ' + c : '')));
    this.toast(p.name + ' · ' + label);
    this.log('folder', to === 'closed' ? 'green' : 'purple', p.client + ' · ' + label, p.name + ' · set by ' + this.me().n);
    return '';
  },
  // Agreed value (what the client pays) and budget (what it costs us), in TZS. Either may be left as is.
  setProjectMoney(pid, f) {
    const p = this.state.projects.find(x => x.id === pid); if (!p) return 'Project not found';
    if (!this.canManageProject()) return 'Only the GM or Management can change the value and budget';
    const num = v => { const t = String(v == null ? '' : v).replace(/[,\s]/g, ''); if (t === '') return null; const n = Math.round(+t); return isFinite(n) && n >= 0 ? n : NaN; };
    const val = num(f.val), bud = num(f.bud);
    if (Number.isNaN(val)) return 'The agreed value must be a number'; if (Number.isNaN(bud)) return 'The budget must be a number';
    const oldVal = this.projectValue ? this.projectValue(p) : (+p.val || 0) * 1e6, oldBud = (+p.bud || 0) * 1e6;
    const changes = [];
    if (val != null && val !== Math.round(oldVal)) changes.push('Agreed value ' + this.fmtT(oldVal) + ' → ' + this.fmtT(val));
    if (bud != null && bud !== Math.round(oldBud)) changes.push('Budget ' + this.fmtT(oldBud) + ' → ' + this.fmtT(bud));
    if (!changes.length) return '';
    this.setProject(pid, x => Object.assign({},
      val != null ? { val: +(val / 1e6).toFixed(2) } : {},
      bud != null ? { bud: +(bud / 1e6).toFixed(2) } : {},
      val != null && x.budget ? { budget: Object.assign({}, x.budget, { value: val }) } : {}));
    const c = said(f.note);
    this.pnote(pid, [changes.join(' · '), c, 'by ' + this.me().n].filter(Boolean).join(' · '), { money: true });
    [this.ROLES.finance.k, p.pm, this.ROLES.ceo.k, this.ROLES.gm.k].filter((k, i, a) => k && k !== this.me().k && a.indexOf(k) === i)
      .forEach(k => this.remind(k, 'Value / budget updated · ' + p.client, 'project', 'wallet', p.name + ' · ' + changes.join(' · ')));
    this.toast('Saved · ' + changes.join(' · '));
    return '';
  },
  canClose(p) { const me = this.me().k; return !!p && (this.isTop() || p.pm === me || this.isManagerOf('operations')); },
  closeProject(pid, comment) {
    const p = this.state.projects.find(x => x.id === pid); if (!p) return 'Project not found';
    if (this.flowOf(p) !== 'execution') return 'Only a project in execution can be closed';
    if (!this.canClose(p)) return 'The PM, the Operations Manager or Management closes the project';
    const open = this.state.tasks.filter(t => t.p === pid && t.kind !== 'brief' && t.st !== 'done').length;
    if (open) return open + ' task(s) still open';
    const c = this.stepNote(pid, 'closed', 'Project closed', comment);
    this.setProject(pid, { flow: 'closed', st: 'done', prog: 100, closedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) });
    [this.ROLES.ceo.k, this.ROLES.gm.k, this.ROLES.finance.k].filter(k => k !== this.me().k).forEach(k => this.remind(k, 'Project closed · ' + p.client, 'project', 'check', p.name + (c ? ' · ' + c : '')));
    this.toast(p.name + ' closed');
    return '';
  }
};

export { sumLines };
