import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

beforeEach(() => {
  db = createFakeSupabase({
    users: { 'daniel@tm.co.tz': { id: 'u1', password: 'secret123' }, 'fatma@tm.co.tz': { id: 'u2', password: 'secret123' } },
    profiles: { u1: { role: 'ceo', full_name: 'Daniel K.', title: 'Managing Director', person_key: 'DK' }, u2: { role: 'store', full_name: 'Fatma Hassan', title: 'Storekeeper', person_key: 'FH' } }
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
    await screen.findByText('COMPANY COMMAND CENTER');
    expect(screen.getByText('LIVE DATA')).toBeTruthy();
    window.innerWidth = 1024;
    expect(db.tables.app_records.get('reqs|REQ-0418').data.st).toBe('pending');

    fireEvent.click(screen.getAllByText('Requests & Floats')[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Approve' })[0]);
    await waitFor(() => expect(db.tables.app_records.get('reqs|REQ-0418').data.st).toBe('approved'));
  });

  it('shows changes made by someone else straight away', async () => {
    render(<App />);
    await screen.findByText('SIGN IN');
    signInAs('daniel@tm.co.tz', 'secret123');
    await screen.findByText('COMPANY COMMAND CENTER');
    fireEvent.click(screen.getAllByText('Projects')[0]);
    const row = db.tables.app_records.get('projects|PRJ-0231');
    act(() => db.remoteUpsert({ ...row, data: { ...row.data, name: 'Lake Zone Roadshow II' } }));
    expect(await screen.findByText(/Lake Zone Roadshow II/)).toBeTruthy();
  });

  it('keeps non-management staff in their own portal', async () => {
    render(<App />);
    await screen.findByText('SIGN IN');
    fireEvent.click(screen.getByRole('button', { name: 'Management' }));
    signInAs('fatma@tm.co.tz', 'secret123');
    expect(await screen.findByText('STOREKEEPER PORTAL')).toBeTruthy();
  });
});
