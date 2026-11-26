import { describe, it, expect } from 'vitest';
import TrinityApp from '../logic/TrinityApp';
import { dayKey } from '../logic/seed';

const app = role => { const a = new TrinityApp(); a.confirm = () => true; a.setState({ role }); return a; };
const daily = (by, at, to = ['DK']) => ({ id: 'RP' + by + at, by, dept: '', kind: 'daily', title: 'Day report', summary: 'Did the work today', issues: '', next: '', file: null, to, at, time: '17:00', readBy: {}, replies: [] });

describe('daily reports calendar', () => {
  it('opens on the calendar and marks the days a staff member sent a daily report', () => {
    const a = app('staff'), me = a.me().k;
    a.setState({ reports: [daily(me, dayKey(0)), daily(me, dayKey(-1)), Object.assign(daily(me, dayKey(-1)), { id: 'w', kind: 'weekly' })] });
    const R = a.renderVals().RPT;
    expect(R.tab).toBe('calendar');
    const C = R.cal;
    expect(C.receive).toBe(false);
    const today = C.cells.find(c => c && c.key === dayKey(0));
    expect(today.st).toBe('full');
    expect(C.reports).toHaveLength(1);
    expect(C.reports[0].mine).toBe(true);
  });

  it('lets Management pick a person, counts reports per day and lists who has not sent', () => {
    const a = app('ceo');
    const staff = (a.state.staff || []).map(p => p.k).filter(k => k !== a.me().k);
    expect(staff.length).toBeGreaterThan(1);
    a.setState({ reports: [daily(staff[0], dayKey(0))] });
    let C = a.renderVals().RPT.cal;
    expect(C.who).toBe('all');
    expect(C.cells.find(c => c && c.key === dayKey(0)).n).toBe(1);
    expect(C.missing).toContain(a.av(staff[1]).n);
    C.setWho(staff[1]);
    C = a.renderVals().RPT.cal;
    expect(C.reports).toHaveLength(0);
    C.prev();
    expect(a.renderVals().RPT.cal.month < dayKey(0).slice(0, 7)).toBe(true);
  });
});

describe('portals', () => {
  it('staff quick buttons are Requests, Reports, Calendar and More', () => {
    const a = app('staff'); a.setState({ w: 390 });
    expect(a.renderVals().mobileTabs.map(t => t.l)).toEqual(['Requests', 'Reports', 'Calendar', 'More']);
  });

  it('Printing is an ordinary department: department home, no print floor', () => {
    const a = app('production');
    expect(a.ROLES.production.home).toBe('dept');
    const pages = a.navFor('production').map(i => i[0]);
    expect(pages).toContain('dept');
    expect(pages).not.toContain('printshop');
    expect(a.allowedPage('production', 'printshop')).toBe('dept');
  });
});
