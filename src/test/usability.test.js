import { describe, it, expect } from 'vitest';
import TrinityApp from '../logic/TrinityApp';
import { ROLES, TABS } from '../logic/constants';

const D = '2026-11-27';
// An app on 27 Nov 2026, 12:00 in Dar es Salaam, with a float of 5M from Management.
const app = (role = 'finance', extra = {}) => {
  const a = new TrinityApp(); a.confirm = () => true; a.smsTo = () => {};
  a.nowDate = () => new Date('2026-11-27T09:00:00Z');
  a.setState(Object.assign({ role, notes: [], reports: [], petty: { open: 0, entries: [], counts: [] }, staff: [{ k: 'GM', fl: 0 }],
    float: { grants: [{ id: 'G1', amt: 5e6, at: D, by: 'DK' }], allocs: [], asks: [] } }, extra));
  return a;
};
const req = (o = {}) => Object.assign({ id: 'REQ-0001', who: 'GM', amt: 300000, cat: 'Transport', p: 'PRJ-0231', step: 5, st: 'approved', log: ['a', 'b', 'c', 'd', 'e'], pay: { by: 'M-Pesa', name: 'Grace Mrema', no: '0754123456' } }, o);

describe('words for money staff must account for', () => {
  it('a paid request is "Paid · to account for" until the receipts are accepted', () => {
    const a = app();
    expect(a.rst(req({ st: 'paid', step: 6 }))[0]).toBe('Paid · to account for');
    expect(a.rst(req({ st: 'paid', step: 6, rec: { st: 'submitted' } }))[0]).toBe('Paid · to account for');
    expect(a.rst(req({ st: 'paid', step: 6, rec: { st: 'ok' } }))[0]).toBe('Paid · accounted for');
  });
  it('paying says who must account for it', () => {
    const a = app('finance', { reqs: [req()] });
    a.payReq(a.state.reqs[0], null, '', { method: 'M-Pesa' });
    expect(a.state.toasts.at(-1).t).toMatch(/^Paid TZS 300,000 to Grace · they must account for it/);
  });
});

describe('Finance navigation', () => {
  it('Finance opens on the Float, with Pay & approve and Invoices as phone tabs', () => {
    expect(ROLES.finance.home).toBe('float');
    expect(TABS.finance.map(t => t[0])).toEqual(['float', 'requests', 'finance']);
    expect(TABS.finance[1][1]).toBe('Pay & approve');
    const a = app();
    expect(a.allowedPage('finance', 'receipts')).toBe('receipts');
    // Monday Briefing appears once in Finance's menus.
    const G = a.navGroups('finance'), all = G.flatMap(g => g[1].map(i => i[1]));
    expect(all.filter(l => l === 'Monday Briefing').length).toBeLessThanOrEqual(1);
  });
});

describe('advance due dates', () => {
  it('"Due today" on the due date, "Overdue" only from the next day', () => {
    const a = app();
    const due = a.accountInfo(req({ st: 'paid', step: 6, paidOn: '2026-11-24' }));
    expect(due).toMatchObject({ dueText: 'Due today', dueToday: true, overdue: false });
    const late = a.accountInfo(req({ st: 'paid', step: 6, paidOn: '2026-11-23' }));
    expect(late).toMatchObject({ dueText: 'Overdue', overdue: true });
    a.setState({ reqs: [req({ st: 'paid', step: 6, paidOn: '2026-11-24' }), req({ id: 'REQ-0002', st: 'paid', step: 6, paidOn: '2026-11-23' })] });
    const adv = a.floatAdvances();
    expect(adv.find(x => x.id === 'REQ-0001')).toMatchObject({ dueText: 'Due today', overdue: false });
    expect(adv.find(x => x.id === 'REQ-0002')).toMatchObject({ dueText: 'Overdue', overdue: true });
  });
});

