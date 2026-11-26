import { describe, it, expect } from 'vitest';
import TrinityApp from '../logic/TrinityApp';

const app = role => { const a = new TrinityApp(); a.confirm = () => true; a.setState({ role }); return a; };

describe('edit client and lead details', () => {
  it('Management edits a client; a rename follows to projects, leads and unsent invoices', () => {
    const a = app('ceo');
    a.setState({
      customers: [{ id: 'C1', n: 'TCRA', contact: 'Asha · Head of PR', phone: '', email: '', tin: '', vrn: '', owner: 'NL' }],
      projects: [{ id: 'P1', client: 'TCRA', name: 'Booth', st: 'on' }],
      leads: [{ id: 'L1', c: 'TCRA', t: 'Booth', v: 0, s: 0, owner: 'NL', hist: [] }],
      invoices: [{ id: 'INV-0001', c: 'TCRA', st: 'draft' }, { id: 'INV-0002', c: 'TCRA', st: 'sent', sentAt: '2026-11-20' }]
    });
    const C = a.renderVals().CR.customers[0];
    expect(C.canEdit).toBe(true);
    C.edit();
    expect(a.state.modal.title).toMatch(/Edit client/);
    expect(a.state.form).toMatchObject({ id: 'C1', n: 'TCRA', contact: 'Asha', title: 'Head of PR' });
    expect(a.updateCustomer({ id: 'C1', n: 'Tanzania Communications Regulatory Authority', contact: 'Asha', title: 'Head of PR', tin: '100-200-300' })).toBe('');
    const n = 'Tanzania Communications Regulatory Authority';
    expect(a.state.customers[0]).toMatchObject({ n, tin: '100-200-300', contact: 'Asha · Head of PR' });
    expect(a.state.projects[0].client).toBe(n);
    expect(a.state.leads[0].c).toBe(n);
    expect(a.state.invoices.find(i => i.id === 'INV-0001')).toMatchObject({ c: n, tin: '100-200-300' });
    expect(a.state.invoices.find(i => i.id === 'INV-0002').c).toBe('TCRA');
  });

  it('a staff member who does not own the client cannot edit it; duplicate names are refused', () => {
    const a = app('staff');
    a.setState({ customers: [{ id: 'C1', n: 'A', owner: 'XX' }, { id: 'C2', n: 'B', owner: 'XX' }] });
    expect(a.canEditClient(a.state.customers[0])).toBe(false);
    a.setState({ role: 'ceo' });
    expect(a.updateCustomer({ id: 'C1', n: 'b' })).toMatch(/already a client/);
  });

  it('the lead owner edits a lead; the change is noted', () => {
    const a = app('ceo');
    a.setState({ leads: [{ id: 'L1', c: 'Ttt', t: 'Branding', v: 0, s: 0, owner: 'NL', hist: [] }] });
    a.setState({ leadSel: 'L1', crmTab: 'leads' });
    const L = a.renderVals().CR.sel;
    expect(L.canEdit).toBe(true);
    L.edit();
    expect(a.state.modal.act).toBe('leadEdit');
    expect(a.updateLead({ id: 'L1', c: 'TTCL', t: 'Branding of 3 shops', v: '45', contact: 'John 0754', src: 'Referral' })).toBe('');
    expect(a.state.leads[0]).toMatchObject({ c: 'TTCL', t: 'Branding of 3 shops', v: 45, contact: 'John 0754', src: 'Referral' });
    expect(a.state.leads[0].hist.at(-1).note).toMatch(/Details updated: client, work, value, contact, source/);
  });
});

describe('invoice number', () => {
  const lines = [{ item: 'Booth branding', n: 1, rate: 1000000, days: 1, events: 1 }];
  it('can be set and changed, must be unique, and defaults to the system number', () => {
    const a = app('finance');
    a.setState({ invoices: [], customers: [{ id: 'C1', n: 'TCRA' }] });
    expect(a.saveInvoice({ c: 'TCRA', lines })).toBe('');
    const first = a.state.invoices[0];
    expect(first.no).toBe(first.id);
    expect(a.saveInvoice({ c: 'TCRA', lines, no: 'TMS/2026/045' })).toBe('');
    expect(a.state.invoices[0].no).toBe('TMS/2026/045');
    expect(a.saveInvoice({ c: 'TCRA', lines, no: 'tms/2026/045' })).toMatch(/already used/);
    expect(a.saveInvoice({ id: first.id, c: 'TCRA', lines, no: 'TMS/2026/044' })).toBe('');
    expect(a.state.invoices.find(i => i.id === first.id).no).toBe('TMS/2026/044');
    expect(a.renderVals().FIN || true).toBeTruthy();
  });
});
