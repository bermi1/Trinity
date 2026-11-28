import { describe, it, expect, vi } from 'vitest';
import TrinityApp from '../logic/TrinityApp';
import { tzDay, tzTime } from '../logic/finance';

const D = '2026-11-27', D2 = '2026-11-28';
// An app on the float's first day: Management gave 7M + 10M + 3M (as live), 12:00 in Dar es Salaam.
const app = (role = 'finance', extra = {}, at = '2026-11-27T09:00:00Z') => {
  const a = new TrinityApp(); a.confirm = () => true; a.smsTo = () => {};
  a.nowDate = () => new Date(at);
  a.setState(Object.assign({ role, reqs: [], notes: [], reports: [], petty: { open: 0, entries: [], counts: [] }, staff: [{ k: 'GM', fl: 0 }, { k: 'JM', fl: 0 }],
    float: { grants: [{ id: 'G1', amt: 7e6, at: D, by: 'DK' }, { id: 'G2', amt: 10e6, at: D, by: 'DK' }, { id: 'G3', amt: 3e6, at: D, by: 'DK' }], allocs: [], asks: [] } }, extra));
  return a;
};
const req = (o = {}) => Object.assign({ id: 'REQ-0001', who: 'GM', amt: 300000, cat: 'Transport', p: 'PRJ-0231', step: 5, st: 'approved', log: ['a', 'b', 'c', 'd', 'e'], pay: { by: 'M-Pesa' } }, o);
const exp = (a, f) => a.addExpense(Object.assign({ amt: '12000', cat: 'Water', method: 'Cash' }, f));

describe('Dar es Salaam day and time', () => {
  it('tzDay / tzTime use EAT (UTC+3) whatever the device zone', () => {
    expect(tzDay(new Date('2026-11-27T20:59:00Z'))).toBe('2026-11-27');
    expect(tzDay(new Date('2026-11-27T21:30:00Z'))).toBe('2026-11-28');
    expect(tzTime(new Date('2026-11-27T21:30:00Z'))).toBe('00:30');
    expect(app().fToday()).toBe(D);
  });
  it('a new request stores the day it was submitted', () => {
    const a = app('staff');
    const id = a.createRequest({ type: 'project', amt: 50000, p: 'PRJ-0231', purpose: 'Taxi' });
    expect(a.state.reqs.find(r => r.id === id).at).toBe(D);
  });
});

