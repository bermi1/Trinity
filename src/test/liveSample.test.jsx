import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { createFakeSupabase } from './fakeSupabase';
import rows from './liveSample.json';

// The records loaded into the live workspace for presentations, opened the way staff open them.
let db;
vi.mock('../lib/supabase', () => ({ get supabase() { return db; } }));
const { default: App } = await import('../App');

const staff = [['FM', 'clientservice', 'Faith Moris Daffa'], ['JK', 'staff', 'Johansen Katunzi'], ['MBM', 'operations', "M'baraka Mohamedi"], ['DI', 'staff', 'Daudi Imani'], ['EG', 'production', 'Ester Goodluck'], ['EN', 'staff', 'Elias Titus Ngonyani'], ['IE', 'staff', 'Innocent Emmanuel'], ['MK', 'staff', 'Mariam Kinogo'], ['JE', 'creative', 'Jenipher Emmanuel'], ['DM', 'pa', 'Diana Mfinanga'], ['LL', 'finance', 'Livia Lwekamwa'], ['JS', 'staff', 'Jonathan Soystenes'], ['MKI', 'reception', 'Martha Kiwayo']];

beforeEach(() => {
  const users = { 'admin@tm.co.tz': { id: 'u0', password: 'admin12345' } }, profiles = { u0: { role: 'ceo', full_name: 'Administrator', title: 'System administrator', person_key: 'AD', is_admin: true } };
  staff.forEach(([k, role, n], i) => { users[k.toLowerCase() + '@tm.co.tz'] = { id: 'u' + (i + 1), password: 'Trinity@2026' }; profiles['u' + (i + 1)] = { role, full_name: n, title: '', person_key: k, is_admin: false, is_demo: false }; });
  db = createFakeSupabase({ users, profiles });
  db.tables.app_records.set('_meta|workspace', { collection: '_meta', id: 'workspace', position: 0, data: { mode: 'live' } });
  const today = new Date().toISOString().slice(0, 10);
  rows.forEach(r => { const c = structuredClone(r); if (c.collection === 'visitors') c.data.date = today; db.tables.app_records.set(c.collection + '|' + c.id, c); });
});

async function signIn(email, pw) {
  window.innerWidth = 1440;
  render(<App />);
  await screen.findByText('SIGN IN');
  const inputs = document.querySelectorAll('input');
  fireEvent.change(inputs[0], { target: { value: email } });
  fireEvent.change(inputs[1], { target: { value: pw } });
  fireEvent.click(screen.getByText('SIGN IN'));
  fireEvent.click(await screen.findByText('Not now'));
}

describe('presentation data in the live workspace', () => {
  it('Management sees the projects, the launch record and the client history', async () => {
    const errs = []; const spy = vi.spyOn(console, 'error').mockImplementation((...a) => errs.push(a.join(' ')));
    await signIn('admin@tm.co.tz', 'admin12345');
    fireEvent.click(screen.getAllByText('Projects')[0]);
    expect(await screen.findByText(/Product Launch · Kili Lager Lite/)).toBeTruthy();
    expect(screen.getByText(/Brand Activation Roadshow/)).toBeTruthy();
    fireEvent.click(screen.getAllByText(/Product Launch · Kili Lager Lite/)[0]);
    expect((await screen.findAllByText(/KBL\/PO\/2026\/0911/)).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByText('Clients & leads')[0]);
    fireEvent.click(await screen.findByRole('tab', { name: /Clients/ }));
    const card = document.querySelector('[data-customer="Kilimanjaro Beverages Ltd"]');
    fireEvent.click(within(card).getByRole('button', { name: /History · 1 ongoing · 1 past/ }));
    expect(within(card).getByText('Staff Awards Night 2025')).toBeTruthy();
    spy.mockRestore();
    expect(errs.filter(e => !/act\(|not wrapped/.test(e))).toEqual([]);
  });

  it('a staff member sees the task given to them', async () => {
    await signIn('di@tm.co.tz', 'Trinity@2026');
    fireEvent.click((await screen.findAllByText('My work'))[0]);
    expect(await screen.findByText('Book stage, lights and sound supplier')).toBeTruthy();
  });

  it('Finance sees the invoices', async () => {
    await signIn('ll@tm.co.tz', 'Trinity@2026');
    // Invoices are under "More" in the Finance menu.
    if (!screen.queryAllByText(/^Invoices/).length) fireEvent.click((await screen.findAllByRole('button', { name: /^More/ }))[0]);
    fireEvent.click((await screen.findAllByText(/^Invoices/))[0]);
    expect(await screen.findByText(/DEMO-INV1/)).toBeTruthy();
  });

  it('Reception sees the visitor in the building', async () => {
    await signIn('mki@tm.co.tz', 'Trinity@2026');
    expect(await screen.findByText('Neema Shirima')).toBeTruthy();
  });
});
