// Client Service CRM: customers, leads and proposals.
// Leads move New → Contacted → Meeting → Proposal sent → Negotiation → Won / Lost. Each move records
// who and when; "Proposal sent" needs the proposal file, "Lost" a reason, "Won" the agreed value.
// Mixed into TrinityApp, so `this` is the app.
import { supabase } from '../lib/supabase';
import { dayKey } from './seed';

export const LEAD_STAGES = ['New', 'Contacted', 'Meeting', 'Proposal sent', 'Negotiation', 'Won', 'Lost'];
export const LOST_REASONS = ['Price too high', 'Chose a competitor', 'No budget', 'Postponed', 'No response', 'Other'];
export const SOURCES = ['Email to Management', 'Phone call', 'Walk-in', 'Referral', 'Tender', 'Existing client'];
const WON = 5, LOST = 6;
// What the owner does to reach each stage.
export const NEXT_ACTION = { 0: 'Mark contacted', 1: 'Meeting held', 2: 'Proposal sent', 3: 'Negotiating', 4: 'Won' };
// Leads saved before these stages existed (Lead, Qualified, Proposal, Negotiation, Won).
const OLD = [1, 2, 3, 4, 5];

const daysSince = key => { if (!key) return 0; const [y, m, d] = key.split('-').map(Number); return Math.max(0, Math.round((Date.now() - new Date(y, m - 1, d).getTime()) / 864e5)); };

