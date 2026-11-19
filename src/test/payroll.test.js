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
    const l = payLine({ basic: 850000, allow: 80000, heslb: true }, 50000);
    expect(l.gross).toBe(930000);
    expect(l.nssf).toBe(93000);
    expect(l.taxable).toBe(837000);
    expect(l.paye).toBe(68000 + Math.round(77000 * 0.25));
    expect(l.heslb).toBe(127500);
    expect(l.net).toBe(930000 - 93000 - l.paye - 127500 - 50000);
    expect([l.erNssf, l.sdl, l.wcf]).toEqual([93000, 32550, 4650]);
  });
});
