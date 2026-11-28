import { describe, it, expect, vi } from 'vitest';
import TrinityApp from '../logic/TrinityApp';

const app = role => { const a = new TrinityApp(); a.confirm = () => true; a.setState({ role }); return a; };

describe('Finance asks the boss for float', () => {
  it('the boss is told in the app and on WhatsApp with balance now, asked and new balance; approving gives the float', () => {
    const a = app('finance');
    const before = a.floatBalance(), boss = a.ROLES.ceo.k;
    a.phones = { [boss]: '0754000101' };
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    expect(a.askFloat(5000000, 'Week of events in Mwanza and Arusha')).toBe('');
    const ask = a.fl().asks[0];
    expect(ask).toMatchObject({ amt: 5000000, st: 'open', balBefore: before });
    const n = a.state.notes.find(x => x.to === boss && /Float request/.test(x.t));
    expect(n.s).toContain('new balance ' + a.fmtT(before + 5000000));
    const msg = decodeURIComponent(open.mock.calls[0][0]);
    expect(msg).toContain('Balance now: ' + a.fmtT(before));
    expect(msg).toContain('Amount requested: ' + a.fmtT(5000000));
    expect(msg).toContain('New balance after approval: ' + a.fmtT(before + 5000000));
    open.mockRestore();
    // Finance can't approve its own request.
    expect(a.approveFloatAsk(ask.id)).toMatch(/Only Management/);
    a.setState({ role: 'ceo' });
    const H = a.renderVals().HD.float;
    expect(H.asks[0]).toMatchObject({ before: a.fmtT(before), after: a.fmtT(before + 5000000) });
    expect(H.asks[0].approve()).toBe('');
    expect(a.fl().asks[0]).toMatchObject({ st: 'given', gave: 5000000 });
    expect(a.floatBalance()).toBe(before + 5000000);
    expect(a.state.notes.some(x => x.to === a.ROLES.finance.k && /Float received/.test(x.t))).toBe(true);
  });

  it('Management can decline with a reason; Finance is told', () => {
    const a = app('finance');
    a.askFloat(1000000, 'Transport for the setup crew');
    const id = a.fl().asks[0].id;
    a.setState({ role: 'ceo' });
    expect(a.declineFloatAsk(id, '')).toMatch(/reason/);
    expect(a.declineFloatAsk(id, 'Use the balance first')).toBe('');
    expect(a.fl().asks[0]).toMatchObject({ st: 'declined', why: 'Use the balance first' });
  });
});
