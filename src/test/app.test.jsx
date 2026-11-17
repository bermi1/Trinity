import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import TrinityApp from '../logic/TrinityApp';

function signIn(role) {
  localStorage.setItem('tm360', JSON.stringify({ auth: true, role, page: undefined }));
  return render(<App />);
}

describe('sign in', () => {
  it('rejects a short password and accepts a valid one', () => {
    render(<App />);
    const [email, pw] = document.querySelectorAll('input');
    fireEvent.change(email, { target: { value: 'daniel.k@trinitymark.co.tz' } });
    fireEvent.change(pw, { target: { value: '12' } });
    fireEvent.click(screen.getByText('SIGN IN'));
    expect(screen.getByText(/at least 4 characters/)).toBeTruthy();
    fireEvent.change(pw, { target: { value: 'demo1234' } });
    fireEvent.click(screen.getByText('SIGN IN'));
    expect(screen.getByText('Set a PIN for quick sign-in')).toBeTruthy();
    fireEvent.click(screen.getByText('Not now'));
    expect(screen.getByRole('heading', { name: /^Good (morning|afternoon|evening),/ })).toBeTruthy();
  });

  it('opens a demo portal with one tap, without a password or PIN prompt', () => {
    render(<App />);
    expect(screen.queryByText('Google')).toBeNull();
    expect(screen.queryByText('Microsoft')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Store' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Finance' }));
    expect(screen.queryByText('Not now')).toBeNull();
    expect(screen.getByText('Rose Temba’s queue')).toBeTruthy();
  });
});

describe('every page renders for every role', () => {
  const pages = ['dashboard', 'briefing', 'projects', 'project', 'tasks', 'requests', 'finance', 'store', 'procurement', 'crm', 'staff', 'notifications', 'field', 'staffportal', 'financeportal', 'reception', 'storekeeper', 'rooms', 'proposals', 'production', 'logistics', 'documents', 'reports', 'calendar', 'settings', 'ceomobile'];
  for (const role of ['ceo', 'gm', 'staff', 'finance', 'reception', 'store', 'production']) {
    it(role, () => {
      for (const page of pages) {
        localStorage.setItem('tm360', JSON.stringify({ auth: true, role, page, projectId: 'PRJ-0231' }));
        const { unmount, container } = render(<App />);
        expect(container.querySelector('main')).toBeTruthy();
        unmount();
      }
    });
  }
});

describe('workflows', () => {
  it('approving a money request moves it to finance for payment, then pays it', () => {
    const app = new TrinityApp();
    const req = app.state.reqs.find(r => r.id === 'REQ-0418');
    app.decide(req, true);
    expect(app.state.reqs.find(r => r.id === 'REQ-0418')).toMatchObject({ st: 'approved', step: 5 });
    app.payReq(app.state.reqs.find(r => r.id === 'REQ-0418'));
    expect(app.state.reqs.find(r => r.id === 'REQ-0418').st).toBe('paid');
    expect(app.state.staff.find(p => p.k === 'JM').fl).toBe(600000);
  });

  it('the new task form validates and creates a task', () => {
    const app = new TrinityApp();
    const before = app.state.tasks.length;
    app.openModal('task');
    app.submitModal();
    expect(app.state.modalErr).toBe('Task is required.');
    app.setState({ form: { ...app.state.form, t: 'Print 500 flyers' } });
    app.submitModal();
    expect(app.state.tasks.length).toBe(before + 1);
    expect(app.state.tasks[0].t).toBe('Print 500 flyers');
    expect(app.state.modal).toBeNull();
  });

  it('issuing and receiving stock changes the quantity', () => {
    const app = new TrinityApp();
    app.openModal('issue', { sku: 'RLU-850', n: 'Roll-up stand', u: 'pcs' });
    app.setState({ form: { ...app.state.form, q: '5' } });
    app.submitModal();
    expect(app.state.stock.find(i => i.sku === 'RLU-850').q).toBe(13);
    app.openModal('receive', { sku: 'RLU-850', n: 'Roll-up stand', u: 'pcs' });
    app.setState({ form: { ...app.state.form, q: '7' } });
    app.submitModal();
    expect(app.state.stock.find(i => i.sku === 'RLU-850').q).toBe(20);
  });

  it('briefing actions become tasks', () => {
    const app = new TrinityApp();
    app.setState({ newAct: { d: 'Hire extra crew', a: 'Call two installers', o: 'MM', dl: 'Fri' } });
    app.renderVals().addAction();
    expect(app.state.actions.at(-1).a).toBe('Call two installers');
    expect(app.state.tasks[0]).toMatchObject({ t: 'Call two installers', who: 'MM' });
  });

  it('the assistant answers from live data', () => {
    const app = new TrinityApp();
    expect(app.answer('which stock is low?')).toMatch(/Vinyl 1.37m gloss/);
    expect(app.answer('what needs my approval')).toMatch(/requests are waiting for you/);
  });

  it('saves data to the browser', async () => {
    signIn('ceo');
    fireEvent.click(screen.getAllByText('Approvals')[0]);
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: 'Approve' })[0]);
      await new Promise(r => setTimeout(r, 400));
    });
    const saved = JSON.parse(localStorage.getItem('tm360data'));
    expect(saved.reqs.find(r => r.id === 'REQ-0418').st).toBe('approved');
  });
});

