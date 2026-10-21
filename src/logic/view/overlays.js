// Ported from the Claude Design file (design/project/Trinity Mark 360 App.dc.html).
// Values for the form modal, command palette, assistant and toasts.
export function overlayVals(s, IC) {
  const V = {};
  const m = s.modal;
  V.modalOpen = !!m;
  V.M = m ? {title:m.title, sub:m.sub, submit:m.submit} : {};
  V.modalErr = s.modalErr;
  V.modalFields = m ? m.fields.map(f => ({l:f.l, v:s.form[f.k] == null ? '' : s.form[f.k], ph:f.ph || '', type:f.type || 'text', isSel:!!f.opts, isInput:!f.opts, opts:f.opts || [], on:e => this.setState({form:Object.assign({}, s.form, {[f.k]:e.target.value}), modalErr:''})})) : [];
  V.modalClose = () => this.setState({modal:null});
  V.modalSubmit = () => this.submitModal();
  V.modalKey = e => { if (e.key === 'Enter') this.submitModal(); };
  V.stop = e => e.stopPropagation();
  const pg = [['dashboard','Dashboard','grid'],['briefing','Monday Briefing','presentation'],['projects','Projects','folder'],['tasks','Tasks','checkSquare'],['requests','Requests & Floats','banknote'],['finance','Finance','chart'],['store','Store & Inventory','package'],['procurement','Procurement','cart'],['crm','CRM & Sales','users'],['staff','Staff & Reports','user'],['notifications','Notifications','bell'],['field','Field capture app','camera'],['proposals','Sales & Proposals','clipboard'],['production','Production','printer'],['logistics','Logistics','truck'],['documents','Documents','paperclip'],['reports','Reports','pie'],['calendar','Calendar','calendar'],['settings','Settings','settings'],['ceomobile','Mobile apps','phone']];
  const acts = [['Create project','folder','project'],['Add task','checkSquare','task'],['Request money','banknote','req'],['Create invoice','fileText','invoice'],['Purchase request','cart','proc'],['New lead','users','lead'],['Create proposal','clipboard','proposal'],['Schedule meeting','calendar','meet'],['Schedule trip','truck','trip'],['New production job','printer','job']];
  let items = [
    ...acts.map(([l,ic,a]) => ({l, s:'Action', ic:IC[ic], run:() => this.openModal(a)})),
    {l:'Ask Trinity Intelligence', s:'AI assistant', ic:IC.sparkle, run:() => this.setState({cmd:false, ai:true})},
    ...pg.map(([k,l,ic]) => ({l:'Go to ' + l, s:'Page', ic:IC[ic], run:() => this.go(k)})),
    ...s.projects.map(p => ({l:p.client + ' · ' + p.name, s:p.id, ic:IC.folder, run:() => this.go('project',{projectId:p.id})})),
    ...s.stock.map(i => ({l:i.n, s:'Stock · ' + i.q + ' ' + i.u, ic:IC.package, run:() => this.go('store',{stockQ:i.n})}))
  ];
  const q = s.cmdQ.trim().toLowerCase();
  if (q) items = items.filter(i => (i.l + ' ' + i.s).toLowerCase().indexOf(q) >= 0); else items = items.slice(0, 9);
  items = items.slice(0, 10);
  V.cmdOpen = s.cmd; V.cmdQ = s.cmdQ;
  V.cmdItems = items.map((i,idx) => Object.assign({}, i, {bg:idx === 0 ? '#F4F1FA' : 'transparent', on:() => { this.setState({cmd:false}); i.run(); }}));
  V.cmdEmpty = items.length === 0;
  V.onCmdQ = e => this.setState({cmdQ:e.target.value});
  V.cmdKey = e => { if (e.key === 'Enter' && items[0]) { this.setState({cmd:false}); items[0].run(); } };
  V.closeCmd = () => this.setState({cmd:false});
  V.aiOpen = s.ai; V.aiQ = s.aiQ; V.aiBusy = s.aiBusy;
  V.aiMsgs = s.aiMsgs.map(x => ({t:x.t, me:x.r === 'me', ai:x.r === 'ai'}));
  V.onAiQ = e => this.setState({aiQ:e.target.value});
  V.aiKey = e => { if (e.key === 'Enter') this.askAI(); };
  V.aiSend = () => this.askAI();
  V.aiSugs = ['Which projects are over budget?','What needs my approval?','Which stock is low?','Who has open floats?','Overdue invoices'].map(t => ({t, on:() => this.askAI(t)}));
  V.closeAI = () => this.setState({ai:false});
  V.aiScroll = el => { if (el) el.scrollTop = el.scrollHeight; };
  V.toasts = s.toasts;
  return V;
}
