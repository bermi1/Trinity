import { describe, it, expect } from 'vitest';
import TrinityApp from '../logic/TrinityApp';
import { dayKey } from '../logic/seed';

const app = role => { const a = new TrinityApp(); a.confirm = () => true; a.setState({ role }); return a; };
const LINES = [{ item: 'Brand ambassadors', n: 2, rate: 500000, days: 1, events: 1 }];
// 1,000,000 direct + 15% admin = 1,150,000 net; + 18% VAT = 1,357,000.
const inv = (id, extra) => Object.assign({ id, c: 'TCRA', p: '', st: 'sent', at: dayKey(0), sentAt: dayKey(0), lines: LINES, admin: 15, vat: 18, v: 1.357, signer: 'ED', signed: { by: 'DM', at: dayKey(0) }, by: 'FN', payments: [] }, extra);
const year = +dayKey(0).slice(0, 4);
const get = (a, id) => a.state.invoices.find(i => i.id === id);
const fh = (a, id) => a.renderVals().FH.invoices.find(i => i.id === id);

describe('cancel an invoice', () => {
  it('Finance cancels with a reason: status, record, notifications, activity', () => {
    const a = app('finance');
    a.setState({ invoices: [inv('INV-9001', { by: 'GMX' })], notes: [], activity: [] });
    expect(a.cancelInvoice('INV-9001', '  Wrong client  ')).toBe('');
    const i = get(a, 'INV-9001');
    expect(i.st).toBe('cancelled');
    expect(i.cancelled).toMatchObject({ by: a.me().k, at: dayKey(0), reason: 'Wrong client', prevSt: 'sent' });
    expect(a.state.activity[0].t).toMatch(/Invoice cancelled/);
    const to = a.state.notes.map(n => n.to);
    expect(to).toContain('GMX');
    expect(to).toContain(a.ROLES.ceo.k);
    const v = fh(a, 'INV-9001');
    expect(v.cancelled).toBe(true);
    expect(v.cancelInfo).toMatchObject({ reason: 'Wrong client', at: dayKey(0) });
    expect(v.canPay || v.canSign || v.canEdit || v.canCancel || v.needsSign).toBe(false);
  });

  it('is refused without a reason, with a confirmed payment, for other roles, or when not confirmed', () => {
    const a = app('gm');
    a.setState({ invoices: [inv('INV-9001'), inv('INV-9002', { st: 'partial', payments: [{ id: 'PY1', amt: 100000, ok: 'DM', at: dayKey(0) }] })] });
    expect(a.cancelInvoice('INV-9001', '   ')).toMatch(/reason/);
    expect(get(a, 'INV-9001').st).toBe('sent');
    expect(a.cancelInvoice('INV-9002', 'Duplicate')).toMatch(/refund \/ credit note first/);
    expect(get(a, 'INV-9002').st).toBe('partial');
    a.confirm = () => false;
    expect(a.cancelInvoice('INV-9001', 'Duplicate')).toBe('Not cancelled');
    expect(get(a, 'INV-9001').st).toBe('sent');
    const b = app('staff');
    b.setState({ invoices: [inv('INV-9001')] });
    expect(b.cancelInvoice('INV-9001', 'Duplicate')).toMatch(/Only Management, the GM and Finance/);
    expect(get(b, 'INV-9001').st).toBe('sent');
  });

  it('unconfirmed payments stay but do not block; they cannot be confirmed afterwards', () => {
    const a = app('finance');
    a.setState({ invoices: [inv('INV-9001', { payments: [{ id: 'PY1', amt: 100000, ok: null, at: dayKey(0) }] })] });
    expect(a.cancelInvoice('INV-9001', 'Client cancelled the event')).toBe('');
    a.setState({ role: 'ceo' });
    a.confirmPayment('INV-9001', 'PY1');
    expect(get(a, 'INV-9001').payments[0].ok).toBeFalsy();
    expect(fh(a, 'INV-9001').payments[0].canOk).toBe(false);
  });

  it('no longer counts toward the company goal, receivables or reports', () => {
    const a = app('ceo');
    a.setState({ projects: [], invoices: [inv('INV-9001'), inv('INV-9002', { st: 'overdue' })] });
    const before = a.wonByWeek(year).fromInvoices;
    const owed = () => a.renderVals().FH.kpis[0].v;
    const owedBefore = owed();
    const aging = () => a.renderVals().REP.aging.reduce((x, b) => x + b.n, 0);
    expect(aging()).toBe(2);
    expect(a.cancelInvoice('INV-9002', 'Replaced by INV-9003')).toBe('');
    expect(a.wonByWeek(year).fromInvoices).toBeCloseTo(before / 2);
    expect(a.wonByWeek(year).list.map(x => x.id)).not.toContain('INV-9002');
    expect(owed()).not.toBe(owedBefore);
    expect(a.renderVals().FH.kpis[1].v).toBe(a.fmtT(0));
    expect(aging()).toBe(1);
  });

  it('cannot be paid, signed, sent or edited afterwards; its number stays used', () => {
    const a = app('finance');
    a.setState({ invoices: [inv('INV-9001', { no: 'TMS/2026/045', st: 'draft', signed: null })] });
    expect(a.cancelInvoice('INV-9001', 'Typo in the scope')).toBe('');
    expect(a.recordPayment('INV-9001', 1000, 'X')).toMatch(/cancelled/);
    a.sendInvoice('INV-9001');
    expect(get(a, 'INV-9001').st).toBe('cancelled');
    a.setState({ role: 'ceo' });
    expect(a.canSign(get(a, 'INV-9001'))).toBe(false);
    a.signInvoice('INV-9001');
    expect(get(a, 'INV-9001').signed).toBeFalsy();
    expect(a.saveInvoice({ id: 'INV-9001', c: 'TCRA', lines: LINES })).toMatch(/cancelled/);
    expect(a.saveInvoice({ c: 'TCRA', no: 'TMS/2026/045', lines: LINES })).toMatch(/already used/);
    expect(a.cancelInvoice('INV-9001', 'Again')).toMatch(/already cancelled/);
  });

  it('Management restores it to the previous status; others cannot', () => {
    const a = app('finance');
    a.setState({ invoices: [inv('INV-9001', { st: 'overdue' })] });
    expect(a.cancelInvoice('INV-9001', 'By mistake')).toBe('');
    expect(fh(a, 'INV-9001').canRestore).toBe(false);
    expect(a.restoreInvoice('INV-9001')).toMatch(/Only Management/);
    a.setState({ role: 'ceo' });
    expect(fh(a, 'INV-9001').canRestore).toBe(true);
    expect(a.restoreInvoice('INV-9001')).toBe('');
    expect(get(a, 'INV-9001')).toMatchObject({ st: 'overdue', cancelled: null });
    expect(get(a, 'INV-9001').restored.was.reason).toBe('By mistake');
    expect(a.recordPayment('INV-9001', 1000, 'X')).toBe('');
  });
});
