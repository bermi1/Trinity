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

export const flowMethods = {
  flowOf(p) {
    if (p.flow && FLOW.includes(p.flow)) return p.flow;
    if (p.st === 'done') return 'closed';
    return 'execution';
  },
  setProject(id, patch) { this.setState(x => ({ projects: x.projects.map(p => (p.id === id ? Object.assign({}, p, typeof patch === 'function' ? patch(p) : patch) : p)) })); },
  pnote(id, t) { this.setProject(id, p => ({ notes: [...(p.notes || []), { by: this.me().k, at: dayKey(0), t, sys: true }] })); },
  canCS() { return this.isTop() || this.myDept() === 'clientservice'; },
  canOps() { return this.isTop() || this.isManagerOf('operations'); },

  // A new project starts at the brief. Its value is not known yet: Operations sets it in the budget.
  newProject(f) {
    const client = (f.client || '').trim(), name = (f.name || '').trim();
    if (!client || !name) return 'Enter the client and the project name';
    const id = this.nextId('PRJ', this.state.projects);
    const p = { id, name, client, pm: '', st: 'on', prog: 0, val: 0, bud: 0, spent: 0, flow: 'brief', due: f.due || 'TBC', team: [], cs: f.cs || this.me().k, lead: f.lead || '', at: dayKey(0) };
    this.setState(x => ({ projects: [p, ...x.projects] }));
    if (p.cs !== this.me().k) this.remind(p.cs, 'New project: send the design brief · ' + client, 'project', 'folder', name);
    this.toast('Project ' + id + ' created · next: send the design brief to Creative');
    this.log('folder', 'purple', 'Project created · ' + client, name);
    return id;
  },
  // Brief sent: the project moves to Design.
  afterBrief(pid) {
    const p = this.state.projects.find(x => x.id === pid); if (!p) return;
    if (this.flowOf(p) === 'brief') { this.setProject(pid, { flow: 'design' }); this.pnote(pid, 'Design brief sent to Creative'); }
  },
  // Every brief of the project approved: Client Service uploads the proposal.
  afterDesignApproved(pid) {
    const p = this.state.projects.find(x => x.id === pid); if (!p || this.flowOf(p) !== 'design') return;
    const briefs = this.state.tasks.filter(t => t.kind === 'brief' && t.p === pid);
    if (briefs.length && briefs.every(b => b.st === 'done')) {
      this.setProject(pid, { flow: 'proposal' });
      this.pnote(pid, 'All designs approved · Client Service to upload the proposal');
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
    this.setProject(pid, { flow: 'budget', proposal: Object.assign({ by: this.me().k, at: dayKey(0), note: (note || '').trim() }, info) });
    this.pnote(pid, 'Proposal uploaded · ' + file.name + ' · sent to Operations for the budget');
    const om = this.managerOf('operations');
    if (om && om !== this.me().k) this.remind(om, 'Budget needed: choose the PM and prepare the internal budget · ' + p.client, 'project', 'wallet', p.name);
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
  submitBudget(pid, b) {
    const e = this.saveBudget(pid, b); if (e) return e;
    const p = this.state.projects.find(x => x.id === pid), lines = (b.lines || []).filter(l => (l.item || '').trim() && +l.cost > 0);
    if (!b.pm) return 'Choose the Project Manager';
    if (!lines.length) return 'Add at least one budget line';
    if (!(+b.value > 0)) return 'Enter the project value (what the client pays)';
    this.setProject(pid, x => ({ flow: 'approval', budget: Object.assign({}, x.budget, { st: 'gm', note: '' }) }));
    this.pnote(pid, 'Budget submitted · internal ' + this.fmtT(sumLines(lines)) + ' · value ' + this.fmtT(+b.value) + ' · waiting for the GM');
    this.remind(this.ROLES.gm.k, 'Budget to approve · ' + p.client, 'project', 'wallet', p.name + ' · ' + this.fmtT(+b.value));
    if (b.pm !== this.me().k) this.remind(b.pm, 'You are Project Manager · ' + p.client, 'project', 'folder', p.name);
    this.toast('Budget sent to the GM for approval');
    return '';
  },
  canApproveBudget(p) {
    const b = p.budget || {}, role = this.state.role || 'ceo';
    return this.flowOf(p) === 'approval' && ((b.st === 'gm' && (role === 'gm' || role === 'ceo')) || (b.st === 'mgmt' && role === 'ceo'));
  },
  approveBudget(pid) {
    const p = this.state.projects.find(x => x.id === pid); if (!p || !this.canApproveBudget(p)) return 'Not waiting for you';
    const b = p.budget, role = this.state.role || 'ceo', me = this.me().k, at = dayKey(0);
    if (b.st === 'gm' && role === 'gm') {
      this.setProject(pid, x => ({ budget: Object.assign({}, x.budget, { st: 'mgmt', gm: { by: me, at } }) }));
      this.pnote(pid, 'Budget approved by the GM · waiting for Management');
      this.remind(this.ROLES.ceo.k, 'Budget to approve · ' + p.client, 'project', 'wallet', p.name + ' · approved by the GM');
      this.toast('Approved · sent to Management');
      return '';
    }
    // Management's approval (it also covers the GM step when Management acts first).
    const internal = sumLines(b.lines);
    this.setProject(pid, x => ({ flow: 'execution', val: +(b.value / 1e6).toFixed(2), bud: +(internal / 1e6).toFixed(2), budget: Object.assign({}, x.budget, { st: 'approved', gm: x.budget.gm || { by: me, at }, mgmt: { by: me, at } }) }));
    this.pnote(pid, 'Budget approved by Management · project is in execution');
    [p.pm, this.managerOf('operations'), p.cs, this.ROLES.finance.k, this.ROLES.gm.k].filter((k, i, a) => k && k !== me && a.indexOf(k) === i)
      .forEach(k => this.remind(k, 'Approved, start execution · ' + p.client, 'project', 'check', p.name + (k === this.ROLES.finance.k ? ' · value ' + this.fmtT(b.value) + ', ready to invoice' : '')));
    this.toast('Budget approved · project moves to execution');
    return '';
  },
  returnBudget(pid, note) {
    const p = this.state.projects.find(x => x.id === pid); if (!p || !this.canApproveBudget(p)) return 'Not waiting for you';
    if (!(note || '').trim()) return 'Say what should change';
    this.setProject(pid, x => ({ flow: 'budget', budget: Object.assign({}, x.budget, { st: 'returned', note: note.trim(), gm: null }) }));
    this.pnote(pid, 'Budget sent back: ' + note.trim());
    const om = this.managerOf('operations'); if (om && om !== this.me().k) this.remind(om, 'Budget sent back · ' + p.client, 'project', 'wallet', note.trim());
    this.toast('Sent back to Operations');
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
  closeProject(pid) {
    const p = this.state.projects.find(x => x.id === pid); if (!p) return 'Project not found';
    const open = this.state.tasks.filter(t => t.p === pid && t.kind !== 'brief' && t.st !== 'done').length;
    if (open) return open + ' task(s) still open';
    this.setProject(pid, { flow: 'closed', st: 'done', prog: 100 });
    this.pnote(pid, 'Project closed');
    [this.ROLES.ceo.k, this.ROLES.gm.k, this.ROLES.finance.k].filter(k => k !== this.me().k).forEach(k => this.remind(k, 'Project closed · ' + p.client, 'project', 'check', p.name));
    this.toast(p.name + ' closed');
    return '';
  }
};

export { sumLines };
