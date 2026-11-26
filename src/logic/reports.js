// Reports: one channel for the whole company. Staff report to their head, heads and Finance to the
// GM and Management, the GM to Management. A report has a summary, issues, next steps and a file;
// the receiver marks it read and can reply, and the sender sees both.
// Mixed into TrinityApp, so `this` is the app.
import { dayKey } from './seed';
import { DEPTS } from './constants';

export const REPORT_KINDS = [['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['custom', 'Other']];

export const reportChannel = {
  // Who this person may send reports to.
  reportTargets() {
    const role = this.state.role || 'ceo', me = this.me().k, ceo = this.ROLES.ceo.k, gm = this.ROLES.gm.k;
    if (role === 'ceo') return [];
    if (role === 'gm' || role === 'pa') return [ceo];
    const d = this.myDept();
    if (role === 'finance' || (d && this.isManagerOf(d))) return [gm, ceo];
    const head = d ? this.managerOf(d) : null;
    return head && head !== me ? [head] : [gm];
  },
  async sendReport(f) {
    const to = (f.to || []).filter(k => this.reportTargets().includes(k));
    if (!to.length) return 'Choose who receives the report';
    if ((f.summary || '').trim().length < 10) return 'Write a short summary of what was done';
    let file = null; if (f.file) { try { file = await this.storeFile(f.file); } catch (e) { return 'Upload failed · ' + (e.message || e); } }
    const me = this.me().k, kind = f.kind || 'weekly';
    const r = { id: 'RP' + Date.now().toString(36), by: me, dept: this.myDept() || (this.state.role || ''), kind, title: (f.title || '').trim() || (REPORT_KINDS.find(k => k[0] === kind) || [0, 'Report'])[1] + ' report', summary: f.summary.trim(), issues: (f.issues || '').trim(), next: (f.next || '').trim(), file, to, at: dayKey(0), time: this.now(), readBy: {}, replies: [] };
    this.setState(x => ({ reports: [r, ...(x.reports || [])] }));
    to.forEach(k => this.notify({ to: k, ic: 'fileText', t: r.title + ' from ' + this.me().n, s: r.summary.slice(0, 120), go: 'reporting' }));
    this.toast('Report sent to ' + to.map(k => this.av(k).first).join(' and '));
    return '';
  },
  // Who reads reports: Management, the GM and the PA see every report; a head of department sees the reports
  // of their own department's staff (and anything sent to them); everyone else only sends and sees what they sent.
  seesAllReports() { return ['ceo', 'gm', 'pa'].includes(this.state.role || 'ceo'); },
  headOfDept() { const d = this.myDept(); return d && this.isManagerOf(d) ? d : null; },
  canReceiveReports() { return this.seesAllReports() || !!this.headOfDept(); },
  reportVisibleTo(r, k) {
    if (r.by === k) return false;
    if (this.seesAllReports()) return true;
    const d = this.headOfDept();
    return !!d && (r.to.includes(k) || this.deptOf(r.by) === d || r.dept === d);
  },
  readReport(id) {
    const me = this.me().k, r = (this.state.reports || []).find(x => x.id === id);
    if (!r || r.by === me || (r.readBy || {})[me]) return;
    this.setState(x => ({ reports: x.reports.map(y => (y.id === id ? Object.assign({}, y, { readBy: Object.assign({}, y.readBy, { [me]: dayKey(0) + ' ' + this.now() }) }) : y)) }));
  },
  replyReport(id, t) {
    const text = (t || '').trim(); if (!text) return 'Write your reply';
    const r = (this.state.reports || []).find(x => x.id === id); if (!r) return 'Report not found';
    this.setState(x => ({ reports: x.reports.map(y => (y.id === id ? Object.assign({}, y, { replies: [...(y.replies || []), { by: this.me().k, t: text, at: dayKey(0) + ' ' + this.now() }] }) : y)) }));
    const who = r.by === this.me().k ? r.to : [r.by];
    who.filter(k => k !== this.me().k).forEach(k => this.notify({ to: k, ic: 'message', t: this.me().n + ' replied on ' + r.title, s: text, go: 'reporting' }));
    this.toast('Reply sent');
    return '';
  },
  // "Send my day" (My work) also lands in the head's report inbox.
  dayReport(k, done, plan, to) {
    const r = { id: 'RP' + Date.now().toString(36) + k, by: k, dept: this.deptOf(k) || '', kind: 'daily', title: 'Day report · ' + this.av(k).n, summary: done.length ? done.map(i => '✓ ' + i.t + (i.report ? ' (' + i.report + ')' : '')).join('\n') : 'Nothing finished yet', issues: '', next: plan.map(i => '• ' + i.t).join('\n'), file: null, to: [to], at: dayKey(0), time: this.now(), readBy: {}, replies: [] };
    this.setState(x => ({ reports: [r, ...(x.reports || [])] }));
  }
};

export function reportingVals(s) {
  const me = this.me().k, all = s.reports || [];
  const row = r => {
    const a = this.av(r.by), read = Object.keys(r.readBy || {});
    return { id: r.id, by: a.n, bi: a.i, bc: a.c, dept: (DEPTS[r.dept] || {}).l || '', kind: (REPORT_KINDS.find(k => k[0] === r.kind) || [0, 'Report'])[1], title: r.title, at: r.at, time: r.time || '',
      summary: r.summary, issues: r.issues, next: r.next, to: r.to.map(k => this.av(k).n).join(', '), unread: r.by !== me && !(r.readBy || {})[me],
      readBy: read.map(k => this.av(k).first + ' · ' + r.readBy[k]).join(', '),
      file: r.file ? { name: r.file.name, open: () => this.openDoc({ n: r.file.name, url: r.file.url, path: r.file.path }) } : null,
      replies: (r.replies || []).map(x => ({ who: this.av(x.by).n, t: x.t, at: x.at, mine: x.by === me })),
      open: () => this.readReport(r.id), reply: t => this.replyReport(r.id, t) };
  };
  const inbox = all.filter(r => r.by !== me && this.reportVisibleTo(r, me)).map(row), sent = all.filter(r => r.by === me).map(row);
  const targets = this.reportTargets().map(k => { const a = this.av(k); return { v: k, l: a.n, i: a.i, c: a.c, ph: a.ph }; });
  const canReceive = this.canReceiveReports();
  // The calendar is where Reports opens: each day shows whose daily report came in.
  const tab = s.rptTab && (canReceive || s.rptTab !== 'inbox') ? s.rptTab : 'calendar';
  return { RPT: { inbox: canReceive ? inbox : [], sent, unread: canReceive ? inbox.filter(r => r.unread).length : 0, canReceive, targets, kinds: REPORT_KINDS, canSend: targets.length > 0, send: f => this.sendReport(f),
    tab, setTab: k => this.setState({ rptTab: k }), cal: dailyCalendar.call(this, s, row),
    draft: s.rptDraft || null, clearDraft: () => this.setState({ rptDraft: null }),
    defaultKind: (s.role || 'ceo') === 'finance' ? 'monthly' : (s.role || 'ceo') === 'gm' ? 'daily' : 'weekly' } };
}

// Daily reports calendar: a month grid. Staff see the days they sent their daily report; Management,
// the GM, the PA and heads of department see how many came in each day, can pick one person, and see
// who has not sent theirs.
const pad = n => String(n).padStart(2, '0');
function dailyCalendar(s, row) {
  const me = this.me().k, today = dayKey(0), all = (s.reports || []).filter(r => r.kind === 'daily');
  const receive = this.canReceiveReports();
  // People whose daily reports this person follows.
  const head = this.headOfDept();
  const people = !receive ? [me] : this.seesAllReports()
    ? [...new Set((s.staff || []).map(p => p.k).filter(k => k && k !== me))]
    : this.teamOf(head).filter(k => k !== me);
  const who = receive && s.rptWho && people.includes(s.rptWho) ? s.rptWho : receive ? 'all' : me;
  const scope = who === 'all' ? people : [who];
  const list = all.filter(r => scope.includes(r.by) && (r.by === me || this.reportVisibleTo(r, me)));
  const month = /^\d{4}-\d{2}$/.test(s.rptMonth || '') ? s.rptMonth : today.slice(0, 7);
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1), days = new Date(y, m, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // weeks start on Monday
  const byDay = {};
  list.forEach(r => { (byDay[r.at] ||= []).push(r); });
  const sel = s.rptDay && s.rptDay.slice(0, 7) === month ? s.rptDay : today.slice(0, 7) === month ? today : month + '-01';
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= days; d++) {
    const key = month + '-' + pad(d), dow = new Date(y, m - 1, d).getDay(), recs = byDay[key] || [];
    const senders = new Set(recs.map(r => r.by));
    const work = dow !== 0 && key <= today;
    cells.push({ key, d, n: senders.size, of: scope.length, today: key === today, on: key === sel, future: key > today, weekend: dow === 0 || dow === 6,
      st: !recs.length ? (work && dow !== 6 && key < today ? 'miss' : 'none') : senders.size >= scope.length ? 'full' : 'part',
      pick: () => this.setState({ rptDay: key }) });
  }
  const dayRecs = (byDay[sel] || []).slice().sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const sentBy = new Set(dayRecs.map(r => r.by));
  const shift = k => { const d = new Date(y, m - 1 + k, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); };
  const sentDays = cells.filter(c => c && c.n).length, workDays = cells.filter(c => c && !c.future && !c.weekend).length;
  return {
    month, label: first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }), receive, who,
    prev: () => this.setState({ rptMonth: shift(-1), rptDay: '' }), next: () => this.setState({ rptMonth: shift(1), rptDay: '' }),
    thisMonth: () => this.setState({ rptMonth: today.slice(0, 7), rptDay: today }), canNext: shift(1) <= today.slice(0, 7),
    people: receive ? [{ v: 'all', l: 'Everyone' }, ...people.map(k => ({ v: k, l: this.av(k).n }))] : [],
    setWho: k => this.setState({ rptWho: k }),
    cells, sel, selLabel: new Date(sel + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
    reports: dayRecs.map(r => Object.assign(row(r), { mine: r.by === me })), today: sel === today, missing: sel <= today ? scope.filter(k => !sentBy.has(k)).map(k => this.av(k).n) : [],
    summary: receive ? sentDays + ' of ' + workDays + ' working days with reports' : 'You sent ' + sentDays + ' of ' + workDays + ' working days',
    canSend: !receive || this.reportTargets().length > 0, sendToday: () => this.setState({ rptTab: 'new' })
  };
}