describe('requests', () => {
  it('opening a paid request shows its details instead of crashing', () => {
    localStorage.setItem('tm360', JSON.stringify({ auth: true, role: 'ceo', page: 'requests' }));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^All ·/ }));
    fireEvent.click(screen.getAllByText('REQ-0412')[0]);
    expect(screen.getAllByText('Paid · float open').length).toBeGreaterThan(0);
  });
});

describe('command palette', () => {
  it('opens with Ctrl+K and runs the first match on Enter', () => {
    signIn('ceo');
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'go to calendar' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getAllByText('Calendar').length).toBeGreaterThan(0);
  });
});

describe('approval chain permissions', () => {
  const route = (app, f) => {
    const id = app.createRequest(Object.assign({ who: 'SK', p: 'PRJ-0231', purpose: 'Test' }, f));
    const steps = [app.state.reqs.find(r => r.id === id).step];
    const notified = [app.state.notes[0].to];
    while (app.state.reqs.find(r => r.id === id).st === 'pending') {
      app.decide(app.state.reqs.find(r => r.id === id), true);
      steps.push(app.state.reqs.find(r => r.id === id).step);
      notified.push(app.state.notes[0].to);
    }
    return { r: app.state.reqs.find(r => r.id === id), steps, notified };
  };

  it('project and internal requests: GM → Finance → Management → Finance pays', () => {
    for (const type of ['project', 'internal']) {
      const { r, steps, notified } = route(new TrinityApp(), { type, amt: 900000, title: 'Office internet' });
      expect(steps).toEqual([2, 3, 4, 5]);
      expect(notified).toEqual(['GN', 'RT', 'DK', 'RT']);
      expect(r).toMatchObject({ type, st: 'approved' });
      expect(r.log[1]).toBe('Not needed');
    }
  });

  it('emergency requests: GM → Management → Finance pays', () => {
    const { steps, notified, r } = route(new TrinityApp(), { type: 'emergency', amt: 900000, title: 'Generator repair' });
    expect(steps).toEqual([2, 4, 5]);
    expect(notified).toEqual(['GN', 'DK', 'RT']);
    expect(r.log.filter(t => t === 'Not needed')).toHaveLength(2);
  });

  it('management requests: Finance checks, then pays', () => {
    const { steps, notified } = route(new TrinityApp(), { type: 'management', amt: 900000, title: 'Client dinner' });
    expect(steps).toEqual([3, 5]);
    expect(notified).toEqual(['RT', 'RT']);
  });

  it('small project and office requests skip Management; the company sets the limit (0 = never)', () => {
    expect(route(new TrinityApp(), { type: 'project', amt: 150000 }).steps).toEqual([2, 3, 5]);
    expect(route(new TrinityApp(), { type: 'emergency', amt: 150000 }).steps).toEqual([2, 4, 5]);
    const app = new TrinityApp();
    app.setState({ company: { smallLimit: 0, off: [] } });
    expect(route(app, { type: 'internal', amt: 5000 }).steps).toEqual([2, 3, 4, 5]);
  });

  it('only the GM, Finance and Management approve; staff never do', () => {
    const app = new TrinityApp();
    const req = { id: 'REQ-9', type: 'project', who: 'GM', p: 'PRJ-0231', amt: 900000, step: 2, st: 'pending', log: [] };
    app.setState({ role: 'staff' });
    expect([2, 3, 4].map(step => app.canAct({ ...req, step }))).toEqual([false, false, false]);
    expect(app.canPay()).toBe(false);
    app.setState({ role: 'gm' });
    expect([2, 3, 4].map(step => app.canAct({ ...req, step }))).toEqual([true, false, false]);
    app.setState({ role: 'finance' });
    expect([2, 3, 4].map(step => app.canAct({ ...req, step }))).toEqual([false, true, false]);
    expect(app.canPay()).toBe(true);
    app.setState({ role: 'ceo' });
    expect([2, 3, 4].map(step => app.canAct({ ...req, step }))).toEqual([true, true, true]);
    // Requests made before the request types existed still wait for their Project Manager.
    app.setState({ role: 'staff' });
    app.ROLES = { ...app.ROLES, staff: { ...app.ROLES.staff, k: 'SK' } };
    expect(app.canAct({ ...req, step: 1 })).toBe(true);
  });
});

