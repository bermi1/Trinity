// Client Service CRM: clients, leads and proposals.
// Leads move New → Contacted → Meeting → Proposal sent → Negotiation → Won / Lost. Each move records
import { FLOW, FLOW_L } from './flow';
// who and when; "Lost" needs a reason, "Won" the agreed value. A file is optional at any step from
// the meeting on: the proposal, artwork, or another file, labelled with what it is.
// Mixed into TrinityApp, so `this` is the app.
import { supabase } from '../lib/supabase';
import { dayKey } from './seed';

export const LEAD_STAGES = ['New', 'Contacted', 'Meeting', 'Proposal sent', 'Negotiation', 'Won', 'Lost'];
export const LOST_REASONS = ['Price too high', 'Chose a competitor', 'No budget', 'Postponed', 'No response', 'Other'];
export const SOURCES = ['Email to Management', 'Phone call', 'Walk-in', 'Referral', 'Tender', 'Existing client'];
const WON = 5, LOST = 6;
// What a file on a lead is. Only a 'proposal' fills l.proposal (which targets count as a proposal);
// every file, whatever it is, goes on l.files.
export const LEAD_FILE_KINDS = [['proposal', 'Proposal'], ['artwork', 'Artwork'], ['other', 'Other']];
const kindL = k => (LEAD_FILE_KINDS.find(x => x[0] === k) || LEAD_FILE_KINDS[0])[1];
// The files on a lead: l.files, or the proposal of a lead saved before files had a kind.
const leadFiles = l => (l.files && l.files.length ? l.files : l.proposal ? [Object.assign({ kind: 'proposal' }, l.proposal)] : []);
// What the owner does to reach each stage.
export const NEXT_ACTION = { 0: 'Mark contacted', 1: 'Meeting held', 2: 'Proposal sent', 3: 'Negotiating', 4: 'Won' };
// Leads saved before these stages existed (Lead, Qualified, Proposal, Negotiation, Won).
const OLD = [1, 2, 3, 4, 5];

const daysSince = key => { if (!key) return 0; const [y, m, d] = key.split('-').map(Number); return Math.max(0, Math.round((Date.now() - new Date(y, m - 1, d).getTime()) / 864e5)); };

// The event's details on a lead (and its project): where, the setup date, how many people.
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const isDay = d => { if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false; const [y, m, x] = d.split('-').map(Number), t = new Date(y, m - 1, x); return t.getFullYear() === y && t.getMonth() === m - 1 && t.getDate() === x; };
export const fmtSetup = d => (isDay(d || '') ? +d.slice(8) + ' ' + MON[+d.slice(5, 7) - 1] + (d.slice(0, 4) !== String(new Date().getFullYear()) ? ' ' + d.slice(0, 4) : '') : '');
// Checks venue / setup date / pax from a form. Returns { error } or { venue, setupDate, pax }.
export function eventDetails(f) {
  const venue = String(f.venue == null ? '' : f.venue).trim(), setupDate = String(f.setupDate == null ? '' : f.setupDate).trim(), p = String(f.pax == null ? '' : f.pax).trim();
  if (setupDate && !isDay(setupDate)) return { error: 'Enter a valid setup date' };
  if (p && !/^\d+$/.test(p)) return { error: 'Pax must be a whole number (0 or more)' };
  return { venue, setupDate, pax: p ? parseInt(p, 10) : 0 };
}
const eventLine = l => [l.venue || '', l.setupDate ? 'setup ' + fmtSetup(l.setupDate) : '', l.pax > 0 ? l.pax + ' pax' : ''].filter(Boolean).join(' · ');

