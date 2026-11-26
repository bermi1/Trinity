import { describe, it, expect } from 'vitest';
import TrinityApp from '../logic/TrinityApp';

const app = role => { const a = new TrinityApp(); a.confirm = () => true; a.setState({ role }); return a; };

describe('New project with a new client', () => {
  it('"+ New client" shows the client fields; creating adds the client and the project', () => {
    const a = app('ceo');
    a.setState({ customers: [{ id: 'C1', n: 'TCRA' }] });
    a.openModal('project');
    let F = a.renderVals().modalFields.map(f => f.k);
    expect(F).not.toContain('nc_n');
    a.renderVals().modalFields.find(f => f.k === 'client').set('__new_client__');
    F = a.renderVals().modalFields.map(f => f.k);
    expect(F).toEqual(expect.arrayContaining(['nc_n', 'nc_contact', 'nc_phone', 'nc_tin', 'nc_vrn']));
    // The company name is required.
    a.setState({ form: Object.assign({}, a.state.form, { name: 'Launch' }) });
    a.submitModal();
    expect(a.state.modalErr).toMatch(/company name is required/i);
    a.setState({ form: Object.assign({}, a.state.form, { nc_n: 'Azam Media Ltd', nc_contact: 'Rose', nc_tin: '104-555-210', venue: 'Mlimani City', pax: '300' }) });
    a.submitModal();
    expect(a.state.modal).toBeNull();
    expect(a.state.customers.find(c => c.n === 'Azam Media Ltd')).toMatchObject({ tin: '104-555-210', contact: 'Rose' });
    expect(a.state.projects[0]).toMatchObject({ client: 'Azam Media Ltd', name: 'Launch', venue: 'Mlimani City', pax: 300 });
  });

  it('an existing client typed again is reused, not duplicated; with no clients the form starts on New client', () => {
    const a = app('ceo');
    a.setState({ customers: [] });
    a.openModal('project');
    expect(a.state.form.client).toBe('__new_client__');
    a.setState({ customers: [{ id: 'C1', n: 'TCRA' }] });
    a.setState({ form: { client: '__new_client__', nc_n: 'tcra', name: 'Booth' } });
    a.submitModal();
    expect(a.state.customers.length).toBe(1);
    expect(a.state.projects[0].client).toBe('TCRA');
  });
});
