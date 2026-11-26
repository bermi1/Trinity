// Ported from the Claude Design file (design/project/Trinity Mark 360 App.dc.html).
// Values for the form modal, command palette, assistant and toasts.
export function overlayVals(s, IC) {
  const V = {};
  const m = s.modal;
  V.modalOpen = !!m;
  V.M = m ? {title:m.title, sub:m.sub, submit:m.submit, wide:!!m.wide} : {};
  V.modalErr = s.modalErr;
  // Each field becomes chips, faces, a searchable list, an amount, a file drop or text (see FormFields).
  const setF = k => val => this.setState(x => ({form:Object.assign({}, x.form, {[k]:val}), modalErr:''}));
  const isPerson = v => !!(this.PPL[v] || (this.people || {})[v]);
  V.modalFields = m ? m.fields.filter(f => !f.when || f.when(s.form || {})).map(f => {
    if (f.type === 'file') return {k:f.k, l:f.l, kind:'file', accept:f.accept, hint:f.hint, attached:s.form._file ? (s.form.n || 'File') + ' · ' + this.fmtSize(s.form._file.size) : '', uploading:!!s.form._uploading, on:e => this.attachFile(e.target.files && e.target.files[0])};
    const base = {k:f.k, l:f.l, v:s.form[f.k] == null ? '' : s.form[f.k], ph:f.ph || '', type:f.type || 'text', req:!!f.req, im:f.im, set:setF(f.k)};
    if (f.opts) {
      const people = f.opts.length > 0 && f.opts.every(o => isPerson(o.v));
      if (people) return Object.assign(base, {kind:'people', opts:f.opts.map(o => { const a = this.av(o.v); return {v:o.v, l:o.l, i:a.i, c:a.c, ph:a.ph}; })});
      return Object.assign(base, {kind:f.kind || (f.opts.length <= 6 ? 'chips' : 'pick'), opts:f.opts});
    }
    if (f.type === 'number' && /\(TZS\)/.test(f.l)) return Object.assign(base, {kind:'money'});
    return Object.assign(base, {kind:f.area || /^(purpose|note|message)$/.test(f.k) ? 'area' : 'text'});
  }) : [];
  V.modalClose = () => this.setState({modal:null});
  V.modalSubmit = () => this.submitModal();
  V.modalKey = e => { if (e.key === 'Enter') this.submitModal(); };
  V.stop = e => e.stopPropagation();
  const pg = [['today','My work','checkSquare'],['dashboard','Dashboard','grid'],['briefing','Monday Briefing','presentation'],['projects','Projects','folder'],['requests','Requests & Floats','banknote'],['finance','Finance','chart'],['store','Store & Inventory','package'],['procurement','Procurement','cart'],['clients','Clients & leads','users'],['staff','Staff & Reports','user'],['notifications','Notifications','bell'],['field','Field capture app','camera'],['proposals','Sales & Proposals','clipboard'],['production','Production','printer'],['logistics','Logistics','truck'],['documents','Documents','paperclip'],['reports','Reports','pie'],['calendar','Calendar','calendar'],['settings','Settings','settings'],['ceomobile','Mobile apps','phone']];
  // Actions of parked sections (procurement, logistics, production) are left out.
  const acts = [['Create project','folder','project'],['Add task','checkSquare','task'],['Request money','banknote','req'],['Create invoice','fileText','invoice'],['Purchase request','cart','proc','procurement'],['New lead','users','lead'],['Create proposal','clipboard','proposal'],['Schedule meeting','calendar','meet'],['Schedule trip','truck','trip','logistics'],['New production job','printer','job','production']].filter(a => !a[3] || !this.isOff(a[3]));
  let items = [
    ...acts.map(([l,ic,a]) => ({l, s:'Action', ic:IC[ic], run:() => this.openModal(a)})),
    {l:'Ask Trinity Intelligence', s:'AI assistant', ic:IC.sparkle, run:() => this.setState({cmd:false, ai:true})},
    ...pg.filter(([k]) => !this.isOff(k)).map(([k,l,ic]) => ({l:'Go to ' + l, s:'Page', ic:IC[ic], run:() => this.go(k)})),
    ...s.projects.map(p => ({l:p.client + ' · ' + p.name, s:p.id, ic:IC.folder, run:() => this.go('project',{projectId:p.id})})),
    ...(this.isOff('store') ? [] : s.stock).map(i => ({l:i.n, s:'Stock · ' + i.q + ' ' + i.u, ic:IC.package, run:() => this.go('store',{stockQ:i.n})}))
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
  V.aiMsgs = s.aiMsgs.map((x, i) => ({t:i === 0 && x.t.indexOf('Habari.') === 0 ? x.t.replace('Habari.', 'Habari ' + this.me().n.split(' ')[0] + '.') : x.t, me:x.r === 'me', ai:x.r === 'ai'}));
  V.onAiQ = e => this.setState({aiQ:e.target.value});
  V.aiKey = e => { if (e.key === 'Enter') this.askAI(); };
  V.aiSend = () => this.askAI();
  V.aiSugs = ['Which projects are over budget?','What needs my approval?','Which stock is low?','Who has open floats?','Overdue invoices'].map(t => ({t, on:() => this.askAI(t)}));
  V.closeAI = () => this.setState({ai:false});
  V.aiScroll = el => { if (el) el.scrollTop = el.scrollHeight; };
  V.toasts = s.toasts;
  return V;
}
