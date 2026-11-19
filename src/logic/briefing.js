// Monday Briefing: prepared from live data plus each head's weekly update; decisions become tasks;
// published minutes go to every head; next week opens with last week's actions and their status.
// Mixed into TrinityApp, so `this` is the app.
import { dayKey } from './seed';
import { DEPTS } from './constants';

const BR_DEPTS = ['clientservice', 'creative', 'operations', 'finance', 'production', 'reception'];
// The Monday of the week (this week, or next week from Friday on, so heads prepare ahead).
export function briefWeek(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()), wd = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - wd + (wd >= 4 ? 7 : 0));
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
}
const addDays = (k, n) => { const [y, m, d] = k.split('-').map(Number); const x = new Date(y, m - 1, d + n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };

export const briefingMethods = {
  // Everyone attends (presentations, highlights, actions); heads also see updates and issues.
  canBriefing() { return true; },
  isBriefHead() { const d = this.myDept(); return this.isTop() || ['finance', 'pa'].includes(this.state.role || 'ceo') || (d && this.isManagerOf(d)); },
  canChair() { return this.isTop() || (this.state.role || 'ceo') === 'pa'; },
  // Anyone presenting uploads the file and the key points before the meeting.
  async uploadPresentation(f) {
    if (!(f.title || '').trim()) return 'Give your presentation a title';
    if (!f.file) return 'Attach your presentation';
    if ((f.points || '').trim().length < 5) return 'Write the key points (a short summary)';
    let file; try { file = await this.storeFile(f.file); } catch (e) { return 'Upload failed · ' + (e.message || e); }
    const b = this.brief(briefWeek());
    this.saveBrief(Object.assign({}, b, { pres: [...(b.pres || []), { id: 'PR' + Date.now().toString(36), by: this.me().k, title: f.title.trim(), points: f.points.trim(), file, at: dayKey(0) + ' ' + this.now() }] }));
    this.toast('Presentation uploaded for Monday · ' + f.title.trim());
    return '';
  },
  addHighlight(t) {
    if (!this.canChair()) return 'The PA, the GM or Management records highlights';
    if (!(t || '').trim()) return 'Write the highlight';
    const b = this.brief(briefWeek());
    this.saveBrief(Object.assign({}, b, { highlights: [...(b.highlights || []), { t: t.trim(), by: this.me().k }] }));
    return '';
  },
  brief(week) { return (this.state.briefings || []).find(b => b.week === week) || { id: 'BR' + week, week, updates: {}, decisions: [], published: null }; },
  saveBrief(b) { this.setState(x => ({ briefings: [...(x.briefings || []).filter(y => y.week !== b.week), b] })); },
  sendBriefUpdate(f) {
    const d = (this.state.role || 'ceo') === 'finance' ? 'finance' : this.myDept();
    if (!d || !(this.isManagerOf(d) || (this.state.role || 'ceo') === 'finance')) return 'Department heads send the weekly update';
    if ((f.done || '').trim().length < 5) return 'Write what your department did last week';
    const b = this.brief(briefWeek());
    this.saveBrief(Object.assign({}, b, { updates: Object.assign({}, b.updates, { [d]: { by: this.me().k, done: f.done.trim(), issues: (f.issues || '').trim(), plan: (f.plan || '').trim(), at: dayKey(0) + ' ' + this.now() } }) }));
    this.notify({ to: this.ROLES.gm.k, ic: 'presentation', t: 'Briefing update · ' + DEPTS[d].l, s: f.done.trim().slice(0, 100), go: 'briefing' });
    this.toast('Update sent for Monday’s briefing');
    return '';
  },
  remindBriefing(d) { const k = this.managerOf(d); if (k) { this.remind(k, 'Send your update for Monday’s briefing', 'briefing', 'presentation', DEPTS[d].l); this.toast('Reminder sent to ' + this.av(k).n); } },
  // A decision with an action, owner and deadline becomes a task.
  addDecision(f) {
    if (!this.canChair()) return 'The PA, the GM or Management records decisions';
    if (!(f.d || '').trim() || !(f.a || '').trim()) return 'Write the decision and the action';
    if (!f.o) return 'Choose who does it';
    const b = this.brief(briefWeek()), tid = 'T' + Date.now();
    this.setState(x => ({ tasks: [{ id: tid, t: f.a.trim(), p: f.p || '', who: f.o, due: f.due || 'This week', st: 'todo', pri: 'high', by: this.me().k, src: 'briefing' }, ...x.tasks] }));
    this.saveBrief(Object.assign({}, b, { decisions: [...b.decisions, { d: f.d.trim(), a: f.a.trim(), o: f.o, due: f.due || 'This week', task: tid }] }));
    if (f.o !== this.me().k) this.remind(f.o, 'Action from Monday Briefing: ' + f.a.trim(), 'today', 'presentation', 'Decision: ' + f.d.trim() + ' · due ' + (f.due || 'this week'));
    this.toast('Decision recorded · task given to ' + this.av(f.o).n);
    return '';
  },
  publishBriefing() {
    if (!this.canChair()) return 'The PA, the GM or Management publishes the minutes';
    const b = this.brief(briefWeek());
    if (!b.decisions.length) return 'Record at least one decision before publishing';
    this.saveBrief(Object.assign({}, b, { published: { by: this.me().k, at: dayKey(0) + ' ' + this.now() } }));
    const heads = [...new Set([this.ROLES.ceo.k, this.ROLES.gm.k, ...BR_DEPTS.map(d => this.managerOf(d)), ...(this.state.staff || []).map(p => p.k)].filter(k => k && k !== this.me().k))];
    heads.forEach(k => this.notify({ to: k, ic: 'presentation', t: 'Monday Briefing minutes published', s: b.decisions.length + ' decisions · ' + b.decisions.filter(x => x.o === k).length + ' action(s) for you', go: 'briefing' }));
    this.toast('Minutes published to ' + heads.length + ' people');
    return '';
  }
};

export function briefingVals(s) {
  const week = briefWeek(), from = addDays(week, -7), to = addDays(week, -1), next = addDays(week, 6), b = this.brief(week), prev = this.brief(addDays(week, -7));
  const role = s.role || 'ceo', top = this.isTop(), me = this.me().k, head = this.isBriefHead();
  const label = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); };
  // Last week from live data.
  const cash = top ? this.cashEntries().filter(e => e.at >= from && e.at <= to) : [];
  const moved = (s.projects || []).flatMap(p => (p.notes || []).filter(n => n.sys && n.at >= from && n.at <= to).map(n => ({ t: p.client + ' · ' + p.name, s: n.t, at: n.at })));
  const tasksDone = (s.tasks || []).filter(t => t.st === 'done' && t.doneOn >= from && t.doneOn <= to);
  const live = (s.projects || []).filter(p => p.st !== 'done');
  const issues = [
    ...live.filter(p => p.st === 'late' || p.st === 'risk').map(p => ({ tag: p.st === 'late' ? 'Delayed' : 'At risk', t: p.client + ' · ' + p.name, s: 'Due ' + p.due })),
    ...live.filter(p => this.flowOf(p) === 'approval').map(p => ({ tag: 'Budget', t: p.client + ' · ' + p.name, s: 'Budget waiting for approval' })),
    ...live.filter(p => this.flowOf(p) === 'execution' && !p.po).map(p => ({ tag: 'No PO', t: p.client + ' · ' + p.name, s: 'Work started without a purchase order' })),
    ...(top ? (s.invoices || []).filter(i => i.st === 'overdue').map(i => ({ tag: 'Overdue', t: i.c + ' · ' + i.id, s: this.fmtM(i.v) + ' · ' + i.due })) : [])
  ];
  // This week: calendar and project deadlines.
  const weekItems = ((this.officeVals(s).MT || {}).days || []).filter(d => d.k >= week && d.k <= next).map(d => ({ l: d.l, items: d.items.map(i => i.time + ' · ' + i.title) }));
  const lastActions = prev.decisions.map(x => { const t = (s.tasks || []).find(y => y.id === x.task); return { a: x.a, who: this.av(x.o).n, done: !!(t && t.st === 'done'), report: t && t.report ? t.report : '' }; });
  const heads = BR_DEPTS.map(d => ({ d, l: DEPTS[d].l, head: this.av(this.managerOf(d)).n, u: b.updates[d] ? Object.assign({}, b.updates[d], { byN: this.av(b.updates[d].by).n }) : null, remind: () => this.remindBriefing(d) }));
  const myDept = role === 'finance' ? 'finance' : this.myDept();
  return {
    BRF: {
      head,
      pres: (b.pres || []).map(p => ({ id: p.id, title: p.title, points: p.points, by: this.av(p.by).n, bi: this.av(p.by).i, bc: this.av(p.by).c, at: p.at, mine: p.by === me, open: () => this.openDoc({ n: p.file.name, url: p.file.url, path: p.file.path }), name: p.file.name })),
      upload: f => this.uploadPresentation(f),
      highlights: (b.highlights || []).map(h => ({ t: h.t, by: this.av(h.by).first })), addHighlight: t => this.addHighlight(t),
      week: label(week), range: label(from) + ' – ' + label(to), chair: this.canChair(), published: b.published ? this.av(b.published.by).n + ' · ' + b.published.at : '',
      money: top ? { in: this.fmtT(cash.filter(e => e.dir === 'in').reduce((a, e) => a + e.amt, 0)), out: this.fmtT(cash.filter(e => e.dir === 'out').reduce((a, e) => a + e.amt, 0)) } : null,
      stats: !head ? [] : [{ l: 'Projects active', v: String(live.length) }, { l: 'Tasks done last week', v: String(tasksDone.length) }, { l: 'Project steps completed', v: String(moved.length) }, { l: 'Issues to discuss', v: String(issues.length) }],
      moved: head ? moved.slice(0, 10) : [], issues: head ? issues : [], weekItems, lastActions,
      heads: head ? heads : [], sent: heads.filter(h => h.u).length,
      myUpdate: myDept && b.updates[myDept] ? b.updates[myDept] : null, canUpdate: !!myDept && (this.isManagerOf(myDept) || role === 'finance'), sendUpdate: f => this.sendBriefUpdate(f),
      decisions: b.decisions.map(x => { const t = (s.tasks || []).find(y => y.id === x.task); return { d: x.d, a: x.a, who: this.av(x.o).n, due: x.due, st: t ? this.tst(t.st)[0] : '' }; }),
      people: [...new Set([this.ROLES.gm.k, ...BR_DEPTS.map(d => this.managerOf(d)), ...(s.staff || []).map(p => p.k)].filter(Boolean))].map(k => { const a = this.av(k); return { v: k, l: a.n, i: a.i, c: a.c }; }),
      projects: live.map(p => ({ v: p.id, l: p.client + ' · ' + p.name })),
      decide: f => this.addDecision(f), publish: () => this.publishBriefing()
    }
  };
}
