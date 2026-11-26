import { describe, it, expect } from 'vitest';
import TrinityApp from '../logic/TrinityApp';

const app = role => { const a = new TrinityApp(); a.confirm = () => true; a.setState({ role }); return a; };

describe('transaction charges', () => {
  it('paying a request records the charges in the cash book, not on the float', () => {
    const a = app('finance');
    const r = { id: 'REQ-0001', who: 'GM', amt: 300000, st: 'approved', step: 5, log: [], cat: 'Transport', pay: { by: 'Mobile money' } };
    a.setState({ reqs: [r], staff: [{ k: 'GM', fl: 0 }] });
    expect(a.payReq(r, '300000', 'abc')).toMatch(/number/);
    expect(a.payReq(r, '250000', '2,500')).toBeFalsy();
    const q = a.state.reqs[0];
    expect(q).toMatchObject({ st: 'paid', paidAmt: 250000, payFee: 2500 });
    expect(a.state.staff[0].fl).toBe(250000);
    const cash = a.cashEntries().filter(e => e.ref.includes('REQ-0001'));
    expect(cash.map(e => [e.cat, e.amt])).toEqual(expect.arrayContaining([['Staff requests · Transport', 250000], ['Transaction charges', 2500]]));
  });

  it('money out (and money in) can carry transaction charges; none is fine', () => {
    const a = app('finance');
    expect(a.addEntry({ dir: 'out', amt: 1000000, cat: 'Rent', party: 'Landlord', fee: '5000' })).toBe('');
    expect(a.addEntry({ dir: 'in', amt: 2000000, cat: 'Client payment', party: 'TCRA', fee: '3000' })).toBe('');
    expect(a.addEntry({ dir: 'out', amt: 50000, cat: 'Fuel & transport' })).toBe('');
    const charges = a.cashEntries().filter(e => e.cat === 'Transaction charges');
    expect(charges.map(e => [e.dir, e.amt]).sort()).toEqual([['out', 3000], ['out', 5000]]);
    expect(a.addEntry({ dir: 'out', amt: 1, cat: 'Rent', fee: 'x' })).toMatch(/number/);
  });
});
