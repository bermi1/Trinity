// Trinity Mark 360 application logic, ported from the Claude Design file.
// State lives here; the view modules turn it into the flat values the
// components render (see src/logic/view).
import Logic from './Logic';
import { IC, PPL, ROLES, TABS, ST, STAGES, OLD_STAGE, CHAIN, CH, REQ_TYPES, PARKED } from './constants';
import { seed, dayKey } from './seed';
import { renderVals } from './view/shell';
import { pageVals } from './view/workflow';
import { pageVals2 } from './view/modules';
import { overlayVals } from './view/overlays';
import { supabase } from '../lib/supabase';
import RecordSync, { applyChange } from './sync';
import { printDocument } from '../lib/print';
import { storeMethods } from './store';
import { adminMethods, emptyLike } from './admin';
import { pinFor, savePin, checkPin, clearPin, clearUnlocked, isUnlocked, isValidPin, markUnlocked, LOCK_AFTER_MS } from './pin';
import { storeVals } from './view/storeops';
import { todoMethods, todayVals } from './todos';
import { deptMethods, deptVals } from './depts';
import { crmMethods, crmVals, SOURCES } from './crm';
import { projectMethods, projectVals, reqFlowMethods } from './projectview';
import { financeMethods, financeVals, reportMethods, reportVals } from './finance';
import { homeVals } from './home';
import { officeMethods, officeVals } from './office';
import { flowMethods, FLOW } from './flow';
import { reportChannel, reportingVals } from './reports';
import { pettyMethods, pettyVals } from './petty';
import { briefingMethods, briefingVals } from './briefing';