describe('the float book', () => {
  it('is derived from grants, paid requests (paid amount), charges, expenses and returned change', async () => {
    const a = app('finance', { reqs: [
      req({ st: 'paid', step: 6, paidOn: D, paidAt: '10:00', paidAmt: 250000, payFee: 2500 }),
      req({ id: 'REQ-0002', who: 'JM', amt: 100000, st: 'paid', step: 6, paidOn: D, paidAmt: 100000, rec: { spent: 60000, back: 40000, st: 'ok', okAt: D, backVia: 'Cash' } }),
      req({ id: 'REQ-0003', st: 'paid', step: 6, paidOn: '2026-11-20' }) // before the float started: not part of it
    ] });
    expect(await exp(a, { amt: '12000', method: 'M-Pesa', fee: '500', p: '' })).toBe('');
    const L = a.floatBook();
    expect(L.map(l => [l.kind, l.dir, l.amt]).sort()).toEqual([
      ['charge', 'out', 2500], ['charge', 'out', 500], ['expense', 'out', 12000], ['float', 'in', 10e6], ['float', 'in', 3e6], ['float', 'in', 7e6],
      ['request', 'out', 100000], ['request', 'out', 250000], ['returned', 'in', 40000]].sort());
    const d = a.floatDay(D);
    expect(d).toMatchObject({ open: 0, in: 20040000, out: 250000 + 2500 + 100000 + 12000 + 500 });
    expect(d.close).toBe(20040000 - 365000);
  });

  it('carries the closing balance down as the next day’s opening', async () => {
    const a = app();
    await exp(a, { amt: '50000' });
    const b = app('finance', { float: a.state.float, petty: a.state.petty }, '2026-11-28T06:00:00Z');
    expect(b.fToday()).toBe(D2);
    await exp(b, { amt: '10000', cat: 'Transport' });
    expect(b.floatDay(D2).open).toBe(b.floatDay(D).close);
    expect(b.floatDay(D2).close).toBe(20e6 - 60000);
    expect(b.floatBalance()).toBe(20e6 - 60000);
  });

  it('voided expenses stay in the list but do not count; same-day edits keep a reason', async () => {
    const a = app();
    await exp(a, { amt: '30000' });
    const id = a.state.petty.entries[0].id;
    expect(a.editExpense(id, { amt: '35000', cat: 'Water', method: 'Cash' })).toMatch(/reason/);
    expect(a.editExpense(id, { amt: '35000', cat: 'Water', method: 'Cash', reason: 'Receipt says 35,000' })).toBe('');
    expect(a.state.petty.entries[0]).toMatchObject({ amt: 35000, edits: [{ reason: 'Receipt says 35,000', was: { amt: 30000 } }] });
    expect(a.voidExpense(id, '')).toMatch(/reason/);
    expect(a.voidExpense(id, 'Entered twice')).toBe('');
    expect(a.floatBook().find(l => l.id === id).void).toBe(true);
    expect(a.floatDay(D).out).toBe(0);
    expect(a.state.petty.entries).toHaveLength(1);
  });

  it('warns but saves when an expense takes the float below zero, and tells Management', async () => {
    const a = app('finance', { float: { grants: [{ id: 'G', amt: 100000, at: D, by: 'DK' }], allocs: [], asks: [] } });
    expect(await exp(a, { amt: '150000' })).toBe('');
    expect(a.floatBalance()).toBe(-50000);
    expect(a.state.notes.some(n => n.to === 'DK' && /Float below zero/.test(n.t))).toBe(true);
  });

  it('only Finance and Management record; Finance recording the float tells Management', () => {
    expect(app('gm').receiveFloat({ amt: '1000000' })).toMatch(/Only/);
    const a = app();
    expect(a.receiveFloat({ amt: '2,000,000', method: 'M-Pesa', note: 'Extra for transport' })).toBe('');
    expect(a.fl().grants[0]).toMatchObject({ amt: 2e6, method: 'M-Pesa', at: D, time: '12:00', by: 'RT' });
    expect(a.state.notes.some(n => n.to === 'DK' && n.t === 'Float received · TZS 2,000,000')).toBe(true);
    expect(a.receiveFloat({ amt: '1000', at: '2026-11-10' })).toMatch(/7 days/);
  });
});

describe('paying requests from the float', () => {
  it('Finance picks the method and the date (today by default, up to 7 days back)', () => {
    const a = app();
    a.setState({ reqs: [req()] });
    expect(a.payReq(a.state.reqs[0], '', '', { method: 'Cash', date: '2026-11-15' })).toMatch(/7 days/);
    expect(a.payReq(a.state.reqs[0], '', '', { method: 'Cash', date: '2026-11-28' })).toMatch(/future/);
    expect(a.payReq(a.state.reqs[0], '200000', '1000', { method: 'Cash', date: '2026-11-26' })).toBe('');
    expect(a.state.reqs[0]).toMatchObject({ st: 'paid', paidOn: '2026-11-26', paidAt: '12:00', paidVia: 'Cash', paidAmt: 200000, payFee: 1000 });
    const b = app(); b.setState({ reqs: [req()] });
    b.payReq(b.state.reqs[0]);
    expect(b.state.reqs[0]).toMatchObject({ paidOn: D, paidVia: 'M-Pesa', paidAmt: 300000 });
    expect(b.state.notes.find(n => n.to === 'GM').t).toBe('Account for REQ-0001 · TZS 300,000 paid');
  });
});

