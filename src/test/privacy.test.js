import { describe, it, expect } from 'vitest';
import TrinityApp from '../logic/TrinityApp';
import { dayKey } from '../logic/seed';

const app = role => { const a = new TrinityApp(); a.confirm = () => true; a.setState({ role }); return a; };
const ids = list => list.map(r => r.id);
const listIds = a => ids(a.renderVals().reqList || []);

describe('money request privacy', () => {
  it('a staff member does not see someone else’s request', () => {
    const a = app('staff'), me = a.me().k;
    // REQ-0418 is Juma's; REQ-0423 and REQ-0412 are Grace's own.
    expect(a.state.reqs.find(r => r.id === 'REQ-0418').who).not.toBe(me);
    expect(a.canSeeReq(a.state.reqs.find(r => r.id === 'REQ-0418'))).toBe(false);
    expect(ids(a.visibleReqs())).not.toContain('REQ-0418');
    expect(a.visibleReqs().every(r => r.who === me)).toBe(true);
    const V = a.renderVals();
    expect(V.MR).toBeTruthy();
    const mine = [...V.MR.open, ...V.MR.done].map(r => r.id);
    expect(mine).toContain('REQ-0423');
    expect(mine).not.toContain('REQ-0418');
    // The project page lists only her own request.
    a.setState({ projectId: 'PRJ-0231' });
    expect(ids(a.renderVals().P.reqs || [])).not.toContain('REQ-0418');
    // The assistant does not list other people's requests either.
    expect(a.answer('what needs my approval?')).not.toContain(a.av('JM').first);
  });

  it('a request created for someone else stays visible to the person who created it', () => {
    const a = app('operations'), me = a.me().k;
    const id = a.createRequest({ type: 'internal', amt: 50000, purpose: 'Office tea', who: 'JM', payBy: 'Cash', payName: 'Juma' });
    const r = a.state.reqs.find(x => x.id === id);
    expect(r.by).toBe(me);
    expect(a.canSeeReq(r)).toBe(true);
  });

  it('an approver sees a request that is waiting for them, and can act on it', () => {
    const a = app('staff'), me = a.me().k;
    // Grace is the PM of PRJ-0228; Juma's older request is at the PM step.
    a.setState(x => ({ projects: x.projects.map(p => (p.id === 'PRJ-0228' ? Object.assign({}, p, { pm: me }) : p)) }));
    const r = a.state.reqs.find(x => x.id === 'REQ-0426');
    expect(r).toMatchObject({ who: 'JM', step: 1, st: 'pending' });
    expect(a.canSeeReq(r)).toBe(true);
    a.setState({ reqFilter: 'me', reqSel: 'REQ-0426' });
    const V = a.renderVals();
    expect(V.MR).toBeFalsy();
    expect(ids(V.reqList)).toEqual(['REQ-0426']);
    expect(V.R.canDecide).toBe(true);
    // Other people's requests that are not waiting for her stay hidden.
    a.setState({ reqFilter: 'all' });
    expect(listIds(a)).not.toContain('REQ-0418');
    // Once she approved it, it is no longer waiting for her and disappears.
    a.decide(r, true);
    expect(a.canSeeReq(a.state.reqs.find(x => x.id === 'REQ-0426'))).toBe(false);
  });

  it('a head of department does not see their team’s requests', () => {
    const a = app('operations');
    expect(a.teamOf('operations')).toContain('JM');
    a.setState({ myReqScope: 'team' });
    const V = a.renderVals();
    expect(V.MR.mgr).toBe(false);
    expect([...V.MR.open, ...V.MR.done].map(r => r.id)).not.toContain('REQ-0418');
  });

  it('Finance sees every request, at every step and of every person', () => {
    const a = app('finance');
    a.setState({ reqFilter: 'all' });
    const l = listIds(a);
    expect(l.sort()).toEqual(ids(a.state.reqs).sort());
    expect(l).toContain('REQ-0425'); // at Finance
    expect(l).toContain('REQ-0412'); // paid
    expect(l).toContain('REQ-0418'); // waiting for Management
    expect(l).toContain('REQ-0405'); // rejected at the GM
    // Steps 1, 2 and 4 are all visible.
    const steps = a.visibleReqs().filter(r => r.st === 'pending').map(r => r.step);
    [1, 2, 3, 4].forEach(n => { if (a.state.reqs.some(r => r.st === 'pending' && r.step === n)) expect(steps).toContain(n); });
    // The project page shows them too.
    const r = a.state.reqs.find(x => x.id === 'REQ-0418');
    if (r.p) { a.setState({ projectId: r.p }); expect(ids(a.renderVals().P.reqs || [])).toContain('REQ-0418'); }
  });

  it('Finance cannot approve, reject or pay out of its step; the page says view only', () => {
    const a = app('finance');
    const pend = a.state.reqs.filter(r => r.st === 'pending' && r.step !== 3);
    expect(pend.length).toBeGreaterThan(0);
    pend.forEach(r => {
      expect(a.canAct(r)).toBe(false);
      const before = JSON.stringify(a.state.reqs.find(x => x.id === r.id));
      expect(a.decide(r, true)).toMatch(/view only/);
      expect(a.decide(r, false)).toMatch(/view only/);
      expect(JSON.stringify(a.state.reqs.find(x => x.id === r.id))).toBe(before);
      expect(a.payReq(r)).toMatch(/not approved/);
      expect(a.state.reqs.find(x => x.id === r.id).st).toBe('pending');
      a.setState({ reqFilter: 'all', reqSel: r.id });
      const V = a.renderVals();
      expect(V.R.id).toBe(r.id);
      expect(V.R.canDecide).toBe(false);
      expect(V.R.canPay).toBe(false);
      expect(V.R.viewOnly).toMatch(/you can view only/);
    });
    const gmReq = pend.find(r => r.step === 2);
    if (gmReq) { a.setState({ reqSel: gmReq.id }); expect(a.renderVals().R.viewOnly).toBe('Waiting for the GM · you can view only'); }
    const rej = a.state.reqs.find(r => r.st === 'rejected');
    a.setState({ reqSel: rej.id });
    expect(a.renderVals().R.viewOnly).toMatch(/Rejected/);
    expect(a.decide(rej, true)).toMatch(/not waiting/);
    // Nothing out of step is offered on the Float page or the home page.
    expect(a.renderVals().FL.verify.every(x => a.state.reqs.find(r => r.id === x.id).step === 3)).toBe(true);
  });

  it('Finance still verifies at its step and pays approved requests', () => {
    const a = app('finance');
    const r = a.state.reqs.find(x => x.id === 'REQ-0425');
    expect(r).toMatchObject({ st: 'pending', step: 3 });
    a.setState({ reqFilter: 'all', reqSel: r.id });
    expect(a.renderVals().R.canDecide).toBe(true);
    expect(a.renderVals().R.viewOnly).toBe('');
    expect(a.decide(r, true)).toBeUndefined();
    expect(a.state.reqs.find(x => x.id === r.id).step).toBeGreaterThan(3);
    const ap = a.state.reqs.find(x => x.st === 'approved');
    expect(ap).toBeTruthy();
    a.setState({ reqSel: ap.id });
    expect(a.renderVals().R.canPay).toBe(true);
    expect(a.renderVals().R.viewOnly).toBe('');
    expect(a.payReq(ap)).toBe('');
    expect(a.state.reqs.find(x => x.id === ap.id).st).toBe('paid');
  });

  it('Management keeps its override at any step; the GM only at its own', () => {
    const c = app('ceo'), r = c.state.reqs.find(x => x.st === 'pending' && x.step === 3);
    expect(c.decide(r, true)).toBeUndefined();
    const g = app('gm'), q = g.state.reqs.find(x => x.st === 'pending' && x.step !== 2);
    expect(g.decide(q, true)).toMatch(/view only/);
  });

  it('Management, the GM and the PA see every request', () => {
    ['ceo', 'gm', 'pa'].forEach(role => {
      const a = app(role);
      a.setState({ reqFilter: 'all' });
      expect(listIds(a).sort()).toEqual(ids(a.state.reqs).sort());
    });
  });
});

