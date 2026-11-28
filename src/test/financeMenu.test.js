import { describe, it, expect } from 'vitest';
import TrinityApp from '../logic/TrinityApp';

describe('Finance menu', () => {
  it('is grouped in order (Money, Invoices & accounts, My day, More) and keeps every page', () => {
    const a = new TrinityApp(); a.setState({ role: 'finance' });
    const G = a.navGroups('finance');
    expect(G.map(g => g[0])).toEqual(['Money', 'Invoices & accounts', 'My day', 'More']);
    expect(G[0][1].map(i => i[0])).toEqual(['float', 'financeportal', 'requests', 'receipts']);
    expect(G[1][1].map(i => i[0])).toEqual(['invoices', 'finance', 'cashbook', 'freports']);
    expect(G[2][1].map(i => i[0])).toEqual(expect.arrayContaining(['today', 'memos', 'checkin', 'meetings', 'reporting']));
  });
  it('other portals keep memos and check-in in their first group', () => {
    const a = new TrinityApp(); a.setState({ role: 'staff' });
    const first = a.navGroups('staff')[0][1].map(i => i[0]);
    expect(first).toEqual(expect.arrayContaining(['memos', 'checkin']));
  });
});
