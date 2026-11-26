import { describe, it, expect } from 'vitest';
import TrinityApp from '../logic/TrinityApp';

const app = role => { const a = new TrinityApp(); a.confirm = () => true; a.setState({ role }); return a; };
const lead = (extra = {}) => Object.assign({ id: 'L1', sv: 2, c: 'Serena Group', t: 'Gala dinner', v: 80, s: 2, owner: 'NL', contact: 'Asha', hist: [], venue: 'Serena Hotel', setupDate: '2026-12-12', pax: 250 }, extra);

describe('leads carry venue, setup date and pax', () => {
  it('new work records venue, setup date and pax', () => {
    const a = app('ceo');
    a.setState({ leads: [] });
    const id = a.newWork({ c: 'Serena Group', t: 'Gala dinner', owner: 'NL', venue: ' Serena Hotel ', setupDate: '2026-12-12', pax: '250' });
    expect(id[0]).toBe('L');
    expect(a.state.leads[0]).toMatchObject({ venue: 'Serena Hotel', setupDate: '2026-12-12', pax: 250 });
    expect(a.renderVals().CR.stages[0].leads[0].event).toMatch(/Serena Hotel · setup 12 Dec.* · 250 pax/);
  });

  it('new work refuses a bad pax or setup date, through the form too', () => {
    const a = app('ceo');
    a.setState({ leads: [] });
    expect(a.newWork({ c: 'X', t: 'Y', pax: '2.5' })).toMatch(/whole number/);
    expect(a.newWork({ c: 'X', t: 'Y', pax: '-3' })).toMatch(/whole number/);
    expect(a.newWork({ c: 'X', t: 'Y', setupDate: '2026-02-31' })).toMatch(/valid setup date/);
    expect(a.state.leads.length).toBe(0);
    a.openModal('work');
    a.setState({ form: Object.assign({}, a.state.form, { c: 'X', t: 'Y', pax: 'abc' }) });
    a.submitModal();
    expect(a.state.modalErr).toMatch(/whole number/);
    expect(a.state.leads.length).toBe(0);
    a.setState({ form: Object.assign({}, a.state.form, { pax: '0' }) });
    a.submitModal();
    expect(a.state.leads.length).toBe(1);
    expect(a.state.leads[0].pax).toBe(0);
  });

  it('edit lead changes venue and pax, validates, and notes the change', () => {
    const a = app('ceo');
    a.setState({ leads: [lead({ venue: '', setupDate: '', pax: 0 })] });
    a.editLead('L1');
    expect(a.state.form).toMatchObject({ venue: '', setupDate: '', pax: '' });
    expect(a.updateLead({ id: 'L1', c: 'Serena Group', t: 'Gala dinner', v: '80', contact: 'Asha', venue: 'JNICC', pax: 'ten' })).toMatch(/whole number/);
    expect(a.updateLead({ id: 'L1', c: 'Serena Group', t: 'Gala dinner', v: '80', contact: 'Asha', venue: 'JNICC', setupDate: '12/12/2026' })).toMatch(/valid setup date/);
    expect(a.state.leads[0].venue).toBe('');
    expect(a.updateLead({ id: 'L1', c: 'Serena Group', t: 'Gala dinner', v: '80', contact: 'Asha', venue: 'JNICC', setupDate: '2026-12-01', pax: '400' })).toBe('');
    expect(a.state.leads[0]).toMatchObject({ venue: 'JNICC', setupDate: '2026-12-01', pax: 400 });
    expect(a.state.leads[0].hist.at(-1).note).toBe('Details updated: venue, setup date, pax');
    a.setState({ leadSel: 'L1', crmTab: 'leads' });
    expect(a.renderVals().CR.sel).toMatchObject({ venue: 'JNICC', pax: '400' });
    expect(a.renderVals().CR.sel.setup).toMatch(/^1 Dec/);
  });
});

describe('push a lead to a client and a project', () => {
  it('creates the client and a linked project carrying the event details; the lead keeps its stage', () => {
    const a = app('ceo');
    a.setState({ leads: [lead()], customers: [], leadSel: 'L1', crmTab: 'leads' });
    const L = a.renderVals().CR.sel;
    expect(L.job).toBe('');
    const id = L.push();
    expect(id).toMatch(/^PRJ-/);
    expect(a.state.customers.filter(c => c.n === 'Serena Group').length).toBe(1);
    const p = a.state.projects.find(x => x.id === id);
    expect(p).toMatchObject({ client: 'Serena Group', name: 'Gala dinner', lead: 'L1', cs: 'NL', val: 80, venue: 'Serena Hotel', setupDate: '2026-12-12', pax: 250, flow: 'brief' });
    const l = a.state.leads[0];
    expect(l.job).toBe(id);
    expect(a.leadStage(l)).toBe(2);
    expect(l.hist.at(-1).note).toBe('Client & project created · ' + id);
    expect(a.state.page).toBe('project');
    expect(a.state.projectId).toBe(id);
  });

  it('a second push opens the same project; an existing client is not duplicated', () => {
    const a = app('ceo');
    a.setState({ leads: [lead()], customers: [{ id: 'C1', n: 'serena group', owner: 'NL' }] });
    const n0 = a.state.projects.length;
    const id = a.pushLead('L1');
    expect(a.pushLead('L1')).toBe(id);
    expect(a.state.projects.length).toBe(n0 + 1);
    expect(a.state.customers.length).toBe(1);
    a.setState({ leadSel: 'L1', page: 'clients' });
    expect(a.renderVals().CR.sel.job).toBe(id);
  });

  it('moving the lead to Won afterwards does not create another project', () => {
    const a = app('ceo');
    a.setState({ leads: [lead({ s: 4 })], customers: [] });
    const id = a.pushLead('L1');
    const n = a.state.projects.length;
    expect(a.moveLead('L1', 5, { value: 90 })).toBe('');
    expect(a.state.projects.length).toBe(n);
    expect(a.state.leads[0].job).toBe(id);
    expect(a.state.customers.length).toBe(1);
  });

  it('only whoever can move the lead can push it', () => {
    const a = app('staff');
    a.setState({ leads: [lead({ owner: 'XX' })], customers: [] });
    expect(a.pushLead('L1')).toMatch(/Only/);
    expect(a.state.leads[0].job).toBeUndefined();
  });
});
