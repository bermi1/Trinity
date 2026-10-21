// Trinity Mark 360 application logic, ported from the Claude Design file.
// State lives here; the view modules turn it into the flat values the
// components render (see src/logic/view).
import Logic from './Logic';
import { IC, PPL, ROLES, TABS, ST, STAGES, CHAIN, CH } from './constants';
import { seed } from './seed';
import { renderVals } from './view/shell';
import { pageVals } from './view/workflow';
import { pageVals2 } from './view/modules';
import { overlayVals } from './view/overlays';
import { supabase } from '../lib/supabase';
import RecordSync, { applyChange } from './sync';
import { printDocument } from '../lib/print';

const OFFLINE = 'Could not reach the server. Check your connection and try again.';
// Supabase retries network failures indefinitely; give up after a while so people get an answer.
const withTimeout = (promise, ms = 15000) => Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error(OFFLINE)), ms))]);

export default class TrinityApp extends Logic {
  IC = IC;
  PPL = PPL;
  ROLES = ROLES;
  TABS = TABS;
  ST = ST;
  STAGES = STAGES;
  CHAIN = CHAIN;
  CH = CH;
  seed() { return seed(); }

  constructor() {
    super();
    // With a database, the account decides who is signed in, not the browser.
    if (supabase) Object.assign(this.state, {db:true, booting:true, auth:false, email:'', pw:''});
    // "Remember me" off: the sign-in lasts until the browser closes.
    if (!supabase && this.forgetOnClose()) this.state.auth = false;
  }
  forgetOnClose() {
    try { return localStorage.getItem('tm360-forget') === '1' && !sessionStorage.getItem('tm360-live'); } catch (e) { return false; }
  }
  rememberChoice() {
    try {
      sessionStorage.setItem('tm360-live', '1');
      if (this.state.remember) localStorage.removeItem('tm360-forget'); else localStorage.setItem('tm360-forget', '1');
    } catch (e) {}
  }
  signInWith(provider) {
    if (!this.state.db) { this.signIn(); return; }
    supabase.auth.signInWithOAuth({provider, options:{redirectTo:location.origin}}).then(({error}) => {
      if (error) this.setState({loginErr:/not enabled|unsupported provider/i.test(error.message) ? (provider === 'google' ? 'Google' : 'Microsoft') + ' sign-in is not switched on yet. Use your email and password.' : error.message});
    });
  }
  state = (() => { let sv = {}, saved = {}; try { sv = JSON.parse(localStorage.getItem('tm360') || '{}'); saved = JSON.parse(localStorage.getItem('tm360data') || '{}'); } catch (e) {}
    let emb = false, er = null; try { const qp = new URLSearchParams(location.search); emb = qp.get('embed') === '1'; er = qp.get('role'); } catch (e) {}
    if (emb) { const rr = this.ROLES[er] ? er : 'ceo'; sv = {auth:true, role:rr, page:this.ROLES[rr].home, projectId:'PRJ-0231'}; }
    const data = this.seed(); Object.keys(data).forEach(k => { if (saved && saved[k] !== undefined) data[k] = saved[k]; });
    return Object.assign({embed:emb,more:false,colSel:{tasks:1,proc:0,crm:0},mobileRole:sv.role||'ceo',docType:'all',docQ:'',propFilter:'all',prefs:sv.prefs||{push:true,email:true,sms:false,digest:true},auth:!!sv.auth,remember:sv.remember !== false,online:typeof navigator === 'undefined' ? true : navigator.onLine !== false,navDir:'tab',role:sv.role||'ceo',loginRole:sv.role||'ceo',mTab:'home',page:sv.page||'dashboard',projectId:sv.projectId||'PRJ-0231',email:'daniel.k@trinitymark.co.tz',pw:'demo1234',loginErr:'',range:'12W',tip:-1,menu:false,drawer:false,w:typeof window!=='undefined'?window.innerWidth:1440,reqSel:'REQ-0418',reqFilter:'me',taskFilter:'all',projFilter:'all',stockQ:'',leadQ:'',modal:null,form:{},modalErr:'',cmd:false,cmdQ:'',ai:false,aiQ:'',aiBusy:false,aiMsgs:[{r:'ai',t:'Habari. Ask me about projects, money, stock or staff — I read the live Trinity Mark 360 data.'}],toasts:[],fieldTab:'home',newAct:{d:'',a:'',o:'SK',dl:''}}, data); })();