describe('accounting for an advance', () => {
  const paidApp = (o = {}) => { const a = app('finance', { reqs: [req(Object.assign({ st: 'paid', step: 6, paidOn: D, paidAmt: 200000 }, o))], staff: [{ k: 'GM', fl: 200000 }] }); return a; };
  const as = (a, role) => { a.setState({ role }); return a; };

  it('partial payment, part spent, change returned in cash: the float is credited and the advance closes by the paid amount', async () => {
    const a = as(paidApp(), 'staff');
    a.ROLES = Object.assign({}, a.ROLES, { staff: Object.assign({}, a.ROLES.staff, { k: 'GM' }) });
    expect(await a.reconcileReq('REQ-0001', { items: [{ d: 'Taxi', amt: '120000' }, { d: 'Lunch', amt: '30000' }] })).toMatch(/how the change/);
    expect(await a.reconcileReq('REQ-0001', { items: [{ d: 'Taxi', amt: '120000' }, { d: 'Lunch', amt: '30,000' }], backVia: 'Cash' })).toBe('');
    expect(a.state.reqs[0].rec).toMatchObject({ spent: 150000, back: 50000, backVia: 'Cash', st: 'submitted', items: [{ d: 'Taxi', amt: 120000 }, { d: 'Lunch', amt: 30000 }] });
    expect(a.state.notes.some(n => n.to === 'RT' && n.t === 'Receipts to check · REQ-0001')).toBe(true);
    as(a, 'finance');
    expect(a.confirmRec('REQ-0001')).toBe('');
    expect(a.state.staff[0].fl).toBe(0); // reduced by the 200,000 paid, not the 300,000 asked
    expect(a.state.reqs[0].rec).toMatchObject({ st: 'ok', okAt: D, backVia: 'Cash' });
    const back = a.floatBook().find(l => l.kind === 'returned');
    expect(back).toMatchObject({ amt: 50000, at: D, method: 'Cash', paid: 200000, spent: 150000 });
    expect(a.floatDay(D).close).toBe(20e6 - 200000 + 50000);
    // A project's spending is what was really spent.
    expect(a.floatByProject(D, D, true)[0]).toMatchObject({ p: 'PRJ-0231', net: 150000, total: 150000 });
    expect(a.dailyFloat(D).returned[0]).toMatchObject({ id: 'REQ-0001', paid: 200000, spent: 150000, back: 50000 });
  });

  it('change "not yet" returned blocks acceptance until Finance says how it came back', async () => {
    const a = paidApp();
    await a.reconcileReq('REQ-0001', { items: [{ d: 'Taxi', amt: '150000' }], backVia: 'Not yet' });
    expect(a.confirmRec('REQ-0001')).toMatch(/not come back yet/);
    expect(a.confirmRec('REQ-0001', { backVia: 'M-Pesa' })).toBe('');
    expect(a.floatBook().find(l => l.kind === 'returned').method).toBe('M-Pesa');
  });

  it('spent more than given is marked for Finance; nothing comes back', async () => {
    const a = paidApp();
    expect(await a.reconcileReq('REQ-0001', { items: [{ d: 'Fuel', amt: '230000' }] })).toBe('');
    expect(a.state.reqs[0].rec).toMatchObject({ spent: 230000, back: 0, over: 30000 });
    expect(a.recView(a.state.reqs[0]).over).toBe('TZS 30,000');
    expect(a.state.notes[0].s).toMatch(/spent more than given \(TZS 30,000\)/);
    expect(a.confirmRec('REQ-0001')).toBe('');
    expect(a.floatBook().some(l => l.kind === 'returned')).toBe(false);
  });

  it('Finance can send it back with a note; the person sends it again', async () => {
    const a = paidApp();
    await a.reconcileReq('REQ-0001', { items: [{ d: 'Taxi', amt: '200000' }] });
    expect(a.sendBackRec('REQ-0001', '')).toMatch(/fixing/);
    expect(a.sendBackRec('REQ-0001', 'The receipt photo is missing')).toBe('');
    expect(a.state.reqs[0].rec).toMatchObject({ st: 'back', backNote: 'The receipt photo is missing' });
    expect(a.state.notes.some(n => n.to === 'GM' && n.t === 'Receipts sent back · REQ-0001')).toBe(true);
    expect(a.confirmRec('REQ-0001')).toMatch(/Waiting/);
    expect(await a.reconcileReq('REQ-0001', { items: [{ d: 'Taxi', amt: '200000' }] })).toBe('');
    expect(a.state.reqs[0].rec.st).toBe('submitted');
    expect(a.state.reqs[0].rec.prev.backNote).toBe('The receipt photo is missing');
  });

  it('advances are due 3 days after payment: listed as overdue, reminded once a day, and in the report', () => {
    const a = app('finance', { reqs: [req({ st: 'paid', step: 6, paidOn: '2026-11-23', paidAmt: 300000 }), req({ id: 'REQ-0002', st: 'paid', step: 6, paidOn: D, paidAmt: 80000, p: '' })],
      float: { grants: [{ id: 'G1', amt: 5e6, at: '2026-11-20', by: 'DK' }], allocs: [], asks: [] } });
    const adv = a.floatAdvances();
    expect(adv.map(x => [x.id, x.days, x.overdue])).toEqual([['REQ-0001', 4, true], ['REQ-0002', 0, false]]);
    expect(a.accountReminders()).toBe(1);
    expect(a.state.notes[0]).toMatchObject({ to: 'GM', t: 'Account for REQ-0001 · TZS 300,000 · overdue' });
    expect(a.accountReminders()).toBe(0); // once a day
    const R = a.dailyFloat(D);
    expect(R.advances).toHaveLength(2);
    expect(R.advancesT).toBe(380000);
    expect(a.floatReportHtml(R)).toContain('Advances not yet accounted for');
  });
});

