import { describe, it, expect } from 'vitest';
import TrinityApp from '../logic/TrinityApp';
import { isoWeek } from '../logic/targets';

const app = () => { const a = new TrinityApp(); a.confirm = () => true; a.setState({ role: 'gm' }); return a; };
const year = isoWeek(new Date()).year;
const day = `${year}-11-23`;

describe('company goal counts invoices', () => {
  it('a sent invoice on a project with no agreed value counts in full, before VAT', () => {
    const a = app();
    a.setState({ targets: [{ id: 'T', year, revenue: 3e9, depts: {}, weeks: {} }],
      projects: [{ id: 'PRJ-0001', name: 'TCRA booth', client: 'TCRA', at: day, st: 'on', val: 0 }],
      invoices: [{ id: 'INV-0001', c: 'TCRA', p: 'PRJ-0001', v: 8.26, vat: 18, st: 'sent', at: day, title: 'TCRA BOOTH BRANDING' }] });
    const w = a.wonByWeek(year);
    expect(Math.round(w.fromInvoices)).toBe(Math.round(8.26e6 / 1.18));
    expect(w.fromProjects).toBe(0);
    expect(a.renderVals().TG.won.invoices).toBe(1);
  });

  it('drafts do not count, and a project is never counted twice', () => {
    const a = app();
    a.setState({ projects: [{ id: 'P1', at: day, st: 'on', val: 10 }],
      invoices: [
        { id: 'I1', p: 'P1', v: 6, st: 'sent', at: day },
        { id: 'I2', p: 'P1', v: 6, st: 'paid', at: day },
        { id: 'I3', p: 'P1', v: 50, st: 'draft', at: day },
        { id: 'I4', p: '', v: 2, st: 'sent', at: day }
      ] });
    const w = a.wonByWeek(year);
    // project 10M + invoices beyond it (12M billed → 2M more) + 2M invoice with no project
    expect(w.fromProjects).toBe(10e6);
    expect(Math.round(w.fromInvoices)).toBe(4e6);
  });

  it('lost projects and their invoices do not count', () => {
    const a = app();
    a.setState({ projects: [{ id: 'P1', at: day, st: 'lost', val: 10 }], invoices: [{ id: 'I1', p: 'P1', v: 6, st: 'sent', at: day }] });
    const w = a.wonByWeek(year);
    expect(w.fromProjects + w.fromInvoices).toBe(0);
  });
});