// Password of the demo accounts, so they open with one tap (see .env). Leave it out to require passwords.
const demoPassword = () => import.meta.env.VITE_DEMO_PASSWORD || '';
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
  REQ_TYPES = REQ_TYPES;
  CH = CH;
  seed() { return seed(); }

  constructor() {
    super();
    // With a database, the account decides who is signed in, not the browser.
    if (supabase) Object.assign(this.state, {db:true, booting:true, auth:false, email:'', pw:''});
    // "Remember me" off: the sign-in lasts until the browser closes.
    if (!supabase && this.forgetOnClose()) this.state.auth = false;
    if (!supabase && this.state.auth && pinFor(this.state.pinUser) && !isUnlocked()) this.state.pin = 'lock';
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

  state = (() => { let sv = {}, saved = {}; try { sv = JSON.parse(localStorage.getItem('tm360') || '{}'); saved = JSON.parse(localStorage.getItem('tm360data') || '{}'); } catch (e) {}
    let emb = false, er = null; try { const qp = new URLSearchParams(location.search); emb = qp.get('embed') === '1'; er = qp.get('role'); } catch (e) {}
    if (emb) { const rr = this.ROLES[er] ? er : 'ceo'; sv = {auth:true, role:rr, page:this.ROLES[rr].home, projectId:'PRJ-0231'}; }
    const data = this.seed(); Object.keys(data).forEach(k => { if (saved && saved[k] !== undefined) data[k] = saved[k]; });
    return Object.assign({embed:emb,more:false,navMore:!!sv.navMore,colSel:{tasks:1,proc:0,crm:0},mobileRole:sv.role||'ceo',docType:'all',docQ:'',propFilter:'all',prefs:sv.prefs||{push:true,email:true,sms:false,digest:true},auth:!!sv.auth,pinUser:sv.pinUser||'',remember:sv.remember !== false,online:typeof navigator === 'undefined' ? true : navigator.onLine !== false,navDir:'tab',role:sv.role||'ceo',loginRole:sv.role||'ceo',mTab:'home',page:this.allowedPage(sv.role || 'ceo', sv.page),projectId:sv.projectId||'PRJ-0231',jobId:sv.jobId||'JOB-0313',email:'',pw:'',loginErr:'',range:'12W',tip:-1,menu:false,drawer:false,w:typeof window!=='undefined'?window.innerWidth:1440,reqSel:'REQ-0418',reqFilter:'me',taskFilter:'all',projFilter:'all',stockQ:'',leadQ:'',modal:null,form:{},modalErr:'',cmd:false,cmdQ:'',ai:false,aiQ:'',aiBusy:false,aiMsgs:[{r:'ai',t:'Habari. Ask me about projects, money, stock or staff — I read the live Trinity Mark 360 data.'}],toasts:[],fieldTab:'home',newAct:{d:'',a:'',o:'SK',dl:''}}, data); })();

  componentDidMount() {
    this._key = e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); this.setState(s => ({cmd:!s.cmd,cmdQ:''})); }
      if (e.key === 'Escape') this.setState({cmd:false,ai:false,modal:null,menu:false,drawer:false});
    };
    this._rs = () => this.setState({w:window.innerWidth});
    window.addEventListener('keydown', this._key); window.addEventListener('resize', this._rs);
    this._prevData = {}; this.dataKeys().forEach(k => { this._prevData[k] = this.state[k]; });
    if (this.state.db) this.startDb();
    this._vis = () => { if (document.hidden) this._hiddenAt = Date.now(); else { this.pinLockIfIdle(this._hiddenAt); this._hiddenAt = 0; } };
    document.addEventListener('visibilitychange', this._vis);
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
  componentWillUnmount() { document.removeEventListener('visibilitychange', this._vis); window.removeEventListener('popstate', this._pop); window.removeEventListener('online', this._net); window.removeEventListener('offline', this._net); if (this.sync) this.sync.unsubscribe(); if (this._authSub) this._authSub.unsubscribe(); window.removeEventListener('keydown', this._key); window.removeEventListener('resize', this._rs); try { this._bc && this._bc.close(); } catch (e) {} }
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
    if (!s.embed) { try { localStorage.setItem('tm360', JSON.stringify({auth:s.auth,role:s.role,page:s.page,projectId:s.projectId,jobId:s.jobId,pinUser:s.pinUser,prefs:s.prefs,remember:s.remember,navMore:!!s.navMore})); } catch (e) {} }
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
    if (!s.db) { const who = s.email.trim().toLowerCase(); this.setState({auth:true,role:s.loginRole,page:this.ROLES[s.loginRole].home,taskFilter:s.loginRole === 'staff' ? 'mine' : 'all',pinUser:who,pin:this.afterPasswordPin(who)}); return; }
    if (s.signingIn) return;
    this.setState({signingIn:true, loginErr:'Signing in…'});
    this.passwordSignIn(s.email.trim(), s.pw, s.loginRole, false);
  }
  passwordSignIn(email, pw, role, quick) {
    withTimeout(supabase.auth.signInWithPassword({email, password:pw})).then(({data, error}) => {
      if (error) { this.setState({signingIn:false, loginErr:error.message === 'Invalid login credentials' ? (quick ? 'This demo account is not available any more.' : 'Wrong email or password.') : /fetch|network/i.test(error.message) || !error.status ? OFFLINE : error.message}); return; }
      return this.enter(data.user, role, true, quick);
    }).catch(err => { console.error(err); this.setState({signingIn:false, loginErr:OFFLINE}); });
  }
  // Demo accounts: one tap, no password and no PIN prompt.
  quickSignIn(role) {
    const s = this.state, R = this.ROLES[role];
    this.rememberChoice();
    if (!s.db) { const who = R.email.toLowerCase(); this.setState({auth:true,role,loginRole:role,email:R.email,page:R.home,taskFilter:role === 'staff' ? 'mine' : 'all',pinUser:who,pin:null}); return; }
    if (s.signingIn) return;
    if (!demoPassword()) { this.setState({loginRole:role, email:R.email, loginErr:'Enter the password for ' + R.email + '.'}); return; }
    this.setState({signingIn:true, loginRole:role, loginErr:'Signing in…'});
    this.passwordSignIn(R.email, demoPassword(), role, true);
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
    clearUnlocked();
    if (!this.state.db) { this.setState({auth:false,menu:false,pin:null}); return; }
    if (this.sync) this.sync.unsubscribe();
    this.account = null;
    this.people = {};
    this.ROLES = ROLES;
    supabase.auth.signOut().finally(() => this.setState({auth:false, menu:false, pw:'', signingIn:false, pin:null, users:null}));
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
  async enter(user, wanted, fresh, quick) {
    try {
      const { data: prof, error } = await withTimeout(supabase.from('profiles').select('role,full_name,title,person_key,is_admin,is_demo').eq('user_id', user.id).maybeSingle());
      if (error) throw error;
      const acc = prof || {role:'staff'};
      const role = ROLES[acc.role] ? acc.role : 'staff';
      this.account = {role, isAdmin:!!acc.is_admin, isDemo:!!acc.is_demo};
      const { data: everyone } = await withTimeout(supabase.from('profiles').select('full_name,person_key'));
      this.setPeople(everyone);
      this.ROLES = Object.assign({}, ROLES, {[role]:Object.assign({}, ROLES[role], {email:user.email}, acc.full_name ? {n:acc.full_name} : {}, acc.title ? {t:acc.title} : {}, acc.person_key ? {k:acc.person_key} : {})});
      const shared = await withTimeout(this.sync.load(this.seed()), 30000);
      // After "Remove demo", collections with no rows start empty instead of showing demo data.
      const live = !!shared._meta;
      delete shared._meta;
      if (live) { const seed = this.seed(); Object.keys(seed).forEach(k => { if (!(k in shared)) shared[k] = emptyLike(seed[k]); }); }
      this.applyRemote(Object.assign(shared, {workspaceLive:live}));
      this.sync.unsubscribe();
      this.sync.subscribe((c, change) => { const next = applyChange(this.state[c], change); if (next !== undefined) this.applyRemote({[c]:next}); });
      const s = this.state;
      // Management may open any portal; everyone else gets their own.
      const pick = fresh ? wanted : s.role;
      const r = role === 'ceo' && ROLES[pick] ? pick : role;
      const keepPage = !fresh && r === s.role && s.page;
      const who = user.email.toLowerCase();
      this.setState({pinUser:who, pin:quick ? null : fresh ? this.afterPasswordPin(who) : pinFor(who) && !isUnlocked() ? 'lock' : null, auth:true, booting:false, signingIn:false, loginErr:'', pw:'', email:user.email, role:r, loginRole:r, page:keepPage ? s.page : this.ROLES[r].home, taskFilter:r === 'staff' ? 'mine' : 'all'});
    } catch (err) {
      console.error(err);
      const missing = err && (err.code === '42P01' || err.code === 'PGRST205' || /does not exist|schema cache/i.test(err.message || ''));
      await supabase.auth.signOut().catch(() => {});
      this.setState({booting:false, signingIn:false, auth:false, loginErr:missing ? 'The database is not set up yet. Run supabase/migrations in the Supabase SQL Editor.' : 'Could not load your workspace: ' + (err.message || err)});
    }
  }
  // ---- PIN unlock
  // After a password sign-in: ask to set a PIN unless one exists or they said "not now" on this device.
  afterPasswordPin(who) {
    if (pinFor(who)) { markUnlocked(); return null; }
    try { if (localStorage.getItem('tm360-pin-skip') === who) return null; } catch (e) {}
    return 'setup';
  }
  async setPin(pin, again) {
    if (!isValidPin(pin)) return 'Use 4 to 6 digits, not all the same or in a row.';
    if (pin !== again) return 'The two PINs don’t match.';
    await savePin(this.state.pinUser, pin);
    this.setState({pin:null});
    this.toast('PIN set · use it to unlock next time');
    return null;
  }
  async unlock(pin) {
    const r = await checkPin(this.state.pinUser, pin);
    if (r.result === 'ok') { this.setState({pin:null}); return null; }
    if (r.result === 'wrong') return 'Wrong PIN · ' + r.left + (r.left === 1 ? ' try' : ' tries') + ' left';
    this.signOut();
    this.setState({loginErr:'Too many wrong PINs. Sign in with your password.'});
    return null;
  }
  skipPin() { try { localStorage.setItem('tm360-pin-skip', this.state.pinUser); } catch (e) {} this.setState({pin:null}); }
  pinLockIfIdle(hiddenAt) { if (hiddenAt && Date.now() - hiddenAt > LOCK_AFTER_MS && this.state.auth && pinFor(this.state.pinUser)) { clearUnlocked(); this.setState({pin:'lock'}); } }
  turnOffPin() { clearPin(); try { localStorage.setItem('tm360-pin-skip', this.state.pinUser); } catch (e) {} this.setState({menu:false}); this.toast('PIN turned off on this device'); }

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
    const srqN = s.requisitions.filter(q => q.st === 'pending' || q.st === 'partial').length, waitN = s.jobs.filter(j => j.s < 7 && !this.materialsReady(j)).length;
    const rptN = (s.reports || []).filter(r => r.by !== this.me().k && this.reportVisibleTo(r, this.me().k) && !(r.readBy || {})[this.me().k]).length;
    const lowN = s.stock.filter(i => i.q < i.min).length, finQ = s.reqs.filter(q => q.st === 'pending' && q.step === 3).length, myOpen = s.tasks.filter(t => t.who === this.me().k && t.st !== 'done' && t.kind !== 'brief').length;
    // Each portal shows only what that person uses every day; everything else waits under "More".
    const mob = ['ceomobile','Mobile app','phone',0,{mobileRole:role}];
    const company = [['briefing','Monday Briefing','presentation'],['calendar','Calendar','calendar'],['projects','Projects','folder'],['documents','Documents','paperclip'],['notifications','Notifications','bell',unread],mob,['settings','Settings','settings']];
    const N = {
      ceo:[['Every day',[['dashboard','Dashboard','grid'],['today','My work','checkSquare',myOpen],['briefing','Monday Briefing','presentation'],['meetings','Calendar','calendar'],['reporting','Reports','fileText',rptN],['requests','Approvals','banknote',myReq],['projects','Projects','folder'],['clients','Clients & leads','users'],['finance','Finance & Invoices','chart']]],
        ['More',[['calendar','Calendar','calendar'],['notifications','Notifications','bell',unread],['proposals','Sales & Proposals','clipboard'],['production','Production','printer'],['procurement','Procurement','cart'],['store','Store & Inventory','package'],['requisitions','Store requisitions','clipboard',srqN],['movements','Stock ledger','receipt'],['logistics','Logistics','truck'],['staff','Staff & Reports','user'],['rooms','Meeting rooms','calendar'],['documents','Documents','paperclip'],['ceomobile','Mobile apps','phone',0,{mobileRole:'ceo'}],['field','Field capture app','camera'],...(this.canSetup() ? [['company','Company setup','settings']] : []),...(this.isAdmin() ? [['users','Users & access','shield']] : []),['settings','Settings','settings']], true]],
      staff:[['My work',[['staffportal','My Day','home'],['meetings','Calendar','calendar'],['reporting','Reports','fileText',rptN],['today','My work','checkSquare',myOpen],['requests','My requests','banknote'],['field','Field capture','camera']]],
        ['More',[['briefing','Monday Briefing','presentation'],['calendar','Calendar','calendar'],['projects','Projects','folder'],['rooms','Meeting rooms','calendar'],['documents','Documents','paperclip'],['notifications','Notifications','bell',unread],mob,['settings','Settings','settings']], true]],
      finance:[['Finance',[['financeportal','My queue','wallet',finQ],['meetings','Calendar','calendar'],['reporting','Reports','fileText',rptN],['briefing','Monday Briefing','presentation'],['today','My work','checkSquare',myOpen],['finance','Finance','chart'],['invoices','Invoices','fileText'],['cashbook','Cash book','receipt'],['petty','Petty cash','wallet'],['freports','Finance reports','pie'],['float','Float','wallet'],['requests','Requests & Floats','banknote']]],
        ['More',[['proposals','Proposals','clipboard'],['procurement','Procurement','cart'],...company], true]],
      reception:[['Front office',[['reception','Front desk','message'],['meetings','Calendar','calendar'],['reporting','Reports','fileText',rptN],['today','My work','checkSquare',myOpen],['rooms','Meeting rooms','calendar'],['calendar','Calendar','calendar'],['clients','Client enquiries','users']]],
        ['More',[['staff','Staff directory','user'],['briefing','Monday Briefing','presentation'],['documents','Documents','paperclip'],['notifications','Notifications','bell',unread],mob,['settings','Settings','settings']], true]],
      store:[['Store',[['storekeeper','My store','home',lowN],['today','My work','checkSquare',myOpen],['requisitions','Requisitions','clipboard',srqN],['store','Inventory','package'],['movements','Stock ledger','receipt'],['procurement','Procurement','cart']]],
        ['More',[['production','Production','printer'],['logistics','Logistics','truck'],...company], true]],
      production:[['Printing',[['printshop','Print floor','printer',waitN],['today','My work','checkSquare',myOpen],['production','Production jobs','checkSquare'],['requisitions','Store requisitions','clipboard']]],
        ['More',[['store','Inventory','package'],['procurement','Procurement','cart'],...company], true]]
    };
    // The Personal Assistant runs Management's diary and records purchase orders; no money.
    N.pa = [['Office',[['meetings','Calendar','calendar'],['reception','Front desk','message'],['projects','Projects','folder'],['clients','Clients & leads','users'],['today','My work','checkSquare',myOpen],['reporting','Reports','fileText',rptN]]]];
    // Department portals: their dashboard first, then what that department works with.
    const myReqs = ['requests','My requests','banknote'], deptMore = [['meetings','Calendar','calendar'],['reporting','Reports','fileText',rptN],...(this.myDept() && this.isManagerOf(this.myDept()) ? [['briefing','Monday Briefing','presentation']] : []),['briefing','Monday Briefing','presentation'],['calendar','Calendar','calendar'],['rooms','Meeting rooms','calendar'],['settings','Settings','settings']];
    N.clientservice = [['Client Service',[['dept','Client Service','home'],['today','My work','checkSquare',myOpen],['clients','Clients & leads','users'],['proposals','Proposals','clipboard'],['projects','Projects','folder'],myReqs]],['More',deptMore,true]];
    N.creative = [['Creative',[['dept','Creative','home'],['today','My work','checkSquare',myOpen],['projects','Projects','folder'],myReqs]],['More',deptMore,true]];
    N.operations = [['Operations',[['dept','Operations','home'],['today','My work','checkSquare',myOpen],['projects','Projects','folder'],myReqs]],['More',[['field','Field capture app','camera'], ...deptMore],true]];
    // The General Manager sees what Management sees, without company setup and accounts.
    N.gm = N.ceo.map(([t, items, more]) => [t, items.filter(i => !['company','users','field','ceomobile'].includes(i[0])).map(i => (i[0] === 'requests' ? ['requests','Approvals','banknote',s.reqs.filter(q => q.st === 'pending' && q.step === 2).length] : i[0] === 'finance' ? ['finance','Invoices','fileText'] : i)), more]);
    let G = N[role] || N.ceo;
    // Sections the administrator switched off are hidden everywhere.
    // Notifications open from the bell (and the Alerts tab on phones), not from the side menu.
    G = G.map(([t, items, more]) => [t, items.filter(i => !this.isOff(i[0]) && i[0] !== 'notifications' && i[0] !== 'settings' && !(i[0] === 'briefing' && !this.canBriefing()) && !(s.embed && i[0] === 'ceomobile')), more]).filter(g => g[1].length);
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
  av(k) { const p = this.PPL[k] || (this.people && this.people[k]) || [String(k || '—'),'#6E6A7C']; return {i:k,n:p[0],c:p[1],first:p[0].split(' ')[0]}; }
  proj(id) { return this.state.projects.find(p => p.id === id) || {id:'',name:'General',client:'Company'}; }
  tone(t) { return ({amber:['#FBF1DD','#8A6414'],purple:['#EFE8FA','#5A2FA8'],green:['#E6F4EC','#1F7549'],blue:['#E9EFFA','#3559A8'],dark:['#EDE8F6','#2B1459'],red:['#FBEDEE','#B23A46']})[t] || ['#F4F1FA','#2B1459']; }
  // Pages a portal may open: parked sections and (outside Management, the GM and Finance) the company dashboard send people to their own home.
  allowedPage(role, page) {
    const home = (this.ROLES[role] || ROLES.ceo).home;
    if (!page || PARKED.includes(page) || (this.state && this.isOff(page))) return home;
    if (page === 'dashboard' && !['ceo','gm','finance'].includes(role)) return home;
    if (page === 'crm') return 'clients';
    // Tasks and the daily to-do are one page: My work.
    if (page === 'tasks') return 'today';
    if (page === 'briefing' && this.state && !this.canBriefing()) return home;
    // Finance tools: Float for Management and Finance; the rest also for the GM.
    if (page === 'finance' && !['ceo','gm','finance'].includes(role)) return home;
    // Separate finance pages belong to the Finance portal; Management and the GM use the tabs on Finance.
    if (['invoices','cashbook','freports','float','petty'].includes(page) && role !== 'finance') return ['ceo','gm'].includes(role) ? 'finance' : home;
    return page;
  }
  // Opens a finance tool: its own page in the Finance portal, a tab on Finance for Management and the GM.
  finGo(tab, extra) {
    if ((this.state.role || 'ceo') === 'finance') this.go({ invoices: 'invoices', cash: 'cashbook', reports: 'freports', float: 'float', petty: 'petty' }[tab] || 'finance', extra);
    else this.go('finance', Object.assign({ finTab: tab }, extra || {}));
  }
  go(page, extra) {
    page = this.allowedPage(this.state.role || 'ceo', page);
    const s = this.state, x = extra || {}, same = page === s.page && (!x.projectId || x.projectId === s.projectId);
    this.setState(Object.assign({page,menu:false,drawer:false,cmd:false,more:false,tip:-1,navDir:this.isTab(page) ? 'tab' : 'push'}, x));
    if (!same || (x.jobId && x.jobId !== s.jobId)) this.pushHistory({page, projectId:x.projectId || s.projectId, jobId:x.jobId || s.jobId});
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
      this.setState({page:st.page, projectId:st.projectId || s.projectId, jobId:st.jobId || s.jobId, navDir:'back', tip:-1});
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
  notify(n) {
    this.setState(s => ({notes:[Object.assign({id:Date.now()+Math.random(),read:false,time:this.now()}, n), ...s.notes]}));
    this.queueOutside(n);
  }
  // Alerts that should reach people outside the system (WhatsApp, SMS, email) go to an outbox.
  // A server function sends them once the gateway keys are set; until then each one can be sent by hand.
  alertKind(n) { const g = n.go || ''; return g === 'clients' ? 'clients' : g === 'requests' ? 'approvals' : g === 'finance' ? 'payments' : /design/i.test(n.t || '') ? 'designs' : g === 'today' || g === 'tasks' ? 'tasks' : 'other'; }
  queueOutside(n) {
    const c = this.state.company || {}, N = Object.assign({ wa: true, sms: false, email: false, events: { clients: true, approvals: true, designs: true, payments: true, tasks: false } }, c.notify || {});
    const phone = (c.phones || {})[n.to], kind = this.alertKind(n);
    if (!n.to || !phone || !(N.events || {})[kind] || !(N.wa || N.sms)) return;
    const msg = { id: 'OB' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), to: n.to, phone, ch: N.wa ? 'whatsapp' : 'sms', kind, text: 'Trinity Mark 360 · ' + n.t + (n.s ? '\n' + n.s : ''), st: 'queued', at: dayKey(0) + ' ' + this.now() };
    this.setState(s => ({ outbox: [msg, ...(s.outbox || [])].slice(0, 200) }));
  }
  log(ic, tone, t, sub) { this.setState(s => ({activity:[{time:this.now(),ic,tone,t,s:sub}, ...s.activity].slice(0,7)})); }
  smooth(pts) { let d = 'M' + pts[0][0] + ' ' + pts[0][1]; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i-1] || pts[i], p1 = pts[i], p2 = pts[i+1], p3 = pts[i+2] || p2; d += ' C' + (p1[0]+(p2[0]-p0[0])/6).toFixed(1) + ' ' + (p1[1]+(p2[1]-p0[1])/6).toFixed(1) + ' ' + (p2[0]-(p3[0]-p1[0])/6).toFixed(1) + ' ' + (p2[1]-(p3[1]-p1[1])/6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1); } return d; }
  spark(vals) { const mn = Math.min(...vals), mx = Math.max(...vals), r = mx - mn || 1; const pts = vals.map((v,i) => [3 + i*(84/(vals.length-1)), 27 - (v-mn)/r*22]); const l = this.smooth(pts); return {l, f:l + ' L87 30 L3 30 Z'}; }

  openModal(act, preset) {
    // Invoices open the full invoice editor (works on the phone too).
    if (act === 'invoice') { if (!this.canInvoice()) { this.toast('Invoices are created by Management, the GM and Finance'); return; } this.finGo('invoices', {invEdit:'new'}); return; }
    const PO = this.state.projects.filter(p => p.st !== 'done').map(p => ({v:p.id,l:p.client + ' · ' + p.name}));
    const PP = Object.keys(this.PPL).map(k => ({v:k,l:this.PPL[k][0]}));
    const O = a => a.map(x => ({v:x,l:x}));
    const defs = {
      task:{title:'New task',sub:'Every task is linked to a project, an owner and a deadline. The person is notified.',submit:'Create task',fields:[{k:'t',l:'Task',ph:'e.g. Print 500 flyers',req:1},{k:'p',l:'Project',opts:PO},{k:'who',l:'Assign to',opts:this.assignable().map(k => ({v:k, l:this.av(k).n}))},{k:'due',l:'Deadline',ph:'e.g. Fri 25'},{k:'pri',l:'Priority',opts:[{v:'high',l:'High'},{v:'med',l:'Medium'},{v:'low',l:'Low'}]}]},
      req:{title:'Request money',sub:'Choose the kind of request.',submit:'Continue',fields:[{k:'type',l:'Type of request',opts:[{v:'project',l:'Project request'},{v:'internal',l:'Internal office request'},{v:'emergency',l:'Emergency request'},...((this.state.role || 'ceo') === 'ceo' ? [{v:'management',l:'Management request'}] : [])]}]},
      work:{title:'New work',sub:'Record work that came in and choose who in Client Service follows it up. They are notified.',submit:'Create lead',fields:[{k:'c',l:'Client',ph:'Company name',req:1},{k:'t',l:'What do they need?',ph:'e.g. Roadshow in 6 regions',req:1},{k:'owner',l:'Follow-up by',opts:(this.isTop() || this.isManagerOf('clientservice') ? this.teamOf('clientservice') : [this.me().k]).map(k => ({v:k,l:this.av(k).n}))},{k:'src',l:'Came in by',opts:O(SOURCES)},{k:'v',l:'Estimated value (TZS M)',type:'number',ph:'e.g. 80'},{k:'contact',l:'Contact person',ph:'Name and phone'},{k:'note',l:'Notes',ph:'What was asked, deadlines, budget'}]},
      customer:{title:'Add customer',sub:'Everything an invoice needs about the client. The PO number, PO date and vendor number come later, per project.',submit:'Add customer',wide:true,fields:[{k:'n',l:'Company name',ph:'e.g. CRDB Bank PLC',req:1},{k:'contact',l:'Contact person',ph:'Name'},{k:'title',l:'Contact title',ph:'e.g. Head of Marketing'},{k:'phone',l:'Phone',ph:'+255 7xx xxx xxx'},{k:'email',l:'Email',ph:'name@company.co.tz'},{k:'tin',l:'TIN',ph:'100-000-000'},{k:'vrn',l:'VRN',ph:'10-000000-X'},{k:'address',l:'Physical address',ph:'Street, building, area'},{k:'box',l:'P.O. Box',ph:'e.g. P.O. Box 268'},{k:'city',l:'City',ph:'Dar es Salaam'},{k:'owner',l:'Account owner',opts:this.teamOf('clientservice').map(k => ({v:k,l:this.av(k).n}))}]},
      brief:{title:'Send brief to Creative',sub:'The Creative lead receives it and assigns a designer. You are told when artwork goes to the client.',submit:'Send brief',fields:[{k:'t',l:'What is needed',ph:'e.g. Stage backdrop and 3 roll-up banners',req:1},{k:'p',l:'Project',opts:PO},{k:'place',l:'For',opts:O(['Indoor event','Outdoor event','Print','Digital'])},{k:'note',l:'Brief memo',ph:'Theme, sizes, client wishes, deadlines'},{k:'due',l:'Needed by',ph:'e.g. Fri 21'}]},
      reqProject:{title:'Project request',sub:'Goes to GM → Finance → Management → Finance pays.' + (this.smallLimit() ? ' Up to ' + this.fmtT(this.smallLimit()) + ', Management is not needed.' : ''),submit:'Submit request',fields:[{k:'amt',l:'Amount (TZS)',type:'number',ph:'300000',req:1},{k:'cat',l:'Category',opts:O(['Team','Operations','Supplies'])},{k:'p',l:'Project',opts:PO},{k:'purpose',l:'Purpose',ph:'What is the money for?',req:1},{k:'need',l:'Needed by',ph:'e.g. Friday'}]},
      reqInternal:{title:'Internal office request',sub:'Goes to GM → Finance → Management → Finance pays.' + (this.smallLimit() ? ' Up to ' + this.fmtT(this.smallLimit()) + ', Management is not needed.' : ''),submit:'Submit request',fields:[{k:'title',l:'Title',ph:'e.g. Office internet, May',req:1},{k:'amt',l:'Amount (TZS)',type:'number',ph:'150000',req:1},{k:'purpose',l:'Purpose',ph:'What is it for and why?',req:1},{k:'need',l:'Needed by',ph:'e.g. Friday'},...(this.fl().allocs.some(a => a.to.indexOf('office:') === 0) ? [{k:'alloc',l:'From the office float',opts:this.fl().allocs.filter(a => a.to.indexOf('office:') === 0).map(a => ({v:a.to,l:a.to.slice(7) + ' · ' + this.fmtT(this.allocUse(a).left) + ' left'}))}] : [])]},
      reqEmergency:{title:'Emergency request',sub:'Goes to GM → Management → Finance pays. Use only when it cannot wait.',submit:'Submit emergency',fields:[{k:'title',l:'Title',ph:'e.g. Generator repair on site',req:1},{k:'amt',l:'Amount (TZS)',type:'number',ph:'250000',req:1},{k:'p',l:'Project',opts:[{v:'',l:'Not for a project'}, ...PO]},{k:'purpose',l:'What happened, and what is it for?',ph:'Explain the emergency',req:1}]},
      reqMgmt:{title:'Management request',sub:'Finance checks, then pays.',submit:'Submit request',fields:[{k:'title',l:'Title',ph:'e.g. Client meeting expenses',req:1},{k:'amt',l:'Amount (TZS)',type:'number',ph:'500000',req:1},{k:'purpose',l:'Purpose',ph:'What is it for?',req:1}]},
      lead:{title:'New lead',sub:'Leads move Lead → Qualified → Proposal → Negotiation → Won.',submit:'Add lead',fields:[{k:'c',l:'Client',ph:'Company name',req:1},{k:'t',l:'Opportunity',ph:'e.g. Product launch event',req:1},{k:'v',l:'Estimated value (TZS M)',type:'number',ph:'80'},{k:'src',l:'Source',opts:O(['Website','Referral','Tender','Existing client','Walk-in'])}]},
      project:{title:'New project',sub:'Starts at the brief. Operations sets the Project Manager, budget and value later.',submit:'Create project',fields:[{k:'client',l:'Client',opts:(this.state.customers || []).map(c => ({v:c.n,l:c.n})),req:1},{k:'name',l:'Project name',ph:'e.g. Brand activation',req:1},{k:'due',l:'Deadline',ph:'e.g. 30 Oct'}]},
      issue:{title:'Issue stock',sub:'',submit:'Issue from store',fields:[{k:'q',l:'Quantity',type:'number',ph:'1',req:1},{k:'p',l:'For project',opts:PO},{k:'who',l:'Collected by',opts:PP}]},
      receive:{title:'Receive stock',sub:'',submit:'Receive into store',fields:[{k:'q',l:'Quantity received',type:'number',ph:'10',req:1},{k:'sup',l:'Supplier',ph:'e.g. Chapa Supplies'}]},
      invoice:{title:'New invoice',sub:'Saved as a draft until you send it.',submit:'Create invoice',fields:[{k:'p',l:'Project',opts:PO},{k:'v',l:'Amount (TZS M)',type:'number',ph:'25',req:1},{k:'due',l:'Due date',ph:'e.g. 15 Oct'}]},
      proposal:{title:'New proposal',sub:'Starts as a draft, then goes to internal review.',submit:'Create draft',fields:[{k:'c',l:'Client',ph:'Client name',req:1},{k:'t',l:'Service / scope',ph:'e.g. Product launch activation',req:1},{k:'v',l:'Value (TZS M)',type:'number',ph:'80'},{k:'valid',l:'Valid until',ph:'e.g. 30 Oct'},{k:'own',l:'Owner',opts:PP}]},
      job:{title:'New production job',sub:'Moves Brief → Design → Approval → Production → QC → Packaging → Delivery.',submit:'Create job',fields:[{k:'t',l:'Job',ph:'e.g. Roll-up banners × 10',req:1},{k:'p',l:'Project',opts:PO},{k:'mat',l:'Materials',ph:'e.g. PET film, roll-up stands'},{k:'qty',l:'Quantity',type:'number',ph:'10'},{k:'due',l:'Deadline',ph:'e.g. Fri 25'},{k:'who',l:'Assigned to',opts:PP}]},
      trip:{title:'Schedule trip',sub:'Every trip is linked to a project.',submit:'Schedule trip',fields:[{k:'what',l:'Load',ph:'e.g. 4 gazebo tents',req:1},{k:'p',l:'Project',opts:PO},{k:'to',l:'Destination',ph:'e.g. Arusha',req:1},{k:'veh',l:'Vehicle',opts:O(['T 482 DXY','T 119 DKL','T 733 DGH'])},{k:'drv',l:'Driver',opts:O(['Amani Juma','Hassan Rajab'])},{k:'date',l:'Date & time',ph:'e.g. Fri 25 · 06:00'}]},
      doc:{title:'Upload document',sub:'Stored against a project, with permissions.',submit:'Upload',fields:[{k:'file',l:'File',type:'file'},{k:'n',l:'File name',ph:'e.g. Signed contract.pdf',req:1},{k:'type',l:'Type',opts:O(['Contract','Proposal','Quotation','Invoice','Receipt','Design','Brief','Report','Client approval','Purchase'])},{k:'p',l:'Project',opts:PO}]},
      item:{title:'New stock item',sub:'Adds the item to the store. The opening quantity is recorded in the stock ledger.',submit:'Add item',fields:[{k:'n',l:'Item name',ph:'e.g. Vinyl 1.37m gloss',req:1},{k:'sku',l:'Code (SKU)',ph:'e.g. VNL-137G',req:1},{k:'cat',l:'Category',opts:O(['Print media','Consumables','Apparel','Display','Boards','Equipment','Stationery','Other'])},{k:'u',l:'Unit',ph:'e.g. rolls, pcs, L',req:1},{k:'q0',l:'Opening quantity',type:'number',ph:'0'},{k:'min',l:'Reorder at (minimum)',type:'number',ph:'5'},{k:'cost',l:'Unit cost (TZS)',type:'number',ph:'185000'},{k:'loc',l:'Bin / location',ph:'e.g. A-02'}]},
      srq:{title:'Request from store',sub:'The storekeeper issues it and charges it to the project.',submit:'Send to store',fields:[{k:'sku',l:'Item',opts:this.state.stock.map(i => ({v:i.sku,l:i.n + ' · ' + i.q + ' ' + i.u + ' in store'}))},{k:'q',l:'Quantity',type:'number',ph:'1',req:1},{k:'p',l:'For project',opts:[{v:'',l:'General use'}].concat(PO)},{k:'purpose',l:'Purpose',ph:'e.g. Sample prints for client'}]},
      meet:{title:'Schedule meeting',sub:'Participants get a reminder. Actions become tasks.',submit:'Schedule',fields:[{k:'n',l:'Title',ph:'e.g. Production review',req:1},{k:'d',l:'Day',opts:O(['Mon 21','Tue 22','Wed 23','Thu 24','Fri 25','Sat 26'])},{k:'t',l:'Time',ph:'e.g. 10:00'},{k:'k',l:'Type',opts:[{v:'meet',l:'Internal meeting'},{v:'client',l:'Client meeting'},{v:'proj',l:'Project'}]}]},
      proc:{title:'Purchase request',sub:'Request → Approved → Delivered. The store then receives it.',submit:'Submit purchase request',fields:[{k:'t',l:'Item',ph:'e.g. Vinyl rolls × 10',req:1},{k:'p',l:'Project',opts:PO},{k:'v',l:'Estimated cost (TZS M)',type:'number',ph:'1.5'}]}
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
    if (m.act === 'task') this.createTask(f);
    if (m.act === 'brief') this.createBrief(f);
    if (m.act === 'work') this.newWork(f);
    if (m.act === 'customer') this.addCustomer(f);
    if (m.act === 'req') { const next = {project:'reqProject', internal:'reqInternal', emergency:'reqEmergency', management:'reqMgmt'}[f.type] || 'reqProject'; const keep = Object.assign({who:f.who}, f.p ? {p:f.p} : {}); this.setState({modal:null}); setTimeout(() => this.openModal(next, keep), 0); return; }
    if (/^req(Project|Internal|Emergency|Mgmt)$/.test(m.act)) this.createRequest(Object.assign({}, f, {type:{reqProject:'project', reqInternal:'internal', reqEmergency:'emergency', reqMgmt:'management'}[m.act]}));
    if (m.act === 'lead') { this.setState(x => ({leads:[{id:'L'+Date.now(),c:f.c,t:f.t,v:+f.v||0,s:0,src:f.src}, ...x.leads]})); this.toast('Lead added · ' + f.c); this.log('users','blue','New lead · ' + f.c, f.t); }
    if (m.act === 'project') { const id = this.newProject(f); if (typeof id === 'string' && id.indexOf('PRJ') === 0) setTimeout(() => this.go('project',{projectId:id}), 50); }
    if (m.act === 'issue') { const q = Math.max(0, +f.q || 0); this.setState(this.stockChange([{sku:f.sku, qty:-q, type:'issue'}], 'Direct issue · ' + this.av(f.who).n, f.p, '')); this.toast('Issued ' + q + ' ' + f.u + ' of ' + f.n + ' to ' + P.client); this.log('package','dark','Store issued ' + q + ' ' + f.u + ' · ' + f.n, P.name + ' · ' + this.av(f.who).first); }
    if (m.act === 'receive') { const q = Math.max(0, +f.q || 0); this.setState(this.stockChange([{sku:f.sku, qty:q, type:'receipt'}], 'Received' + (f.sup ? ' · ' + f.sup : ''), '', '')); this.toast('Received ' + q + ' ' + f.u + ' · ' + f.n); this.log('package','green','Stock received · ' + f.n, q + ' ' + f.u + (f.sup ? ' from ' + f.sup : '')); }
    if (m.act === 'invoice') { const id = this.nextId('INV', s.invoices); this.setState(x => ({invoices:[{id,c:P.client,p:f.p,v:+f.v||0,st:'draft',due:f.due||'—'}, ...x.invoices]})); this.toast('Invoice ' + id + ' saved as draft'); }
    if (m.act === 'proc') { const id = this.nextId('PR', s.proc); this.setState(x => ({proc:[{id,t:f.t,p:f.p,v:+f.v||0,s:0,sup:'—'}, ...x.proc]})); this.toast('Purchase request ' + id + ' submitted'); }
    if (m.act === 'proposal') { const id = this.nextId('PRO', s.proposals); this.setState(x => ({proposals:[{id,c:f.c,t:f.t,v:+f.v||0,s:0,own:f.own,valid:f.valid||'30 days'}, ...x.proposals]})); this.toast('Proposal ' + id + ' saved as draft'); this.log('clipboard','purple','Proposal drafted · ' + f.c, f.t); }
    if (m.act === 'job') { const id = this.nextId('JOB', s.jobs); this.setState(x => ({jobs:[{id,t:f.t,p:f.p,mat:f.mat||'—',qty:+f.qty||1,s:0,due:f.due||'TBC',who:f.who,cost:0,waste:0}, ...x.jobs]})); this.toast('Production job ' + id + ' created'); this.log('printer','purple','Production job created · ' + f.t, P.client); }
    if (m.act === 'trip') { const id = this.nextId('TRP', s.trips); this.setState(x => ({trips:[{id,what:f.what,p:f.p,to:f.to,veh:f.veh,drv:f.drv,s:0,date:f.date||'TBC'}, ...x.trips]})); this.toast('Trip ' + id + ' scheduled · ' + f.to); this.log('truck','dark','Trip scheduled to ' + f.to, f.what + ' · ' + f.veh); }
    if (m.act === 'doc') { const fl = f._file || {}; this.setState(x => ({docs:[{id:Date.now(),n:f.n,type:f.type,p:f.p,by:this.me().k,d:'Today',sz:fl.size ? this.fmtSize(fl.size) : '—',url:fl.url || '',path:fl.path || '',mime:fl.mime || ''}, ...x.docs]})); this.toast('Uploaded · ' + f.n); this.log('paperclip','blue','Document uploaded · ' + f.type, f.n); }
    if (m.act === 'item') {
      const sku = String(f.sku).trim().toUpperCase();
      if (s.stock.some(i => i.sku === sku)) { this.setState({modalErr:'An item with code ' + sku + ' already exists.'}); return; }
      const q0 = Math.max(0, Math.round(+f.q0 || 0));
      this.setState(x => ({stock:[...x.stock, {sku, n:String(f.n).trim(), cat:f.cat, q:0, min:Math.max(0, Math.round(+f.min || 0)), u:String(f.u).trim(), loc:String(f.loc || '').trim() || '—', cost:Math.max(0, +f.cost || 0)}]}));
      if (q0) this.setState(this.stockChange([{sku, qty:q0, type:'receipt'}], 'Opening stock', '', ''));
      this.toast(String(f.n).trim() + ' added to the store');
      this.setState({modal:null}); return;
    }
    if (m.act === 'srq') { this.newRequisition(f); this.setState({modal:null}); return; }
    if (m.act === 'meet') { this.setState(x => ({events:[...x.events, {id:Date.now(),d:f.d,t:f.t||'09:00',n:f.n,k:f.k}]})); this.toast('Meeting scheduled · ' + f.d + ' ' + (f.t || '09:00')); this.notify({ic:'calendar',t:'Meeting scheduled · ' + f.n,s:f.d + ' ' + (f.t || '09:00'),go:'calendar'}); }
    this.setState({modal:null});
  }
  // Who approves a request at each step of the chain (index = step).
  approverAt(r, step) { return [r.who, this.proj(r.p).pm || 'SK', 'GN', 'RT', 'DK', 'RT'][step]; }
  // Management can act at any step; Finance verifies at step 3; the PM and Operations at their own step.
  // Management can act at any position; the GM, Finance and (older requests) the Project Manager at their own.
  canAct(r) {
    if (r.st !== 'pending') return false;
    const role = this.state.role || 'ceo';
    return role === 'ceo' || (role === 'gm' && r.step === 2) || (role === 'finance' && r.step === 3) || (r.step === 1 && this.me().k === this.approverAt(r, 1));
  }

  canPay() { const role = this.state.role || 'ceo'; return role === 'ceo' || role === 'finance'; }
  // Requests up to this amount need only the Project Manager and Finance (0 = every request takes all steps).
  // Project stage 1–5 (older projects stored 1–15).
  stageOf(p) { return FLOW.indexOf(this.flowOf(p)) + 1; }
  smallLimit() { const c = this.state.company || {}; return c.smallLimit == null ? 200000 : +c.smallLimit || 0; }
  isSmall(r) { const lim = this.smallLimit(); return lim > 0 && r.amt <= lim; }
  // Positions this request does not go through: by its type, and Management for small project or office requests.
  skipsFor(r) {
    const t = REQ_TYPES[r.type || 'project'] || REQ_TYPES.project, skip = t.skip.slice();
    if ((r.type || 'project') !== 'emergency' && this.isSmall(r) && !skip.includes(4)) skip.push(4);
    return skip;
  }
  // The next position after `step` that this request goes through (5 = approved, ready to pay).
  nextStep(r, step) { const skip = this.skipsFor(r); let n = step + 1; while (n < 5 && skip.includes(n)) n++; return n; }
  // Every new money request goes through here: it starts at its first approver, who is notified.
  createRequest(f) {
    const s = this.state, type = REQ_TYPES[f.type] ? f.type : 'project', amt = +f.amt || 0, who = f.who || this.me().k;
    const id = this.nextId('REQ', s.reqs), draft = {type, amt};
    const step = this.nextStep(draft, 0), log = [this.now()];
    for (let i = 1; i < step; i++) log.push('Not needed');
    const r = {id, type, who, amt, cat:type === 'project' ? (f.cat || 'Operations') : REQ_TYPES[type].l.replace(' request', ''), title:(f.title || '').trim(), purpose:(f.purpose || '').trim(), p:f.p || '', alloc:f.alloc || '', need:f.need || (type === 'emergency' ? 'Today' : 'This week'), step, st:step >= 5 ? 'approved' : 'pending', log};
    this.setState(x => ({reqs:[r, ...x.reqs], reqSel:id}));
    const to = step >= 5 ? 'RT' : this.approverAt(r, step);
    this.remind(to, step >= 5 ? id + ' is ready to pay' : id + ' needs your approval', 'requests', 'banknote', this.av(who).n + ' · ' + this.fmtT(amt));
    this.toast(id + ' submitted · waiting for ' + (step >= 5 ? 'payment' : this.CHAIN[step]));
    this.log('banknote','amber',this.av(who).first + ' requested ' + this.fmtT(amt), this.reqWhat(r) + ' · ' + id);
    return id;
  }
  // What a request is for, in a few words.
  reqWhat(r) { const t = r.type || 'project'; return t === 'project' ? (r.cat || 'Project') + ' · ' + (this.proj(r.p).name || 'Project') : REQ_TYPES[t].l.replace(' request', '') + ' · ' + (r.title || r.purpose || ''); }
  decide(r, ok) {
    const t = this.now(), skip = [];
    const n = this.nextStep(r, r.step);
    for (let i = r.step + 1; i < n; i++) skip.push(i);
    const last = n >= 5;
    const patch = ok ? (last ? {step:5, st:'approved'} : {step:n}) : {st:'rejected'};
    this.setState(x => ({reqs:x.reqs.map(q => q.id === r.id ? Object.assign({}, q, patch, {log:[...q.log, t, ...(ok ? skip.map(() => 'Not needed') : [])]}) : q)}));
    const next = ok ? (last ? 'RT' : this.approverAt(r, n)) : r.who;
    if (ok) this.remind(next, last ? r.id + ' is approved · ready to pay' : r.id + ' needs your approval', 'requests', 'banknote', this.av(r.who).n + ' · ' + this.fmtT(r.amt));
    else this.remind(r.who, r.id + ' was not approved', 'requests', 'x', 'Rejected by ' + this.me().n);
    this.toast(ok ? r.id + (last ? ' approved · sent to Finance for payment' : (r.step === 3 ? ' verified' : ' approved') + ' · sent to ' + this.CHAIN[n]) : r.id + ' rejected · ' + this.av(r.who).first + ' notified');
    this.log(ok ? 'check' : 'x', ok ? 'green' : 'red', this.me().n + (ok ? ' approved ' : ' rejected ') + this.fmtT(r.amt), this.reqWhat(r) + ' · ' + r.id);
  }
  payReq(r) {
    const t = this.now();
    this.setState(x => ({reqs:x.reqs.map(q => q.id === r.id ? Object.assign({}, q, {step:6,st:'paid',paidOn:dayKey(0),log:[...q.log,t]}) : q), staff:x.staff.map(p => p.k === r.who ? Object.assign({}, p, {fl:p.fl + r.amt}) : p)}));
    this.toast('Paid · float opened for ' + this.av(r.who).n);
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

Object.assign(TrinityApp.prototype, { renderVals, pageVals, pageVals2, overlayVals, storeVals, todayVals, deptVals, crmVals, projectVals, financeVals, reportVals, homeVals, officeVals, reportingVals, pettyVals, briefingVals }, storeMethods, adminMethods, todoMethods, deptMethods, crmMethods, projectMethods, financeMethods, reportMethods, officeMethods, reqFlowMethods, flowMethods, reportChannel, pettyMethods, briefingMethods);