describe('spending by project', () => {
  it('shows the amount paid under Requests and the change returned on its own line, never a negative request', () => {
    const a = app('finance', { reqs: [req({ st: 'paid', step: 6, paidOn: D, paidAmt: 300000, rec: { spent: 200000, back: 100000, st: 'ok', okAt: D, backVia: 'Cash' } })] });
    const P = a.floatVals(a.state).FL.proj('today');
    const row = P.rows.find(r => r.p === 'PRJ-0231');
    expect(row).toMatchObject({ requests: 'TZS 300,000', returned: 'TZS 100,000', total: 'TZS 200,000' });
    expect(P.total).toMatchObject({ requests: 'TZS 300,000', returned: 'TZS 100,000', total: 'TZS 200,000' });
  });
  it('a project whose only line is change returned still shows, with requests at zero', () => {
    const a = app('finance', { reqs: [req({ st: 'paid', step: 6, paidOn: '2026-11-20', paidAmt: 300000, rec: { spent: 200000, back: 100000, st: 'ok', okAt: D, backVia: 'Cash' } })] });
    const row = a.floatVals(a.state).FL.proj('today').rows.find(r => r.p === 'PRJ-0231');
    expect(row).toMatchObject({ requests: 'TZS 0', returned: 'TZS 100,000' });
  });
});

describe('paying a request', () => {
  it('"Mark paid" opens the confirm sheet; nothing is paid until it is confirmed', () => {
    const a = app('finance', { reqs: [req()], reqSel: 'REQ-0001', reqFilter: 'all' });
    const V = a.pageVals(a.state, a.IC, a.ST, false);
    V.R.pay();
    expect(a.state.paySheet).toBe('REQ-0001');
    expect(a.state.reqs[0].st).toBe('approved');
    const P = a.payVals(a.state);
    expect(P).toMatchObject({ id: 'REQ-0001', asked: 300000, method: 'M-Pesa' });
    expect(P.pay({ amt: '250000', method: 'M-Pesa', fee: '1500', at: D })).toBe('');
    expect(a.state.reqs[0]).toMatchObject({ st: 'paid', paidAmt: 250000, payFee: 1500, paidVia: 'M-Pesa' });
    expect(a.state.paySheet).toBeNull();
  });
  it('the Float "Waiting to be paid" list opens the same sheet', () => {
    const a = app('finance', { reqs: [req()] });
    const F = a.floatVals(a.state).FL;
    expect(F.waitList.map(w => w.id)).toEqual(['REQ-0001']);
    F.waitList[0].pay();
    expect(a.state.paySheet).toBe('REQ-0001');
    expect(a.state.reqs[0].st).toBe('approved');
  });
  it('the phone back button closes an open Float sheet, and asks before throwing away a half-filled expense', () => {
    const a = app('finance');
    a.setState({ floatSheet: 'expense' });
    a._floatDirty = true; let asked = 0; a.confirm = () => { asked++; return false; };
    a.onPopState({ state: {} });
    expect(asked).toBe(1); expect(a.state.floatSheet).toBe('expense');
    a.confirm = () => true; a.onPopState({ state: {} });
    expect(a.state.floatSheet).toBeNull();
  });
});

describe('opening a request', () => {
  it('a notification for a request opens that request, selected and brought into view', () => {
    const a = app('finance', { reqs: [req()] });
    a.goTarget('request:REQ-0001');
    expect(a.state).toMatchObject({ page: 'requests', reqSel: 'REQ-0001', reqFocus: 'REQ-0001' });
  });
});

describe('the request form', () => {
  it('opens on the project request with a type switch that keeps what was typed, paid to the person asking by M-Pesa', () => {
    const a = app('staff');
    a.openModal('req');
    expect(a.state.modal.act).toBe('reqProject');
    expect(a.state.form).toMatchObject({ payBy: 'M-Pesa', payName: 'Grace Mrema' });
    a.setState({ form: Object.assign({}, a.state.form, { purpose: 'Taxi to the venue', items: [{ d: 'Taxi', qty: '2', price: '15000' }] }) });
    a.switchReqType('reqInternal');
    expect(a.state.modal.act).toBe('reqInternal');
    expect(a.state.form).toMatchObject({ purpose: 'Taxi to the venue', payName: 'Grace Mrema', items: [{ d: 'Taxi', qty: '2', price: '15000' }] });
    const f = a.overlayVals(a.state, a.IC).modalFields[0];
    expect(f).toMatchObject({ l: 'Type of request', v: 'reqInternal' });
    expect(f.opts.map(o => o.l)).toEqual(['Project', 'Office', 'Emergency']);
  });
});
