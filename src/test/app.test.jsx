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
    const [, pw] = document.querySelectorAll('input');
    fireEvent.change(pw, { target: { value: '12' } });
    fireEvent.click(screen.getByText('SIGN IN'));
    expect(screen.getByText(/at least 4 characters/)).toBeTruthy();
    fireEvent.change(pw, { target: { value: 'demo1234' } });
    fireEvent.click(screen.getByText('SIGN IN'));
    expect(screen.getByText('COMPANY COMMAND CENTER')).toBeTruthy();
  });

  it('opens the chosen portal', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Store' }));
    fireEvent.click(screen.getByText('SIGN IN'));
    expect(screen.getByText('STOREKEEPER PORTAL')).toBeTruthy();
  });
});

describe('every page renders for every role', () => {
  const pages = ['dashboard', 'briefing', 'projects', 'project', 'tasks', 'requests', 'finance', 'store', 'procurement', 'crm', 'staff', 'notifications', 'field', 'staffportal', 'financeportal', 'reception', 'storekeeper', 'rooms', 'proposals', 'production', 'logistics', 'documents', 'reports', 'calendar', 'settings', 'ceomobile'];
  for (const role of ['ceo', 'staff', 'finance', 'reception', 'store']) {
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
    fireEvent.click(screen.getAllByText('Requests & Floats')[0]);
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
    fireEvent.change(input, { target: { value: 'go to logistics' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getAllByText('Logistics').length).toBeGreaterThan(0);
    expect(screen.getByText(/Vehicles, drivers and every trip/)).toBeTruthy();
  });
});
