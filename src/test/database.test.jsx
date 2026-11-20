import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { createFakeSupabase } from './fakeSupabase';

let db;
vi.mock('../lib/supabase', () => ({ get supabase() { return db; } }));

const { default: App } = await import('../App');

function signInAs(email, password) {
  const inputs = document.querySelectorAll('input');
  fireEvent.change(inputs[0], { target: { value: email } });
  fireEvent.change(inputs[1], { target: { value: password } });
  fireEvent.click(screen.getByText('SIGN IN'));
}
// After a password sign-in the app offers a PIN; these tests skip it.
const skipPin = async () => fireEvent.click(await screen.findByText('Not now'));

beforeEach(() => {
  db = createFakeSupabase({
    users: { 'daniel@tm.co.tz': { id: 'u1', password: 'secret123' }, 'fatma@tm.co.tz': { id: 'u2', password: 'secret123' }, 'admin@tm.co.tz': { id: 'u3', password: 'admin12345' } },
    profiles: {
      u1: { role: 'ceo', full_name: 'Daniel K.', title: 'Managing Director', person_key: 'DK', is_demo: true },
      u2: { role: 'store', full_name: 'Fatma Hassan', title: 'Storekeeper', person_key: 'FH', is_demo: true },
      u3: { role: 'ceo', full_name: 'Administrator', title: 'System administrator', person_key: 'AD', is_admin: true }
    }
  });
});

