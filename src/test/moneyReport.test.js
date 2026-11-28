import { describe, it, expect } from 'vitest';
import TrinityApp from '../logic/TrinityApp';

describe('money report PDF', () => {
  it('builds a branded one-page report for the chosen period', () => {
    const a = new TrinityApp(); a.setState({ role: 'finance', repPeriod: 'month' });
    const R = a.renderVals().REP;
    let html = '';
    const orig = a.printMoneyReport; a.printMoneyReport = D => { html = a.moneyReportHtml(D); return html; };
    R.pdf();
    a.printMoneyReport = orig;
    expect(html).toContain('MONEY REPORT');
    expect(html).toContain('trinity-logo-full.png');
    expect(html).toContain(R.label);
    expect(html).toContain('Where the money went');
    expect(html).toContain('Money in and out');
    expect(html).toContain('Prepared by (Finance)');
  });
});
