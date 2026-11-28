import { describe, it, expect } from 'vitest';
import TrinityApp from '../logic/TrinityApp';

const app = role => { const a = new TrinityApp(); a.confirm = () => true; a.setState({ role }); return a; };

describe('transaction charges are always recorded and can be corrected', () => {
  it('a cash expense can carry charges, and they come off the float', async () => {
    const a = app('finance');
    const before = a.floatDay(a.fToday()).close;
    expect(await a.addExpense({ amt: '10000', cat: 'Water', method: 'Cash', fee: '500' })).toBeFalsy();
    const e = a.pt().entries.find(x => x.amt === 10000 && x.cat === 'Water' && x.fee === 500);
    expect(e).toBeTruthy();
    expect(a.floatDay(a.fToday()).close).toBe(before - 10500);
  });

  it('Finance adds or corrects charges on an expense already recorded, even from an earlier day', () => {
    const a = app('finance');
    const e = a.pt().entries.find(x => !x.void);
    const before = a.floatDay(a.fToday()).close, old = e.fee || 0;
    expect(a.setCharges('expense', e.id, '1,200')).toBe('');
    const now = a.pt().entries.find(x => x.id === e.id);
    expect(now.fee).toBe(1200);
    expect(now.edits.at(-1)).toMatchObject({ was: { fee: old } });
    expect(a.floatDay(a.fToday()).close).toBe(before - (1200 - old));
    expect(a.setCharges('expense', e.id, 'abc')).toMatch(/number/);
  });

  it('charges on a paid request can be added later', () => {
    const a = app('finance');
    const r = a.state.reqs.find(x => x.st === 'paid');
    expect(a.setCharges('request', r.id, '2500')).toBe('');
    expect(a.state.reqs.find(x => x.id === r.id).payFee).toBe(2500);
    expect(a.floatBook().some(l => l.kind === 'charge' && l.ref === r.id && l.amt === 2500)).toBe(true);
    const unpaid = a.state.reqs.find(x => x.st !== 'paid');
    if (unpaid) expect(a.setCharges('request', unpaid.id, '100')).toMatch(/paid request/);
  });

  it('charges on a company cash book entry can be corrected; staff cannot change charges', () => {
    const a = app('finance');
    expect(a.addEntry({ dir: 'out', amt: 1000000, cat: 'Rent', party: 'Landlord' })).toBe('');
    const l = a.state.ledger[0];
    expect(a.setCharges('ledger', l.id, '5000')).toBe('');
    expect(a.cashEntries().some(e => e.cat === 'Transaction charges' && e.amt === 5000)).toBe(true);
    a.setState({ role: 'staff' });
    expect(a.setCharges('ledger', l.id, '1')).toMatch(/Only Finance/);
  });

  it('the Float line details offer charges editing for expenses and request payments', () => {
    const a = app('finance');
    const FL = a.renderVals().FL;
    const lines = FL.dayView(a.fToday()).lines;
    const l = lines.find(x => x.kind === 'expense' && !x.void) || lines.find(x => x.kind === 'request');
    if (l) { expect(l.canFee).toBe(true); expect(typeof l.setFee).toBe('function'); }
  });
});