describe('live database', () => {
  it('rejects a wrong password', async () => {
    render(<App />);
    await screen.findByText('SIGN IN');
    signInAs('daniel@tm.co.tz', 'nope1234');
    expect(await screen.findByText('Wrong email or password.')).toBeTruthy();
  });

  it('signs in, seeds the empty database and saves changes to it', async () => {
    window.innerWidth = 1440;
    render(<App />);
    await screen.findByText('SIGN IN');
    expect(screen.getByText('Sign in with your Trinity Mark account')).toBeTruthy();
    signInAs('daniel@tm.co.tz', 'secret123');
    await skipPin();
    await screen.findByRole('heading', { name: /^Good (morning|afternoon|evening),/ });
    expect(screen.getByText('LIVE DATA')).toBeTruthy();
    window.innerWidth = 1024;
    expect(db.tables.app_records.get('reqs|REQ-0418').data.st).toBe('pending');

    fireEvent.click(screen.getAllByText('Approvals')[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Approve' })[0]);
    await waitFor(() => expect(db.tables.app_records.get('reqs|REQ-0418').data.st).toBe('approved'));
  });

  it('shows changes made by someone else straight away', async () => {
    render(<App />);
    await screen.findByText('SIGN IN');
    signInAs('daniel@tm.co.tz', 'secret123');
    await skipPin();
    await screen.findByRole('heading', { name: /^Good (morning|afternoon|evening),/ });
    fireEvent.click(screen.getAllByText('Projects')[0]);
    const row = db.tables.app_records.get('projects|PRJ-0231');
    act(() => db.remoteUpsert({ ...row, data: { ...row.data, name: 'Lake Zone Roadshow II' } }));
    expect(await screen.findByText(/Lake Zone Roadshow II/)).toBeTruthy();
  });

  it('opens a demo portal with one tap using the demo password, with no PIN prompt', async () => {
    vi.stubEnv('VITE_DEMO_PASSWORD', 'demo-pass');
    db.users['gm@trinitymark.co.tz'] = { id: 'u4', password: 'demo-pass' };
    db.tables.profiles.set('u4', { role: 'gm', full_name: 'Joseph Ngowi', title: 'General Manager', person_key: 'GN', is_demo: true });
    render(<App />);
    await screen.findByText('SIGN IN');
    fireEvent.click(screen.getByRole('button', { name: 'General Manager' }));
    expect(await screen.findByRole('heading', { name: /^Good (morning|afternoon|evening),/ })).toBeTruthy();
    expect(screen.queryByText('Not now')).toBeNull();
    vi.unstubAllEnvs();
  });

  it('without a demo password (production), the login shows no demo portals', async () => {
    vi.stubEnv('VITE_DEMO_PASSWORD', '');
    render(<App />);
    await screen.findByText('SIGN IN');
    expect(screen.queryByRole('group', { name: 'Demo portals' })).toBeNull();
    expect(screen.queryByText('or open a demo portal')).toBeNull();
    vi.unstubAllEnvs();
  });

  it('keeps non-management staff in their own portal', async () => {
    render(<App />);
    await screen.findByText('SIGN IN');
    signInAs('fatma@tm.co.tz', 'secret123');
    await skipPin();
    expect(await screen.findByText('STOREKEEPER PORTAL')).toBeTruthy();
  });
});

describe('administrator', () => {
  const asAdmin = async () => {
    window.innerWidth = 1440;
    render(<App />);
    await screen.findByText('SIGN IN');
    signInAs('admin@tm.co.tz', 'admin12345');
    await skipPin();
    await screen.findByRole('heading', { name: /^Good (morning|afternoon|evening),/ });
    fireEvent.click(screen.getByRole('button', { name: /More/ }));
    fireEvent.click(screen.getByText('Users & access'));
    await screen.findByText('Accounts · 3');
  };
  const field = label => screen.getByText(label, { selector: 'label' }).querySelector('input, select');

  it('only administrators see Users & access', async () => {
    render(<App />);
    await screen.findByText('SIGN IN');
    signInAs('daniel@tm.co.tz', 'secret123');
    await skipPin();
    await screen.findByRole('heading', { name: /^Good (morning|afternoon|evening),/ });
    const more = screen.queryByRole('button', { name: /More/ });
    if (more) fireEvent.click(more);
    expect(screen.queryByText('Users & access')).toBeNull();
  });

  it('creates an account that can then sign in to its portal', async () => {
    await asAdmin();
    fireEvent.change(field('Full name'), { target: { value: 'Neema Lyimo' } });
    fireEvent.change(field('Email'), { target: { value: 'neema@tm.co.tz' } });
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Portal' })).getByRole('radio', { name: 'Finance' }));
    fireEvent.change(field('Starting password'), { target: { value: 'short' } });
    fireEvent.click(screen.getByText('Create account'));
    expect(await screen.findByText('The starting password needs at least 8 characters.')).toBeTruthy();
    fireEvent.change(field('Starting password'), { target: { value: 'Welcome-2026' } });
    await act(async () => { fireEvent.click(screen.getByText('Create account')); });
    expect(await screen.findByText('Accounts · 4')).toBeTruthy();
    expect(db.tables.profiles.get('u4')).toMatchObject({ role: 'finance', full_name: 'Neema Lyimo', person_key: 'NL' });
    expect(db.users['neema@tm.co.tz'].password).toBe('Welcome-2026');
  });

  it('a new account must choose its own password on first sign-in', async () => {
    db.users['new@tm.co.tz'] = { id: 'u9', password: 'Welcome-2026', meta: {} };
    db.tables.profiles.set('u9', { role: 'staff', full_name: 'Habiba Juma', title: 'Office Assistant', person_key: 'HJ', is_admin: false, is_demo: false });
    render(<App />);
    await screen.findByText('SIGN IN');
    signInAs('new@tm.co.tz', 'Welcome-2026');
    expect(await screen.findByText('Welcome, Habiba')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'Welcome-2026' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'Welcome-2026' } });
    await act(async () => { fireEvent.click(screen.getByText('Save and continue')); });
    expect(await screen.findByText('Choose a password different from the one you were given.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'Habiba-own-1' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'Habiba-own-1' } });
    await act(async () => { fireEvent.click(screen.getByText('Save and continue')); });
    expect(db.users['new@tm.co.tz'].password).toBe('Habiba-own-1');
    expect(screen.queryByText('Welcome, Habiba')).toBeNull();
  });

  it('removes all demo accounts and demo data in one tap, leaving an empty workspace', async () => {
    window.confirm = () => true;
    await asAdmin();
    expect(db.tables.app_records.size).toBeGreaterThan(50);
    await act(async () => { fireEvent.click(screen.getByText('Remove demo accounts and data')); });
    expect(await screen.findByText(/Demo removed · 2 accounts and \d+ records deleted/)).toBeTruthy();
    expect(await screen.findByText('Accounts · 1')).toBeTruthy();
    expect([...db.tables.app_records.keys()]).toEqual(['_meta|workspace']);
    fireEvent.click(screen.getByText('Projects'));
    expect(await screen.findByText('All · 0')).toBeTruthy();
  });
});