  componentDidMount() {
    this._key = e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); this.setState(s => ({cmd:!s.cmd,cmdQ:''})); }
      if (e.key === 'Escape') this.setState({cmd:false,ai:false,modal:null,menu:false,drawer:false});
    };
    this._rs = () => this.setState({w:window.innerWidth});
    window.addEventListener('keydown', this._key); window.addEventListener('resize', this._rs);
    this._prevData = {}; this.dataKeys().forEach(k => { this._prevData[k] = this.state[k]; });
    if (this.state.db) this.startDb();
    this._pop = e => this.onPopState(e);
    this._net = () => this.setState({online:navigator.onLine});
    window.addEventListener('popstate', this._pop); window.addEventListener('online', this._net); window.addEventListener('offline', this._net);
    if (!this.state.embed) { try { history.replaceState({tm:1, depth:0, page:this.state.page, projectId:this.state.projectId}, ''); } catch (e) {} }
    try {
      const target = new URLSearchParams(location.search).get('go');
      if (target) {
        history.replaceState(history.state, '', location.pathname);
        if (target === 'newreq') this._afterAuth = () => this.openModal('req');
        else this._afterAuth = () => this.go(target);
        if (this.state.auth) { this._afterAuth(); this._afterAuth = null; }
      }
    } catch (e) {}
    try { this._bc = new BroadcastChannel('tm360'); this._bc.onmessage = e => { if (!e.data || typeof e.data !== 'object') return; this._remote = true; this.setState(e.data, () => { this._remote = false; Object.keys(e.data).forEach(k => { if (this._prevData) this._prevData[k] = this.state[k]; }); }); }; } catch (e) {}
  }
  componentWillUnmount() { window.removeEventListener('popstate', this._pop); window.removeEventListener('online', this._net); window.removeEventListener('offline', this._net); if (this.sync) this.sync.unsubscribe(); if (this._authSub) this._authSub.unsubscribe(); window.removeEventListener('keydown', this._key); window.removeEventListener('resize', this._rs); try { this._bc && this._bc.close(); } catch (e) {} }
  componentDidUpdate(pp, ps) {
    const s = this.state;
    const was = !!this._overlayWas, now = this.overlayOpen(s);
    if (now !== was && s.w < 700 && !s.embed) {
      if (now) this.pushHistory({page:s.page, projectId:s.projectId, overlay:true});
      else if (this._closingByBack) this._closingByBack = false;
      else if (history.state && history.state.overlay) { this._ignorePop = true; this._depth = Math.max(0, (this._depth || 1) - 1); history.back(); }
    }
    this._overlayWas = now;
    if (s.auth && this._afterAuth && !this._afterAuthRunning) { this._afterAuthRunning = true; const f = this._afterAuth; this._afterAuth = null; setTimeout(() => { this._afterAuthRunning = false; f(); }, 0); }
    if (!s.embed) { try { localStorage.setItem('tm360', JSON.stringify({auth:s.auth,role:s.role,page:s.page,projectId:s.projectId,prefs:s.prefs,remember:s.remember})); } catch (e) {} }
    const dk = this.dataKeys(), prev = this._prevData || {}, diff = {}; let n = 0;
    dk.forEach(k => { if (s[k] !== prev[k]) { diff[k] = s[k]; n++; } });
    this._prevData = {}; dk.forEach(k => { this._prevData[k] = s[k]; });
    if (!n || this._remote) return;
    if (this.sync && s.auth) this.sync.push(prev, s, Object.keys(diff), err => this.dbError(err));
    try { this._bc && this._bc.postMessage(diff); } catch (e) {}
    if (s.db) return;
    clearTimeout(this._sv); this._sv = setTimeout(() => { try { const o = {}; dk.forEach(k => { o[k] = this.state[k]; }); localStorage.setItem('tm360data', JSON.stringify(o)); } catch (e) {} }, 300);
  }
  // ---- People and records
  me() { return this.ROLES[this.state.role || 'ceo']; }
  // Field app user: management previews it as the field supervisor; everyone else uses their own.
  fieldKey() { const r = this.state.role || 'ceo'; return r === 'ceo' ? 'JM' : this.ROLES[r].k; }
  // Company-wide alerts plus the ones addressed to the signed-in person.
  myNotes(s) { const k = this.me().k; return s.notes.filter(n => !n.to || n.to === k); }
  remind(to, t, go, ic, sub) { this.notify({to, ic:ic || 'clock', t, s:sub || 'From ' + this.me().n, go}); }
  // Next number in a series such as REQ-0435, based on the highest number in use.
  nextId(prefix, list, field) {
    const f = field || 'id', re = new RegExp('^' + prefix + '-(\\d+)$');
    const max = list.reduce((m, x) => { const r = re.exec(String(x[f] || '')); return r ? Math.max(m, +r[1]) : m; }, 0);
    return prefix + '-' + String(max + 1).padStart(4, '0');
  }
  fmtSize(b) { return b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  submitReport(k, text, clear) {
    const a = this.av(k);
    this.setState(x => Object.assign({reportsToday:Object.assign({}, x.reportsToday, {[k]:true}), reportsSub:(x.reportsToday || {})[k] ? x.reportsSub : Math.min(48, x.reportsSub + 1), staff:x.staff.map(p => p.k === k ? Object.assign({}, p, {rep:true}) : p)}, clear || {}));
    this.toast('Daily report submitted');
    this.log('fileText','purple',a.n + ' submitted daily report', String(text || '').slice(0,60));
  }
  // Asks before a decision that notifies people or discards work.
  confirm(message) { try { return window.confirm(message); } catch (e) { return true; } }
  printDoc(doc) { if (!printDocument(doc)) this.toast('Allow pop-ups for this site to open the document'); }
  // Opens a stored document: a signed link from the database, or the file kept in this browser.
  async openDoc(d) {
    if (!d.url && !d.path) { this.toast(d.n + ' has no file attached yet · upload it from Documents'); return; }
    const w = window.open('', '_blank');
    try {
      let url = d.url;
      if (d.path) { const { data, error } = await supabase.storage.from('documents').createSignedUrl(d.path, 3600); if (error) throw error; url = data.signedUrl; }
      // Browsers refuse to open data: links in a new tab, so hand over a blob link instead.
      if (url.startsWith('data:')) url = URL.createObjectURL(await (await fetch(url)).blob());
      if (w) w.location.href = url; else window.location.href = url;
    } catch (err) { if (w) w.close(); console.error(err); this.toast('Could not open ' + d.n); }
  }
  // Field photo: opens the camera on phones (file picker elsewhere) and files the picture under Documents.
  takePhoto(k) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.setAttribute('capture', 'environment');
    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const task = this.state.tasks.find(t => t.who === k && t.st !== 'done');
      this.setState({form:{n:'', _file:null}});
      await this.attachFile(file);
      const info = this.state.form._file;
      if (!info) { this.toast(this.state.modalErr || 'Photo could not be saved'); return; }
      const n = 'Site photo · ' + this.av(k).first + ' · ' + this.now() + ' · ' + file.name;
      this.setState(x => ({form:{}, docs:[{id:Date.now(), n, type:'Report', p:task ? task.p : '', by:k, d:'Today', sz:this.fmtSize(info.size), url:info.url || '', path:info.path || '', mime:info.mime || ''}, ...x.docs]}));
      this.toast('Photo saved to Documents');
      this.log('camera','blue',this.av(k).first + ' added a site photo', task ? this.proj(task.p).client : 'Field');
    };
    input.click();
  }
  // Reads a picked file: uploads it to Supabase Storage, or keeps small files in the browser in demo mode.
  async attachFile(file) {
    if (!file) return;
    const name = file.name, base = {_file:null, _uploading:true};
    this.setState(x => ({form:Object.assign({}, x.form, base, x.form.n ? {} : {n:name}), modalErr:''}));
    try {
      let info;
      if (this.state.db) {
        const path = (crypto.randomUUID ? crypto.randomUUID() : Date.now()) + '/' + name.replace(/[^\w.\- ]+/g, '_');
        const { error } = await supabase.storage.from('documents').upload(path, file, {contentType:file.type || undefined});
        if (error) throw error;
        info = {path, size:file.size, mime:file.type};
      } else {
        if (file.size > 2 * 1048576) throw new Error('In the demo, files must be under 2 MB');
        const url = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(file); });
        info = {url, size:file.size, mime:file.type};
      }
      this.setState(x => ({form:Object.assign({}, x.form, {_file:info, _uploading:false})}));
    } catch (err) {
      console.error(err);
      this.setState(x => ({form:Object.assign({}, x.form, {_file:null, _uploading:false}), modalErr:'Upload failed · ' + (err.message || err)}));
    }
  }

  // ---- Sign-in and data, in demo mode (browser only) or against Supabase.
  signIn() {
    const s = this.state;
    if (!s.email.trim() || s.pw.length < 4) { this.setState({loginErr:'Enter your email and a password of at least 4 characters.'}); return; }
    this.rememberChoice();
    if (!s.db) { this.setState({auth:true,role:s.loginRole,page:this.ROLES[s.loginRole].home,taskFilter:s.loginRole === 'staff' ? 'mine' : 'all'}); return; }
    if (s.signingIn) return;
    this.setState({signingIn:true, loginErr:'Signing in…'});
    withTimeout(supabase.auth.signInWithPassword({email:s.email.trim(), password:s.pw})).then(({data, error}) => {
      if (error) { this.setState({signingIn:false, loginErr:error.message === 'Invalid login credentials' ? 'Wrong email or password.' : /fetch|network/i.test(error.message) || !error.status ? OFFLINE : error.message}); return; }
      return this.enter(data.user, s.loginRole, true);
    }).catch(err => { console.error(err); this.setState({signingIn:false, loginErr:OFFLINE}); });
  }
  forgotPassword() {
    const s = this.state;
    if (!s.db) { this.setState({loginErr:'A reset link has been sent to ' + s.email + ' (demo).'}); return; }
    if (!s.email.trim()) { this.setState({loginErr:'Enter your email first, then click "Forgot password?".'}); return; }
    supabase.auth.resetPasswordForEmail(s.email.trim(), {redirectTo:location.origin}).then(({error}) => {
      this.setState({loginErr:error ? error.message : 'A reset link has been sent to ' + s.email.trim() + '.'});
    });
  }
  signOut() {
    if (!this.state.db) { this.setState({auth:false,menu:false}); return; }
    if (this.sync) this.sync.unsubscribe();
    this.account = null;
    this.ROLES = ROLES;
    supabase.auth.signOut().finally(() => this.setState({auth:false, menu:false, pw:'', signingIn:false}));
  }
  resetDemo() {
    if (this.state.db) { this.setState({menu:false}); this.toast('Reset is only available in the demo, not on the live database'); return; }
    if (!this.confirm('Reset all demo data to the starting figures? Your changes in this browser will be lost.')) { this.setState({menu:false}); return; }
    this.setState(Object.assign({menu:false,page:'dashboard'}, this.seed())); this.toast('Demo data reset');
  }
  async startDb() {
    this.sync = new RecordSync(supabase, this.dataKeys());
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' && this.state.auth) this.setState({auth:false});
      if (event === 'PASSWORD_RECOVERY') setTimeout(() => this.choosePassword(), 0);
      if (event === 'SIGNED_IN' && session && !this.state.auth && !this.state.signingIn && !this.state.booting) this.enter(session.user);
    });
    this._authSub = data.subscription;
    try {
      if (this.forgetOnClose()) await withTimeout(supabase.auth.signOut());
      const { data: { session } } = await withTimeout(supabase.auth.getSession());
      if (session) await this.enter(session.user); else this.setState({booting:false});
    } catch (err) { console.error(err); this.setState({booting:false, loginErr:OFFLINE}); }
  }
  async choosePassword() {
    const pw = window.prompt('Choose a new password (at least 8 characters):');
    if (!pw) return;
    const { error } = await supabase.auth.updateUser({password:pw});
    this.toast(error ? error.message : 'Password updated');
  }
  // Loads the signed-in person's profile and all shared data, then opens their portal.
  async enter(user, wanted, fresh) {
    try {
      const { data: prof, error } = await withTimeout(supabase.from('profiles').select('role,full_name,title,person_key').eq('user_id', user.id).maybeSingle());
      if (error) throw error;
      const acc = prof || {role:'staff'};
      const role = ROLES[acc.role] ? acc.role : 'staff';
      this.account = {role};
      this.ROLES = Object.assign({}, ROLES, {[role]:Object.assign({}, ROLES[role], {email:user.email}, acc.full_name ? {n:acc.full_name} : {}, acc.title ? {t:acc.title} : {}, acc.person_key ? {k:acc.person_key} : {})});
      const shared = await withTimeout(this.sync.load(this.seed()), 30000);
      this.applyRemote(shared);
      this.sync.unsubscribe();
      this.sync.subscribe((c, change) => { const next = applyChange(this.state[c], change); if (next !== undefined) this.applyRemote({[c]:next}); });
      const s = this.state;
      // Management may open any portal; everyone else gets their own.
      const pick = fresh ? wanted : s.role;
      const r = role === 'ceo' && ROLES[pick] ? pick : role;
      const keepPage = !fresh && r === s.role && s.page;
      this.setState({auth:true, booting:false, signingIn:false, loginErr:'', pw:'', email:user.email, role:r, loginRole:r, page:keepPage ? s.page : this.ROLES[r].home, taskFilter:r === 'staff' ? 'mine' : 'all'});
    } catch (err) {
      console.error(err);
      const missing = err && (err.code === '42P01' || err.code === 'PGRST205' || /does not exist|schema cache/i.test(err.message || ''));
      await supabase.auth.signOut().catch(() => {});
      this.setState({booting:false, signingIn:false, auth:false, loginErr:missing ? 'The database is not set up yet. Run supabase/migrations in the Supabase SQL Editor.' : 'Could not load your workspace: ' + (err.message || err)});
    }
  }
  // Applies changes that came from the database or another tab without saving them back.
  applyRemote(patch) {
    this._remote = true;
    this.setState(patch, () => { this._remote = false; Object.keys(patch).forEach(k => { if (this._prevData) this._prevData[k] = this.state[k]; }); });
  }
  dbError(err) {
    console.error('Save failed', err);
    this.toast('Could not save your last change · ' + ((err && err.message) || 'check your connection'));
  }
  dataKeys() { return this._dk || (this._dk = Object.keys(this.seed())); }
  navGroups(role) {
    const s = this.state, R = this.ROLES[role];
    const unread = this.myNotes(s).filter(n => !n.read).length, myReq = s.reqs.filter(q => q.st === 'pending' && q.step === 4).length, openTasks = s.tasks.filter(t => t.st !== 'done').length;
    const lowN = s.stock.filter(i => i.q < i.min).length, finQ = s.reqs.filter(q => q.st === 'pending' && q.step === 3).length, myOpen = s.tasks.filter(t => t.who === R.k && t.st !== 'done').length;
    const N = {
      ceo:[['Overview',[['dashboard','Dashboard','grid'],['briefing','Monday Briefing','presentation'],['calendar','Calendar','calendar'],['notifications','Notifications','bell',unread]]],
        ['Commercial',[['crm','CRM','users'],['proposals','Sales & Proposals','clipboard'],['finance','Finance & Invoices','chart']]],
        ['Operations',[['projects','Projects','folder'],['tasks','Tasks','checkSquare',openTasks],['production','Production','printer'],['procurement','Procurement','cart'],['store','Store & Inventory','package'],['logistics','Logistics','truck']]],
        ['Money',[['requests','Requests & Floats','banknote',myReq]]],
        ['People',[['staff','Staff & Reports','user'],['rooms','Meeting rooms','calendar']]],
        ['Records',[['documents','Documents','paperclip'],['reports','Reports','pie']]],
        ['Mobile',[['ceomobile','Mobile apps','phone',0,{mobileRole:'ceo'}],['field','Field capture app','camera']]],
        ['System',[['settings','Settings','settings']]]],
      staff:[['My work',[['staffportal','My Day','home'],['tasks','My tasks','checkSquare',myOpen,{taskFilter:'mine'}],['requests','Approvals','banknote',s.reqs.filter(q => this.canAct(q)).length],['field','Field capture','camera'],['ceomobile','Mobile app','phone',0,{mobileRole:'staff'}]]],
        ['Company',[['briefing','Monday Briefing','presentation'],['calendar','Calendar','calendar'],['projects','Projects','folder'],['rooms','Meeting rooms','calendar'],['documents','Documents','paperclip'],['notifications','Notifications','bell',unread],['settings','Settings','settings']]]],
      finance:[['Finance',[['financeportal','My queue','wallet',finQ],['finance','Finance & Invoices','chart'],['requests','Requests & Floats','banknote'],['proposals','Proposals','clipboard'],['procurement','Procurement','cart'],['reports','Reports','pie']]],
        ['Company',[['briefing','Monday Briefing','presentation'],['calendar','Calendar','calendar'],['projects','Projects','folder'],['documents','Documents','paperclip'],['notifications','Notifications','bell',unread],['ceomobile','Mobile app','phone',0,{mobileRole:'finance'}],['settings','Settings','settings']]]],
      reception:[['Front office',[['reception','Front desk','message'],['rooms','Meeting rooms','calendar'],['calendar','Calendar','calendar'],['crm','Client enquiries','users'],['staff','Staff directory','user']]],
        ['Company',[['briefing','Monday Briefing','presentation'],['documents','Documents','paperclip'],['notifications','Notifications','bell',unread],['ceomobile','Mobile app','phone',0,{mobileRole:'reception'}],['settings','Settings','settings']]]],
      store:[['Store',[['storekeeper','My store','home',lowN],['store','Inventory','package'],['procurement','Procurement','cart'],['production','Production','printer'],['logistics','Logistics','truck']]],
        ['Company',[['briefing','Monday Briefing','presentation'],['calendar','Calendar','calendar'],['projects','Projects','folder'],['documents','Documents','paperclip'],['notifications','Notifications','bell',unread],['ceomobile','Mobile app','phone',0,{mobileRole:'store'}],['settings','Settings','settings']]]]
    };
    let G = N[role] || N.ceo;
    if (s.embed) G = G.map(([t, items]) => [t, items.filter(i => i[0] !== 'ceomobile')]).filter(g => g[1].length);
    return G;
  }
  navFor(role) { const out = []; this.navGroups(role).forEach(g => g[1].forEach(i => out.push(i))); return out; }
  colView(cols, key) {
    const s = this.state, cs = s.colSel || {}, phone = s.w < 700;
    const i0 = Math.max(0, Math.min(cs[key] || 0, cols.length - 1));
    return {view:phone ? [cols[i0]] : cols, tabs:cols.map((c, i) => { const on = i === i0; return {l:c.l + ' · ' + c.n, on:() => this.setState(x => ({colSel:Object.assign({}, x.colSel, {[key]:i})})), bg:on ? '#2B1459' : '#fff', c:on ? '#fff' : '#17152A', bd:on ? '#2B1459' : '#E8E4EF'}; })};
  }

  fmtT(n) { return 'TZS ' + Math.round(n).toLocaleString('en-US'); }
  fmtM(v) { return 'TZS ' + (+v).toFixed(1) + 'M'; }
  now() { return new Date().toTimeString().slice(0,5); }
  av(k) { const p = this.PPL[k] || [String(k || '—'),'#6E6A7C']; return {i:k,n:p[0],c:p[1],first:p[0].split(' ')[0]}; }
  proj(id) { return this.state.projects.find(p => p.id === id) || {id:'',name:'General',client:'Company'}; }
  tone(t) { return ({amber:['#FBF1DD','#8A6414'],purple:['#EFE8FA','#5A2FA8'],green:['#E6F4EC','#1F7549'],blue:['#E9EFFA','#3559A8'],dark:['#EDE8F6','#2B1459'],red:['#FBEDEE','#B23A46']})[t] || ['#F4F1FA','#2B1459']; }
  go(page, extra) {
    const s = this.state, x = extra || {}, same = page === s.page && (!x.projectId || x.projectId === s.projectId);
    this.setState(Object.assign({page,menu:false,drawer:false,cmd:false,more:false,tip:-1,navDir:this.isTab(page) ? 'tab' : 'push'}, x));
    if (!same) this.pushHistory({page, projectId:x.projectId || s.projectId});
    try { window.scrollTo(0,0); } catch (e) {}
  }
  // ---- Native-style navigation: browser/phone back moves through screens and closes sheets.
  isTab(page) { const r = this.state.role || 'ceo'; return page === this.ROLES[r].home || (this.TABS[r] || []).some(t => t[0] === page); }
  pushHistory(entry) {
    if (this.state.embed || typeof history === 'undefined') return;
    this._depth = (this._depth || 0) + 1;
    try { history.pushState(Object.assign({tm:1, depth:this._depth}, entry), ''); } catch (e) {}
  }
  overlayOpen(s) { return !!(s.modal || s.more || s.menu || s.ai || s.cmd); }
  onPopState(e) {
    if (this._ignorePop) { this._ignorePop = false; return; }
    const s = this.state, st = e.state || {};
    this._depth = st.depth || 0;
    if (this.overlayOpen(s)) { this._closingByBack = true; this.setState({modal:null, more:false, menu:false, ai:false, cmd:false}); return; }
    if (st.page && s.auth) {
      this.setState({page:st.page, projectId:st.projectId || s.projectId, navDir:'back', tip:-1});
      try { window.scrollTo(0,0); } catch (err) {}
    }
  }
  goBack() {
    if (!this.state.embed && (this._depth || 0) > 0) { try { history.back(); return; } catch (e) {} }
    this.setState({navDir:'back'});
    this.go(this.ROLES[this.state.role || 'ceo'].home);
    this.setState({navDir:'back'});
  }
  // Pull to refresh: reloads shared data from the database (demo data is already current).
  async refresh() {
    if (!this.sync || !this.state.auth) { await new Promise(r => setTimeout(r, 600)); this.toast('Up to date'); return; }
    try { this.applyRemote(await withTimeout(this.sync.load(this.seed()), 20000)); this.toast('Up to date'); } catch (err) { console.error(err); this.toast(OFFLINE); }
  }
  haptic(ms) { try { if (this.state.w < 700 && navigator.vibrate) navigator.vibrate(ms || 8); } catch (e) {} }
  asRole(r, page, extra) { return () => { if (this.state.db && this.account && this.account.role !== 'ceo' && r !== this.account.role) { this.setState({menu:false, more:false}); this.toast('Your account uses the ' + this.ROLES[this.account.role].label + ' portal'); return; } this.setState(Object.assign({role:r, menu:false, drawer:false, more:false, page:page || this.ROLES[r].home, tip:-1, taskFilter:r === 'staff' ? 'mine' : 'all'}, extra || {})); try { window.scrollTo(0,0); } catch (e) {} }; }
  goTarget(g) { if (g && g.indexOf('project:') === 0) this.go('project',{projectId:g.slice(8)}); else this.go(g || 'dashboard'); }
  toast(t) { this.haptic(10); const id = Date.now() + Math.random(); this.setState(s => ({toasts:[...s.toasts,{id,t}]})); setTimeout(() => this.setState(s => ({toasts:s.toasts.filter(x => x.id !== id)})), 3200); }
  notify(n) { this.setState(s => ({notes:[Object.assign({id:Date.now()+Math.random(),read:false,time:this.now()}, n), ...s.notes]})); }
  log(ic, tone, t, sub) { this.setState(s => ({activity:[{time:this.now(),ic,tone,t,s:sub}, ...s.activity].slice(0,7)})); }
  smooth(pts) { let d = 'M' + pts[0][0] + ' ' + pts[0][1]; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i-1] || pts[i], p1 = pts[i], p2 = pts[i+1], p3 = pts[i+2] || p2; d += ' C' + (p1[0]+(p2[0]-p0[0])/6).toFixed(1) + ' ' + (p1[1]+(p2[1]-p0[1])/6).toFixed(1) + ' ' + (p2[0]-(p3[0]-p1[0])/6).toFixed(1) + ' ' + (p2[1]-(p3[1]-p1[1])/6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1); } return d; }
  spark(vals) { const mn = Math.min(...vals), mx = Math.max(...vals), r = mx - mn || 1; const pts = vals.map((v,i) => [3 + i*(84/(vals.length-1)), 27 - (v-mn)/r*22]); const l = this.smooth(pts); return {l, f:l + ' L87 30 L3 30 Z'}; }

  openModal(act, preset) {
    const PO = this.state.projects.filter(p => p.st !== 'done').map(p => ({v:p.id,l:p.client + ' · ' + p.name}));
    const PP = Object.keys(this.PPL).map(k => ({v:k,l:this.PPL[k][0]}));
    const O = a => a.map(x => ({v:x,l:x}));
    const defs = {
      task:{title:'New task',sub:'Every task is linked to a project, an owner and a deadline.',submit:'Create task',fields:[{k:'t',l:'Task',ph:'e.g. Print 500 flyers',req:1},{k:'p',l:'Project',opts:PO},{k:'who',l:'Assign to',opts:PP},{k:'due',l:'Deadline',ph:'e.g. Fri 25'},{k:'pri',l:'Priority',opts:[{v:'high',l:'High'},{v:'med',l:'Medium'},{v:'low',l:'Low'}]}]},
      req:{title:'Request money',sub:'Routes to PM → Operations → Finance → Management → Payment.',submit:'Submit request',fields:[{k:'amt',l:'Amount (TZS)',type:'number',ph:'300000',req:1},{k:'cat',l:'Category',opts:O(['Transport','Fuel','Materials','Permits','Meals','Supplier deposit'])},{k:'p',l:'Project',opts:PO},{k:'purpose',l:'Purpose',ph:'What is the money for?',req:1},{k:'need',l:'Needed by',ph:'e.g. Today 16:00'}]},
      lead:{title:'New lead',sub:'Leads move Lead → Qualified → Proposal → Negotiation → Won.',submit:'Add lead',fields:[{k:'c',l:'Client',ph:'Company name',req:1},{k:'t',l:'Opportunity',ph:'e.g. Product launch event',req:1},{k:'v',l:'Estimated value (TZS M)',type:'number',ph:'80'},{k:'src',l:'Source',opts:O(['Website','Referral','Tender','Existing client','Walk-in'])}]},
      project:{title:'New project',sub:'Creates the project record, workflow and budget shell.',submit:'Create project',fields:[{k:'client',l:'Client',ph:'Client name',req:1},{k:'name',l:'Project name',ph:'e.g. Brand activation',req:1},{k:'pm',l:'Project manager',opts:PP},{k:'val',l:'Contract value (TZS M)',type:'number',ph:'120'},{k:'due',l:'Deadline',ph:'e.g. 30 Oct'}]},
      issue:{title:'Issue stock',sub:'',submit:'Issue from store',fields:[{k:'q',l:'Quantity',type:'number',ph:'1',req:1},{k:'p',l:'For project',opts:PO},{k:'who',l:'Collected by',opts:PP}]},
      receive:{title:'Receive stock',sub:'',submit:'Receive into store',fields:[{k:'q',l:'Quantity received',type:'number',ph:'10',req:1},{k:'sup',l:'Supplier',ph:'e.g. Chapa Supplies'}]},
      invoice:{title:'New invoice',sub:'Saved as a draft until you send it.',submit:'Create invoice',fields:[{k:'p',l:'Project',opts:PO},{k:'v',l:'Amount (TZS M)',type:'number',ph:'25',req:1},{k:'due',l:'Due date',ph:'e.g. 15 Oct'}]},
      proposal:{title:'New proposal',sub:'Starts as a draft, then goes to internal review.',submit:'Create draft',fields:[{k:'c',l:'Client',ph:'Client name',req:1},{k:'t',l:'Service / scope',ph:'e.g. Product launch activation',req:1},{k:'v',l:'Value (TZS M)',type:'number',ph:'80'},{k:'valid',l:'Valid until',ph:'e.g. 30 Oct'},{k:'own',l:'Owner',opts:PP}]},
      job:{title:'New production job',sub:'Moves Brief → Design → Approval → Production → QC → Packaging → Delivery.',submit:'Create job',fields:[{k:'t',l:'Job',ph:'e.g. Roll-up banners × 10',req:1},{k:'p',l:'Project',opts:PO},{k:'mat',l:'Materials',ph:'e.g. PET film, roll-up stands'},{k:'qty',l:'Quantity',type:'number',ph:'10'},{k:'due',l:'Deadline',ph:'e.g. Fri 25'},{k:'who',l:'Assigned to',opts:PP}]},
      trip:{title:'Schedule trip',sub:'Every trip is linked to a project.',submit:'Schedule trip',fields:[{k:'what',l:'Load',ph:'e.g. 4 gazebo tents',req:1},{k:'p',l:'Project',opts:PO},{k:'to',l:'Destination',ph:'e.g. Arusha',req:1},{k:'veh',l:'Vehicle',opts:O(['T 482 DXY','T 119 DKL','T 733 DGH'])},{k:'drv',l:'Driver',opts:O(['Amani Juma','Hassan Rajab'])},{k:'date',l:'Date & time',ph:'e.g. Fri 25 · 06:00'}]},
      doc:{title:'Upload document',sub:'Stored against a project, with permissions.',submit:'Upload',fields:[{k:'file',l:'File',type:'file'},{k:'n',l:'File name',ph:'e.g. Signed contract.pdf',req:1},{k:'type',l:'Type',opts:O(['Contract','Proposal','Quotation','Invoice','Receipt','Design','Brief','Report','Client approval','Purchase'])},{k:'p',l:'Project',opts:PO}]},
      meet:{title:'Schedule meeting',sub:'Participants get a reminder. Actions become tasks.',submit:'Schedule',fields:[{k:'n',l:'Title',ph:'e.g. Production review',req:1},{k:'d',l:'Day',opts:O(['Mon 21','Tue 22','Wed 23','Thu 24','Fri 25','Sat 26'])},{k:'t',l:'Time',ph:'e.g. 10:00'},{k:'k',l:'Type',opts:[{v:'meet',l:'Internal meeting'},{v:'client',l:'Client meeting'},{v:'proj',l:'Project'}]}]},
      proc:{title:'Purchase request',sub:'Request → Quotation → Approved → PO → Delivered.',submit:'Submit purchase request',fields:[{k:'t',l:'Item',ph:'e.g. Vinyl rolls × 10',req:1},{k:'p',l:'Project',opts:PO},{k:'v',l:'Estimated cost (TZS M)',type:'number',ph:'1.5'}]}
    };
    const m = Object.assign({act}, defs[act], preset && preset._meta ? preset._meta : {});
    const form = {}; m.fields.forEach(f => { form[f.k] = f.opts ? f.opts[0].v : ''; });
    Object.assign(form, preset || {}); delete form._meta;
    this.setState({modal:m, form, modalErr:'', cmd:false, menu:false});
  }
  submitModal() {
    const s = this.state, m = s.modal, f = s.form;
    for (const fd of m.fields) {
      if (fd.type === 'file') continue;
      const val = String(f[fd.k] == null ? '' : f[fd.k]).trim();
      if (fd.req && !val) { this.setState({modalErr:fd.l + ' is required.'}); return; }
      if (fd.type === 'number' && val && !(+val > 0)) { this.setState({modalErr:fd.l + ' must be a number above 0.'}); return; }
    }
    if (m.act === 'issue') { const item = s.stock.find(i => i.sku === f.sku); if (item && +f.q > item.q) { this.setState({modalErr:'Only ' + item.q + ' ' + item.u + ' in store.'}); return; } }
    if (m.act === 'doc' && f._uploading) { this.setState({modalErr:'Please wait for the file to finish uploading.'}); return; }
    const P = this.proj(f.p);
    if (m.act === 'task') { this.setState(x => ({tasks:[{id:'T'+Date.now(),t:f.t,p:f.p,who:f.who,due:f.due||'This week',st:'todo',pri:f.pri}, ...x.tasks]})); this.toast('Task created and assigned to ' + this.av(f.who).n); this.log('checkSquare','purple','Task created · ' + f.t, P.client + ' · assigned to ' + this.av(f.who).first); }
    if (m.act === 'req') { const amt = +f.amt || 0; const id = this.nextId('REQ', s.reqs); const who = f.who || this.me().k; this.setState(x => ({reqs:[{id,who,amt,cat:f.cat,purpose:f.purpose,p:f.p,need:f.need||'This week',step:1,st:'pending',log:[this.now()]}, ...x.reqs], reqSel:id})); this.toast(id + ' submitted · waiting for Project Manager'); this.log('banknote','amber',this.av(who).first + ' requested ' + this.fmtT(amt), P.name + ' · ' + id); }
    if (m.act === 'lead') { this.setState(x => ({leads:[{id:'L'+Date.now(),c:f.c,t:f.t,v:+f.v||0,s:0,src:f.src}, ...x.leads]})); this.toast('Lead added · ' + f.c); this.log('users','blue','New lead · ' + f.c, f.t); }
    if (m.act === 'project') { const id = this.nextId('PRJ', s.projects); const val = +f.val || 0; this.setState(x => ({projects:[{id,name:f.name,client:f.client,pm:f.pm,st:'on',prog:0,val,bud:+(val*0.7).toFixed(1),spent:0,stage:2,due:f.due||'TBC',team:[f.pm]}, ...x.projects]})); this.toast('Project ' + id + ' created'); this.log('folder','purple','Project created · ' + f.client, f.name); setTimeout(() => this.go('project',{projectId:id}), 50); }
    if (m.act === 'issue') { const q = Math.max(0, +f.q || 0); this.setState(x => ({stock:x.stock.map(i => i.sku === f.sku ? Object.assign({}, i, {q:Math.max(0, i.q - q)}) : i)})); this.toast('Issued ' + q + ' ' + f.u + ' of ' + f.n + ' to ' + P.client); this.log('package','dark','Store issued ' + q + ' ' + f.u + ' · ' + f.n, P.name + ' · ' + this.av(f.who).first); }
    if (m.act === 'receive') { const q = Math.max(0, +f.q || 0); this.setState(x => ({stock:x.stock.map(i => i.sku === f.sku ? Object.assign({}, i, {q:i.q + q}) : i)})); this.toast('Received ' + q + ' ' + f.u + ' · ' + f.n); this.log('package','green','Stock received · ' + f.n, q + ' ' + f.u + (f.sup ? ' from ' + f.sup : '')); }
    if (m.act === 'invoice') { const id = this.nextId('INV', s.invoices); this.setState(x => ({invoices:[{id,c:P.client,p:f.p,v:+f.v||0,st:'draft',due:f.due||'—'}, ...x.invoices]})); this.toast('Invoice ' + id + ' saved as draft'); }
    if (m.act === 'proc') { const id = this.nextId('PR', s.proc); this.setState(x => ({proc:[{id,t:f.t,p:f.p,v:+f.v||0,s:0,sup:'—'}, ...x.proc]})); this.toast('Purchase request ' + id + ' submitted'); }
    if (m.act === 'proposal') { const id = this.nextId('PRO', s.proposals); this.setState(x => ({proposals:[{id,c:f.c,t:f.t,v:+f.v||0,s:0,own:f.own,valid:f.valid||'30 days'}, ...x.proposals]})); this.toast('Proposal ' + id + ' saved as draft'); this.log('clipboard','purple','Proposal drafted · ' + f.c, f.t); }
    if (m.act === 'job') { const id = this.nextId('JOB', s.jobs); this.setState(x => ({jobs:[{id,t:f.t,p:f.p,mat:f.mat||'—',qty:+f.qty||1,s:0,due:f.due||'TBC',who:f.who,cost:0,waste:0}, ...x.jobs]})); this.toast('Production job ' + id + ' created'); this.log('printer','purple','Production job created · ' + f.t, P.client); }
    if (m.act === 'trip') { const id = this.nextId('TRP', s.trips); this.setState(x => ({trips:[{id,what:f.what,p:f.p,to:f.to,veh:f.veh,drv:f.drv,s:0,date:f.date||'TBC'}, ...x.trips]})); this.toast('Trip ' + id + ' scheduled · ' + f.to); this.log('truck','dark','Trip scheduled to ' + f.to, f.what + ' · ' + f.veh); }
    if (m.act === 'doc') { const fl = f._file || {}; this.setState(x => ({docs:[{id:Date.now(),n:f.n,type:f.type,p:f.p,by:this.me().k,d:'Today',sz:fl.size ? this.fmtSize(fl.size) : '—',url:fl.url || '',path:fl.path || '',mime:fl.mime || ''}, ...x.docs]})); this.toast('Uploaded · ' + f.n); this.log('paperclip','blue','Document uploaded · ' + f.type, f.n); }
    if (m.act === 'meet') { this.setState(x => ({events:[...x.events, {id:Date.now(),d:f.d,t:f.t||'09:00',n:f.n,k:f.k}]})); this.toast('Meeting scheduled · ' + f.d + ' ' + (f.t || '09:00')); this.notify({ic:'calendar',t:'Meeting scheduled · ' + f.n,s:f.d + ' ' + (f.t || '09:00'),go:'calendar'}); }
    this.setState({modal:null});
  }
  // Who approves a request at each step of the chain (index = step).
  approverAt(r, step) { return [r.who, this.proj(r.p).pm || 'SK', 'MM', 'RT', 'DK', 'RT'][step]; }
  // Management can act at any step; Finance verifies at step 3; the PM and Operations at their own step.
  canAct(r) {
    if (r.st !== 'pending') return false;
    const role = this.state.role || 'ceo';
    return role === 'ceo' || (role === 'finance' && r.step === 3) || (r.step > 0 && r.step < 3 && this.me().k === this.approverAt(r, r.step));
  }
  canPay() { const role = this.state.role || 'ceo'; return role === 'ceo' || role === 'finance'; }
  decide(r, ok) {
    const t = this.now(), last = r.step >= 4;
    const patch = ok ? (last ? {step:5, st:'approved'} : {step:r.step + 1}) : {st:'rejected'};
    this.setState(x => ({reqs:x.reqs.map(q => q.id === r.id ? Object.assign({}, q, patch, {log:[...q.log, t]}) : q)}));
    const next = ok ? (last ? 'RT' : this.approverAt(r, r.step + 1)) : r.who;
    if (ok) this.remind(next, last ? r.id + ' is approved · ready to pay' : r.id + ' needs your approval', 'requests', 'banknote', this.av(r.who).n + ' · ' + this.fmtT(r.amt));
    else this.remind(r.who, r.id + ' was not approved', 'requests', 'x', 'Rejected by ' + this.me().n);
    this.toast(ok ? r.id + (last ? ' approved · sent to Finance for payment' : (r.step === 3 ? ' verified' : ' approved') + ' · sent to ' + this.CHAIN[r.step + 1]) : r.id + ' rejected · ' + this.av(r.who).first + ' notified');
    this.log(ok ? 'check' : 'x', ok ? 'green' : 'red', this.me().n + (ok ? ' approved ' : ' rejected ') + this.fmtT(r.amt), this.proj(r.p).name + ' · ' + r.id);
  }
  payReq(r) {
    const t = this.now();
    this.setState(x => ({reqs:x.reqs.map(q => q.id === r.id ? Object.assign({}, q, {step:6,st:'paid',log:[...q.log,t]}) : q), staff:x.staff.map(p => p.k === r.who ? Object.assign({}, p, {fl:p.fl + r.amt}) : p)}));
    this.toast('Paid via M-Pesa · float opened for ' + this.av(r.who).n);
    this.log('wallet','green','Float opened · ' + this.fmtT(r.amt), this.av(r.who).n + ' · receipts due in 3 days');
  }
  answer(q) {
    const s = this.state; q = q.toLowerCase();
    const list = a => a.join('\n• ');
    if (/budget|\bover\b|margin|profit/.test(q)) { const o = s.projects.filter(p => p.st !== 'done' && p.spent > p.bud * 0.6).sort((a,b) => b.spent/b.bud - a.spent/a.bud).slice(0,4); return 'Budget usage, highest first:\n• ' + list(o.map(p => p.client + ' · ' + p.name + ' — ' + Math.round(p.spent/p.bud*100) + '% of ' + this.fmtM(p.bud))) + '\n\nPwani Beverages is over budget; I recommend a cost review before the Wednesday deadline.'; }
    if (/approv|pending|request|money/.test(q)) { const r = s.reqs.filter(x => x.st === 'pending' && x.step === 4); const tot = r.reduce((a,b) => a + b.amt, 0); return r.length ? r.length + ' requests are waiting for you (' + this.fmtT(tot) + '):\n• ' + list(r.map(x => this.av(x.who).first + ' — ' + this.fmtT(x.amt) + ' · ' + x.cat + ' · needed ' + x.need)) : 'Nothing is waiting for your approval.'; }
    if (/stock|inventory|material|low|vinyl|ink/.test(q)) { const l = s.stock.filter(i => i.q < i.min); return l.length + ' items are below minimum:\n• ' + list(l.map(i => i.n + ' — ' + i.q + ' ' + i.u + ' (min ' + i.min + ')')); }
    if (/float/.test(q)) { const f = s.staff.filter(p => p.fl > 0); return 'Open staff floats total ' + this.fmtT(f.reduce((a,b) => a + b.fl, 0)) + ':\n• ' + list(f.map(p => this.av(p.k).n + ' — ' + this.fmtT(p.fl))) + '\n\nPeter Laizer\u2019s float is 12 days old with no receipts.'; }
    if (/report|staff|missing|who/.test(q)) { const m = s.staff.filter(p => !p.rep); return m.length ? m.length + ' staff have not submitted yesterday\u2019s report:\n• ' + list(m.map(p => this.av(p.k).n + ' · ' + p.role)) : 'Everyone has submitted their report.'; }
    if (/risk|late|delay/.test(q)) { const r = s.projects.filter(p => p.st === 'risk' || p.st === 'late'); return r.length + ' projects need attention:\n• ' + list(r.map(p => p.client + ' · ' + p.name + ' — ' + this.ST[p.st].l + ', due ' + p.due)); }
    if (/invoice|receiv|owe|overdue|cash/.test(q)) { const o = s.invoices.filter(i => i.st === 'overdue'); return 'Overdue invoices total ' + this.fmtM(o.reduce((a,b) => a + b.v, 0)) + ':\n• ' + list(o.map(i => i.c + ' — ' + this.fmtM(i.v) + ' · ' + i.due)); }
    const act = s.projects.filter(p => p.st !== 'done').length, pend = s.reqs.filter(x => x.st === 'pending' && x.step === 4).length;
    return 'Today at a glance: ' + act + ' active projects, ' + pend + ' approvals waiting for you, ' + s.stock.filter(i => i.q < i.min).length + ' stock items below minimum, and ' + s.staff.filter(p => !p.rep).length + ' missing staff reports. Try asking about budgets, floats, stock or overdue invoices.';
  }
  askAI(q) {
    q = (q || this.state.aiQ).trim(); if (!q) return;
    this.setState(s => ({aiMsgs:[...s.aiMsgs,{r:'me',t:q}], aiQ:'', aiBusy:true}));
    setTimeout(() => this.setState(s => ({aiMsgs:[...s.aiMsgs,{r:'ai',t:this.answer(q)}], aiBusy:false})), 650);
  }
  tst(k) { return ({todo:['To do','#F1EEF6','#6E6A7C','#A9A3B8'],prog:['In progress','#EFE8FA','#5A2FA8','#6D3CC2'],review:['Submitted','#FBF1DD','#8A6414','#D89B2B'],done:['Done','#E6F4EC','#1F7549','#2E9B63']})[k]; }
  rst(r) { if (r.st === 'rejected') return ['Rejected','#FBEDEE','#B23A46']; if (r.st === 'paid') return ['Paid · float open','#E6F4EC','#1F7549']; if (r.st === 'approved') return ['Awaiting payment','#E9EFFA','#3559A8']; if (this.state && this.canAct(r) && (r.step === 4 || (this.state.role || 'ceo') !== 'ceo')) return ['Awaiting you','#FBF1DD','#8A6414']; return ['At ' + this.CHAIN[r.step],'#F1EEF6','#5A2FA8']; }
}

Object.assign(TrinityApp.prototype, { renderVals, pageVals, pageVals2, overlayVals });
