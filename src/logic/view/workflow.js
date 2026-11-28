// Ported from the Claude Design file (design/project/Trinity Mark 360 App.dc.html).
// Values for the briefing, projects, tasks and money requests pages.
import { eventLine } from '../flow';
export function pageVals(s, IC, ST, narrow) {
  const V = {};
  const pill = (a) => ({stl:a[0], stbg:a[1], stfg:a[2]});
  // Briefing
  V.lastWeek = [['Projects completed','6'],['Revenue','92.4M'],['Expenses','51.1M'],['Pending payments','38.0M','#8A6414'],['Delayed work','2','#B23A46'],['Tasks carried over','17']].map(([l,v,c]) => ({l,v,c:c || '#17152A'}));
  V.issues = [['OVERDUE','#FBEDEE','#B23A46','Kivuko Foods invoice INV-0187 · TZS 18.6M · 21 days','finance'],['DELAY','#FBF1DD','#8A6414','Large-format printer down 2 days — Mlimani Bank stand slipped','project:PRJ-0233'],['FLOATS','#FBF1DD','#8A6414','3 staff floats unreconciled beyond 7 days · TZS 1.2M','requests']].map(([tag,bg,fg,t,g]) => ({tag,bg,fg,t,on:() => this.goTarget(g)}));
  const K = {p:['PROJECT START','#5A2FA8'],pr:['PROCUREMENT','#3559A8'],dl:['DELIVERY','#1F7549'],pd:['PRODUCTION DUE','#8A6414'],cd:['CLIENT DEADLINE','#8A6414'],dp:['DEPLOYMENT','#5A2FA8'],ev:['EVENT','#E2CE98']};
  const W = [['Mon 21',[['p','Safari Mobile pitch prep'],['pr','Vinyl × 12 rolls']]],['Tue 22',[['dl','Displays to Mwanza'],['pd','400 T-shirts · Kivuko']]],['Wed 23',[['cd','Pwani outlet branding · 16:00']]],['Thu 24',[['dl','Expo stand to Mlimani City'],['dp','Roadshow crew → Musoma']]],['Fri 25',[['ev','Mlimani Bank Expo opens']]]];
  V.week = W.map(([dd,items],i) => ({d:dd, hbg:i === 1 ? '#2B1459' : '#F4F1FA', hc:i === 1 ? '#fff' : '#2B1459', items:items.map(([k,t]) => ({k:K[k][0], tc:K[k][1], t, bg:k === 'ev' ? '#2B1459' : k === 'cd' ? '#FBF6EA' : '#fff', bd:k === 'ev' ? '#2B1459' : k === 'cd' ? '#E4CD95' : '#E8E4EF', c:k === 'ev' ? '#fff' : '#17152A'}))}));
  const AG = ['W38 results','Receivables & floats','Projects at risk','This week\u2019s deployment','Procurement needs','AOB'];
  const cur = s.agenda.indexOf(false);
  V.agenda = AG.map((l,i) => { const dn = s.agenda[i]; return {l, c:dn ? '#6E6A7C' : i === cur ? '#2B1459' : '#17152A', td:dn ? 'line-through' : 'none', bd:dn ? '#2E9B63' : i === cur ? '#6D3CC2' : '#D5CFE0', bg:dn ? '#2E9B63' : '#fff', on:() => this.setState(x => ({agenda:x.agenda.map((v,j) => j === i ? !v : v)}))}; });
  V.actions = s.actions.map(a => { const p = this.av(a.o); return Object.assign({}, a, {oc:p.c, oname:p.n}); });
  const na = s.newAct, setNA = k => e => this.setState({newAct:Object.assign({}, s.newAct, {[k]:e.target.value})});
  V.na = na; V.naD = setNA('d'); V.naA = setNA('a'); V.naO = setNA('o'); V.naDl = setNA('dl');
  V.people = Object.keys(this.PPL).map(k => ({v:k, l:this.PPL[k][0]}));
  V.addAction = () => {
    if (!na.d.trim() || !na.a.trim()) { this.toast('Add a decision and an action first'); return; }
    const tk = this.nextId('TSK', s.actions, 'task');
    this.setState(x => ({actions:[...x.actions, {d:na.d, a:na.a, o:na.o, dl:na.dl || 'This week', task:tk}], tasks:[{id:'T'+Date.now(), t:na.a, p:'PRJ-0231', who:na.o, due:na.dl || 'This week', st:'todo', pri:'med'}, ...x.tasks], newAct:{d:'',a:'',o:'SK',dl:''}}));
    this.toast(tk + ' created and assigned to ' + this.av(na.o).n);
  };
  V.publishMinutes = () => { this.toast('Minutes published to 11 attendees · ' + s.actions.length + ' actions tracked'); this.notify({ic:'presentation', t:'Monday Briefing minutes published', s:s.actions.length + ' decisions · review next Monday', go:'briefing'}); };
  V.teamUpdates = s.teamUpdates.map(u => { const a = this.av(u.who); return Object.assign({}, u, {n:a.n, c:a.c, i:a.i}); });
  const nuu = s.newUpdate;
  V.nu = nuu; V.nuWho = e => this.setState({newUpdate:Object.assign({}, nuu, {who:e.target.value})}); V.nuText = e => this.setState({newUpdate:Object.assign({}, nuu, {t:e.target.value})});
  V.nuPresBg = nuu.pres ? '#6D3CC2' : '#fff'; V.nuPresBd = nuu.pres ? '#6D3CC2' : '#D5CFE0';
  V.nuTogglePres = () => this.setState({newUpdate:Object.assign({}, nuu, {pres:!nuu.pres})});
  V.addUpdate = () => {
    if (!nuu.t.trim()) { this.toast('Write your update first'); return; }
    this.setState(x => ({teamUpdates:[...x.teamUpdates, {id:Date.now(), who:nuu.who, t:nuu.t, pres:nuu.pres, time:'Just now'}], newUpdate:{who:nuu.who, t:'', pres:false}}));
    this.toast((nuu.pres ? 'Presentation' : 'Update') + ' posted to the briefing'); this.log('presentation','purple', this.av(nuu.who).n + (nuu.pres ? ' will present today' : ' posted an update'), nuu.t.slice(0,60));
  };

  // Projects
  const pf = s.projFilter;
  // Each person sees only the projects they may see; money columns only for those who handle money.
  const vis = this.visibleProjects(), seeMoney = ['ceo','gm','finance'].includes(s.role || 'ceo') || this.isManagerOf('operations');
  V.projMoney = seeMoney;
  V.projChips = [['all','All'],['on','On track'],['risk','At risk'],['late','Delayed'],['done','Completed']].map(([k,l]) => ({l:l + ' · ' + (k === 'all' ? vis.length : vis.filter(p => p.st === k).length), on:() => this.setState({projFilter:k}), bg:pf === k ? '#2B1459' : '#fff', c:pf === k ? '#fff' : '#17152A', bd:pf === k ? '#2B1459' : '#E8E4EF'}));
  V.projRows = vis.filter(p => pf === 'all' || p.st === pf).map(p => { const pm = this.av(p.pm), u = p.bud ? p.spent / p.bud : 0; return Object.assign({id:p.id, name:p.name, client:p.client, pmName:pm.n, pmC:pm.c, pmI:pm.i, prog:p.prog + '%', progW:p.prog + '%', progC:ST[p.st].c, used:Math.round(u*100) + '%', usedC:u > 1 ? '#B23A46' : u > .85 ? '#8A6414' : '#17152A', val:this.fmtM(p.val), due:p.due, ev:eventLine(p), on:() => this.go('project',{projectId:p.id})}, pill([ST[p.st].l, ST[p.st].bg, ST[p.st].fg])); });
  V.projEmpty = V.projRows.length === 0;
  V.newProject = () => this.openModal('project');

  // Project detail
  const P = this.proj(s.projectId);
  if (P.id) {
    const pm = this.av(P.pm), u = P.bud ? P.spent / P.bud : 0;
    const ptasks = s.tasks.filter(t => t.p === P.id);
    V.P = Object.assign({id:P.id, name:P.name, client:P.client, pmName:pm.n, due:P.due, prog:P.prog + '%', val:this.fmtM(P.val), margin:(P.val ? Math.round((P.val - Math.max(P.bud, P.spent)) / P.val * 100) : 0) + '%',
      stageLabel:'Stage ' + this.stageOf(P) + ' of ' + this.STAGES.length + ' · ' + this.STAGES[this.stageOf(P) - 1],
      stages:this.STAGES.map((l,i) => ({l, col:i + 1 < this.stageOf(P) || P.st === 'done' ? '#2B1459' : i + 1 === this.stageOf(P) ? '#B49A5A' : '#EDE9F3', c:i + 1 === this.stageOf(P) ? '#17152A' : '#6E6A7C', fw:i + 1 === this.stageOf(P) ? 700 : 500})),
      spent:this.fmtM(P.spent), bud:this.fmtM(P.bud), remaining:this.fmtM(Math.max(0, P.bud - P.spent)), over:P.spent > P.bud, overBy:this.fmtM(P.spent - P.bud), spentW:Math.min(100, u*100) + '%', barC:u > 1 ? '#D9535F' : '#2B1459', usedPct:Math.round(u*100) + '% used',
      profit:this.fmtM(P.val - Math.max(P.bud, P.spent)), invoiced:this.fmtM(s.invoices.filter(i => i.p === P.id && i.st !== 'cancelled').reduce((a,b) => a + b.v, 0)),
      tasks:ptasks.map(t => { const a = this.av(t.who), m = this.tst(t.st); return {t:t.t, who:a.n, due:t.due, stl:m[0], stbg:m[1], stfg:m[2], done:t.st === 'done', chkBg:t.st === 'done' ? '#2E9B63' : '#fff', chkBd:t.st === 'done' ? '#2E9B63' : '#D5CFE0', td:t.st === 'done' ? 'line-through' : 'none', toggle:() => this.setState(x => ({tasks:x.tasks.map(y => y.id === t.id ? Object.assign({}, y, {st:y.st === 'done' ? 'prog' : 'done'}) : y)}))}; }),
      tasksEmpty:ptasks.length === 0, openCount:ptasks.filter(t => t.st !== 'done').length + ' open',
      reqs:this.visibleReqs(s).filter(r => r.p === P.id).map(r => Object.assign({id:r.id, who:this.av(r.who).n, amt:this.fmtT(r.amt), cat:r.cat, items:this.reqItemsView(r).map(x => x.text).join(' · '), on:() => this.go('requests',{reqSel:r.id, reqFilter:'all'})}, pill(this.rst(r)))),
      team:P.team.map(k => this.av(k)), isDone:P.st === 'done', canAdvance:P.st !== 'done',
      advance:() => { const last = this.STAGES.length, ns = Math.min(last, this.stageOf(P) + 1); this.setState(x => ({projects:x.projects.map(p => p.id === P.id ? Object.assign({}, p, {stage:ns, sv:2, prog:Math.max(p.prog, Math.round(ns/last*100)), st:ns === last ? 'done' : p.st}) : p)})); this.toast(ns === last ? P.name + ' closed' : 'Moved to ' + this.STAGES[ns - 1]); this.log('folder','purple',P.client + ' · moved to ' + this.STAGES[ns - 1], P.name); },
      addTask:() => this.openModal('task',{p:P.id, who:P.pm}), reqMoney:() => this.openModal('req',{p:P.id}), invoice:() => this.openModal('invoice',{p:P.id}),
      back:() => this.go('projects')
    }, pill([ST[P.st].l, ST[P.st].bg, ST[P.st].fg]));
  } else V.P = {stages:[], tasks:[], reqs:[], team:[]};
  // Staff, Reception and Printing see projects without money figures.
  if (!seeMoney) {
    const hide = {val:'—', margin:'—', spent:'—', bud:'—', remaining:'—', over:false, overBy:'—', spentW:'0%', usedPct:'—', profit:'—', invoiced:'—', budLine:'—'};
    V.P = Object.assign({}, V.P, hide);
    V.projRows = V.projRows.map(r => Object.assign({}, r, {val:'—', used:'—'}));
  }

  // Tasks
  const tf = s.taskFilter;
  V.taskChips = [['all','All tasks'],['high','High priority'],['today','Due today'],['mine','Mine']].map(([k,l]) => ({l, on:() => this.setState({taskFilter:k}), bg:tf === k ? '#2B1459' : '#fff', c:tf === k ? '#fff' : '#17152A', bd:tf === k ? '#2B1459' : '#E8E4EF'}));
  const tl = s.tasks.filter(t => tf === 'all' || (tf === 'high' && t.pri === 'high') || (tf === 'today' && /today/i.test(t.due)) || (tf === 'mine' && t.who === this.ROLES[s.role || 'ceo'].k));
  const ORD = ['todo','prog','review','done'];
  const move = (t, dir) => () => { const ni = ORD.indexOf(t.st) + dir; if (ni < 0 || ni > 3) return; this.setState(x => ({tasks:x.tasks.map(y => y.id === t.id ? Object.assign({}, y, {st:ORD[ni]}) : y)})); if (ORD[ni] === 'done') { this.toast('Task completed · ' + t.t); this.log('check','green',this.av(t.who).first + ' completed a task', t.t); } };
  const PRI = {high:['High','#FBEDEE','#B23A46'], med:['Medium','#FBF1DD','#8A6414'], low:['Low','#F1EEF6','#6E6A7C']};
  V.taskCols = ORD.map(k => { const m = this.tst(k), items = tl.filter(t => t.st === k); return {l:m[0], dot:m[3], n:items.length, empty:items.length === 0, cards:items.map(t => { const a = this.av(t.who), pr = PRI[t.pri]; return {t:t.t, proj:this.proj(t.p).client, who:a.i, whoC:a.c, whoN:a.n, due:t.due, pl:pr[0], pbg:pr[1], pfg:pr[2], canL:k !== 'todo', canR:k !== 'done', left:move(t,-1), right:move(t,1), rl:k === 'review' ? 'Approve' : k === 'prog' ? 'Submit' : 'Start', open:() => t.p && this.go('project',{projectId:t.p})}; })}; });
  V.newTask = () => this.openModal('task');
  const tvw = this.colView(V.taskCols, 'tasks'); V.taskColsV = tvw.view; V.taskTabs = tvw.tabs;

  // Requests
  const rf = s.reqFilter;
  const role = s.role || 'ceo';
  // Who sees which request: see canSeeReq (Management, the GM and the PA all; everyone else their own and
  // the ones waiting for their approval; Finance also what it verifies, pays and reconciles).
  const me0 = this.me().k, vreqs = this.visibleReqs(s), own = r => r.who === me0 || r.by === me0;
  // Staff, Reception, Printing and the departments get "My requests" (their own) — unless a request is
  // waiting for their approval (e.g. as a project's PM): then they get the approvals page to act on it.
  const ownRoles = ['staff','reception','production','clientservice','creative','operations','store'].includes(role);
  const ownOnly = ownRoles && !vreqs.some(r => !own(r) && this.reqWaitingOnMe(r));
  const RF = {mine:own, me:r => (ownOnly ? own(r) && r.st === 'pending' : this.canAct(r) && (role !== 'ceo' || r.step === 4)), all:() => true, approved:r => r.st === 'approved' || r.st === 'paid', rejected:r => r.st === 'rejected'};
  V.reqTabs = [['me','Awaiting me'], ...(ownOnly ? [] : [['mine','My requests']]), ['all','All'],['approved','Approved'],['rejected','Rejected']].map(([k,l]) => ({l:l + ' · ' + vreqs.filter(RF[k]).length, on:() => this.setState({reqFilter:k}), bg:rf === k ? '#2B1459' : 'transparent', c:rf === k ? '#fff' : '#6E6A7C'}));
  const rl = vreqs.filter(RF[rf] || RF.all);
  const sel = rl.find(r => r.id === s.reqSel) || rl[0];
  V.reqList = rl.map(r => Object.assign({id:r.id, name:this.av(r.who).n, amt:this.fmtT(r.amt), cat:this.reqWhat(r), need:'needed ' + r.need, bg:sel && r.id === sel.id ? '#F4F1FA' : '#fff', bd:sel && r.id === sel.id ? '#6D3CC2' : 'transparent', on:() => this.setState({reqSel:r.id, reqFocus:r.id})}, pill(this.rst(r))));
  V.reqEmpty = rl.length === 0; V.hasSel = !!sel;
  // A request opened on purpose (row tap, "Open the request", a notification) is scrolled into view once.
  V.reqFocus = s.reqFocus || null; V.reqFocusDone = () => { if (this.state.reqFocus) this.setState({reqFocus:null}); };
  if (sel) {
    const rp = this.proj(sel.p), ru = rp.bud ? rp.spent / rp.bud : 0, after = rp.bud ? (rp.spent + sel.amt/1e6) / rp.bud : 0;
    const ppl = [0,1,2,3,4,5].map(i => this.approverAt(sel, i));
    const chain = this.CHAIN.map((l,i) => {
      let st = i < sel.step ? 'done' : i === sel.step ? 'cur' : 'todo';
      if (sel.st === 'rejected' && i === sel.step) st = 'rej';
      if (sel.st === 'rejected' && i > sel.step) st = 'todo';
      if (sel.st === 'paid') st = 'done';
      if (sel.log[i] === 'Not needed') st = 'skip';
      const a = this.av(ppl[i]);
      return {l:i === 4 && role === 'ceo' ? 'Management · you' : l, who:a.n, time:st === 'skip' ? 'Not needed for this request' : st === 'done' || st === 'rej' ? (sel.log[i] || '—') : st === 'cur' ? 'Pending' : '', dotBg:st === 'done' ? '#2E9B63' : st === 'rej' ? '#D9535F' : st === 'cur' ? '#FBF6EA' : '#fff', dotBd:st === 'done' ? '#2E9B63' : st === 'rej' ? '#D9535F' : st === 'cur' ? '#B49A5A' : '#D5CFE0', icon:st === 'done' ? IC.check : st === 'rej' ? IC.x : '', lineC:st === 'done' || st === 'skip' ? '#2E9B63' : '#E8E4EF', lc:st === 'cur' ? '#8A6414' : st === 'todo' || st === 'skip' ? '#6E6A7C' : '#17152A', notLast:i !== 5};
    });
    V.R = Object.assign({id:sel.id, cat:(this.REQ_TYPES[sel.type || 'project'] || {}).l + (sel.title ? ' · ' + sel.title : sel.type && sel.type !== 'project' ? '' : ' · ' + sel.cat), amt:this.fmtT(sel.amt), purpose:sel.purpose, items:this.reqItemsView(sel), proj:sel.p ? rp.id + ' · ' + rp.name : 'Not for a project', projGo:e => { if (e && e.preventDefault) e.preventDefault(); if (rp.id) this.go('project',{projectId:rp.id}); }, who:this.av(sel.who).n, need:sel.need, details:[['Type', (this.REQ_TYPES[sel.type || 'project'] || {}).l || ''], ['Category', sel.cat || ''], ['Title', sel.title || ''], ['Needed by', sel.need || ''], ['From the office float', sel.alloc ? String(sel.alloc).replace(/^office:/, '') : ''], ['Submitted', (sel.log || [])[0] ? (sel.at || '') + ' ' + sel.log[0] : ''], ['Changed', sel.resubmitted ? 'Resubmitted ' + sel.resubmitted : '']].filter(d => d[1] && String(d[1]).trim()), waWho:sel.who !== this.me().k ? () => this.waOpen(sel.who, 'Habari ' + this.av(sel.who).first + ', about your request ' + sel.id + ' (' + this.fmtT(sel.amt) + '): ') : null, mine:sel.who === this.me().k, canEdit:sel.who === this.me().k && sel.st === 'pending' && this.reqUntouched(sel), curAmt:sel.amt, curItems:this.reqEditItems(sel), curPurpose:sel.purpose || '', curTitle:sel.title || '', canFix:sel.who === this.me().k && ['pending','rejected'].includes(sel.st), infoAsked:sel.info === 'asked', curPay:sel.pay || {}, fix:f => this.fixReq(sel.id, f), payOpts:['M-Pesa','Tigo Pesa','Airtel Money','HaloPesa','Bank','Cash'], payTo:sel.pay ? [sel.pay.by, sel.pay.bank, sel.pay.name, sel.pay.no].filter(Boolean).join(' · ') : '', chain,
      budFrom:Math.round(ru*100) + '%', budTo:Math.round(after*100) + '%', w1:Math.min(100, ru*100) + '%', w2:Math.max(0, Math.min(100, after*100) - Math.min(100, ru*100)) + '%', budLine:this.fmtM(rp.bud || 0) + ' project budget',
      canDecide:this.canAct(sel), approveL:sel.step === 3 && role === 'finance' ? 'Verify' : 'Approve', canPay:sel.st === 'approved' && this.canPay(), viewOnly:this.reqViewOnly(sel), remindTo:this.canRemindReq(sel) ? this.av(this.reqWaitingFor(sel)).first : '', remind:wa => this.remindReq(sel.id, wa), lastReminder:(sel.reminders || []).length ? 'Reminded ' + this.av(sel.reminders[sel.reminders.length - 1].to).first + ' · ' + sel.reminders[sel.reminders.length - 1].at + ' · ' + this.av(sel.reminders[sel.reminders.length - 1].by).first : '', waiting:sel.st === 'pending' && sel.step < 4 && (!this.canAct(sel) || role === 'ceo') && !this.reqViewOnly(sel), waitLabel:sel.step < this.CHAIN.length ? 'Waiting for ' + this.CHAIN[sel.step] + ' · ' + this.av(ppl[sel.step]).n : '', isPaid:sel.st === 'paid', isRej:sel.st === 'rejected',
      approve:() => this.decide(sel, true), reject:() => { if (this.confirm('Reject ' + sel.id + ' (' + this.fmtT(sel.amt) + ')? ' + this.av(sel.who).first + ' will be notified.')) this.decide(sel, false); }, pay:() => this.setState({paySheet:sel.id}), feeN:sel.st === 'paid' ? (sel.payFee || 0) : null, setFee:sel.st === 'paid' && this.canFloat && this.canFloat() ? v => this.setCharges('request', sel.id, v) : null, payMethods:['Cash','M-Pesa','Tigo Pesa','Airtel Money','Bank'], payVia:s.payViaFor === sel.id ? s.payVia : (sel.pay && ['Cash','M-Pesa','Tigo Pesa','Airtel Money','Bank'].includes(sel.pay.by) ? sel.pay.by : sel.pay && sel.pay.by ? (sel.pay.bank || /bank/i.test(sel.pay.by) ? 'Bank' : 'M-Pesa') : 'Cash'), setPayVia:k => this.setState({payVia:k, payViaFor:sel.id}), payDate:s.payDateFor === sel.id && s.payDate ? s.payDate : this.fToday(), payDateMin:this.floatMinDay(), payDateMax:this.fToday(), setPayDate:e => this.setState({payDate:e.target.value, payDateFor:sel.id}), floatLeft:this.fl().grants.length ? this.floatBalance() : null, payAmt:s.payAmtFor === sel.id ? s.payAmt : String(sel.amt), setPayAmt:e => this.setState({payAmt:e.target.value, payAmtFor:sel.id}), payFee:s.payFeeFor === sel.id ? s.payFee : '', setPayFee:e => this.setState({payFee:e.target.value, payFeeFor:sel.id}), paidLine:sel.st === 'paid' ? 'Paid ' + this.fmtT(sel.paidAmt || sel.amt) + (sel.paidAmt && sel.paidAmt < sel.amt ? ' of ' + this.fmtT(sel.amt) : '') + (sel.payFee ? ' · charges ' + this.fmtT(sel.payFee) : '') + (sel.paidOn ? ' · ' + sel.paidOn : '') + (sel.paidBy ? ' · ' + this.av(sel.paidBy).n : '') : '',
      ask:() => { let q = ''; try { q = window.prompt('What do you need to know from ' + this.av(sel.who).n + '?', ''); } catch (e) { q = ''; } if (q) this.askReq(sel.id, q); }, thread:(sel.thread || []).map(m => ({who:this.av(m.by).n, t:m.t, at:m.at})), rec:sel.rec ? this.recView(sel) : null,
      whatsapp:() => { const to = this.av(ppl[Math.min(sel.step, 5)]).n, txt = sel.id + ' · ' + this.fmtT(sel.amt) + ' · ' + sel.cat + '\n' + sel.purpose + '\nFrom ' + this.av(sel.who).n + ' · ' + rp.name + '\nWaiting for ' + to + '. Please open Trinity Mark 360 to approve.'; try { window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank', 'noopener'); } catch (e) { /* pop-up blocked */ } },
      nudge:() => { const to = ppl[Math.min(sel.step, 5)]; this.remind(to, sel.id + ' is waiting for your approval', 'request:' + sel.id, 'banknote', this.av(sel.who).n + ' · ' + this.fmtT(sel.amt)); this.toast('Reminder sent to ' + this.av(to).n); }
    }, pill(this.rst(sel)));
  } else V.R = {chain:[]};
  // Float exposure = money paid out to staff on requests that is not yet backed by accepted receipts.
  // It is built from the paid requests themselves, so every shilling shows what it was for.
  const today0 = this.today(), daysSince = k => { if (!k) return 0; const [y, m, d] = k.split('-').map(Number); return Math.max(0, Math.round((new Date(today0.slice(0,4), +today0.slice(5,7) - 1, +today0.slice(8,10)) - new Date(y, m - 1, d)) / 864e5)); };
  const open = vreqs.filter(r => r.st === 'paid' && !(r.rec && r.rec.st === 'ok'));
  const byWho = {};
  open.forEach(r => { (byWho[r.who] = byWho[r.who] || []).push(r); });
  const pa = r => r.paidAmt || r.amt, total = open.reduce((a, r) => a + pa(r), 0), toCheck = open.filter(r => r.rec && r.rec.st === 'submitted'), late = open.filter(r => (!r.rec || r.rec.st === 'back') && daysSince(r.paidOn) > this.accountDays());
  const weekAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); })();
  const paidWeek = vreqs.filter(r => r.st === 'paid' && (r.paidOn || '') >= weekAgo);
  V.floatDef = 'Not yet accounted for is money Finance has paid out to staff for requests that is not yet backed by receipts. It closes when the person accounts for it (what they spent, the receipts and the change) and Finance accepts.';
  V.floatKpis = [{l:'Not yet accounted for', v:this.fmtT(total), n:open.length + ' paid requests · ' + Object.keys(byWho).length + ' people', dark:true}, {l:'Receipts to check', v:String(toCheck.length), n:this.fmtT(toCheck.reduce((a,b) => a + pa(b), 0)) + ' submitted'}, {l:'No receipts after 3 days', v:String(late.length), n:late.length ? this.fmtT(late.reduce((a,b) => a + pa(b), 0)) : 'All on time', red:late.length > 0}, {l:'Paid this week', v:this.fmtT(paidWeek.reduce((a,b) => a + pa(b), 0)), n:paidWeek.length + ' requests'}].map(k => Object.assign(k, {bg:k.dark ? '#2B1459' : '#fff', lc:k.dark ? '#E2CE98' : '#6E6A7C', vc:k.dark ? '#fff' : k.red ? '#B23A46' : '#17152A', nc:k.dark ? 'rgba(255,255,255,.7)' : '#6E6A7C', bd:k.dark ? '#2B1459' : '#E8E4EF'}));
  V.floats = Object.keys(byWho).map(k => {
    const a = this.av(k), list = byWho[k], amt = list.reduce((x, r) => x + pa(r), 0), oldest = Math.max(...list.map(r => daysSince(r.paidOn))), sub = list.filter(r => r.rec && r.rec.st === 'submitted'), isLate = list.some(r => !r.rec && daysSince(r.paidOn) > 3);
    const p = (s.staff || []).find(x => x.k === k) || {};
    return {n:a.n, i:a.i, c:a.c, ph:a.ph, role:p.role || '', amt:this.fmtT(amt), age:oldest ? oldest + (oldest === 1 ? ' day' : ' days') : 'today',
      items:list.map(r => ({id:r.id, what:this.reqWhat(r), purpose:r.purpose || '', proj:r.p ? this.proj(r.p).client : 'Office', amt:this.fmtT(pa(r)), paid:r.paidOn || '', rec:r.rec ? (r.rec.st === 'submitted' ? 'Receipts submitted · spent ' + this.fmtT(r.rec.spent) : r.rec.st === 'back' ? 'Sent back · ' + (r.rec.backNote || '') : '') : 'No receipts yet', open:() => this.setState({reqSel:r.id, reqFilter:'all'})})),
      stl:sub.length ? 'Receipts to check' : isLate ? 'Receipts overdue' : 'In use', stbg:sub.length ? '#E9EFFA' : isLate ? '#FBEDEE' : '#EFE8FA', stfg:sub.length ? '#3559A8' : isLate ? '#B23A46' : '#5A2FA8',
      recLabel:sub.length ? 'Accept receipts' : 'Ask for receipts',
      rec:() => { if (sub.length) { const errs = sub.map(r => this.confirmRec(r.id)).filter(Boolean); if (errs.length) this.toast(errs[0]); } else { this.remind(k, 'Please account for the money you received: ' + this.fmtT(amt), 'requests', 'receipt', list.map(r => r.id).join(', ') + ' · add what you spent and the receipt'); this.toast('Receipt reminder sent to ' + a.n); } }};
  }).sort((x, y) => (y.stl === 'Receipts overdue') - (x.stl === 'Receipts overdue'));
  V.floatsEmpty = V.floats.length === 0;
  V.newReq = () => this.openModal('req');
  // Floats and money totals are for Finance and Management only.
  V.showFloats = ['ceo','finance'].includes(role);
  if (!V.showFloats) { V.floatKpis = []; V.floats = []; V.floatsEmpty = false; }
  // Everyone else gets "My requests": what they asked for, where it is, and what happened.
  // Only their own: a head of department does not see their team's money requests (privacy).
  if (ownOnly) {
    const me = me0, mgr = false, scope = 'mine';
    const list = vreqs.filter(own);
    const row = r => {
      const steps = this.CHAIN.map((l, i) => ({ l: i === 0 ? 'Sent' : i === 5 ? 'Paid' : l, skip:r.log[i] === 'Not needed', done:r.st === 'paid' || i < r.step || (r.st === 'approved' && i < 5), cur:r.st === 'pending' && i === r.step, rej:r.st === 'rejected' && i === r.step, at:r.log[i] && r.log[i] !== 'Not needed' ? r.log[i] : '' })).filter((x, i) => !x.skip && (i !== 1 || !!r.log[1]));
      const P = this.proj(r.p);
      return {id:r.id, what:this.reqWhat(r), purpose:r.purpose || '', items:this.reqItemsView(r), amt:this.fmtT(r.amt), who:this.av(r.who).n, mine:r.who === me, where:r.p ? P.client + ' · ' + P.name : 'Office', need:r.need || '',
        status:this.moneyStatus(r), tone:this.reqTone(r), open:r.st === 'pending' || r.st === 'approved', steps, note:r.st === 'rejected' ? (r.reason || r.log[r.step] || '') : '',
        sel:s.reqSel === r.id, toggle:() => this.setState({reqSel:s.reqSel === r.id ? null : r.id, reqFocus:s.reqSel === r.id ? null : r.id}), thread:(r.thread || []).map(m => ({who:this.av(m.by).n, t:m.t, at:m.at, mine:m.by === me})), asked:r.info === 'asked' && r.who === me, answer:t => this.answerReq(r.id, t), canEdit:r.who === me && r.st === 'pending' && this.reqUntouched(r), curAmt:r.amt, curItems:this.reqEditItems(r), curPurpose:r.purpose || '', curTitle:r.title || '', canFix:r.who === me && ['pending','rejected'].includes(r.st), isRej:r.st === 'rejected', infoAsked:r.info === 'asked', curPay:r.pay || {}, fix:f => this.fixReq(r.id, f), payOpts:['M-Pesa','Tigo Pesa','Airtel Money','HaloPesa','Bank','Cash'], payTo:r.pay ? [r.pay.by, r.pay.bank, r.pay.name, r.pay.no].filter(Boolean).join(' · ') : '', canRec:r.st === 'paid' && r.who === me && (!r.rec || r.rec.st === 'back'), reconcile:(a, f) => this.reconcileReq(r.id, a, f), account:r.st === 'paid' ? this.accountInfo(r) : null, rec:r.rec && r.rec.st !== 'back' ? {spent:this.fmtT(r.rec.spent), back:this.fmtT(r.rec.back), st:r.rec.st === 'ok' ? 'Receipts accepted' : 'Receipts with Finance', over:r.rec.over > 0 ? this.fmtT(r.rec.over) : ''} : null,
        nudge:r.st === 'pending' && r.who === me ? () => { const to = this.approverAt(r, r.step); this.remind(to, r.id + ' is waiting for your approval', 'request:' + r.id, 'banknote', this.av(r.who).n + ' · ' + this.fmtT(r.amt)); this.toast('Reminder sent to ' + this.av(to).n); } : null,
        wa:r.st === 'pending' && r.who === me ? () => { const to = this.approverAt(r, r.step); this.waOpen(to, 'Habari ' + this.av(to).first + ', ' + r.id + ' (' + this.fmtT(r.amt) + ', ' + this.reqWhat(r) + ') is waiting for your approval in Trinity Mark 360.'); } : null};
    };
    // Paid requests the person still has to account for come first, under "To do"; only accepted ones are finished.
    const toAccount = r => r.st === 'paid' && r.who === me && (!r.rec || r.rec.st === 'back');
    V.MR = {todo:list.filter(toAccount).map(row), open:list.filter(r => r.st === 'pending' || r.st === 'approved' || (r.st === 'paid' && !toAccount(r) && !(r.rec && r.rec.st === 'ok'))).map(row), done:list.filter(r => r.st === 'rejected' || (r.st === 'paid' && !toAccount(r) && r.rec && r.rec.st === 'ok')).map(row),
      focus:s.reqFocus || null, focusDone:() => { if (this.state.reqFocus) this.setState({reqFocus:null}); },
      mgr, scope, deptL:'', setScope:k => this.setState({myReqScope:k, reqSel:null}), newReq:() => this.openModal('req')};
  }
  return Object.assign(V, this.pageVals2(s, IC, ST, narrow));
}