describe('the daily float report', () => {
  const day = async () => {
    const a = app('finance', { reqs: [
      req({ st: 'paid', step: 6, paidOn: D, paidAt: '10:00', paidAmt: 250000, payFee: 2500, at: D }),
      req({ id: 'REQ-0002', who: 'JM', amt: 900000, p: '', at: D }),
      req({ id: 'REQ-0003', who: 'JM', amt: 50000, st: 'pending', step: 2 })
    ] });
    await exp(a, { amt: '12000', cat: 'Water' });
    await exp(a, { amt: '48000', cat: 'Printing', p: 'PRJ-0231', method: 'M-Pesa', fee: '600', who: 'Copy Point' });
    return a;
  };

  it('has the summary with the check line and all sections; by-project totals equal total out', async () => {
    const a = await day(), R = a.dailyFloat(D);
    expect(R).toMatchObject({ ref: 'DFR-20261127', open: 0, in: 20e6, float: 20e6, check: true });
    expect(R.out).toBe(250000 + 2500 + 12000 + 48000 + 600);
    expect(R.close).toBe(R.open + R.in - R.out);
    expect(R.submitted.map(r => r.id)).toEqual(['REQ-0001', 'REQ-0002']);
    expect(R.paid[0]).toMatchObject({ id: 'REQ-0001', asked: 300000, paid: 250000, fee: 2500, method: 'M-Pesa' });
    expect(R.expenses.map(e => e.voucher)).toEqual(['PCV-261127-01', 'PCV-261127-02']);
    expect(R.byProject.find(r => !r.p)).toMatchObject({ name: 'Office', expenses: 12000 });
    expect(R.byProject.reduce((t, r) => t + r.total, 0) + R.charges).toBe(R.out);
    expect(a.floatByProject(D, D).reduce((t, r) => t + r.total, 0)).toBe(R.out);
    expect(R.waiting).toMatchObject({ n: 1, total: 900000, pendingN: 1 });
    const html = a.floatReportHtml(R);
    ['DAILY FLOAT REPORT', 'DFR-20261127', 'CLOSING BALANCE', 'Requests paid today', 'Spending by project today', 'Waiting for payment', 'Prepared by', 'Received by Management', '/brand/trinity-logo-full.png', '✓'].forEach(t => expect(html).toContain(t));
    expect(html).toContain('None today'); // no change returned
    expect(html).not.toContain('short');
  });

  it('warns when approved requests waiting are more than the closing balance', async () => {
    const a = app('finance', { float: { grants: [{ id: 'G', amt: 500000, at: D, by: 'DK' }], allocs: [], asks: [] }, reqs: [req({ amt: 900000 })] });
    const R = a.dailyFloat(D);
    expect(R.shortBy).toBe(400000);
    expect(a.floatReportHtml(R)).toContain('short 400,000');
    expect(a.floatSummaryText(R)).toBe('Trinity · Float 27 Nov: Open 0 | In 500,000 | Out 0 (0 paid req, 0 expenses) | Close 500,000 | Waiting 1 = 900,000 ⚠ short 400,000');
  });

  it('send to the boss: snapshot, a report to Management with the file, WhatsApp; a later change shows as revised', async () => {
    const a = await day();
    const open = vi.fn(); const was = window.open; window.open = open;
    expect(await a.sendDailyFloat(D)).toBe('');
    window.open = was;
    expect(open.mock.calls[0][0]).toMatch(/^https:\/\/wa\.me\/\?text=Trinity%20%C2%B7%20Float%2027%20Nov/);
    const snap = a.fl().closes[D];
    expect(snap).toMatchObject({ open: 0, close: a.dailyFloat(D).close, by: 'RT' });
    const rp = a.state.reports[0];
    // Management and the General Manager both receive it.
    expect(rp).toMatchObject({ kind: 'daily', to: ['DK', 'GN'], title: 'Daily float report · 27 Nov 2026' });
    expect(rp.file.name).toBe('Daily float report 2026-11-27.html');
    expect(a.state.notes.some(n => n.to === 'DK' && /Daily float report/.test(n.t))).toBe(true);
    expect(a.state.notes.some(n => n.to === 'GN' && /Daily float report/.test(n.t))).toBe(true);
    expect(a.dailyFloat(D).revised).toBeNull();
    // Voiding after the report was sent tells Management and marks the day revised.
    const id = a.state.petty.entries[0].id;
    a.voidExpense(id, 'Wrong amount');
    expect(a.state.notes.some(n => n.to === 'DK' && /voided after the report/.test(n.t))).toBe(true);
    const R = a.dailyFloat(D);
    expect(R.revised).toEqual({ was: snap.close, now: snap.close + 48600 });
    expect(a.floatReportHtml(R)).toContain('Revised — closing was');
  });
});

