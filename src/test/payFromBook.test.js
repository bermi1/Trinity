import { describe, it, expect } from 'vitest';
import TrinityApp from '../logic/TrinityApp';

const D = '2026-11-27';
const app = (role = 'finance', extra = {}) => {
  const a = new TrinityApp(); a.confirm = () => true; a.smsTo = () => {};
  a.nowDate = () => new Date('2026-11-27T09:00:00Z');
  a.setState(Object.assign({ role, reqs: [], notes: [], reports: [], petty: { open: 0, entries: [], counts: [] }, staff: [{ k: 'GM', fl: 0 }],
    float: { grants: [{ id: 'G1', amt: 1e6, at: D, by: 'DK' }], allocs: [], asks: [] } }, extra));
  return a;
};
const req = (o = {}) => Object.assign({ id: 'REQ-0009', who: 'GM', amt: 50000, cat: 'Transport', p: '', step: 5, st: 'approved', log: [] }, o);

describe('a request paid from an expense already in the cash book', () => {
  it('is marked paid with it and the float goes down only once', async () => {
    const a = app('finance', { reqs: [req({ st: 'pending', step: 4 })] });
    expect(await a.addExpense({ amt: '40000', cat: 'Transport', method: 'M-Pesa', fee: '600', payee: 'GM' })).toBe('');
    expect(a.floatBalance()).toBe(1e6 - 40600);
    const e = a.pt().entries[0];
    // Not approved yet: Finance cannot mark it paid.
    expect(a.payFromBook(a.state.reqs[0], e.id)).toMatch(/not approved/);
    a.setState(x => ({ reqs: x.reqs.map(r => Object.assign({}, r, { st: 'approved', step: 5 })) }));
    const P = a.payVals(Object.assign({}, a.state, { paySheet: 'REQ-0009' }));
    expect(P.book.map(b => b.id)).toEqual([e.id]);
    expect(P.payFromBook(e.id)).toBe('');
    const r = a.state.reqs[0];
    expect(r).toMatchObject({ st: 'paid', paidAmt: 40000, paidOn: D, payFee: 600, paidFrom: { id: e.id } });
    expect(r.rec.st).toBe('ok');
    expect(a.state.staff[0].fl).toBe(0);
    expect(a.floatBalance()).toBe(1e6 - 40600);
    const L = a.floatBook().filter(l => l.dir === 'out');
    expect(L.map(l => [l.kind, l.amt]).sort()).toEqual([['charge', 600], ['request', 40000]]);
    expect(a.cashEntries().filter(c => c.dir === 'out' && ['petty', 'request'].includes(c.src)).reduce((x, c) => x + c.amt, 0)).toBe(40600);
    // The record is used: it is not offered again and cannot be deleted.
    expect(a.bookChoices(req({ id: 'REQ-0010' }))).toEqual([]);
    expect(a.deleteExpense(e.id)).toMatch(/payment of REQ-0009/);
  });
  it('refuses a record bigger than the request', async () => {
    const a = app('finance', { reqs: [req()] });
    await a.addExpense({ amt: '90000', cat: 'Transport', method: 'Cash' });
    expect(a.payFromBook(a.state.reqs[0], a.pt().entries[0].id)).toMatch(/more than was requested/);
  });
});

describe('a request already paid outside the float', () => {
  it('is marked paid on any past day and the float is not touched', () => {
    const a = app('finance', { reqs: [req()] });
    const P = a.payVals(Object.assign({}, a.state, { paySheet: 'REQ-0009' }));
    expect(P.paidOutside({ amt: '50000', method: 'Bank', fee: '', at: '2026-10-02' })).toBe('');
    const r = a.state.reqs[0];
    expect(r).toMatchObject({ st: 'paid', paidOutside: true, paidOn: '2026-10-02', paidAmt: 50000 });
    expect(a.floatBalance()).toBe(1e6);
    expect(a.floatBook().some(l => l.ref === 'REQ-0009')).toBe(false);
    expect(a.cashEntries().some(c => c.ref === 'REQ-0009')).toBe(true);
    expect(a.payReq(a.state.reqs[0], '1', '', { outside: true, date: '2026-12-30' })).toMatch(/already paid/);
  });
});

describe('changing a paid request', () => {
  it('edits amount, charges, day and float/outside with a reason; undo puts it back to waiting', () => {
    const a = app('finance', { reqs: [req()] });
    expect(a.payReq(a.state.reqs[0], '50000', '500', { method: 'M-Pesa' })).toBe('');
    expect(a.floatBalance()).toBe(1e6 - 50500);
    const P = () => a.payVals(Object.assign({}, a.state, { paySheet: 'REQ-0009' }));
    expect(P().edit.save({ amt: '30000', fee: '', method: 'Cash', at: D, outside: false, reason: '' })).toMatch(/reason/);
    expect(P().edit.save({ amt: '30000', fee: '', method: 'Cash', at: D, outside: false, reason: 'Paid less' })).toBe('');
    expect(a.state.reqs[0]).toMatchObject({ paidAmt: 30000, payFee: 0, paidVia: 'Cash' });
    expect(a.state.staff[0].fl).toBe(30000);
    expect(a.floatBalance()).toBe(1e6 - 30000);
    expect(P().edit.save({ amt: '30000', method: 'Bank', at: '2026-09-01', outside: true, reason: 'Boss paid it' })).toBe('');
    expect(a.floatBalance()).toBe(1e6);
    expect(P().edit.history.length).toBe(2);
    expect(P().edit.undo('')).toMatch(/reason/);
    expect(P().edit.undo('Wrong request')).toBe('');
    expect(a.state.reqs[0]).toMatchObject({ st: 'approved', step: 5 });
    expect(a.state.reqs[0].paidAmt).toBeUndefined();
    expect(a.state.staff[0].fl).toBe(0);
  });
  it('undoing a cash book payment frees the record again', async () => {
    const a = app('finance', { reqs: [req()] });
    await a.addExpense({ amt: '40000', cat: 'Transport', method: 'Cash', payee: 'GM' });
    const id = a.pt().entries[0].id;
    expect(a.payFromBook(a.state.reqs[0], id)).toBe('');
    expect(a.editPayment(a.state.reqs[0], { amt: '1', reason: 'x' })).toMatch(/undo/);
    expect(a.undoPayment(a.state.reqs[0], 'Wrong one')).toBe('');
    expect(a.pt().entries[0].req).toBeUndefined();
    expect(a.state.reqs[0].rec).toBeUndefined();
    expect(a.floatBalance()).toBe(1e6 - 40000);
  });
});

describe('deleting a cash book record', () => {
  it('Finance removes it and the float goes back up; staff cannot', async () => {
    const a = app('finance');
    await a.addExpense({ amt: '12000', cat: 'Water', method: 'Cash' });
    const id = a.pt().entries[0].id;
    expect(a.floatBalance()).toBe(1e6 - 12000);
    a.setState({ role: 'staff' });
    expect(a.deleteExpense(id)).toMatch(/Only Finance/);
    a.setState({ role: 'finance' });
    expect(a.deleteExpense(id)).toBe('');
    expect(a.pt().entries).toEqual([]);
    expect(a.floatBalance()).toBe(1e6);
  });
});
