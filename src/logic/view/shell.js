// Ported from the Claude Design file (design/project/Trinity Mark 360 App.dc.html).
// Values for the app shell, login, navigation and the dashboard.
export function renderVals() {
  const s = this.state, IC = this.IC, ST = this.ST;
  const narrow = s.w < 960, wide = s.w >= 1240;
  const unread = this.myNotes(s).filter(n => !n.read).length;
  const myReq = s.reqs.filter(r => r.st === 'pending' && r.step === 4);
  const navPage = s.page === 'project' ? 'projects' : s.page;
  const role = s.role || 'ceo', R = this.ROLES[role];
  const lowN = s.stock.filter(i => i.q < i.min).length, finQ = s.reqs.filter(q => q.st === 'pending' && q.step === 3).length, myOpen = s.tasks.filter(t => t.who === R.k && t.st !== 'done').length;
  const G = this.navGroups(role);
  const nav = G.map(([t, items]) => ({t, items:items.map(([k,l,ic,b,ex]) => { const a = k === navPage; return {l, ic:IC[ic], go:() => this.go(k, ex), bg:a ? 'rgba(255,255,255,.11)' : 'transparent', c:a ? '#fff' : 'rgba(255,255,255,.7)', icc:a ? '#E2CE98' : 'rgba(255,255,255,.55)', fw:a ? 700 : 500, b:b || '', hb:!!b}; })}));
  const phone = s.w < 700;
  const flatNav = []; G.forEach(g => g[1].forEach(i => flatNav.push(i)));
  const tabDefs = this.TABS[role] || this.TABS.ceo;
  const BADGE = {notifications:unread, requests:role === 'ceo' ? myReq.length : 0, financeportal:finQ, storekeeper:lowN, tasks:myOpen};
  const curNav = flatNav.find(i => i[0] === navPage);
  const pageTitle = s.page === 'project' ? this.proj(s.projectId).client : curNav ? curNav[1] : 'Trinity Mark 360';
  const moreActive = !!s.more || !tabDefs.some(t => t[0] === navPage);
  const mobileTabs = tabDefs.map(([k,l,ic,_b,ex]) => { const a = k === navPage && !s.more; const b = BADGE[k] || 0; return {l, ic:IC[ic], c:a ? '#2B1459' : '#8A8698', bar:a ? '#6D3CC2' : 'transparent', fw:a ? 800 : 600, b, hb:b > 0, on:() => this.go(k, ex)}; });
  mobileTabs.push({l:'More', ic:IC.grid, c:moreActive ? '#2B1459' : '#8A8698', bar:moreActive ? '#6D3CC2' : 'transparent', fw:moreActive ? 800 : 600, b:0, hb:false, on:() => this.setState({more:!s.more})});
  const moreItems = flatNav.filter(i => !tabDefs.some(t => t[0] === i[0]) && !(phone && i[0] === 'ceomobile')).map(([k,l,ic,b,ex]) => { const a = k === navPage; return {l, ic:IC[ic], b:b || 0, hb:!!b, bg:a ? '#EFE8FA' : '#fff', bd:a ? '#6D3CC2' : '#E8E4EF', on:() => this.go(k, ex)}; });
  const portalChips = Object.keys(this.ROLES).map(k => ({l:this.ROLES[k].label, bg:role === k ? '#2B1459' : '#fff', c:role === k ? '#fff' : '#17152A', bd:role === k ? '#2B1459' : '#E8E4EF', on:() => this.asRole(k)()}));
  const is = {}; ['dashboard','briefing','notifications','crm','finance','projects','project','tasks','procurement','store','requests','staff','field','staffportal','financeportal','reception','storekeeper','rooms','ceomobile','proposals','production','logistics','documents','reports','calendar','settings'].forEach(k => is[k] = s.page === k);
  const hr = new Date().getHours();
  const d = new Date();
  const dateLabel = d.toLocaleDateString('en-GB',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}) + ' · ' + this.now() + ' EAT';

  const active = s.projects.filter(p => p.st !== 'done');
  const cnt = k => s.projects.filter(p => p.st === k).length;
  const unpaid = s.invoices.filter(i => i.st !== 'paid' && i.st !== 'draft'), overdue = s.invoices.filter(i => i.st === 'overdue');
  const mk = (l,v,u,dd,dc,n,ic,go,sp,spc) => { const k = this.spark(sp); return {l,v,u,d:dd,dc,n,ic:IC[ic],go:() => this.go(go),sp:k.l,spf:k.f,spc}; };
  const pend = s.reqs.filter(r => r.st === 'pending').length;
  const kpis = [
    mk('Active projects', active.length, '', '▲ 3', '#1F7549', 'vs last week · ' + (cnt('risk') + cnt('late')) + ' at risk', 'folder', 'projects', [11,12,12,13,14,14,15,active.length], '#6D3CC2'),
    mk('Today\u2019s revenue', '14.2M', 'TZS', '▲ 8%', '#1F7549', 'vs Tue average', 'trendUp', 'finance', [9,12,10,13,11,12,13,14.2], '#2E9B63'),
    mk('Today\u2019s expenses', '6.8M', 'TZS', '▲ 14%', '#B23A46', '· 62% on 2 projects', 'receipt', 'finance', [5,4.6,5.2,5,5.8,5.4,6,6.8], '#B49A5A'),
    mk('Pending approvals', pend, '', myReq.length + ' need you', '#8A6414', '· oldest 26h', 'banknote', 'requests', [6,8,7,9,6,8,10,pend], '#D89B2B'),
    mk('Outstanding invoices', unpaid.reduce((a,b) => a + b.v, 0).toFixed(1) + 'M', 'TZS', overdue.length + ' overdue', '#B23A46', '· ' + this.fmtM(overdue.reduce((a,b) => a + b.v, 0)), 'fileText', 'finance', [150,162,171,168,180,176,190,186], '#D9535F')
  ];
  const C = this.CH[s.range], n = C.labels.length, all = C.rev.concat(C.exp);
  const step = s.range === '12W' ? 25 : 75, mx = Math.ceil(Math.max(...all) * 1.12 / step) * step;
  const X = i => i * 1000 / (n - 1), Y = v => 240 - v / mx * 240;
  const p1 = C.rev.map((v,i) => [X(i), Y(v)]), p2 = C.exp.map((v,i) => [X(i), Y(v)]);
  const l1 = this.smooth(p1), l2 = this.smooth(p2);
  const tr = C.rev.reduce((a,b) => a + b, 0), te = C.exp.reduce((a,b) => a + b, 0);
  const chart = {l1, l2, f1:l1 + ' L1000 240 L0 240 Z', f2:l2 + ' L1000 240 L0 240 Z', labels:C.labels, yl:[mx, mx*.75, mx*.5, mx*.25, 0].map(v => v ? Math.round(v) + 'M' : '0'), cols:C.labels.map((_,i) => ({on:() => this.setState({tip:i})})), totRev:this.fmtM(tr), totExp:this.fmtM(te), net:'+ ' + this.fmtM(tr - te), margin:Math.round((tr-te)/tr*100) + '%'};
  const ti = s.tip;
  const tip = ti >= 0 && ti < n ? {show:true, left:(ti/(n-1)*100) + '%', y1:(Y(C.rev[ti])/240*100) + '%', y2:(Y(C.exp[ti])/240*100) + '%', tx:ti < 2 ? 'translateX(12px)' : ti > n - 3 ? 'translateX(calc(-100% - 12px))' : 'translateX(-50%)', label:C.labels[ti] + (s.range === '12W' ? ' · 2026' : ''), rev:this.fmtM(C.rev[ti]), exp:this.fmtM(C.exp[ti]), net:'+ ' + this.fmtM(C.rev[ti] - C.exp[ti])} : {show:false};
  const rangeBtns = [['12W','12 weeks'],['6M','6 months'],['1Y','Year']].map(([k,l]) => ({l, on:() => this.setState({range:k,tip:-1}), bg:s.range === k ? '#2B1459' : 'transparent', c:s.range === k ? '#fff' : '#6E6A7C'}));
  const CIRC = 2 * Math.PI * 52; let acc = 0;
  const order = ['on','risk','late','done'];
  const segs = order.map(k => { const len = cnt(k) / s.projects.length * CIRC; const seg = {col:ST[k].c, da:Math.max(0, len - 2).toFixed(2) + ' ' + (CIRC - Math.max(0, len - 2)).toFixed(2), off:(-acc).toFixed(2)}; acc += len; return seg; });
  const donut = {segs, total:s.projects.length, legend:order.map(k => ({l:ST[k].l, col:ST[k].c, n:cnt(k), on:() => this.go('projects',{projFilter:k})}))};
  const over = s.projects.filter(p => p.st !== 'done' && p.spent > p.bud);
  const attention = [
    ...over.map(p => ({t:p.client + ' · ' + p.name.split(' · ')[0], s:'Over budget by ' + Math.round((p.spent/p.bud - 1)*100) + '% · PM ' + this.av(p.pm).n, ic:IC.alert, bg:'#FBEDEE', fg:'#B23A46', on:() => this.go('project',{projectId:p.id})})),
    ...s.projects.filter(p => p.st === 'late').map(p => ({t:p.client + ' · ' + p.name, s:'Production behind · due ' + p.due, ic:IC.clock, bg:'#FBF1DD', fg:'#8A6414', on:() => this.go('project',{projectId:p.id})})),
    ...(overdue[0] ? [{t:overdue[0].c + ' · ' + overdue[0].id, s:'Invoice ' + overdue[0].due + ' · ' + this.fmtM(overdue[0].v), ic:IC.fileText, bg:'#FBEDEE', fg:'#B23A46', on:() => this.go('finance')}] : [])
  ].slice(0,3);
  const activity = s.activity.map(e => { const t = this.tone(e.tone); return Object.assign({}, e, {ic:IC[e.ic], bg:t[0], fg:t[1]}); });
  const pipe = [['PM',1],['Ops',2],['Finance',3],['You',4],['Payment',5],['Paid',6]].map(([l,k]) => { const nn = s.reqs.filter(r => r.step === k && r.st !== 'rejected').length; const you = k === 4, paid = k === 6; return {l, n:nn, bg:you ? '#FBF6EA' : paid ? '#E6F4EC' : '#F4F1FA', bd:you ? '#E4CD95' : 'transparent', fg:you ? '#8A6414' : paid ? '#1F7549' : '#2B1459'}; });
  const PS = ['Request','Quotation','Approved','PO issued','Delivered'];
  const procPipe = PS.map((l,i) => ({l, n:s.proc.filter(p => p.s === i).length}));
  const missing = s.staff.filter(p => !p.rep);
  const reports = {sub:s.reportsSub, total:48, w:(s.reportsSub/48*100) + '%', missing:missing.length ? 'Missing: ' + missing.map(p => { const a = this.av(p.k); return a.first + ' ' + a.n.split(' ')[1][0] + '.'; }).join(', ') : 'Everyone has reported'};
  const q = (l, ic, on, primary) => ({l, ic:IC[ic], on, bg:primary ? '#2B1459' : '#fff', c:primary ? '#fff' : '#17152A', bd:primary ? '#2B1459' : '#E8E4EF', icc:primary ? '#E2CE98' : '#6D3CC2'});
  const quick = [q('Create project','folder',() => this.openModal('project'),true), q('Create invoice','fileText',() => this.openModal('invoice')), q('Add task','checkSquare',() => this.openModal('task')), q('Request payment','banknote',() => this.openModal('req')), q('Purchase request','cart',() => this.openModal('proc')), q('New lead','users',() => this.openModal('lead')), q('Create proposal','clipboard',() => this.openModal('proposal')), q('Schedule meeting','calendar',() => this.openModal('meet'))];

  return Object.assign({
    ic:IC, showLogin:!s.auth, showApp:s.auth, email:s.email, pw:s.pw, loginErr:s.loginErr,
    onEmail:e => this.setState({email:e.target.value,loginErr:''}), onPw:e => this.setState({pw:e.target.value,loginErr:''}),
    signIn:() => this.signIn(), signInGoogle:() => this.signInWith('google'), signInMicrosoft:() => this.signInWith('azure'),
    toggleRemember:() => this.setState({remember:!s.remember}), rememberBg:s.remember ? '#6D3CC2' : '#fff', rememberBd:s.remember ? '#6D3CC2' : '#D5CFE0',
    loginKey:e => { if (e.key === 'Enter') this.signIn(); },
    forgot:e => { e.preventDefault(); this.forgotPassword(); },
    signOut:() => this.signOut(),
    resetDemo:() => this.resetDemo(),
    loginNote:s.db ? 'Sign in with your Trinity Mark account' : 'Demo workspace · any password of 4+ characters', dataBadge:s.db ? 'LIVE DATA' : 'DEMO DATA',
    page:s.page, pageKey:s.page + '|' + (s.page === 'project' ? s.projectId : ''), navDir:s.navDir || 'tab', online:s.online !== false, signingIn:!!s.signingIn, db:!!s.db,
    showBack:phone && !this.isTab(s.page), goSettings:() => this.go('settings'), goBack:() => this.goBack(), refresh:() => this.refresh(), haptic:ms => this.haptic(ms), remember:s.remember !== false,
    nav, is, narrow, wide, phone, notPhone:!phone, tabletNav:narrow && !phone, toastBottom:phone ? 'calc(78px + env(safe-area-inset-bottom, 0px))' : '24px', deskDisp:phone ? 'none' : 'block',
    pageTitle, mobileTabs, moreOpen:phone && !!s.more, closeMore:() => this.setState({more:false}), moreItems, portalChips,
    me:(() => { const R = this.ROLES[s.role || 'ceo']; return {i:R.k, n:R.n, t:R.t, c:this.av(R.k).c, label:R.label.toUpperCase(), first:R.n.split(' ')[0]}; })(),
    loginRoles:Object.keys(this.ROLES).map(k => { const on = s.loginRole === k; return {l:this.ROLES[k].label, on:() => this.setState({loginRole:k, email:this.ROLES[k].email, loginErr:''}), bg:on ? '#2B1459' : '#fff', c:on ? '#fff' : '#17152A', bd:on ? '#2B1459' : '#E8E4EF'}; }),
    asCeo:this.asRole('ceo'), asStaff:this.asRole('staff'), asFinance:this.asRole('finance'), asReception:this.asRole('reception'), asStore:this.asRole('store'), asStaffMobile:this.asRole('staff','field'), asCeoMobile:this.asRole(s.role || 'ceo','ceomobile',{mobileRole:s.role || 'ceo'}), showSidebar:!narrow || s.drawer, drawerOpen:narrow && s.drawer, sb:{pos:narrow ? 'fixed' : 'sticky', z:narrow ? 50 : 1},
    openDrawer:() => this.setState({drawer:true}), closeDrawer:() => this.setState({drawer:false}),
    dateLabel, unread, hasUnread:unread > 0, menu:s.menu, toggleMenu:() => this.setState({menu:!s.menu}),
    goHome:() => this.go(this.ROLES[s.role || 'ceo'].home), goField:() => this.go('field'), goStaffPortal:() => this.go('staffportal'), goFinancePortal:() => this.go('financeportal'), goReception:() => this.go('reception'), goStorekeeper:() => this.go('storekeeper'), goNotes:() => this.go('notifications'), goBrief:() => this.go('briefing'), goProjects:e => { e && e.preventDefault && e.preventDefault(); this.go('projects',{projFilter:'all'}); }, goReq:e => { e && e.preventDefault && e.preventDefault(); this.go('requests'); }, goProc:() => this.go('procurement'), goStaff:() => this.go('staff'), goTasks:() => this.go('tasks'),
    openCmd:() => this.setState({cmd:true,cmdQ:''}), openAI:() => this.setState({ai:true,drawer:false,more:false}),
    greeting:hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening',
    kpis, chart, tip, chartLeave:() => this.setState({tip:-1}), rangeBtns, donut, attention, activity, pipe, procPipe, reports, quick
  }, this.pageVals(s, IC, ST, narrow), this.overlayVals(s, IC));
}
