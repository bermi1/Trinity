// Ported from the Claude Design file (design/project/Trinity Mark 360 App.dc.html).
// Values for the briefing, projects, tasks and money requests pages.
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
  V.projChips = [['all','All'],['on','On track'],['risk','At risk'],['late','Delayed'],['done','Completed']].map(([k,l]) => ({l:l + ' · ' + (k === 'all' ? s.projects.length : s.projects.filter(p => p.st === k).length), on:() => this.setState({projFilter:k}), bg:pf === k ? '#2B1459' : '#fff', c:pf === k ? '#fff' : '#17152A', bd:pf === k ? '#2B1459' : '#E8E4EF'}));
  V.projRows = s.projects.filter(p => pf === 'all' || p.st === pf).map(p => { const pm = this.av(p.pm), u = p.bud ? p.spent / p.bud : 0; return Object.assign({id:p.id, name:p.name, client:p.client, pmName:pm.n, pmC:pm.c, pmI:pm.i, prog:p.prog + '%', progW:p.prog + '%', progC:ST[p.st].c, used:Math.round(u*100) + '%', usedC:u > 1 ? '#B23A46' : u > .85 ? '#8A6414' : '#17152A', val:this.fmtM(p.val), due:p.due, on:() => this.go('project',{projectId:p.id})}, pill([ST[p.st].l, ST[p.st].bg, ST[p.st].fg])); });
  V.projEmpty = V.projRows.length === 0;
  V.newProject = () => this.openModal('project');

  // Project detail
  const P = this.proj(s.projectId);
  if (P.id) {
    const pm = this.av(P.pm), u = P.bud ? P.spent / P.bud : 0;
    const ptasks = s.tasks.filter(t => t.p === P.id);
    V.P = Object.assign({id:P.id, name:P.name, client:P.client, pmName:pm.n, due:P.due, prog:P.prog + '%', val:this.fmtM(P.val), margin:Math.round((P.val - Math.max(P.bud, P.spent)) / P.val * 100) + '%',
      stageLabel:'Stage ' + P.stage + ' of 15 · ' + this.STAGES[P.stage - 1],
      stages:this.STAGES.map((l,i) => ({l, col:i + 1 < P.stage || P.st === 'done' ? '#2B1459' : i + 1 === P.stage ? '#B49A5A' : '#EDE9F3', c:i + 1 === P.stage ? '#17152A' : '#6E6A7C', fw:i + 1 === P.stage ? 700 : 500})),
      spent:this.fmtM(P.spent), bud:this.fmtM(P.bud), remaining:this.fmtM(Math.max(0, P.bud - P.spent)), over:P.spent > P.bud, overBy:this.fmtM(P.spent - P.bud), spentW:Math.min(100, u*100) + '%', barC:u > 1 ? '#D9535F' : '#2B1459', usedPct:Math.round(u*100) + '% used',
      profit:this.fmtM(P.val - Math.max(P.bud, P.spent)), invoiced:this.fmtM(s.invoices.filter(i => i.p === P.id).reduce((a,b) => a + b.v, 0)),
      tasks:ptasks.map(t => { const a = this.av(t.who), m = this.tst(t.st); return {t:t.t, who:a.n, due:t.due, stl:m[0], stbg:m[1], stfg:m[2], done:t.st === 'done', chkBg:t.st === 'done' ? '#2E9B63' : '#fff', chkBd:t.st === 'done' ? '#2E9B63' : '#D5CFE0', td:t.st === 'done' ? 'line-through' : 'none', toggle:() => this.setState(x => ({tasks:x.tasks.map(y => y.id === t.id ? Object.assign({}, y, {st:y.st === 'done' ? 'prog' : 'done'}) : y)}))}; }),
      tasksEmpty:ptasks.length === 0, openCount:ptasks.filter(t => t.st !== 'done').length + ' open',
      reqs:s.reqs.filter(r => r.p === P.id).map(r => Object.assign({id:r.id, who:this.av(r.who).n, amt:this.fmtT(r.amt), cat:r.cat, on:() => this.go('requests',{reqSel:r.id, reqFilter:'all'})}, pill(this.rst(r)))),
      team:P.team.map(k => this.av(k)), isDone:P.st === 'done', canAdvance:P.st !== 'done',
      advance:() => { const ns = Math.min(15, P.stage + 1); this.setState(x => ({projects:x.projects.map(p => p.id === P.id ? Object.assign({}, p, {stage:ns, prog:Math.max(p.prog, Math.round(ns/15*100)), st:ns === 15 ? 'done' : p.st}) : p)})); this.toast(ns === 15 ? P.name + ' closed' : 'Moved to ' + this.STAGES[ns - 1]); this.log('folder','purple',P.client + ' · moved to ' + this.STAGES[ns - 1], P.name); },
      addTask:() => this.openModal('task',{p:P.id, who:P.pm}), reqMoney:() => this.openModal('req',{p:P.id}), invoice:() => this.openModal('invoice',{p:P.id}),
      back:() => this.go('projects')
    }, pill([ST[P.st].l, ST[P.st].bg, ST[P.st].fg]));
  } else V.P = {stages:[], tasks:[], reqs:[], team:[]};

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
  const RF = {me:r => this.canAct(r) && (role !== 'ceo' || r.step === 4), all:() => true, approved:r => r.st === 'approved' || r.st === 'paid', rejected:r => r.st === 'rejected'};
  V.reqTabs = [['me','Awaiting me'],['all','All'],['approved','Approved'],['rejected','Rejected']].map(([k,l]) => ({l:l + ' · ' + s.reqs.filter(RF[k]).length, on:() => this.setState({reqFilter:k}), bg:rf === k ? '#2B1459' : 'transparent', c:rf === k ? '#fff' : '#6E6A7C'}));
  const rl = s.reqs.filter(RF[rf]);
  const sel = rl.find(r => r.id === s.reqSel) || rl[0];
  V.reqList = rl.map(r => Object.assign({id:r.id, name:this.av(r.who).n, amt:this.fmtT(r.amt), cat:r.cat + ' · ' + this.proj(r.p).name, need:'needed ' + r.need, bg:sel && r.id === sel.id ? '#F4F1FA' : '#fff', bd:sel && r.id === sel.id ? '#6D3CC2' : 'transparent', on:() => this.setState({reqSel:r.id})}, pill(this.rst(r))));
  V.reqEmpty = rl.length === 0; V.hasSel = !!sel;
  if (sel) {
    const rp = this.proj(sel.p), ru = rp.bud ? rp.spent / rp.bud : 0, after = rp.bud ? (rp.spent + sel.amt/1e6) / rp.bud : 0;
    const ppl = [0,1,2,3,4,5].map(i => this.approverAt(sel, i));
    const chain = this.CHAIN.map((l,i) => {
      let st = i < sel.step ? 'done' : i === sel.step ? 'cur' : 'todo';
      if (sel.st === 'rejected' && i === sel.step) st = 'rej';
      if (sel.st === 'rejected' && i > sel.step) st = 'todo';
      if (sel.st === 'paid') st = 'done';
      const a = this.av(ppl[i]);
      return {l:i === 4 && role === 'ceo' ? 'Management · you' : l, who:a.n, time:st === 'done' || st === 'rej' ? (sel.log[i] || '—') : st === 'cur' ? 'Pending' : '', dotBg:st === 'done' ? '#2E9B63' : st === 'rej' ? '#D9535F' : st === 'cur' ? '#FBF6EA' : '#fff', dotBd:st === 'done' ? '#2E9B63' : st === 'rej' ? '#D9535F' : st === 'cur' ? '#B49A5A' : '#D5CFE0', icon:st === 'done' ? IC.check : st === 'rej' ? IC.x : '', lineC:st === 'done' ? '#2E9B63' : '#E8E4EF', lc:st === 'cur' ? '#8A6414' : st === 'todo' ? '#6E6A7C' : '#17152A', notLast:i !== 5};
    });
    V.R = Object.assign({id:sel.id, cat:sel.cat, amt:this.fmtT(sel.amt), purpose:sel.purpose, proj:rp.id + ' · ' + rp.name, projGo:e => { if (e && e.preventDefault) e.preventDefault(); if (rp.id) this.go('project',{projectId:rp.id}); }, who:this.av(sel.who).n, need:sel.need, chain,
      budFrom:Math.round(ru*100) + '%', budTo:Math.round(after*100) + '%', w1:Math.min(100, ru*100) + '%', w2:Math.max(0, Math.min(100, after*100) - Math.min(100, ru*100)) + '%', budLine:this.fmtM(rp.bud || 0) + ' project budget',
      canDecide:this.canAct(sel), canPay:sel.st === 'approved' && this.canPay(), waiting:sel.st === 'pending' && sel.step < 4 && (!this.canAct(sel) || role === 'ceo'), waitLabel:sel.step < this.CHAIN.length ? 'Waiting for ' + this.CHAIN[sel.step] + ' · ' + this.av(ppl[sel.step]).n : '', isPaid:sel.st === 'paid', isRej:sel.st === 'rejected',
      approve:() => this.decide(sel, true), reject:() => { if (this.confirm('Reject ' + sel.id + ' (' + this.fmtT(sel.amt) + ')? ' + this.av(sel.who).first + ' will be notified.')) this.decide(sel, false); }, pay:() => this.payReq(sel),
      ask:() => { this.remind(sel.who, this.me().first + ' needs more information on ' + sel.id, 'requests', 'message', sel.cat + ' · ' + this.fmtT(sel.amt)); this.toast('Question sent to ' + this.av(sel.who).n); },
      nudge:() => { const to = ppl[Math.min(sel.step, 5)]; this.remind(to, sel.id + ' is waiting for your approval', 'requests', 'banknote', this.av(sel.who).n + ' · ' + this.fmtT(sel.amt)); this.toast('Reminder sent to ' + this.av(to).n); }
    }, pill(this.rst(sel)));
  } else V.R = {chain:[]};
  const fl = s.staff.filter(p => p.fl > 0);
  const AGE = {JM:'1 day',GM:'2 days',AJ:'4 days',PL:'12 days'};
  V.floatKpis = [{l:'Float exposure', v:this.fmtT(fl.reduce((a,b) => a + b.fl, 0)), n:'across ' + fl.length + ' staff', dark:true}, {l:'Awaiting you', v:myReqCount(s), n:this.fmtT(s.reqs.filter(r => r.st === 'pending' && r.step === 4).reduce((a,b) => a + b.amt, 0)) + ' requested'}, {l:'Overdue receipts', v:String(fl.filter(p => p.k === 'PL').length), n:'oldest 12 days · Peter L.', red:true}, {l:'Paid this week', v:this.fmtT(s.reqs.filter(r => r.st === 'paid').reduce((a,b) => a + b.amt, 0)), n:s.reqs.filter(r => r.st === 'paid').length + ' requests'}].map(k => Object.assign(k, {bg:k.dark ? '#2B1459' : '#fff', lc:k.dark ? '#E2CE98' : '#6E6A7C', vc:k.dark ? '#fff' : k.red ? '#B23A46' : '#17152A', nc:k.dark ? 'rgba(255,255,255,.7)' : '#6E6A7C', bd:k.dark ? '#2B1459' : '#E8E4EF'}));
  function myReqCount(st) { return String(st.reqs.filter(r => r.st === 'pending' && r.step === 4).length); }
  V.floats = fl.map(p => { const a = this.av(p.k), late = p.k === 'PL'; return {n:a.n, i:a.i, c:a.c, role:p.role, amt:this.fmtT(p.fl), age:AGE[p.k] || 'today', stl:late ? 'Receipts overdue' : 'In use', stbg:late ? '#FBEDEE' : '#EFE8FA', stfg:late ? '#B23A46' : '#5A2FA8', rec:() => { this.setState(x => ({staff:x.staff.map(q => q.k === p.k ? Object.assign({}, q, {fl:0}) : q)})); this.toast('Float reconciled · ' + a.n); this.log('receipt','green','Float reconciled · ' + this.fmtT(p.fl), a.n + ' · receipts verified'); }}; });
  V.floatsEmpty = V.floats.length === 0;
  V.newReq = () => this.openModal('req');
  return Object.assign(V, this.pageVals2(s, IC, ST, narrow));
}