export const crmMethods = {
  leadStage(l) { return l.sv === 2 ? l.s : OLD[l.s] != null ? OLD[l.s] : 1; },
  // The owner, the Client Service Manager, Management and the GM move leads.
  canMoveLead(l) { return this.isTop() || this.isManagerOf('clientservice') || l.owner === this.me().k; },
  canSeeValues() { return this.isTop() || ['clientservice', 'finance'].includes(this.state.role || 'ceo'); },

  // Saves a file: to the database storage when live, in this browser (small files) in the demo.
  async storeFile(file) {
    if (this.state.db) {
      const path = (crypto.randomUUID ? crypto.randomUUID() : Date.now()) + '/' + file.name.replace(/[^\w.\- ]+/g, '_');
      const { error } = await supabase.storage.from('documents').upload(path, file, { contentType: file.type || undefined });
      if (error) throw error;
      return { name: file.name, path, size: file.size, mime: file.type };
    }
    if (file.size > 2 * 1048576) throw new Error('In the demo, files must be under 2 MB');
    const url = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(file); });
    return { name: file.name, url, size: file.size, mime: file.type };
  },

  // Records incoming work (from Management or Client Service) as a New lead for one owner.
  newWork(f) {
    const id = 'L' + Date.now().toString(36), owner = f.owner || this.me().k, today = dayKey(0);
    const lead = { id, sv: 2, c: f.c.trim(), t: f.t.trim(), v: +f.v || 0, s: 0, src: f.src || 'Email to Management', owner, next: f.next || 'Today', at: today, contact: (f.contact || '').trim(), hist: [{ s: 0, by: this.me().k, at: today, note: (f.note || '').trim() || 'Work received' }] };
    this.setState(x => ({ leads: [lead, ...x.leads], leadSel: id, crmTab: 'leads' }));
    if (owner !== this.me().k) this.remind(owner, 'New work for you: ' + lead.c, 'clients', 'users', lead.t + ' · from ' + this.me().n);
    this.toast('Lead created · ' + lead.c + ' · ' + this.av(owner).n);
    this.log('users', 'blue', 'New work · ' + lead.c, lead.t + ' · ' + this.av(owner).first);
    return id;
  },
  addCustomer(f) {
    const n = f.n.trim();
    if ((this.state.customers || []).some(c => c.n.toLowerCase() === n.toLowerCase())) { this.toast(n + ' is already a customer'); return; }
    this.setState(x => ({ customers: [{ id: 'C' + Date.now().toString(36), n, contact: [(f.contact || '').trim(), (f.title || '').trim()].filter(Boolean).join(' · '), phone: (f.phone || '').trim(), email: (f.email || '').trim(), tin: (f.tin || '').trim(), vrn: (f.vrn || '').trim(), box: (f.box || '').trim(), address: (f.address || '').trim(), city: (f.city || '').trim(), owner: f.owner || this.me().k }, ...(x.customers || [])] }));
    this.toast('Customer added · ' + n);
  },

  // Moves a lead one step, with what that step needs. Returns an error message, or '' when done.
  moveLead(id, to, extra = {}) {
    const l = this.state.leads.find(x => x.id === id);
    if (!l) return 'This lead no longer exists.';
    if (!this.canMoveLead(l)) return 'Only ' + this.av(l.owner).n + ' or the Client Service Manager can move this lead.';
    const proposal = extra.proposal || l.proposal;
    if (to === 3 && !proposal) return 'Attach the proposal you sent.';
    if (to === WON && !(+extra.value > 0 || l.v > 0)) return 'Enter the agreed value.';
    if (to === LOST && !extra.reason) return 'Choose why it was lost.';
    const today = dayKey(0), me = this.me().k;
    const patch = { s: to, sv: 2, at: today, hist: [...(l.hist || []), { s: to, by: me, at: today, note: (extra.note || '').trim() || (to === LOST ? extra.reason : '') }] };
    if (extra.proposal) patch.proposal = Object.assign({ by: me, at: today }, extra.proposal);
    if (to === WON && +extra.value > 0) patch.v = +extra.value;
    if (to === LOST) patch.lost = extra.reason;
    if (extra.next) patch.next = extra.next;
    const next = Object.assign({}, l, patch);
    this.setState(x => ({ leads: x.leads.map(y => (y.id === id ? next : y)) }));
    const csm = this.managerOf('clientservice');
    if (to === 3 && csm && csm !== me) this.remind(csm, 'Proposal sent · ' + l.c, 'clients', 'fileText', l.t + ' · by ' + this.me().n);
    if (to === LOST && csm && csm !== me) this.remind(csm, 'Lead lost · ' + l.c, 'clients', 'x', extra.reason + ' · ' + this.me().n);
    if (to === WON) this.wonToJob(next);
    else this.toast(l.c + ' → ' + LEAD_STAGES[to]);
    this.log(to === WON ? 'trendUp' : to === LOST ? 'x' : 'users', to === WON ? 'green' : to === LOST ? 'red' : 'blue', l.c + ' · ' + LEAD_STAGES[to], l.t + ' · ' + this.me().first);
    return '';
  },
  // A won lead becomes a customer (if new) and a job, and Operations, the GM and Management are told.
  wonToJob(l) {
    const id = this.newProject({ client: l.c, name: l.t, cs: l.owner, lead: l.id });
    this.setState(x => ({
      leads: x.leads.map(y => (y.id === l.id ? Object.assign({}, y, { job: id }) : y)),
      customers: (x.customers || []).some(c => c.n.toLowerCase() === l.c.toLowerCase()) ? x.customers : [{ id: 'C' + Date.now().toString(36), n: l.c, contact: l.contact || '', phone: '', email: '', tin: '', city: '', owner: l.owner }, ...(x.customers || [])]
    }));
    [this.ROLES.gm.k, this.ROLES.ceo.k].filter(k => k !== this.me().k).forEach(k => this.remind(k, 'New job won · ' + l.c, 'project', 'trendUp', l.t + ' · ' + id));
    this.toast('Won · ' + l.c + ' · project ' + id + ' created · next: send the design brief');
  },
  setLeadOwner(id, k) {
    const l = this.state.leads.find(x => x.id === id); if (!l || l.owner === k) return;
    this.setState(x => ({ leads: x.leads.map(y => (y.id === id ? Object.assign({}, y, { owner: k }) : y)) }));
    this.remind(k, 'Lead assigned to you · ' + l.c, 'clients', 'users', l.t + ' · from ' + this.me().n);
    this.toast(l.c + ' → ' + this.av(k).n);
  },
  // A memo to a department (for a lead that needs work without a full project). The head acts on it.
  async sendMemo(f) {
    const text = (f.text || '').trim(); if (!f.dept) return 'Choose the department'; if (text.length < 5) return 'Write the memo';
    let file = null; if (f.file) { try { file = await this.storeFile(f.file); } catch (e) { return 'Upload failed · ' + (e.message || e); } }
    const to = this.managerOf(f.dept), id = 'MEMO' + Date.now().toString(36), at = dayKey(0);
    const m = { id, from: this.me().k, dept: f.dept, to, text, file, lead: f.lead || '', st: 'sent', at, log: [{ by: this.me().k, at, t: 'Sent' }] };
    this.setState(x => ({ memos: [m, ...(x.memos || [])] }));
    const L = (this.state.leads || []).find(l => l.id === f.lead);
    if (L) this.setState(x => ({ leads: x.leads.map(l => (l.id === L.id ? Object.assign({}, l, { hist: [...(l.hist || []), { s: this.leadStage(l), by: this.me().k, at, note: 'Memo sent to ' + this.av(to).n + ': ' + text.slice(0, 80) }] }) : l)) }));
    if (to && to !== this.me().k) this.notify({ to, ic: 'fileText', t: 'Memo from ' + this.me().n + (L ? ' · ' + L.c : ''), s: text.slice(0, 120), go: 'dept' });
    this.toast('Memo sent to ' + this.av(to).n);
    return '';
  },
  memoAct(id, st, reply) {
    const m = (this.state.memos || []).find(x => x.id === id); if (!m) return;
    const at = dayKey(0), t = st === 'seen' ? 'Seen' : 'Done' + (reply ? ': ' + reply : '');
    this.setState(x => ({ memos: x.memos.map(y => (y.id === id ? Object.assign({}, y, { st, reply: reply || y.reply || '', log: [...(y.log || []), { by: this.me().k, at, t }] }) : y)) }));
    if (m.from !== this.me().k) this.notify({ to: m.from, ic: 'check', t: 'Memo ' + (st === 'seen' ? 'seen' : 'done') + ' by ' + this.me().n, s: reply || m.text.slice(0, 80), go: m.lead ? 'clients' : 'dept' });
    this.toast(st === 'seen' ? 'Marked as seen' : 'Memo done · ' + this.av(m.from).n + ' told');
  },
  setLeadNext(id, next) { this.setState(x => ({ leads: x.leads.map(y => (y.id === id ? Object.assign({}, y, { next }) : y)) })); }
};