const rep = (by, to, extra) => Object.assign({ id: 'RP' + by + to.join(''), by, dept: 'operations', kind: 'weekly', title: 'Weekly report', summary: 'What was done this week', issues: '', next: '', file: null, to, at: dayKey(0), time: '17:00', readBy: {}, replies: [] }, extra || {});

describe('report privacy', () => {
  it('staff see only their own reports and reports addressed to them', () => {
    const a = app('staff'), me = a.me().k;
    a.setState({ reports: [rep('JM', ['MM']), rep(me, ['MM']), rep('AJ', [me])] });
    const R = a.renderVals().RPT;
    expect(R.sent.map(r => r.id)).toEqual(['RP' + me + 'MM']);
    expect(R.inbox.map(r => r.id)).toEqual(['RPAJ' + me]);
    expect(a.reportVisibleTo(rep('JM', ['MM']), me)).toBe(false);
  });

  it('a head sees only the reports addressed to them, not every report of their staff', () => {
    const a = app('operations'), me = a.me().k;
    a.setState({ reports: [rep('JM', [me]), rep('AJ', ['GN']), Object.assign(rep('PL', ['GN']), { kind: 'daily', id: 'd1' }), Object.assign(rep('JM', [me]), { kind: 'daily', id: 'd2' })] });
    const R = a.renderVals().RPT;
    expect(R.canReceive).toBe(true);
    expect(R.inbox.map(r => r.id).sort()).toEqual(['RPJM' + me, 'd2'].sort());
    // The daily calendar: only the day report sent to the head; Peter (sent to the GM) shows as not sent.
    expect(R.cal.reports.map(r => r.id)).toEqual(['d2']);
    expect(R.cal.missing).toContain(a.av('PL').n);
    expect(R.cal.missing).not.toContain(a.av('JM').n);
    // Not-sent list only names the head's own team.
    const team = a.teamOf('operations').map(k => a.av(k).n);
    expect(R.cal.missing.every(n => team.includes(n))).toBe(true);
  });

  it('Management, the GM and the PA see every report', () => {
    ['ceo', 'gm', 'pa'].forEach(role => {
      const a = app(role), me = a.me().k;
      a.setState({ reports: [rep('JM', ['MM']), rep('AJ', ['GN'])].filter(r => r.by !== me) });
      expect(a.renderVals().RPT.inbox).toHaveLength(2);
    });
  });
});

describe('Finance reminds the approver', () => {
  it('sends the GM a reminder that opens the request, and notes it', () => {
    const a = new TrinityApp(); a.confirm = () => true; a.setState({ role: 'finance' });
    const r = a.state.reqs.find(x => x.st === 'pending' && x.step === 2);
    if (!r) return;
    const gm = a.reqWaitingFor(r);
    expect(a.canRemindReq(r)).toBe(true);
    expect(a.remindReq(r.id)).toBe('');
    expect(a.state.notes.some(n => n.to === gm && /Reminder: .* is waiting for you/.test(n.t) && n.go === 'request:' + r.id)).toBe(true);
    expect(a.state.reqs.find(x => x.id === r.id).reminders.at(-1)).toMatchObject({ to: gm });
    a.setState({ reqFilter: 'all', reqSel: r.id });
    expect(a.renderVals().R.remindTo).toBeTruthy();
    // No reminder button where Finance itself must act.
    const own = a.state.reqs.find(x => x.st === 'pending' && x.step === 3);
    if (own) expect(a.canRemindReq(own)).toBe(false);
  });
});