describe('the petty cash book', () => {
  it('a row paid to a staff member can settle their approved request: paid once, never also an expense', async () => {
    const a = app('finance', { reqs: [req(), req({ id: 'REQ-0002', st: 'pending', step: 2, amt: 70000 })] });
    const list = a.floatStaffReqs('GM');
    expect(list.map(r => [r.id, r.can])).toEqual([['REQ-0001', true], ['REQ-0002', false]]);
    expect(await a.addExpense({ payee: 'GM', settle: 'REQ-0002', amt: '70000', method: 'Cash' })).toMatch(/waiting for approval/);
    expect(await a.addExpense({ payee: 'GM', settle: 'REQ-0001', amt: '300000', method: 'M-Pesa', fee: '1000' })).toBe('');
    expect(a.state.reqs[0]).toMatchObject({ st: 'paid', paidAmt: 300000, paidVia: 'M-Pesa', payFee: 1000, paidOn: D });
    expect(a.state.petty.entries).toHaveLength(0);
    expect(a.floatBalance()).toBe(20e6 - 301000);
    expect(a.dailyFloat(D).paid.map(p => p.id)).toEqual(['REQ-0001']);
    expect(a.dailyFloat(D).expenses).toHaveLength(0);
    expect(a.state.staff[0].fl).toBe(300000);
    // Management may pay a pending one directly, after a confirm.
    a.setState({ role: 'ceo' });
    expect(await a.addExpense({ payee: 'GM', settle: 'REQ-0002', amt: '', method: 'Cash' })).toBe('');
    expect(a.state.reqs[1]).toMatchObject({ st: 'paid', paidAmt: 70000 });
  });

  it('shows the running balance after each row, brought forward and carried down; exports the same columns', async () => {
    const a = app();
    await exp(a, { amt: '12000', cat: 'Water', who: 'Uhai' });
    await exp(a, { amt: '30000', cat: 'Transport', payee: 'JM', p: 'PRJ-0231' });
    await exp(a, { amt: '5000', cat: 'Airtime' });
    a.voidExpense(a.state.petty.entries[0].id, 'Mistake');
    const b = a.pettyBook(D, D);
    expect(b[0]).toMatchObject({ bf: true, what: 'Balance brought forward', bal: 0 });
    expect(b[b.length - 1]).toMatchObject({ cd: true, what: 'Balance carried down', bal: 20e6 - 42000 });
    const rows = b.filter(r => r.kind === 'expense');
    expect(rows.map(r => r.bal)).toEqual([20e6 - 12000, 20e6 - 42000, 20e6 - 42000]);
    expect(rows[1].who).toBe(a.av('JM').n);
    expect(rows[2].void).toBe(true);
    const sheet = a.pettyBookSheet(D, D);
    expect(sheet[0]).toEqual(['Date', 'Voucher', 'Paid to', 'What for', 'Project', 'Amount (TZS)', 'Balance (TZS)']);
    expect(sheet[1]).toEqual([D, '', '', 'Balance brought forward', '', '', 0]);
    expect(sheet.find(r => r[1] === 'PCV-261127-02')).toEqual([D, 'PCV-261127-02', a.av('JM').n, 'Transport', a.projLabel('PRJ-0231'), -30000, 20e6 - 42000]);
    expect(sheet[sheet.length - 1].slice(3)).toEqual(['Balance carried down', '', '', 20e6 - 42000]);
  });
});
