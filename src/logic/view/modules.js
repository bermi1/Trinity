// Ported from the Claude Design file (design/project/Trinity Mark 360 App.dc.html).
// Values for finance, store, procurement, CRM, staff, portals, mobile and the remaining modules.
export function pageVals2(s, IC, ST, narrow) {
  const V = {};
  const hr = new Date().getHours();
  // Finance
  const Y = this.CH['1Y'], tr = Y.rev.reduce((a,b) => a + b, 0), te = Y.exp.reduce((a,b) => a + b, 0);
  const unpaid = s.invoices.filter(i => i.st === 'sent' || i.st === 'overdue');
  V.finKpis = [['Revenue · 12 months','TZS ' + (tr/1000).toFixed(2) + 'B','▲ 18% vs prior year','#1F7549'],['Expenses · 12 months','TZS ' + (te/1000).toFixed(2) + 'B','▲ 11% vs prior year','#8A6414'],['Net profit','TZS ' + ((tr-te)/1000).toFixed(2) + 'B',Math.round((tr-te)/tr*100) + '% margin','#1F7549'],['Receivables',this.fmtM(unpaid.reduce((a,b) => a + b.v, 0)),s.invoices.filter(i => i.st === 'overdue').length + ' overdue','#B23A46']].map(([l,v,n,c]) => ({l,v,n,c}));
  const nets = Y.rev.map((r,i) => r - Y.exp[i]), nm = Math.max(...nets);
  V.netBars = nets.map((v,i) => ({l:Y.labels[i], v:v + 'M', h:(v/nm*100) + '%', c:i === nets.length - 1 ? '#B49A5A' : '#6D3CC2'}));
  const lateDays = i => { const m = /(\d+) days late/.exec(i.due); return m ? +m[1] : 0; };
  const B = [['Not yet due',i => i.st === 'sent','#6D3CC2'],['1–15 days late',i => i.st === 'overdue' && lateDays(i) <= 15,'#D89B2B'],['16–30 days late',i => i.st === 'overdue' && lateDays(i) > 15 && lateDays(i) <= 30,'#D9535F'],['30+ days late',i => i.st === 'overdue' && lateDays(i) > 30,'#8E2A35']];
  const bv = B.map(([l,f,c]) => ({l, c, v:s.invoices.filter(f).reduce((a,b) => a + b.v, 0)})), bm = Math.max(1, ...bv.map(b => b.v));
  V.aging = bv.map(b => ({l:b.l, c:b.c, v:this.fmtM(b.v), w:(b.v/bm*100) + '%'}));
  const EC = [['Production',38,'#2B1459'],['Field & logistics',22,'#6D3CC2'],['Procurement',18,'#B49A5A'],['Payroll',15,'#4C78D0'],['Admin & other',7,'#A9A3B8']];
  V.expCats = EC.map(([l,p,c]) => ({l, p:p + '%', w:p + '%', c, v:this.fmtM(p * 172 / 100)}));
  const IS = {paid:['Paid','#E6F4EC','#1F7549'], sent:['Sent','#E9EFFA','#3559A8'], overdue:['Overdue','#FBEDEE','#B23A46'], draft:['Draft','#F1EEF6','#6E6A7C']};
  V.invRows = s.invoices.map(i => ({id:i.id, c:i.c, proj:this.proj(i.p).name, v:this.fmtM(i.v), due:i.due, stl:IS[i.st][0], stbg:IS[i.st][1], stfg:IS[i.st][2], canPay:i.st === 'sent' || i.st === 'overdue', canSend:i.st === 'draft',
    pay:() => { this.setState(x => ({invoices:x.invoices.map(y => y.id === i.id ? Object.assign({}, y, {st:'paid', due:'Paid today'}) : y)})); this.toast(i.id + ' marked paid · ' + this.fmtM(i.v) + ' received'); this.log('trendUp','green','Payment received · ' + i.c, i.id + ' · ' + this.fmtM(i.v)); },
    send:() => { this.setState(x => ({invoices:x.invoices.map(y => y.id === i.id ? Object.assign({}, y, {st:'sent', due:y.due === '—' ? '30 days' : y.due}) : y)})); this.toast(i.id + ' sent to ' + i.c); }}));
  V.newInvoice = () => this.openModal('invoice');
  // Store
  const sq = s.stockQ.toLowerCase();
  const low = s.stock.filter(i => i.q < i.min);
  V.stockQ = s.stockQ; V.onStockQ = e => this.setState({stockQ:e.target.value});
  V.stockKpis = [['Items tracked', String(s.stock.length), 'across 6 categories'], ['Below minimum', String(low.length), 'reorder recommended'], ['Stock value', this.fmtM(s.stock.reduce((a,b) => a + b.q * b.cost, 0) / 1e6), 'at cost'], ['Issued this week', '46', 'to 7 projects']].map(([l,v,n],i) => ({l,v,n,vc:i === 1 && low.length ? '#B23A46' : '#17152A'}));
  V.stockRows = s.stock.filter(i => !sq || (i.n + i.sku + i.cat).toLowerCase().indexOf(sq) >= 0).map(i => { const r = i.q / (i.min * 2), lo = i.q < i.min; return {sku:i.sku, n:i.n, cat:i.cat, q:i.q + ' ' + i.u, min:i.min + ' ' + i.u, loc:i.loc, w:Math.min(100, r*100) + '%', c:lo ? '#D9535F' : r < .75 ? '#D89B2B' : '#2E9B63', low:lo, stl:lo ? 'Low' : 'OK', stbg:lo ? '#FBEDEE' : '#E6F4EC', stfg:lo ? '#B23A46' : '#1F7549',
    issue:() => this.openModal('issue',{sku:i.sku, n:i.n, u:i.u, _meta:{sub:i.n + ' · ' + i.q + ' ' + i.u + ' in store'}}),
    receive:() => this.openModal('receive',{sku:i.sku, n:i.n, u:i.u, _meta:{sub:i.n + ' · ' + i.q + ' ' + i.u + ' in store'}}),
    reorder:() => { const id = 'PR-0' + (213 + s.proc.length - 7); this.setState(x => ({proc:[{id, t:i.n + ' × ' + (i.min * 2 - i.q), p:'', v:+((i.min * 2 - i.q) * i.cost / 1e6).toFixed(2), s:0, sup:'—'}, ...x.proc]})); this.toast('Purchase request ' + id + ' created for ' + i.n); }}; });
  V.stockEmpty = V.stockRows.length === 0;
  // Procurement
  const PS = ['Request','Quotation','Approved','PO issued','Delivered'], RL = ['Get quotes','Approve','Issue PO','Mark delivered'];
  V.procCols = PS.map((l,k) => { const items = s.proc.filter(p => p.s === k); return {l, n:items.length, tot:this.fmtM(items.reduce((a,b) => a + b.v, 0)), empty:!items.length, cards:items.map(p => ({id:p.id, t:p.t, proj:p.p ? this.proj(p.p).client : 'Store stock', v:this.fmtM(p.v), sup:p.sup, canR:k < 4, rl:RL[k], done:k === 4,
    right:() => { const sup = p.sup === '—' && k === 0 ? 'Chapa Supplies' : p.sup; this.setState(x => ({proc:x.proc.map(y => y.id === p.id ? Object.assign({}, y, {s:k + 1, sup}) : y)})); this.toast(k === 3 ? p.id + ' delivered · received into store' : p.id + ' → ' + PS[k + 1]); if (k === 3) this.log('truck','green','Delivery received · ' + p.t, p.id + ' · ' + sup); }}))}; });
  V.newProc = () => this.openModal('proc');
  const pvw = this.colView(V.procCols, 'proc'); V.procColsV = pvw.view; V.procTabs = pvw.tabs;
  // CRM
  const LS = ['Lead','Qualified','Proposal','Negotiation','Won'], PR = [.1,.25,.5,.75,1];
  V.leadCols = LS.map((l,k) => { const items = s.leads.filter(x => x.s === k); return {l, n:items.length, tot:this.fmtM(items.reduce((a,b) => a + b.v, 0)), won:k === 4, empty:!items.length, cards:items.map(x => ({c:x.c, t:x.t, v:this.fmtM(x.v), src:x.src, canR:k < 4, rl:k === 3 ? 'Mark won' : 'Advance',
    right:() => { this.setState(y => ({leads:y.leads.map(z => z.id === x.id ? Object.assign({}, z, {s:k + 1}) : z)})); if (k === 3) { this.toast('Won · ' + x.c + ' — create the project'); this.log('trendUp','green','Deal won · ' + x.c, x.t + ' · ' + this.fmtM(x.v)); setTimeout(() => this.openModal('project',{client:x.c, name:x.t, val:String(x.v)}), 300); } else this.toast(x.c + ' → ' + LS[k + 1]); }}))}; });
  const open = s.leads.filter(x => x.s < 4);
  V.crmKpis = [['Open pipeline', this.fmtM(open.reduce((a,b) => a + b.v, 0))], ['Weighted forecast', this.fmtM(open.reduce((a,b) => a + b.v * PR[b.s], 0))], ['Won this quarter', this.fmtM(s.leads.filter(x => x.s === 4).reduce((a,b) => a + b.v, 0) + 312)], ['Win rate', '38%']].map(([l,v]) => ({l,v}));
  V.newLead = () => this.openModal('lead');
  const cvw = this.colView(V.leadCols, 'crm'); V.leadColsV = cvw.view; V.leadTabs = cvw.tabs;
  // Staff
  const miss = s.staff.filter(p => !p.rep);
  V.staffSummary = (s.staff.length - miss.length) + ' of ' + s.staff.length + ' shown staff reported yesterday';
  V.hasMissing = miss.length > 0;
  V.remindAll = () => { this.toast('Reminder sent to ' + miss.length + ' staff via SMS & app'); };
  V.staffRows = s.staff.map(p => { const a = this.av(p.k); return {n:a.n, i:a.i, c:a.c, role:p.role, dept:p.dept, tasks:s.tasks.filter(t => t.who === p.k && t.st !== 'done').length + ' open', fl:p.fl ? this.fmtT(p.fl) : '—', stl:p.rep ? 'Submitted' : 'Missing', stbg:p.rep ? '#E6F4EC' : '#FBEDEE', stfg:p.rep ? '#1F7549' : '#B23A46', miss:!p.rep, remind:() => this.toast('Reminder sent to ' + a.n)}; });
  // Notifications
  V.noteRows = s.notes.map(n => ({ic:IC[n.ic] || IC.bell, t:n.t, s:n.s, time:n.time, unread:!n.read, bg:n.read ? '#fff' : '#FBF9FE', fw:n.read ? 500 : 700, on:() => { this.setState(x => ({notes:x.notes.map(y => y.id === n.id ? Object.assign({}, y, {read:true}) : y)})); this.goTarget(n.go); }}));
  V.markAllRead = () => this.setState(x => ({notes:x.notes.map(y => Object.assign({}, y, {read:true}))}));
  // Field app
  const ft = s.fieldTasks, fd = ft.filter(t => t.st === 'done').length;
  V.fDone = fd + ' of ' + ft.length + ' done'; V.fW = (fd / ft.length * 100) + '%';
  V.fTasks = ft.map((t,i) => ({t:t.t, s:t.s, time:t.time, done:t.st === 'done', prog:t.st === 'prog', todo:t.st === 'todo', bd:t.st === 'prog' ? '#6D3CC2' : '#E8E4EF', op:t.st === 'done' ? .6 : 1, td:t.st === 'done' ? 'line-through' : 'none',
    start:() => this.setState(x => ({fieldTasks:x.fieldTasks.map((y,j) => j === i ? Object.assign({}, y, {st:'prog'}) : y)})),
    complete:() => { this.setState(x => ({fieldTasks:x.fieldTasks.map((y,j) => j === i ? Object.assign({}, y, {st:'done'}) : y)})); this.toast('Task completed · synced to office'); this.log('check','green','John M. completed · ' + t.t, t.s); }}));
  V.fTab = {home:s.fieldTab === 'home', req:s.fieldTab === 'req', report:s.fieldTab === 'report'};
  V.fTabs = [['home','Home','home'],['req','Money','banknote'],['report','Report','fileText']].map(([k,l,ic]) => ({l, ic:IC[ic], c:s.fieldTab === k ? '#2B1459' : '#8A8698', bar:s.fieldTab === k ? '#6D3CC2' : 'transparent', on:() => this.setState({fieldTab:k})}));
  const fr = s.fieldReq, setFR = k => e => this.setState({fieldReq:Object.assign({}, s.fieldReq, {[k]:e.target.value})});
  V.fr = fr; V.frAmt = setFR('amt'); V.frPurpose = setFR('purpose'); V.frP = setFR('p'); V.frCat = setFR('cat');
  V.projOpts = s.projects.filter(p => p.st !== 'done').map(p => ({v:p.id, l:p.client + ' · ' + p.name}));
  V.catOpts = ['Transport','Fuel','Materials','Permits','Meals'].map(x => ({v:x, l:x}));
  V.frSubmit = () => { const amt = +fr.amt || 0; if (!amt || !fr.purpose.trim()) { this.toast('Enter an amount and a purpose'); return; } const id = 'REQ-0' + (427 + s.reqs.length); this.setState(x => ({reqs:[{id, who:'JM', amt, cat:fr.cat, purpose:fr.purpose, p:fr.p, need:'Today', step:1, st:'pending', log:[this.now()]}, ...x.reqs], fieldReq:{amt:'', purpose:'', p:fr.p, cat:'Transport'}, fieldTab:'home'})); this.toast(id + ' sent · waiting for Project Manager'); this.log('banknote','amber','John M. requested ' + this.fmtT(amt), this.proj(fr.p).name + ' · ' + id); };
  V.myReqs = s.reqs.filter(r => r.who === 'JM').slice(0,3).map(r => Object.assign({id:r.id, amt:this.fmtT(r.amt), cat:r.cat}, (a => ({stl:a[0], stbg:a[1], stfg:a[2]}))(this.rst(r))));
  V.reportText = s.reportText; V.onReport = e => this.setState({reportText:e.target.value}); V.reportSent = s.reportSent; V.reportOpen = !s.reportSent;
  V.fDoneList = ft.filter(t => t.st === 'done').map(t => ({t:t.t, s:t.s}));
  V.sendReport = () => { this.setState(x => ({reportSent:true, reportsSub:Math.min(48, x.reportsSub + 1)})); this.toast('Daily report submitted'); this.log('fileText','purple','John M. submitted daily report', fd + ' tasks completed'); };
  V.clock = this.now();
  V.goFieldReport = () => this.setState({fieldTab:'report'});

  // Staff portal (Grace Mrema, Field Officer)
  const SPk = 'GM';
  const spTasks = s.tasks.filter(t => t.who === SPk);
  V.SP = {
    greet:(hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening') + ', ' + this.av(SPk).n.split(' ')[0],
    kpis:[{l:'Open tasks', v:String(spTasks.filter(t => t.st !== 'done').length)}, {l:'My requests', v:String(s.reqs.filter(r => r.who === SPk).length)}, {l:'Open float', v:this.fmtT(s.staff.find(p => p.k === SPk).fl)}, {l:'Reports this week', v:'5 / 5'}],
    tasks:spTasks.map(t => ({t:t.t, proj:this.proj(t.p).client, due:t.due, td:t.st === 'done' ? 'line-through' : 'none', chkBg:t.st === 'done' ? '#2E9B63' : '#fff', chkBd:t.st === 'done' ? '#2E9B63' : '#D5CFE0', toggle:() => this.setState(x => ({tasks:x.tasks.map(y => y.id === t.id ? Object.assign({}, y, {st:y.st === 'done' ? 'prog' : 'done'}) : y)}))})),
    tasksEmpty:spTasks.length === 0,
    reqs:s.reqs.filter(r => r.who === SPk).map(r => Object.assign({amt:this.fmtT(r.amt), cat:r.cat}, (a => ({stl:a[0], stbg:a[1], stfg:a[2]}))(this.rst(r)))), reqsEmpty:s.reqs.filter(r => r.who === SPk).length === 0,
    newReq:() => this.openModal('req', {who:SPk}), reportText:s.spReportText || '', onReport:e => this.setState({spReportText:e.target.value}),
    sendReport:() => { if (!(s.spReportText || '').trim()) { this.toast('Write your report first'); return; } this.toast('Report submitted'); this.log('fileText', 'purple', this.av(SPk).n + ' submitted daily report', (s.spReportText || '').slice(0,60)); this.setState({spReportText:'', reportsSub:Math.min(48, s.reportsSub + 1)}); }
  };

  // Finance portal (Rose Temba)
  const fReqs = s.reqs.filter(r => r.st === 'pending' && r.step === 3);
  V.FP = {
    kpis:[{l:'Awaiting verification', v:String(fReqs.length)}, {l:'Overdue invoices', v:String(s.invoices.filter(i => i.st === 'overdue').length), c:'#B23A46'}, {l:'Open floats', v:String(s.staff.filter(p => p.fl > 0).length)}, {l:'Paid this week', v:String(s.reqs.filter(r => r.st === 'paid').length)}],
    reqs:fReqs.map(r => ({who:this.av(r.who).n, amt:this.fmtT(r.amt), cat:r.cat, proj:this.proj(r.p).name, verify:() => { this.setState(x => ({reqs:x.reqs.map(y => y.id === r.id ? Object.assign({}, y, {step:4, log:[...y.log, this.now()]}) : y)})); this.toast(r.id + ' verified · sent to Management'); this.log('check','green','Rose T. verified ' + this.fmtT(r.amt), this.proj(r.p).name + ' · ' + r.id); }})),
    reqsEmpty:fReqs.length === 0,
    overdue:s.invoices.filter(i => i.st === 'overdue').map(i => ({id:i.id, c:i.c, due:i.due, v:this.fmtM(i.v)})), overdueEmpty:s.invoices.filter(i => i.st === 'overdue').length === 0,
    floats:s.staff.filter(p => p.fl > 0).map(p => { const a = this.av(p.k); return {n:a.n, i:a.i, c:a.c, amt:this.fmtT(p.fl), age:({JM:'1 day',GM:'2 days',AJ:'4 days',PL:'12 days'})[p.k] || 'today', rec:() => { this.setState(x => ({staff:x.staff.map(q => q.k === p.k ? Object.assign({}, q, {fl:0}) : q)})); this.toast('Float reconciled · ' + a.n); this.log('receipt','green','Float reconciled · ' + this.fmtT(p.fl), a.n); }}; })
  };

  // Reception / office front portal
  const VS = {in:['On site','#E9EFFA','#3559A8'], out:['Left','#F1EEF6','#6E6A7C'], waiting:['Waiting','#FBF1DD','#8A6414']};
  V.RC = {
    visitors:s.visitors.map(v => Object.assign({name:v.name, co:v.co, purpose:v.purpose, host:this.av(v.host).n, time:v.time, canOut:v.st !== 'out', checkout:() => { this.setState(x => ({visitors:x.visitors.map(y => y.id === v.id ? Object.assign({}, y, {st:'out'}) : y)})); this.toast(v.name + ' checked out'); }}, (a => ({stl:a[0], stbg:a[1], stfg:a[2]}))(VS[v.st]))),
    deliveries:s.deliveries.map(d => ({from:d.from, items:d.items, time:d.time, canArrive:d.st === 'expected', arrived:d.st === 'arrived', arrive:() => { this.setState(x => ({deliveries:x.deliveries.map(y => y.id === d.id ? Object.assign({}, y, {st:'arrived'}) : y)})); this.toast(d.id + ' marked arrived'); this.notify({ic:'truck', t:'Delivery arrived · ' + d.from, s:d.items, go:'reception'}); }}))
  };
  const nv = s.newVisitor;
  V.NV = {name:nv.name, co:nv.co, purpose:nv.purpose, host:nv.host,
    onName:e => this.setState({newVisitor:Object.assign({}, nv, {name:e.target.value})}), onCo:e => this.setState({newVisitor:Object.assign({}, nv, {co:e.target.value})}), onPurpose:e => this.setState({newVisitor:Object.assign({}, nv, {purpose:e.target.value})}), onHost:e => this.setState({newVisitor:Object.assign({}, nv, {host:e.target.value})}),
    add:() => { if (!nv.name.trim()) { this.toast('Enter the visitor\u2019s name'); return; } this.setState(x => ({visitors:[...x.visitors, {id:Date.now(), name:nv.name, co:nv.co || '—', purpose:nv.purpose || '—', host:nv.host, time:this.now(), st:'in'}], newVisitor:{name:'',co:'',purpose:'',host:nv.host}})); this.toast(nv.name + ' checked in'); }
  };

  // Storekeeper portal (Fatma Hassan)
  const skLow = s.stock.filter(i => i.q < i.min);
  V.SK = {
    kpis:[{l:'Below minimum', v:String(skLow.length), c:skLow.length ? '#B23A46' : '#17152A'}, {l:'To receive', v:String(s.deliveries.filter(d => d.st === 'expected' || d.st === 'arrived').length)}, {l:'Items tracked', v:String(s.stock.length)}, {l:'Issued this week', v:'46'}],
    low:skLow.map(i => ({n:i.n, sku:i.sku, loc:i.loc, q:i.q + ' ' + i.u, min:i.min + ' ' + i.u, reorder:() => { const id = 'PR-0' + (213 + s.proc.length - 7); this.setState(x => ({proc:[{id, t:i.n + ' × ' + (i.min * 2 - i.q), p:'', v:+((i.min * 2 - i.q) * i.cost / 1e6).toFixed(2), s:0, sup:'—'}, ...x.proc]})); this.toast('Purchase request ' + id + ' created for ' + i.n); }})),
    lowEmpty:skLow.length === 0,
    deliveries:s.deliveries.map(d => ({from:d.from, items:d.items, canReceive:d.st === 'arrived', received:d.st === 'received', receive:() => { this.setState(x => ({deliveries:x.deliveries.map(y => y.id === d.id ? Object.assign({}, y, {st:'received'}) : y)})); this.toast(d.items + ' received into store'); this.log('package','green','Stock received · ' + d.items, 'from ' + d.from); }})),
    quick:s.stock.slice(0,5).map(i => ({n:i.n, q:i.q + ' ' + i.u, issue:() => { this.setState(x => ({stock:x.stock.map(y => y.sku === i.sku ? Object.assign({}, y, {q:Math.max(0, y.q - 1)}) : y)})); this.toast('Issued 1 ' + i.u.replace(/s$/,'') + ' of ' + i.n); }}))
  };
  const me = this.ROLES[s.role || 'ceo'];
  const H = ['08','09','10','11','12','13','14','15','16'];
  V.hours = H.map(x => x + ':00');
  V.roomTitle = s.roomTitle; V.onRoomTitle = e => this.setState({roomTitle:e.target.value});
  V.roomRows = s.rooms.map(rm => ({n:rm.n, cap:rm.cap + ' seats', cells:H.map(hh => { const b = rm.b[hh], mine = b && b[0] === me.k; return {free:!b, booked:!!b, label:b ? b[1] : '', who:b ? this.av(b[0]).first + (mine ? ' · you' : '') : '', bg:!b ? '#fff' : mine ? '#EFE8FA' : '#F4F1FA', bd:!b ? '#E8E4EF' : mine ? '#6D3CC2' : '#E8E4EF',
    on:() => {
      if (!b) { const title = (s.roomTitle || '').trim() || 'Meeting'; this.setState(x => ({rooms:x.rooms.map(y => y.id === rm.id ? Object.assign({}, y, {b:Object.assign({}, y.b, {[hh]:[me.k, title]})}) : y)})); this.toast(rm.n + ' booked · ' + hh + ':00'); this.log('calendar','blue', me.n + ' booked ' + rm.n, hh + ':00 · ' + title); }
      else if (mine) { this.setState(x => ({rooms:x.rooms.map(y => { if (y.id !== rm.id) return y; const nb = Object.assign({}, y.b); delete nb[hh]; return Object.assign({}, y, {b:nb}); })})); this.toast('Booking cancelled · ' + rm.n + ' ' + hh + ':00'); }
      else this.toast('Booked by ' + this.av(b[0]).n + ' · ' + b[1]);
    }}; })}));
  V.roomsFree = s.rooms.reduce((a, rm) => a + H.filter(hh => !rm.b[hh]).length, 0) + ' free slots today';
  const appr = s.reqs.filter(q => q.st === 'pending' && q.step === 4);
  const unreadN = s.notes.filter(n => !n.read).length;
  const rv = this.CH['12W'].rev, sx = i => i * 300 / (rv.length - 1), sy = v => 76 - v / 100 * 70;
  const sl = this.smooth(rv.map((v,i) => [sx(i), sy(v)]));
  V.MM = {
    home:s.mTab === 'home', appr:s.mTab === 'appr', alerts:s.mTab === 'alerts',
    tabs:[['home','Home','home'],['appr','Approvals','banknote'],['alerts','Alerts','bell']].map(([k,l,ic]) => ({l, ic:IC[ic], c:s.mTab === k ? '#2B1459' : '#8A8698', bar:s.mTab === k ? '#6D3CC2' : 'transparent', badge:k === 'appr' ? appr.length : unreadN, hasBadge:(k === 'appr' && appr.length > 0) || (k === 'alerts' && unreadN > 0), on:() => this.setState({mTab:k})})),
    waiting:appr.length + (appr.length === 1 ? ' approval waiting' : ' approvals waiting'),
    kpis:[['Revenue today','TZS 14.2M','▲ 8%','#1F7549'],['Approvals',String(appr.length),this.fmtT(appr.reduce((a,b) => a + b.amt, 0)),'#8A6414'],['Active projects',String(s.projects.filter(p => p.st !== 'done').length),(s.projects.filter(p => p.st === 'risk' || p.st === 'late').length) + ' at risk','#B23A46'],['Overdue',this.fmtM(s.invoices.filter(i => i.st === 'overdue').reduce((a,b) => a + b.v, 0)),s.invoices.filter(i => i.st === 'overdue').length + ' invoices','#B23A46']].map(([l,v,n,c]) => ({l,v,n,c})),
    sl, sf:sl + ' L300 80 L0 80 Z',
    risk:s.projects.filter(p => p.st === 'risk' || p.st === 'late').map(p => ({n:p.client, t:p.name, stl:ST[p.st].l, stbg:ST[p.st].bg, stfg:ST[p.st].fg})),
    approvals:appr.map(q => ({who:this.av(q.who).n, i:q.who, c:this.av(q.who).c, amt:this.fmtT(q.amt), cat:q.cat, proj:this.proj(q.p).name, need:q.need, approve:() => this.decide(q, true), reject:() => this.decide(q, false)})),
    apprEmpty:appr.length === 0,
    notes:s.notes.slice(0,8).map(n => ({ic:IC[n.ic] || IC.bell, t:n.t, s:n.s, time:n.time, unread:!n.read, fw:n.read ? 500 : 700, on:() => this.setState(x => ({notes:x.notes.map(y => y.id === n.id ? Object.assign({}, y, {read:true}) : y)}))}))
  };
  {
    const cp = (cur, key, list) => list.map(([k,l]) => ({l, on:() => this.setState({[key]:k}), bg:cur === k ? '#2B1459' : '#fff', c:cur === k ? '#fff' : '#17152A', bd:cur === k ? '#2B1459' : '#E8E4EF'}));
    // Proposals
    const PPS = ['Draft','Internal review','Approved','Sent','Viewed','Negotiation','Accepted'];
    const PNX = ['Submit for review','Approve','Send to client','Mark viewed','Negotiate','Mark accepted'];
    const pst = p => p.s < 0 ? ['Rejected','#FBEDEE','#B23A46'] : p.s === 6 ? ['Accepted','#E6F4EC','#1F7549'] : p.s >= 3 ? [PPS[p.s],'#E9EFFA','#3559A8'] : [PPS[p.s],'#F1EEF6','#5A2FA8'];
    const pf2 = s.propFilter || 'all';
    V.propChips = cp(pf2, 'propFilter', [['all','All'],['open','In preparation'],['sent','With client'],['won','Accepted'],['lost','Rejected']]);
    const pfl = {all:() => true, open:p => p.s >= 0 && p.s < 3, sent:p => p.s >= 3 && p.s < 6, won:p => p.s === 6, lost:p => p.s < 0};
    const setP = (id, o) => this.setState(x => ({proposals:x.proposals.map(y => y.id === id ? Object.assign({}, y, o) : y)}));
    V.propRows = s.proposals.filter(pfl[pf2]).map(p => { const st = pst(p); return {id:p.id, c:p.c, t:p.t, v:this.fmtM(p.v), own:this.av(p.own).n, valid:p.valid, stl:st[0], stbg:st[1], stfg:st[2],
      steps:PPS.map((_, i) => ({c:p.s < 0 ? (i === 0 ? '#D9535F' : '#F1EEF6') : i <= p.s ? (p.s === 6 ? '#2E9B63' : '#6D3CC2') : '#EDE9F3'})),
      stepLabel:p.s < 0 ? 'Closed · not accepted' : 'Stage ' + (p.s + 1) + ' of 7 · ' + PPS[p.s],
      canAdv:p.s >= 0 && p.s < 6, advL:p.s >= 0 && p.s < 6 ? PNX[p.s] : '', canReject:p.s >= 3 && p.s < 6, canConv:p.s === 6 && !p.conv, conv:!!p.conv,
      adv:() => { setP(p.id, {s:p.s + 1}); this.toast(p.id + ' → ' + PPS[p.s + 1]); if (p.s + 1 === 6) { this.log('trendUp','green','Proposal accepted · ' + p.c, p.t + ' · ' + this.fmtM(p.v)); this.notify({ic:'check',t:'Proposal accepted · ' + p.c,s:p.id + ' · ' + this.fmtM(p.v),go:'proposals'}); } },
      reject:() => { setP(p.id, {s:-1}); this.toast(p.id + ' marked not accepted'); },
      pdf:() => this.toast(p.id + '.pdf generated · ready to email'),
      convert:() => { setP(p.id, {conv:true}); this.openModal('project', {client:p.c, name:p.t, val:String(p.v), pm:p.own}); }}; });
    V.propEmpty = V.propRows.length === 0;
    const pOpen = s.proposals.filter(p => p.s >= 0 && p.s < 6), pWon = s.proposals.filter(p => p.s === 6), pClosed = s.proposals.filter(p => p.s === 6 || p.s < 0);
    V.propKpis = [{l:'Open proposals', v:String(pOpen.length), n:this.fmtM(pOpen.reduce((a,b) => a + b.v, 0)) + ' in play'}, {l:'With client', v:String(s.proposals.filter(p => p.s >= 3 && p.s < 6).length), n:'sent, viewed or negotiating'}, {l:'Accepted', v:String(pWon.length), n:this.fmtM(pWon.reduce((a,b) => a + b.v, 0))}, {l:'Win rate', v:pClosed.length ? Math.round(pWon.length / pClosed.length * 100) + '%' : '—', n:'of closed proposals'}];
    V.newProposal = () => this.openModal('proposal');
    // Production
    const JST = ['Brief','Design','Client approval','Production','Quality check','Packaging','Delivery'];
    const JNX = ['Start design','Send for approval','Approved · produce','Send to QC','Pass QC','Packed · dispatch','Mark delivered'];
    V.jobRows = s.jobs.map(j => { const a = this.av(j.who), done = j.s >= 7; return {id:j.id, t:j.t, client:this.proj(j.p).client, meta:j.qty + ' pcs · ' + j.mat, due:j.due, who:a.i, whoC:a.c, whoN:a.n, cost:this.fmtM(j.cost), waste:j.waste + '% waste', wc:j.waste > 4 ? '#B23A46' : '#6E6A7C',
      steps:JST.map((_, i) => ({c:i < j.s || done ? '#2E9B63' : i === j.s ? '#6D3CC2' : '#EDE9F3'})), stage:done ? 'Delivered' : JST[j.s], stageC:done ? '#1F7549' : '#5A2FA8',
      canAdv:!done, advL:done ? '' : JNX[j.s],
      adv:() => { const nx = j.s + 1; this.setState(x => ({jobs:x.jobs.map(y => y.id === j.id ? Object.assign({}, y, {s:nx}) : y)})); this.toast(j.id + ' → ' + (nx >= 7 ? 'Delivered' : JST[nx])); if (nx === 5) this.log('check','green','QC passed · ' + j.t, this.proj(j.p).client); if (nx >= 7) this.log('truck','green','Production delivered · ' + j.t, this.proj(j.p).client); }}; });
    const jAct = s.jobs.filter(j => j.s < 7);
    V.jobKpis = [{l:'Jobs in progress', v:String(jAct.length), n:'across ' + new Set(jAct.map(j => j.p)).size + ' projects'}, {l:'On the print floor', v:String(s.jobs.filter(j => j.s === 3).length), n:'in production now'}, {l:'Awaiting a decision', v:String(s.jobs.filter(j => j.s === 2 || j.s === 4).length), n:'client approval or QC'}, {l:'Average wastage', v:(s.jobs.reduce((a,b) => a + b.waste, 0) / Math.max(1, s.jobs.length)).toFixed(1) + '%', n:'target under 4%'}];
    V.newJob = () => this.openModal('job');
    // Logistics
    const TRS = ['Scheduled','Dispatched','Arrived','Delivered','Returned'], TNX = ['Dispatch','Mark arrived','Mark delivered','Mark returned'];
    V.tripRows = s.trips.map(t => { const done = t.s >= 4; return {id:t.id, what:t.what, client:this.proj(t.p).client, to:t.to, veh:t.veh + ' · ' + t.drv, date:t.date, steps:TRS.map((_, i) => ({c:i <= t.s ? (done ? '#2E9B63' : '#6D3CC2') : '#EDE9F3'})), stage:TRS[t.s], canAdv:!done, advL:done ? '' : TNX[t.s],
      adv:() => { this.setState(x => ({trips:x.trips.map(y => y.id === t.id ? Object.assign({}, y, {s:y.s + 1}) : y)})); this.toast(t.id + ' → ' + TRS[t.s + 1]); this.log('truck','dark', t.veh + ' · ' + TRS[t.s + 1].toLowerCase(), t.what + ' · ' + t.to); }}; });
    V.vehRows = s.vehicles.map(v => { const on = s.trips.find(t => t.veh === v.reg && t.s >= 1 && t.s <= 2); const st = on ? ['On trip · ' + on.to,'#EFE8FA','#5A2FA8'] : v.svc ? ['Service due ' + v.svc,'#FBF1DD','#8A6414'] : ['Available','#E6F4EC','#1F7549']; return {reg:v.reg, type:v.type, stl:st[0], stbg:st[1], stfg:st[2]}; });
    V.newTrip = () => this.openModal('trip');
    // Documents
    const dq = (s.docQ || '').toLowerCase(), dty = s.docType || 'all';
    V.docChips = cp(dty, 'docType', ['all','Contract','Proposal','Design','Brief','Receipt','Client approval','Purchase','Report'].map(k => [k, k === 'all' ? 'All' : k]));
    V.docQ = s.docQ || ''; V.onDocQ = e => this.setState({docQ:e.target.value});
    V.docRows = s.docs.filter(d => (dty === 'all' || d.type === dty) && (!dq || (d.n + ' ' + d.type + ' ' + this.proj(d.p).client).toLowerCase().indexOf(dq) >= 0)).map(d => { const ext = (d.n.split('.').pop() || 'file').toUpperCase().slice(0,4); return {n:d.n, ext, extBg:ext === 'PDF' ? '#FBEDEE' : '#E9EFFA', extC:ext === 'PDF' ? '#B23A46' : '#3559A8', meta:d.type + ' · ' + (d.p ? this.proj(d.p).client : 'Company') + ' · ' + this.av(d.by).n + ' · ' + d.d, sz:d.sz, open:() => this.toast('Opening ' + d.n + ' (preview)')}; });
    V.docEmpty = V.docRows.length === 0;
    V.newDoc = () => this.openModal('doc');
    // Reports
    const dl = (name, rows) => { try { const csv = rows.map(rw => rw.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\n'); const b = new Blob([csv], {type:'text/csv'}); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove(); this.toast(name + ' downloaded'); } catch (e) { this.toast('The export could not be completed. Please try again.'); } };
    const RPT = [
      ['Weekly management report','Revenue, spend, projects and decisions for the Monday Briefing','presentation','Mon 07:00', () => [['Metric','Value'],['Active projects', s.projects.filter(p => p.st !== 'done').length],['Pending approvals', s.reqs.filter(q => q.st === 'pending').length],['Overdue invoices (TZS M)', s.invoices.filter(i => i.st === 'overdue').reduce((a,b) => a + b.v, 0)],['Staff reports submitted', s.reportsSub + '/48']]],
      ['Project P&L','Budget, spend and progress for every project','folder','Today 08:00', () => [['Project','Client','Status','Contract (M)','Budget (M)','Spent (M)','Progress %']].concat(s.projects.map(p => [p.id + ' ' + p.name, p.client, this.ST[p.st].l, p.val, p.bud, p.spent, p.prog]))],
      ['Receivables & invoices','Every invoice with status and due date','fileText','Today 08:00', () => [['Invoice','Client','Amount (M)','Status','Due']].concat(s.invoices.map(i => [i.id, i.c, i.v, i.st, i.due]))],
      ['Money requests & floats','Every request with its approval status','banknote','Live', () => [['Request','Staff','Amount (TZS)','Category','Project','Status']].concat(s.reqs.map(q => [q.id, this.av(q.who).n, q.amt, q.cat, this.proj(q.p).name, this.rst(q)[0]]))],
      ['Store stock report','Quantities, minimums and bin locations','package','Live', () => [['SKU','Item','Category','Qty','Unit','Minimum','Bin']].concat(s.stock.map(i => [i.sku, i.n, i.cat, i.q, i.u, i.min, i.loc]))],
      ['Staff daily reports','Submissions and open floats by person','user','Yesterday 18:00', () => [['Name','Role','Department','Reported','Open float (TZS)']].concat(s.staff.map(p => [this.av(p.k).n, p.role, p.dept, p.rep ? 'Yes' : 'No', p.fl]))],
      ['Production report','Jobs, stages, cost and wastage','printer','Live', () => [['Job','Client','Stage','Qty','Cost (M)','Waste %']].concat(s.jobs.map(j => [j.id + ' ' + j.t, this.proj(j.p).client, j.s >= 7 ? 'Delivered' : JST[j.s], j.qty, j.cost, j.waste]))]
    ];
    V.repRows = RPT.map(([t, d, ic, last, rows]) => ({t, d, ic:IC[ic], last, csv:() => dl(t.replace(/[^a-z0-9]+/gi,'-').toLowerCase() + '.csv', rows()), pdf:() => this.toast(t + ' · PDF generated and emailed to you (demo)')}));
    // Calendar
    const CK = {meet:['Meeting','#EFE8FA','#5A2FA8'], client:['Client','#FBF1DD','#8A6414'], proj:['Project','#E9EFFA','#3559A8'], log:['Logistics','#E6F4EC','#1F7549'], dead:['Deadline','#FBEDEE','#B23A46'], event:['Event','#2B1459','#FFFFFF']};
    V.calLegend = Object.keys(CK).map(k => ({l:CK[k][0], bg:CK[k][1], c:CK[k][2]}));
    V.calDays = ['Mon 21','Tue 22','Wed 23','Thu 24','Fri 25','Sat 26'].map(d => { const ev = s.events.filter(e => e.d === d).slice().sort((a,b) => a.t < b.t ? -1 : 1); const td = d === 'Tue 22'; return {d:d + (td ? ' · today' : ''), hbg:td ? '#2B1459' : '#FAF9FC', hc:td ? '#fff' : '#17152A', n:ev.length + (ev.length === 1 ? ' item' : ' items'), empty:!ev.length, ev:ev.map(e => { const c = CK[e.k] || CK.meet; return {t:e.t, n:e.n, k:c[0], bg:c[1], c:c[2]}; })}; });
    V.newMeet = () => this.openModal('meet');
    // Settings
    const pr = s.prefs || {};
    V.prefRows = [['push','Push notifications','Approvals, tasks and alerts on your phone'],['email','Email','Daily digest, invoices and approvals'],['sms','SMS','Urgent approvals only'],['digest','Monday Briefing pack','Prepared automatically every Monday 07:00']].map(([k,l,d]) => ({l, d, tbg:pr[k] ? '#6D3CC2' : '#D5CFE0', tx:pr[k] ? '20px' : '2px', toggle:() => { this.setState(x => ({prefs:Object.assign({}, x.prefs, {[k]:!(x.prefs || {})[k]})})); this.toast(l + (pr[k] ? ' turned off' : ' turned on')); }}));
    const MODS = ['Dashboard','Projects','Tasks','Finance','Requests','Store','Procurement','CRM & Sales','Staff & HR','Reports'];
    const PERM = {Management:[2,2,2,2,2,2,2,2,2,2], Finance:[1,1,1,2,2,1,2,1,0,2], Staff:[0,1,2,0,1,0,0,0,0,0], Reception:[0,0,1,0,0,0,0,1,1,0], Store:[0,1,1,0,1,2,2,0,0,1]};
    V.permHead = MODS.map(m => ({m}));
    V.permRows = Object.keys(PERM).map(rl => ({r:rl, cells:PERM[rl].map(v => ({l:v === 2 ? 'Full' : v === 1 ? 'View' : '—', bg:v === 2 ? '#E6F4EC' : v === 1 ? '#EFE8FA' : 'transparent', c:v === 2 ? '#1F7549' : v === 1 ? '#5A2FA8' : '#A9A3B8'}))}));
    V.company = [['Company','Trinity Mark Solutions Ltd'],['Location','Dar es Salaam, Tanzania'],['Currency','TZS · Tanzanian shilling'],['Time zone','Africa/Dar_es_Salaam (EAT)'],['Financial year','January – December'],['Data',s.db ? 'Live · Supabase database' : 'Demo data only']].map(([k,v]) => ({k,v}));
    V.audit = s.activity.slice(0,6).map(e => ({time:e.time, t:e.t, s:e.s}));
    V.meP = {n:me.n, t:me.t, e:me.email, i:me.k, c:this.av(me.k).c, role:me.label};
    // Mobile apps preview
    const mr = this.ROLES[s.mobileRole] ? s.mobileRole : 'ceo';
    let pth = ''; try { pth = location.pathname; } catch (e) {} V.devSrc = (pth || '/') + '?embed=1&role=' + mr;
    V.devTabs = cp(mr, 'mobileRole', Object.keys(this.ROLES).map(k => [k, this.ROLES[k].label]));
    const DI = {ceo:['Management app','Daniel runs the whole company from his phone: approvals, cash, projects at risk and every module one tap away.'], staff:['Staff app','Grace’s day in her pocket: tasks, money requests, daily reports, projects and meetings.'], finance:['Finance app','Rose verifies requests, chases invoices and reconciles floats from anywhere.'], reception:['Reception app','Aisha checks visitors in, logs deliveries and books rooms from a tablet or phone.'], store:['Store app','Fatma issues and receives stock, reorders low items and receives deliveries on the store floor.']};
    const tabsR = this.TABS[mr];
    V.dev = {title:DI[mr][0], d:DI[mr][1], tabs:tabsR.map(t => ({l:t[1]})).concat([{l:'More'}]), more:this.navFor(mr).filter(it => !tabsR.some(t => t[0] === it[0]) && it[0] !== 'ceomobile').map(it => ({l:it[1]}))};
  }
  V.greeting = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  return V;
}
