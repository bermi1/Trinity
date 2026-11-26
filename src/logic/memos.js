// Memos between departments: a request to a department, linked to a project or lead, with one of the
// office's request categories. The department head opens it and assigns it to someone; that person
// attaches the work (a design, a costing…), and it shows on the project. Everyone sees where it stands.
// Mixed into TrinityApp, so `this` is the app.
import { dayKey } from './seed';

export const MEMO_CATS = [['project', 'Project request'], ['internal', 'Internal office request'], ['emergency', 'Emergency request'], ['management', 'Management request']];
export const MEMO_ST = { sent: 'Sent', seen: 'Seen', assigned: 'Assigned', prog: 'In progress', done: 'Done' };
const ORDER = ['sent', 'seen', 'assigned', 'prog', 'done'];
export const MEMO_DEPT_L = { clientservice: 'Client Service', creative: 'Creative', operations: 'Operations', finance: 'Finance', production: 'Printing', reception: 'Reception', gm: 'General Manager', management: 'Management' };
// Memos can also go straight to the General Manager or to Management (the MD), not only to a department.
export const MEMO_TOP = { gm: 'gm', management: 'ceo' };
const catL = c => (MEMO_CATS.find(x => x[0] === c) || MEMO_CATS[0])[1];

export const memoMethods = {
  // Who receives a memo sent to this department: its head, or the GM / the MD for memos to them.
  memoHead(dept) {
    const role = MEMO_TOP[dept];
    if (!role) return this.managerOf(dept);
    return (this.roleHolder || {})[role] || (this.state.workspaceLive ? null : (this.ROLES[role] || {}).k) || null;
  },
  memoById(id) { return (this.state.memos || []).find(m => m.id === id) || null; },
  memoPatch(id, patch, t) {
    const at = dayKey(0) + ' ' + this.now();
    this.setState(x => ({ memos: (x.memos || []).map(m => (m.id === id ? Object.assign({}, m, typeof patch === 'function' ? patch(m) : patch, { log: [...(m.log || []), { by: this.me().k, at, t }] }) : m)) }));
  },
  canRunMemo(m) { return !!m && (this.isTop() || this.isManagerOf(m.dept) || m.to === this.me().k); },
  openMemo(id) {
    const m = this.memoById(id); if (!m) return;
    const me = this.me().k;
    if (m.st === 'sent' && this.canRunMemo(m) && m.from !== me) {
      this.memoPatch(id, { st: 'seen' }, 'Opened');
      this.notify({ to: m.from, ic: 'check', t: 'Memo seen by ' + this.me().n, s: m.text.slice(0, 90), go: 'memo:' + id });
    } else if (m.who === me && m.st === 'assigned' && !(m.log || []).some(l => l.by === me && /Opened by assignee/.test(l.t))) this.memoPatch(id, {}, 'Opened by assignee');
    this.go('memo', { memoId: id });
  },
  skipMemoPop(id) { this.setState(x => ({ memoSkip: [...(x.memoSkip || []), id] })); },
  memoAssign(id, k) {
    const m = this.memoById(id); if (!m) return 'Memo not found';
    if (!this.canRunMemo(m)) return 'The department head assigns the memo';
    const tid = 'T' + Date.now();
    const task = { id: tid, t: 'Memo: ' + m.text.slice(0, 70), p: m.project || '', who: k, by: this.me().k, due: m.cat === 'emergency' ? 'Today' : 'This week', st: 'todo', pri: m.cat === 'emergency' ? 'high' : 'med', memo: id };
    this.setState(x => ({ tasks: [task, ...(x.tasks || []).filter(t => t.id !== m.task)] }));
    this.memoPatch(id, { who: k, st: m.st === 'prog' ? 'prog' : 'assigned', task: tid }, 'Assigned to ' + this.av(k).n);
    if (k !== this.me().k) this.notify({ to: k, ic: 'fileText', t: catL(m.cat) + ' assigned to you', s: m.text.slice(0, 110), go: 'memo:' + id });
    if (m.from !== this.me().k) this.notify({ to: m.from, ic: 'users', t: 'Your memo is with ' + this.av(k).n, s: m.text.slice(0, 90), go: 'memo:' + id });
    if (m.project) this.pnote(m.project, 'Memo assigned to ' + this.av(k).n + ': ' + m.text.slice(0, 60));
    this.toast('Assigned to ' + this.av(k).n);
    return '';
  },
  memoStart(id) {
    const m = this.memoById(id); if (!m) return;
    this.memoPatch(id, { st: 'prog' }, 'Started');
    if (m.task) this.setState(x => ({ tasks: x.tasks.map(t => (t.id === m.task ? Object.assign({}, t, { st: 'prog' }) : t)) }));
    if (m.from !== this.me().k) this.notify({ to: m.from, ic: 'clock', t: 'Work started on your memo', s: this.me().n + ' · ' + m.text.slice(0, 80), go: 'memo:' + id });
  },
  async memoAttach(id, file) {
    const m = this.memoById(id); if (!m) return 'Memo not found';
    if (!file) return 'Choose a file';
    let f; try { f = await this.storeFile(file); } catch (e) { return 'Upload failed · ' + (e.message || e); }
    const entry = Object.assign({}, f, { by: this.me().k, at: dayKey(0) });
    this.memoPatch(id, mm => ({ files: [...(mm.files || []), entry], st: mm.st === 'done' ? 'done' : 'prog' }), 'Attached ' + file.name);
    // The work also goes on the project, so the project shows it.
    if (m.project) {
      this.setProject(m.project, p => ({ files: [...(p.files || []), Object.assign({ memo: id, dept: m.dept }, entry)] }));
      this.pnote(m.project, MEMO_DEPT_L[m.dept] + ' attached ' + file.name + ' (memo)');
    }
    [m.from, m.to || this.managerOf(m.dept)].filter(k => k && k !== this.me().k).forEach(k => this.notify({ to: k, ic: 'paperclip', t: 'File attached to memo · ' + file.name, s: this.me().n + ' · ' + m.text.slice(0, 70), go: 'memo:' + id }));
    this.toast('Attached · ' + file.name);
    return '';
  },
  // WhatsApp reminder about a memo: opens WhatsApp to that person's number with the message written,
  // and notes it on the memo's trail. The link in the message opens the memo in the app.
  memoRemindWa(id, k) {
    const m = this.memoById(id); if (!m) return 'Memo not found';
    if (!k || k === this.me().k) return 'Choose who to remind';
    const a = this.av(k), link = (typeof location !== 'undefined' ? location.origin : '') + '/?go=memo:' + id;
    const text = 'Habari ' + a.first + ', reminder about the ' + catL(m.cat).toLowerCase() + ' memo from ' + this.av(m.from).n + ' to ' + (MEMO_DEPT_L[m.dept] || m.dept) + ':\n"' + m.text.slice(0, 200) + '"\nStatus: ' + (MEMO_ST[m.st] || 'Sent') + '. Please open it in Trinity Mark 360: ' + link;
    if (!this.waOpen(k, text)) return a.first + ' has not added a WhatsApp number yet';
    this.memoPatch(id, {}, 'WhatsApp reminder to ' + a.n);
    this.notify({ to: k, ic: 'message', t: 'Reminder · memo from ' + this.av(m.from).n, s: m.text.slice(0, 90), go: 'memo:' + id });
    return '';
  },
  memoDone(id, reply) {
    const m = this.memoById(id); if (!m) return 'Memo not found';
    this.memoPatch(id, { st: 'done', reply: (reply || '').trim() }, 'Done' + (reply ? ': ' + reply.trim() : ''));
    if (m.task) this.setState(x => ({ tasks: x.tasks.map(t => (t.id === m.task ? Object.assign({}, t, { st: 'done', report: (reply || '').trim() || 'Done' }) : t)) }));
    if (m.from !== this.me().k) this.notify({ to: m.from, ic: 'check', t: 'Memo done · ' + MEMO_DEPT_L[m.dept], s: (reply || '').trim() || m.text.slice(0, 80), go: 'memo:' + id });
    if (m.project) this.pnote(m.project, 'Memo done by ' + MEMO_DEPT_L[m.dept] + (reply ? ': ' + reply.trim() : ''));
    this.toast('Memo done · ' + this.av(m.from).n + ' told');
    return '';
  }
};

