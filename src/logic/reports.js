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
  const tab = s.rptTab && (canReceive || s.rptTab !== 'inbox') ? s.rptTab : !canReceive ? (targets.length ? 'new' : 'sent') : (targets.length && !inbox.length ? 'new' : 'inbox');
  return { RPT: { inbox: canReceive ? inbox : [], sent, unread: canReceive ? inbox.filter(r => r.unread).length : 0, canReceive, targets, kinds: REPORT_KINDS, canSend: targets.length > 0, send: f => this.sendReport(f),
    tab, setTab: k => this.setState({ rptTab: k }),
    draft: s.rptDraft || null, clearDraft: () => this.setState({ rptDraft: null }),
    defaultKind: (s.role || 'ceo') === 'finance' ? 'monthly' : (s.role || 'ceo') === 'gm' ? 'daily' : 'weekly' } };
}