export const crmMethods = {
  leadStage(l) { return l.sv === 2 ? l.s : OLD[l.s] != null ? OLD[l.s] : 1; },
  // The owner, the Client Service Manager, Management and the GM move leads.
  canMoveLead(l) { return this.isTop() || this.isManagerOf('clientservice') || l.owner === this.me().k; },
  canSeeValues() { return this.isTop() || ['clientservice', 'finance', 'pa'].includes(this.state.role || 'ceo') || this.isCsStaff(); },
  // A Client Service team member on the staff portal (e.g. Flavia, Mariam): sees their own leads, clients and targets.
  isCsStaff() { return (this.state.role || 'ceo') === 'staff' && this.deptOf(this.me().k) === 'clientservice'; },

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
  // Returns the new lead's id, or an error message (not starting with 'L') when venue / setup / pax are wrong.
  newWork(f) {
    const ev = eventDetails(f); if (ev.error) return ev.error;
    const id = 'L' + Date.now().toString(36), owner = f.owner || this.me().k, today = dayKey(0);
    const lead = { id, sv: 2, c: f.c.trim(), t: f.t.trim(), v: +f.v || 0, s: 0, src: f.src || 'Email to Management', owner, next: f.next || 'Today', at: today, contact: (f.contact || '').trim(), venue: ev.venue, setupDate: ev.setupDate, pax: ev.pax, hist: [{ s: 0, by: this.me().k, at: today, note: (f.note || '').trim() || 'Work received' }] };
    this.setState(x => ({ leads: [lead, ...x.leads], leadSel: id, crmTab: 'leads' }));
    if (owner !== this.me().k) this.remind(owner, 'New work for you: ' + lead.c, 'clients', 'users', lead.t + ' · from ' + this.me().n);
    this.toast('Lead created · ' + lead.c + ' · ' + this.av(owner).n);
    this.log('users', 'blue', 'New work · ' + lead.c, lead.t + ' · ' + this.av(owner).first);
    return id;
  },
  // Editing a client's details: Management, the GM, the PA, Finance (it invoices them), the Client Service
  // Manager and the client's own account owner.
  canEditClient(c) { return !!c && (this.isTop() || ['pa', 'finance'].includes(this.state.role || 'ceo') || this.isManagerOf('clientservice') || c.owner === this.me().k); },
  editClient(id) {
    const c = (this.state.customers || []).find(x => x.id === id); if (!c) return;
    const [contact, title] = String(c.contact || '').split(' · ');
    this.openModal('customer', { id: c.id, n: c.n, contact: contact || '', title: title || '', phone: c.phone || '', email: c.email || '', tin: c.tin || '', vrn: c.vrn || '', address: c.address || '', box: c.box || '', city: c.city || '', owner: c.owner || '',
      _meta: { title: 'Edit client · ' + c.n, sub: 'Changes show everywhere this client appears. Invoices already sent keep what was printed on them.', submit: 'Save changes' } });
  },
  updateCustomer(f) {
    const c = (this.state.customers || []).find(x => x.id === f.id); if (!c) return 'Client not found';
    if (!this.canEditClient(c)) return 'Only Management, Finance, the PA, the Client Service Manager or the account owner can change this client';
    const n = (f.n || '').trim(); if (!n) return 'Enter the company name';
    if ((this.state.customers || []).some(x => x.id !== c.id && x.n.toLowerCase() === n.toLowerCase())) return n + ' is already a client';
    const old = c.n, same = v => (v || '').toLowerCase() === old.toLowerCase(), renamed = n !== old;
    const next = Object.assign({}, c, { n, contact: [(f.contact || '').trim(), (f.title || '').trim()].filter(Boolean).join(' · '), phone: (f.phone || '').trim(), email: (f.email || '').trim(), tin: (f.tin || '').trim(), vrn: (f.vrn || '').trim(), box: (f.box || '').trim(), address: (f.address || '').trim(), city: (f.city || '').trim(), owner: f.owner || c.owner });
    // Invoices not yet sent (drafts, or waiting for signature) take the new details; sent ones stay as issued.
    const open = i => same(i.c) && (i.st === 'draft' || !i.sentAt) && i.st !== 'paid';
    this.setState(x => ({
      customers: x.customers.map(y => (y.id === c.id ? next : y)),
      projects: renamed ? (x.projects || []).map(p => (same(p.client) ? Object.assign({}, p, { client: n }) : p)) : x.projects,
      leads: renamed ? (x.leads || []).map(l => (same(l.c) ? Object.assign({}, l, { c: n }) : l)) : x.leads,
      invoices: (x.invoices || []).map(i => (open(i) ? Object.assign({}, i, { c: n, tin: next.tin, vrn: next.vrn, addr: [next.box, next.address, next.city].filter(Boolean).join(', ') }) : i))
    }));
    this.toast('Client updated · ' + n);
    this.log('users', 'blue', 'Client details updated · ' + n, renamed ? 'Renamed from ' + old : 'By ' + this.me().n);
    return '';
  },
  // Editing a lead's details (client, the work, value, contact, how it came in): whoever can move the lead.
  editLead(id) {
    const l = (this.state.leads || []).find(x => x.id === id); if (!l) return;
    this.openModal('leadEdit', { id: l.id, c: l.c || '', t: l.t || '', v: l.v ? String(l.v) : '', contact: l.contact || '', src: l.src || '', venue: l.venue || '', setupDate: l.setupDate || '', pax: l.pax > 0 ? String(l.pax) : '' });
  },
  updateLead(f) {
    const l = (this.state.leads || []).find(x => x.id === f.id); if (!l) return 'This lead no longer exists.';
    if (!this.canMoveLead(l)) return 'Only ' + this.av(l.owner).n + ' or the Client Service Manager can change this lead.';
    const c = (f.c || '').trim(), t = (f.t || '').trim();
    if (!c) return 'Enter the client'; if (!t) return 'Enter what they need';
    const v = f.v === '' || f.v == null ? 0 : +f.v; if (!(v >= 0)) return 'The value must be a number';
    const ev = eventDetails(f); if (ev.error) return ev.error;
    const changes = [c !== l.c ? 'client' : '', t !== l.t ? 'work' : '', v !== (l.v || 0) ? 'value' : '', (f.contact || '').trim() !== (l.contact || '') ? 'contact' : '', (f.src || '') !== (l.src || '') ? 'source' : '',
      ev.venue !== (l.venue || '') ? 'venue' : '', ev.setupDate !== (l.setupDate || '') ? 'setup date' : '', ev.pax !== (l.pax || 0) ? 'pax' : ''].filter(Boolean);
    if (!changes.length) return '';
    const at = dayKey(0);
    this.setState(x => ({ leads: x.leads.map(y => (y.id === l.id ? Object.assign({}, y, { c, t, v, contact: (f.contact || '').trim(), src: f.src || y.src || '', venue: ev.venue, setupDate: ev.setupDate, pax: ev.pax, hist: [...(y.hist || []), { s: this.leadStage(y), by: this.me().k, at, note: 'Details updated: ' + changes.join(', ') }] }) : y)) }));
    this.toast('Lead updated · ' + c);
    return '';
  },
  addCustomer(f) {
    const n = f.n.trim();
    if ((this.state.customers || []).some(c => c.n.toLowerCase() === n.toLowerCase())) { this.toast(n + ' is already a client'); return; }
    this.setState(x => ({ customers: [{ id: 'C' + Date.now().toString(36), n, contact: [(f.contact || '').trim(), (f.title || '').trim()].filter(Boolean).join(' · '), phone: (f.phone || '').trim(), email: (f.email || '').trim(), tin: (f.tin || '').trim(), vrn: (f.vrn || '').trim(), box: (f.box || '').trim(), address: (f.address || '').trim(), city: (f.city || '').trim(), owner: f.owner || this.me().k, at: dayKey(0) }, ...(x.customers || [])] }));
    this.toast('Client added · ' + n);
  },

  // Moves a lead one step, with what that step needs. Returns an error message, or '' when done.
  moveLead(id, to, extra = {}) {
    const l = this.state.leads.find(x => x.id === id);
    if (!l) return 'This lead no longer exists.';
    if (!this.canMoveLead(l)) return 'Only ' + this.av(l.owner).n + ' or the Client Service Manager can move this lead.';
    if (to === WON && !(+extra.value > 0 || l.v > 0)) return 'Enter the agreed value.';
    if (to === LOST && !extra.reason) return 'Choose why it was lost.';
    const today = dayKey(0), me = this.me().k;
    const patch = { s: to, sv: 2, at: today, hist: [...(l.hist || []), { s: to, by: me, at: today, note: (extra.note || '').trim() || (to === LOST ? extra.reason : '') }] };
    if (extra.proposal) Object.assign(patch, this.leadFilePatch(l, extra.proposal, extra.kind));
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
  // A file added to a lead: on l.files with its kind; a proposal also becomes l.proposal.
  leadFilePatch(l, info, kind) {
    const k = LEAD_FILE_KINDS.some(x => x[0] === kind) ? kind : 'proposal';
    const f = Object.assign({ by: this.me().k, at: dayKey(0) }, info, { kind: k });
    const patch = { files: [...leadFiles(l), f] };
    if (k === 'proposal') patch.proposal = f;
    return patch;
  },
  // Attach a file to a lead without moving it (e.g. artwork sent after the proposal).
  attachLeadFile(id, info, kind) {
    const l = this.state.leads.find(x => x.id === id);
    if (!l) return 'This lead no longer exists.';
    if (!this.canMoveLead(l)) return 'Only ' + this.av(l.owner).n + ' or the Client Service Manager can add files to this lead.';
    if (!info || !info.name) return 'Choose a file';
    const patch = this.leadFilePatch(l, info, kind), today = dayKey(0);
    patch.hist = [...(l.hist || []), { s: this.leadStage(l), by: this.me().k, at: today, note: kindL(patch.files.at(-1).kind) + ' attached · ' + info.name }];
    this.setState(x => ({ leads: x.leads.map(y => (y.id === id ? Object.assign({}, y, patch) : y)) }));
    this.toast(kindL(patch.files.at(-1).kind) + ' attached · ' + info.name);
    return '';
  },
  // The lead's client added to the clients list, unless a client with that name is already there.
  customerFromLead(l) {
    this.setState(x => ({
      customers: (x.customers || []).some(c => c.n.toLowerCase() === l.c.toLowerCase()) ? x.customers : [{ id: 'C' + Date.now().toString(36), n: l.c, contact: l.contact || '', phone: '', email: '', tin: '', city: '', owner: l.owner, at: dayKey(0) }, ...(x.customers || [])]
    }));
  },
  // A project for the lead, made the normal way (newProject), carrying the value and the event's details,
  // and linked both ways (project.lead, lead.job). Returns the project id, or an error message.
  projectFromLead(l) {
    const id = this.newProject({ client: l.c, name: l.t, cs: l.owner, lead: l.id });
    if (typeof id !== 'string' || id.indexOf('PRJ') !== 0) return id;
    this.setProject(id, Object.assign({ venue: l.venue || '', setupDate: l.setupDate || '', pax: l.pax || 0 }, l.v > 0 ? { val: l.v } : {}));
    this.setState(x => ({ leads: x.leads.map(y => (y.id === l.id ? Object.assign({}, y, { job: id }) : y)) }));
    return id;
  },
  // A won lead becomes a client (if new) and a job, and Operations, the GM and Management are told.
  // If the lead already has a project (pushed before it was won), no second one is made.
  wonToJob(l) {
    this.customerFromLead(l);
    if (l.job) { this.toast('Won · ' + l.c + ' · project ' + l.job); return; }
    const id = this.projectFromLead(l);
    [this.ROLES.gm.k, this.ROLES.ceo.k].filter(k => k !== this.me().k).forEach(k => this.remind(k, 'New job won · ' + l.c, 'project', 'trendUp', l.t + ' · ' + id));
    this.toast('Won · ' + l.c + ' · project ' + id + ' created · next: send the design brief');
  },
  // At any stage: the lead's client becomes a client (if new) and a project opens for it. The lead stays
  // at its stage. Returns the project id, or an error message.
  pushLead(lid) {
    const l = (this.state.leads || []).find(x => x.id === lid);
    if (!l) return 'This lead no longer exists.';
    if (!this.canMoveLead(l)) return 'Only ' + this.av(l.owner).n + ' or the Client Service Manager can do this.';
    if (l.job) { this.go('project', { projectId: l.job }); return l.job; }
    this.customerFromLead(l);
    const id = this.projectFromLead(l);
    if (typeof id !== 'string' || id.indexOf('PRJ') !== 0) return id;
    this.setState(x => ({ leads: x.leads.map(y => (y.id === l.id ? Object.assign({}, y, { hist: [...(y.hist || []), { s: this.leadStage(y), by: this.me().k, at: dayKey(0), note: 'Client & project created · ' + id }] }) : y)) }));
    this.toast(l.c + ' · client & project ' + id + ' created');
    this.log('folder', 'purple', 'Lead pushed to a project · ' + l.c, l.t + ' · ' + id);
    this.go('project', { projectId: id });
    return id;
  },
  setLeadOwner(id, k) {
    const l = this.state.leads.find(x => x.id === id); if (!l || l.owner === k) return;
    this.setState(x => ({ leads: x.leads.map(y => (y.id === id ? Object.assign({}, y, { owner: k }) : y)) }));
    this.remind(k, 'Lead assigned to you · ' + l.c, 'clients', 'users', l.t + ' · from ' + this.me().n);
    this.toast(l.c + ' → ' + this.av(k).n);
  },
  // A memo to a department (for a lead that needs work without a full project). The head acts on it.
  // With dept 'person' and `to`, it goes straight to one person, already assigned to them.
  // `wa`: also open WhatsApp to whoever receives it, with the memo written.
  async sendMemo(f) {
    const text = (f.text || '').trim(), me = this.me().k, direct = f.dept === 'person';
    if (!f.dept) return 'Choose the department';
    if (direct && !f.to) return 'Choose the person';
    if (direct && f.to === me) return 'Choose someone other than yourself';
    if (text.length < 5) return 'Write the memo';
    if (!direct && !this.memoHead(f.dept)) return 'No one leads that department yet · set it in Company setup';
    let file = null; if (f.file) { try { file = await this.storeFile(f.file); } catch (e) { return 'Upload failed · ' + (e.message || e); } }
    const to = direct ? f.to : this.memoHead(f.dept), id = 'MEMO' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at = dayKey(0);
    const cat = ['project', 'internal', 'emergency', 'management'].includes(f.cat) ? f.cat : 'project';
    const m = { id, cat, from: me, dept: f.dept, to, text, file, lead: f.lead || '', project: f.project || '', st: 'sent', at, files: [], log: [{ by: me, at, t: 'Sent' }] };
    if (direct) {
      // Straight to the person: assigned to them, with a task on their list, as if the head had assigned it.
      const tid = 'T' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      Object.assign(m, { who: to, st: 'assigned', task: tid, toDept: this.deptOf(to) || '', log: [{ by: me, at, t: 'Sent to ' + this.av(to).n }] });
      const task = { id: tid, t: 'Memo: ' + text.slice(0, 70), p: m.project, who: to, by: me, due: cat === 'emergency' ? 'Today' : 'This week', st: 'todo', pri: cat === 'emergency' ? 'high' : 'med', memo: id };
      this.setState(x => ({ tasks: [task, ...(x.tasks || [])] }));
    }
    this.setState(x => ({ memos: [m, ...(x.memos || [])] }));
    const L = (this.state.leads || []).find(l => l.id === f.lead);
    if (L) this.setState(x => ({ leads: x.leads.map(l => (l.id === L.id ? Object.assign({}, l, { hist: [...(l.hist || []), { s: this.leadStage(l), by: me, at, note: 'Memo sent to ' + this.av(to).n + ': ' + text.slice(0, 80) }] }) : l)) }));
    if (f.project) this.pnote(f.project, 'Memo sent to ' + this.av(to).n + ': ' + text.slice(0, 60));
    if (to && to !== me) this.notify({ to, ic: 'fileText', t: (direct ? 'Memo to you from ' : 'Memo from ') + this.me().n + (L ? ' · ' + L.c : ''), s: text.slice(0, 120), go: 'memo:' + id });
    this.toast('Memo sent to ' + this.av(to).n);
    if (f.wa) { const r = this.memoWaSend(id); this.toast('Memo sent to ' + this.av(to).n + (r ? ' · ' + r : ' · WhatsApp opened')); }
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
  const mine = this.isCsStaff() ? this.me().k : null;
  // Client Service staff see only their own leads and clients.
  const leads = s.leads.filter(l => !mine || l.owner === mine).map(l => Object.assign({}, l, { st: this.leadStage(l) }));
  const team = this.teamOf('clientservice');
  const row = l => {
    const stale = l.st < WON && daysSince(l.at) >= 7, a = this.av(l.owner);
    const files = leadFiles(l), last = files[files.length - 1];
    return { id: l.id, c: l.c, t: l.t, v: fmtM(l.v), st: l.st, stage: LEAD_STAGES[l.st], owner: a.n, oi: a.i, oc: a.c, next: l.next || '', stale, days: daysSince(l.at), hasProposal: !!l.proposal, hasFile: !!last, fileL: last ? kindL(last.kind) : '', lost: l.lost || '', event: eventLine(l), open: () => this.setState({ leadSel: l.id }) };
  };
  const open = leads.filter(l => l.st < WON);
  const cust = (s.customers || []).filter(c => !mine || c.owner === mine || s.leads.some(l => l.owner === mine && (l.c || '').toLowerCase() === (c.n || '').toLowerCase())).map(c => {
    const jobs = s.projects.filter(p => (p.client || '').toLowerCase() === c.n.toLowerCase()), active = jobs.filter(p => p.st !== 'done').length;
    const same = x => (x || '').toLowerCase() === c.n.toLowerCase();
    const job = p => {
      const step = this.flowOf(p), done = p.st === 'done' || step === 'closed', inv = (s.invoices || []).filter(i => i.p === p.id);
      return { id: p.id, name: p.name, done, stage: FLOW_L[FLOW.indexOf(step)] || '', due: p.due || '', when: p.closedAt || p.due || '',
        pm: p.pm ? this.av(p.pm).n : '', value: fmtM(p.val || 0), po: p.po && p.po.no ? 'PO ' + p.po.no : 'No PO yet',
        billed: showV && inv.length ? fmtM(inv.reduce((a, b) => a + (b.v || 0), 0)) + ' invoiced · ' + inv.filter(i => i.st === 'paid').length + '/' + inv.length + ' paid' : '',
        open: () => this.go('project', { projectId: p.id }) };
    };
    const hist = jobs.map(job);
    return Object.assign({}, c, { canEdit: this.canEditClient(c), edit: () => this.editClient(c.id), jobs: jobs.length, active, value: fmtM(jobs.reduce((a, b) => a + (b.val || 0), 0)), ownerN: this.av(c.owner).n, leads: open.filter(l => l.c === c.n).length,
      ongoing: hist.filter(h => !h.done), past: hist.filter(h => h.done),
      dealt: leads.filter(l => same(l.c) && (l.st === WON || l.st === LOST)).map(l => ({ id: l.id, t: l.t, won: l.st === WON, why: l.lost || '', open: () => this.setState({ crmTab: l.st === WON ? 'won' : 'lost', leadSel: l.id }) })),
      openLeads: open.filter(l => same(l.c)).map(row) });
  }).sort((a, b) => b.active - a.active || a.n.localeCompare(b.n));
  const sel = leads.find(l => l.id === s.leadSel);
  let L = null;
  if (sel) {
    const can = this.canMoveLead(sel);
    L = Object.assign(row(sel), {
      can, src: sel.src || '', contact: sel.contact || '', canOwner: this.isTop() || this.isManagerOf('clientservice'),
      team: team.map(k => { const a = this.av(k); return { v: k, l: a.n, i: a.i, c: a.c, ph: a.ph }; }), ownerK: sel.owner,
      next1: sel.st < WON ? sel.st + 1 : null, nextLabel: NEXT_ACTION[sel.st] || '', // From the meeting on, a file can go with the step (optional): proposal, artwork or other.
      offerFile: sel.st >= 2 && sel.st < WON, needsFile: false, needsValue: sel.st === 4, kinds: LEAD_FILE_KINDS.map(([v, l]) => ({ v, l })),
      proposal: sel.proposal ? Object.assign({}, sel.proposal, { size: this.fmtSize(sel.proposal.size || 0), byN: this.av(sel.proposal.by).n, open: () => this.openDoc({ n: sel.proposal.name, url: sel.proposal.url, path: sel.proposal.path }) }) : null,
      files: leadFiles(sel).map(f => ({ name: f.name, kind: f.kind || 'proposal', kindL: kindL(f.kind), label: kindL(f.kind) + ' · ' + f.name, at: f.at || '', size: this.fmtSize(f.size || 0), byN: this.av(f.by).n, open: () => this.openDoc({ n: f.name, url: f.url, path: f.path, mime: f.mime }) })),
      attach: (info, kind) => this.attachLeadFile(sel.id, info, kind),
      hist: (sel.hist || []).slice().reverse().map(h => ({ stage: LEAD_STAGES[h.s], by: this.av(h.by).n, at: h.at, note: h.note || '' })),
      job: sel.job || '', goJob: () => this.go('project', { projectId: sel.job }), push: () => this.pushLead(sel.id),
      venue: sel.venue || '', setup: fmtSetup(sel.setupDate), pax: sel.pax > 0 ? String(sel.pax) : '',
      canEdit: can, edit: () => this.editLead(sel.id),
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
