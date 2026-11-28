import { describe, it, expect } from 'vitest';
import TrinityApp from '../logic/TrinityApp';

const fin = page => { const a = new TrinityApp(); a.setState({ role: 'finance', page }); return a; };

describe('Finance menu', () => {
  it('has three money items, then her day', () => {
    const a = fin('float');
    const G = a.navGroups('finance');
    expect(G.map(g => g[0])).toEqual(['Money', 'My day', 'More']);
    expect(G[0][1].map(i => i[0])).toEqual(['float', 'requests', 'finance']);
    expect(G[0][1].map(i => i[1])).toEqual(['Float', 'Pay & approve', 'Invoices & finance']);
    expect(G[1][1].map(i => i[0])).toEqual(expect.arrayContaining(['today', 'memos', 'checkin']));
  });

  it('Pay & approve holds My queue, Requests and Receipts as tabs; the menu item stays lit', () => {
    for (const page of ['financeportal', 'requests', 'receipts']) {
      const v = fin(page).renderVals();
      expect(v.finTabs.map(t => t.l)).toEqual(['My queue', 'Requests', 'Receipts']);
      expect(v.finTabs.find(t => t.on).k).toBe(page);
      expect(v.nav.flatMap(g => g.items).find(i => i.on).l).toBe('Pay & approve');
    }
  });

  it('Invoices & finance holds Overview, Invoices, Company cash book and Finance reports as tabs', () => {
    for (const page of ['finance', 'invoices', 'cashbook', 'freports']) {
      const v = fin(page).renderVals();
      expect(v.finTabs.map(t => t.l)).toEqual(['Overview', 'Invoices', 'Company cash book', 'Finance reports']);
      expect(v.nav.flatMap(g => g.items).find(i => i.on).l).toBe('Invoices & finance');
    }
  });

  it('other portals have no Finance tabs, and keep memos and check-in in their first group', () => {
    const a = new TrinityApp(); a.setState({ role: 'staff', page: 'requests' });
    expect(a.renderVals().finTabs).toBeNull();
    expect(a.navGroups('staff')[0][1].map(i => i[0])).toEqual(expect.arrayContaining(['memos', 'checkin']));
  });
});
