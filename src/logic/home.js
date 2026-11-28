// The company home (Management, GM, Finance): a few figures, what needs attention, pipeline,
// projects by stage, cash this month and recent activity.
export function homeVals(s) {
  const role = s.role || 'ceo';
  // The PA sees Management's overview, to run Management's day.
  if (!['ceo', 'gm', 'finance', 'pa'].includes(role)) return { HD: null };
  const me = this.me(), open = (s.leads || []).filter(l => this.leadStage(l) < 5), live = s.projects.filter(p => p.st !== 'done');
  const myAppr = this.visibleReqs(s).filter(r => r.st === 'pending' && this.canAct(r) && (role !== 'ceo' || r.step === 4));
  const unpaid = (s.invoices || []).filter(i => i.st !== 'paid' && i.st !== 'draft' && i.st !== 'cancelled');
  const owed = unpaid.reduce((a, i) => a + i.v * 1e6 - (i.payments || []).filter(p => p.ok).reduce((x, p) => x + p.amt, 0), 0);
  const att = [
    ...live.filter(p => this.canApproveBudget(p)).map(p => ({ tag: 'Budget', tone: 'purple', t: 'Approve budget · ' + p.client, s: p.name + ' · ' + this.fmtT((p.budget || {}).value || 0), on: () => this.go('project', { projectId: p.id }) })),
    ...myAppr.slice(0, 4).map(r => ({ tag: 'Approve', tone: 'amber', t: this.reqWhat(r) + ' · ' + this.fmtT(r.amt), s: this.av(r.who).n, on: () => this.go('requests', { reqSel: r.id, reqFilter: 'me' }) })),
    ...(s.invoices || []).filter(i => i.lines && !i.signed && this.canSign(i)).map(i => ({ tag: 'Sign', tone: 'purple', t: 'Invoice ' + i.id + ' · ' + i.c, s: this.fmtM(i.v), on: () => this.finGo('invoices', { invSel: i.id }) })),
    ...(role === 'ceo' ? (s.invoices || []).filter(i => i.st !== 'cancelled' && (i.payments || []).some(p => !p.ok)).map(i => ({ tag: 'Confirm', tone: 'green', t: 'Payment received · ' + i.c, s: i.id, on: () => this.finGo('invoices', { invSel: i.id }) })) : []),
    ...unpaid.filter(i => i.st === 'overdue').map(i => ({ tag: 'Overdue', tone: 'red', t: i.c + ' · ' + this.fmtM(i.v), s: i.id + ' · ' + i.due, on: () => this.finGo('invoices', { invSel: i.id }) })),
    ...live.filter(p => p.st === 'late' || p.st === 'risk').map(p => ({ tag: p.st === 'late' ? 'Delayed' : 'At risk', tone: 'red', t: p.client + ' · ' + p.name, s: 'Due ' + p.due + ' · PM ' + (p.pm ? this.av(p.pm).n : 'not chosen'), on: () => this.go('project', { projectId: p.id }) })),
    ...live.filter(p => this.flowOf(p) === 'budget').map(p => ({ tag: 'Budget', tone: 'amber', t: p.client + ' · ' + p.name, s: 'With Operations for the budget', on: () => this.go('project', { projectId: p.id }) }))
  ].slice(0, 7);
  const stages = ['New', 'Contacted', 'Meeting', 'Proposal sent', 'Negotiation'].map((l, i) => { const ls = open.filter(x => this.leadStage(x) === i); return { l, n: ls.length, v: ls.reduce((a, b) => a + (b.v || 0), 0) }; });
  const pmax = Math.max(1, ...stages.map(x => x.n));
  const pstages = [['Brief & design', ['brief', 'design']], ['Proposal & budget', ['proposal', 'budget']], ['Approval', ['approval']], ['Execution', ['execution']]].map(([l, fs]) => ({ l, n: live.filter(p => fs.includes(this.flowOf(p))).length }));
  const hr = new Date().getHours();
  // Today's float, for Management and the GM: the balance, what went out, what waits to be paid and
  // whether Finance has sent today's report. The report opens on the Float page (view only for the GM).
  const fl = (() => {
    if (!['ceo', 'gm'].includes(role) || !this.floatDay) return null;
    const today = this.fToday(), d = this.floatDay(today), W = this.floatWaiting(today), sent = this.floatSent(today);
    const sg = v => (v < 0 ? '−' : '') + this.fmtT(Math.abs(v));
    const asks = role === 'ceo' ? this.fl().asks.filter(a => a.st === 'open').map(a => ({ id: a.id, amt: this.fmtT(a.amt), who: this.av(a.by).n, at: a.at + (a.time ? ' ' + a.time : ''), note: a.note,
      before: this.fmtT(a.balBefore != null ? a.balBefore : d.close), after: this.fmtT((a.balBefore != null ? a.balBefore : d.close) + a.amt),
      approve: () => this.approveFloatAsk(a.id), decline: why => this.declineFloatAsk(a.id, why) })) : [];
    // Card details: who holds the float, the last money from the boss, this month's use, money not yet accounted for.
    const grants = this.fl().grants.slice().sort((x, y) => String(y.at + (y.time || '')).localeCompare(String(x.at + (x.time || '')))), last = grants[0];
    const month = today.slice(0, 7), mStart = month + '-01';
    const gotMonth = grants.filter(g => (g.at || '').slice(0, 7) === month).reduce((x, g) => x + g.amt, 0);
    const byP = this.floatByProject(mStart, today, true), spentMonth = byP.reduce((x, r) => x + r.total, 0);
    const adv = this.floatAdvances(today), advT = adv.reduce((x, r) => x + r.paid, 0);
    const top = this.floatByProject(today, today, true).filter(r => r.total > 0).sort((x, y) => y.total - x.total).slice(0, 3).map(r => ({ name: r.name, t: this.fmtT(r.total) }));
    const fin = this.ROLES.finance || {}, now = new Date();
    const card = { holder: fin.n || 'Finance', since: grants.length ? grants[grants.length - 1].at : '',
      asOf: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' + this.now(),
      last: last ? { amt: this.fmtT(last.amt), at: last.at, by: this.av(last.by).n } : null,
      opened: sg(d.open), in: this.fmtT(d.in), gotMonth: this.fmtT(gotMonth), spentMonth: this.fmtT(spentMonth),
      usedPct: gotMonth ? Math.min(100, Math.round(spentMonth / gotMonth * 100)) : null,
      advN: adv.length, advT: this.fmtT(advT), advOver: adv.filter(r => r.overdue).length, top };
    return { card, asks, balance: sg(d.close), neg: d.close < 0, out: this.fmtT(d.out), waitN: W.n, waitT: this.fmtT(W.total),
      sent: !!sent, sentLine: sent ? 'Sent ' + String(sent.sentAt || '').slice(11) + ' · ' + this.av(sent.by).n : 'Not sent yet',
      open: () => { this.finGo('float', { flView: 'report', flDay: today }); setTimeout(() => { try { const el = document.querySelector('.fl-report'); if (el) el.scrollIntoView({ block: 'start' }); } catch (e) { /* not rendered */ } }, 120); } };
  })();
  return {
    HD: {
      hello: (hr < 12 ? 'Good morning, ' : hr < 17 ? 'Good afternoon, ' : 'Good evening, ') + me.n.split(' ')[0],
      date: new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
      kpis: [
        { l: 'Active projects', v: String(live.length), s: live.filter(p => p.st === 'late' || p.st === 'risk').length + ' need attention', on: () => this.go('projects') },
        { l: 'Open leads', v: String(open.length), s: open.filter(l => this.leadStage(l) >= 3).length + ' with a proposal', on: () => this.go('clients') },
        { l: 'Owed by clients', v: this.fmtM(owed / 1e6), s: unpaid.filter(i => i.st === 'overdue').length + ' overdue', warn: unpaid.some(i => i.st === 'overdue'), on: () => this.finGo('invoices') },
        { l: 'Waiting for you', v: String(myAppr.length), s: myAppr.length ? this.fmtT(myAppr.reduce((a, b) => a + b.amt, 0)) : 'All clear', on: () => this.go('requests') }
      ],
      att, stages: stages.map(x => Object.assign(x, { w: Math.round(x.n / pmax * 100), vt: '' })),
      po: (() => { const ps = live.filter(p => ['approval', 'execution'].includes(this.flowOf(p))); const miss = ps.filter(p => !p.po); return { got: ps.length - miss.length, miss: miss.length, list: miss.slice(0, 5).map(p => ({ t: p.client + ' · ' + p.name, s: this.flowOf(p) === 'execution' ? 'Work started without a PO' : 'Waiting for approval', on: () => this.go('project', { projectId: p.id }) })) }; })(),
      float: fl, pstages, customers: (s.customers || []).length, won: (s.leads || []).filter(l => this.leadStage(l) === 5).length,
      team: { sent: Object.keys(s.reportsToday || {}).length, total: (s.staff || []).length },
      activity: this.visibleActivity(s).slice(0, 6),
      actions: [
        ['New work', 'plus', () => this.openModal('work')], ['Assign task', 'checkSquare', () => this.openModal('task')], ['Invoice', 'fileText', () => this.openModal('invoice')], ['Request', 'banknote', () => this.openModal('req')]
      ].map(([l, , on]) => ({ l, on })),
      goClients: () => this.go('clients'), goProjects: () => this.go('projects'), goTeam: () => this.go('today', { todoTab: 'team' })
    }
  };
}