// One memo, as each person sees it.
function memoRow(m) {
  const s = this.state, me = this.me().k, P = m.project ? (s.projects || []).find(p => p.id === m.project) : null, L = m.lead ? (s.leads || []).find(l => l.id === m.lead) : null;
  const face = k => { const a = this.av(k); return { k, n: a.n, i: a.i, c: a.c, ph: a.ph }; };
  const run = this.canRunMemo(m), mine = m.who === me;
  return {
    id: m.id, cat: m.cat || 'project', catL: catL(m.cat), st: m.st, stL: MEMO_ST[m.st] || 'Sent', urgent: m.cat === 'emergency',
    steps: ORDER.map((k, i) => ({ k, l: MEMO_ST[k], done: ORDER.indexOf(m.st) >= i })),
    from: face(m.from), to: face(m.to), dept: MEMO_DEPT_L[m.dept] || m.dept, who: m.who ? face(m.who) : null, text: m.text, reply: m.reply || '', at: m.at,
    about: P ? P.client + ' · ' + P.name : L ? L.c + ' · ' + L.t : '', goAbout: P ? () => this.go('project', { projectId: P.id }) : L ? () => this.setState({ page: 'clients', leadSel: L.id }) : null,
    file: m.file ? { name: m.file.name, open: () => this.openDoc({ n: m.file.name, url: m.file.url, path: m.file.path, mime: m.file.mime }) } : null,
    files: (m.files || []).map(f => ({ name: f.name, by: this.av(f.by).n, at: f.at, img: /^image\//.test(f.mime || '') && f.url ? f.url : '', open: () => this.openDoc({ n: f.name, url: f.url, path: f.path, mime: f.mime }) })),
    log: (m.log || []).slice().reverse().map(l => ({ t: l.t, by: this.av(l.by).n, at: l.at })),
    canAssign: run && m.st !== 'done', team: run ? (MEMO_TOP[m.dept] ? [...new Set([...(s.staff || []).map(p => p.k), ...['clientservice', 'creative', 'operations', 'finance', 'production', 'reception'].map(d => this.managerOf(d))].filter(k => k && k !== me))] : this.teamOf(m.dept)).map(face) : [],
    canWork: (mine || run) && m.st !== 'done', canStart: (mine || run) && ['seen', 'assigned'].includes(m.st),
    isSender: m.from === me,
    remind: memoRemindees.call(this, m, me, run).map(k => { const a = this.av(k); return { k, n: a.n, first: a.first, has: !!this.waNumber(k), wa: () => this.memoRemindWa(m.id, k) }; }),
    assign: k => this.memoAssign(m.id, k), start: () => this.memoStart(m.id), attach: f => this.memoAttach(m.id, f), done: r => this.memoDone(m.id, r), open: () => this.openMemo(m.id)
  };
}

// Who this person can remind on WhatsApp about a memo still open: the sender reminds whoever has it
// (the person it is assigned to, else the department head); the head reminds the person assigned;
// the person working on it can ping the sender back.
function memoRemindees(m, me, run) {
  if (m.st === 'done') return [];
  const head = m.to || this.managerOf(m.dept), out = [];
  if (m.from === me) out.push(m.who || head);
  if (run && m.who && m.who !== me) out.push(m.who);
  if (m.who === me && m.from !== me) out.push(m.from);
  if (this.isTop() && m.from !== me && !m.who) out.push(head);
  return [...new Set(out.filter(k => k && k !== me))];
}

export function memoVals(s) {
  const me = this.me().k, all = s.memos || [], role = s.role || 'ceo';
  const mineIn = all.filter(m => m.to === me || m.who === me || this.isManagerOf(m.dept) || (this.isTop() && m.cat === 'management'));
  // A new memo pops up for the head who receives it, and for the person it is assigned to.
  const skip = s.memoSkip || [];
  const pop = all.find(m => !skip.includes(m.id) && m.from !== me && ((m.st === 'sent' && (m.to === me || this.isManagerOf(m.dept))) || (m.st === 'assigned' && m.who === me && !(m.log || []).some(l => l.by === me && /Opened by assignee/.test(l.t)))));
  const cur = s.memoId ? this.memoById(s.memoId) : null;
  const visible = m => m && (m.from === me || m.to === me || m.who === me || this.isManagerOf(m.dept) || this.isTop() || role === 'pa');
  return {
    MEMO: {
      cats: MEMO_CATS.map(([v, l]) => ({ v, l })),
      cur: visible(cur) ? memoRow.call(this, cur) : null, back: () => this.go('memos'),
      inbox: mineIn.map(m => memoRow.call(this, m)), sent: all.filter(m => m.from === me).map(m => memoRow.call(this, m)),
      all: this.isTop() || role === 'pa' ? all.map(m => memoRow.call(this, m)) : null,
      tab: s.memoTab || 'in', setTab: t => this.setState({ memoTab: t }), goList: () => this.go('memos', { memoTab: 'in' }),
      pop: pop ? memoRow.call(this, pop) : null, skip: id => this.skipMemoPop(id),
      forProject: pid => all.filter(m => m.project === pid).map(m => memoRow.call(this, m)),
      send: f => this.sendMemo(f),
      depts: ['creative', 'operations', 'finance', 'production', 'clientservice', 'gm', 'management']
        .filter(d => d !== this.myDept() && !(MEMO_TOP[d] && this.memoHead(d) === me)).map(d => ({ v: d, l: MEMO_DEPT_L[d] }))
    }
  };
}