// Values for the Clients & leads page.
export function crmVals(s) {
  const showV = this.canSeeValues(), fmtM = v => (showV ? this.fmtM(v) : '');
  const leads = s.leads.map(l => Object.assign({}, l, { st: this.leadStage(l) }));
  const team = this.teamOf('clientservice');
  const row = l => {
    const stale = l.st < WON && daysSince(l.at) >= 7, a = this.av(l.owner);
    return { id: l.id, c: l.c, t: l.t, v: fmtM(l.v), st: l.st, stage: LEAD_STAGES[l.st], owner: a.n, oi: a.i, oc: a.c, next: l.next || '', stale, days: daysSince(l.at), hasProposal: !!l.proposal, lost: l.lost || '', open: () => this.setState({ leadSel: l.id }) };
  };
  const open = leads.filter(l => l.st < WON);
  const cust = (s.customers || []).map(c => {
    const jobs = s.projects.filter(p => p.client === c.n), active = jobs.filter(p => p.st !== 'done').length;
    return Object.assign({}, c, { jobs: jobs.length, active, value: fmtM(jobs.reduce((a, b) => a + (b.val || 0), 0)), ownerN: this.av(c.owner).n, leads: open.filter(l => l.c === c.n).length });
  }).sort((a, b) => b.active - a.active || a.n.localeCompare(b.n));
  const sel = leads.find(l => l.id === s.leadSel);
  let L = null;
  if (sel) {
    const can = this.canMoveLead(sel);
    L = Object.assign(row(sel), {
      can, src: sel.src || '', contact: sel.contact || '', canOwner: this.isTop() || this.isManagerOf('clientservice'),
      team: team.map(k => { const a = this.av(k); return { v: k, l: a.n, i: a.i, c: a.c, ph: a.ph }; }), ownerK: sel.owner,
      next1: sel.st < WON ? sel.st + 1 : null, nextLabel: NEXT_ACTION[sel.st] || '', needsFile: sel.st === 2 && !sel.proposal, needsValue: sel.st === 4,
      proposal: sel.proposal ? Object.assign({}, sel.proposal, { size: this.fmtSize(sel.proposal.size || 0), byN: this.av(sel.proposal.by).n, open: () => this.openDoc({ n: sel.proposal.name, url: sel.proposal.url, path: sel.proposal.path }) }) : null,
      hist: (sel.hist || []).slice().reverse().map(h => ({ stage: LEAD_STAGES[h.s], by: this.av(h.by).n, at: h.at, note: h.note || '' })),
      job: sel.job || '', goJob: () => this.go('project', { projectId: sel.job }),
      close: () => this.setState({ leadSel: null }), setOwner: k => this.setLeadOwner(sel.id, k), setNext: t => this.setLeadNext(sel.id, t),
      move: (to, extra) => this.moveLead(sel.id, to, extra), store: f => this.storeFile(f),
      memo: f => this.sendMemo(Object.assign({ lead: sel.id }, f)),
      memos: (s.memos || []).filter(m => m.lead === sel.id).map(m => ({ id: m.id, to: this.av(m.to).n, dept: m.dept, text: m.text, st: { sent: 'Sent', seen: 'Seen', done: 'Done' }[m.st], reply: m.reply || '', at: m.at })),
      depts: ['creative', 'operations', 'finance', 'production'].map(d => ({ v: d, l: { creative: 'Creative', operations: 'Operations', finance: 'Finance', production: 'Printing' }[d] }))
    });
  }
  const tab = s.crmTab || 'leads';
  return {
    CR: {
      tab, setTab: t => this.setState({ crmTab: t, leadSel: null }), showV,
      stages: LEAD_STAGES.slice(0, WON).map((l, i) => ({ l, i, n: open.filter(x => x.st === i).length, leads: open.filter(x => x.st === i).map(row) })),
      lost: leads.filter(l => l.st === LOST).map(row), won: leads.filter(l => l.st === WON).map(row),
      customers: cust, sel: L, reasons: LOST_REASONS,
      kpis: [
        { l: 'Open leads', v: String(open.length) },
        { l: 'Proposals with clients', v: String(open.filter(l => l.st >= 3).length) },
        ...(showV ? [{ l: 'Pipeline value', v: this.fmtM(open.reduce((a, b) => a + (b.v || 0), 0)) }] : []),
        { l: 'Needs follow-up', v: String(open.filter(l => daysSince(l.at) >= 7).length), warn: open.some(l => daysSince(l.at) >= 7) }
      ],
      newWork: () => this.openModal('work'), newCustomer: () => this.openModal('customer')
    }
  };
}