describe('PIN unlock', () => {
  const type = digits => digits.split('').forEach(d => fireEvent.click(screen.getByRole('button', { name: d })));

  it('sets a PIN after signing in, then asks for it when the app is reopened', async () => {
    const first = render(<App />);
    fireEvent.change(document.querySelectorAll('input')[0], { target: { value: 'daniel.k@trinitymark.co.tz' } });
    fireEvent.change(document.querySelectorAll('input')[1], { target: { value: 'demo1234' } });
    fireEvent.click(screen.getByText('SIGN IN'));
    type('1111');
    await act(async () => { fireEvent.click(screen.getByText('Next')); });
    type('1111');
    await act(async () => { fireEvent.click(screen.getByText('Save PIN')); });
    expect(await screen.findByText('Use 4 to 6 digits, not all the same or in a row.')).toBeTruthy();
    type('2580');
    await act(async () => { fireEvent.click(screen.getByText('Next')); });
    type('2580');
    await act(async () => { fireEvent.click(screen.getByText('Save PIN')); });
    expect(await screen.findByRole('heading', { name: /^Good (morning|afternoon|evening),/ })).toBeTruthy();
    first.unmount();

    sessionStorage.clear();                 // the browser was closed
    render(<App />);
    expect(screen.getByText('Enter your PIN')).toBeTruthy();
    type('9999');
    await act(async () => { fireEvent.click(screen.getByText('Unlock')); });
    expect(await screen.findByText('Wrong PIN · 4 tries left')).toBeTruthy();
    type('2580');
    await act(async () => { fireEvent.click(screen.getByText('Unlock')); });
    expect(await screen.findByRole('heading', { name: /^Good (morning|afternoon|evening),/ })).toBeTruthy();
  });

  it('five wrong PINs sign the person out', async () => {
    const { savePin } = await import('../logic/pin');
    await savePin('daniel.k@trinitymark.co.tz', '2580');
    sessionStorage.clear();
    localStorage.setItem('tm360', JSON.stringify({ auth: true, role: 'ceo', page: 'dashboard', pinUser: 'daniel.k@trinitymark.co.tz' }));
    render(<App />);
    for (let left = 4; left >= 0; left--) {
      type('1357');
      await act(async () => { fireEvent.click(screen.getByText('Unlock')); });
      if (left) await screen.findByText('Wrong PIN · ' + left + (left === 1 ? ' try' : ' tries') + ' left');
    }
    expect(await screen.findByText('Too many wrong PINs. Sign in with your password.')).toBeTruthy();
    expect(localStorage.getItem('tm360-pin')).toBeNull();
  });
});
