import { describe, it, expect } from 'vitest';
import { paye, payLine } from '../logic/payroll';

describe('Tanzania payroll', () => {
  it('PAYE follows the mainland monthly bands', () => {
    expect(paye(270000)).toBe(0);
    expect(paye(520000)).toBe(20000);
    expect(paye(760000)).toBe(68000);
    expect(paye(1000000)).toBe(128000);
    expect(paye(1500000)).toBe(278000);
  });
  it('a pay line: NSSF 10%, PAYE on gross less NSSF, HESLB 15% of basic, employer costs', () => {
    const l = payLine({ basic: 850000, allow: 80000, heslb: true, nssf: true, paye: true, sdl: true, wcf: true }, [{ d: 'Salary advance', amt: 50000 }]);
    expect(l.gross).toBe(930000);
    expect(l.nssf).toBe(93000);
    expect(l.taxable).toBe(837000);
    expect(l.paye).toBe(68000 + Math.round(77000 * 0.25));
    expect(l.heslb).toBe(127500);
    expect(l.net).toBe(930000 - 93000 - l.paye - 127500 - 50000);
    expect([l.erNssf, l.sdl, l.wcf]).toEqual([93000, 32550, 4650]);
    expect(l.deds).toEqual([{ d: 'Salary advance', amt: 50000 }]);
  });
  it('nothing statutory is deducted unless it is switched on for the employee', () => {
    const l = payLine({ basic: 850000, allow: 80000 });
    expect([l.nssf, l.paye, l.heslb, l.erNssf, l.sdl, l.wcf, l.other]).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(l.net).toBe(930000);
  });
  it('deduction lines add up, each with its description', () => {
    const l = payLine({ basic: 500000 }, [{ d: 'Loan', amt: 30000 }, { d: 'Uniform', amt: 15000 }, { d: '', amt: 0 }]);
    expect(l.other).toBe(45000);
    expect(l.deds.length).toBe(2);
    expect(l.net).toBe(455000);
  });
});
