import { describe, it, expect } from 'vitest';
import TrinityApp from '../logic/TrinityApp';
import { eventFields, eventLine, fmtDay } from '../logic/flow';

const app = role => { const a = new TrinityApp(); a.confirm = () => true; a.setState({ role }); return a; };
const proj = (a, id) => a.state.projects.find(p => p.id === id);
const lastNote = (a, id) => { const n = proj(a, id).notes || []; return n[n.length - 1]; };

describe('project event details: venue, setup date, pax', () => {
  it('newProject stores venue, setupDate and pax', () => {
    const a = app('ceo');
    const id = a.newProject({ client: 'Mlimani Bank', name: 'Gala', venue: '  Serena Hotel  ', setupDate: '2026-12-12', pax: '250' });
    expect(id).toMatch(/^PRJ-/);
    expect(proj(a, id)).toMatchObject({ venue: 'Serena Hotel', setupDate: '2026-12-12', pax: 250, flow: 'brief' });
  });

  it('newProject normalises bad input', () => {
    const a = app('ceo');
    const id = a.newProject({ client: 'Mlimani Bank', name: 'Gala', venue: '  Mlimani   City ', setupDate: '2026-02-30', pax: '-5' });
    expect(proj(a, id)).toMatchObject({ venue: 'Mlimani City', setupDate: '', pax: 0 });
    const id2 = a.newProject({ client: 'Mlimani Bank', name: 'Gala 2', setupDate: '12/12/2026', pax: '1,200.7' });
    expect(proj(a, id2)).toMatchObject({ venue: '', setupDate: '', pax: 1200 });
    const id3 = a.newProject({ client: 'Mlimani Bank', name: 'Gala 3', pax: 'many' });
    expect(proj(a, id3)).toMatchObject({ venue: '', setupDate: '', pax: 0 });
    expect(eventFields({ pax: 80 })).toEqual({ venue: '', setupDate: '', pax: 80 });
  });

  it('formats the setup date and the card line', () => {
    expect(fmtDay('2026-12-12')).toBe('12 Dec 2026');
    expect(fmtDay('nope')).toBe('');
    expect(eventLine({ venue: 'Serena', setupDate: '2026-12-12', pax: 1200 })).toBe('Serena · 12 Dec 2026 · 1,200 pax');
    expect(eventLine({})).toBe('');
  });

  it('the project page shows the event; the PM edits it and the change is noted', () => {
    const a = app('ceo');
    a.setState({ projectId: 'PRJ-0231' });
    const E = a.renderVals().PV.event;
    expect(E).toMatchObject({ venue: 'Rock City Mall grounds, Mwanza', setup: '12 Dec 2026', paxN: 1200, canEdit: true });

    const pm = app('operations'); // the Operations Manager
    expect(pm.editProjectEvent('PRJ-0231', { venue: 'CCM Kirumba Stadium', setupDate: '2026-12-14', pax: '1500' })).toBe('');
    expect(proj(pm, 'PRJ-0231')).toMatchObject({ venue: 'CCM Kirumba Stadium', setupDate: '2026-12-14', pax: 1500 });
    expect(lastNote(pm, 'PRJ-0231').t).toMatch(/^Event details changed · Venue: CCM Kirumba Stadium · Setup: 14 Dec 2026 · Pax: 1500 · by /);
  });

  it('the project’s Client Service owner may edit; others are refused; bad values are refused', () => {
    const cs = app('clientservice');
    const id = cs.newProject({ client: 'Kilimo Bank', name: 'Launch' });
    expect(cs.editProjectEvent(id, { venue: 'Arusha AICC', setupDate: '2027-01-10', pax: 90 })).toBe('');
    expect(proj(cs, id)).toMatchObject({ venue: 'Arusha AICC', setupDate: '2027-01-10', pax: 90 });
    expect(cs.editProjectEvent(id, { venue: 'Arusha AICC', setupDate: '2027-13-01', pax: 90 })).toMatch(/setup date/);
    expect(cs.editProjectEvent(id, { venue: 'Arusha AICC', setupDate: '', pax: '12.5' })).toMatch(/whole number/);

    const staff = app('staff');
    staff.setState({ projects: cs.state.projects });
    expect(staff.editProjectEvent(id, { venue: 'Elsewhere' })).toMatch(/Only/);
    expect(proj(staff, id).venue).toBe('Arusha AICC');
    staff.setState({ projectId: 'PRJ-0231' });
    const PV = staff.renderVals().PV;
    if (!PV.none) expect(PV.event.canEdit).toBe(false);
  });
});

describe('moving a project step by step with a comment', () => {
  it('Client Service moves Brief → Design with a comment: noted, shown in the timeline, sent to Creative', () => {
    const a = app('clientservice');
    const id = a.newProject({ client: 'Kilimo Bank', name: 'Store Opening' });
    expect(a.advanceProject(id, '  Brief agreed in the client meeting  ')).toBe('');
    expect(proj(a, id).flow).toBe('design');
    const n = lastNote(a, id);
    expect(n).toMatchObject({ step: 'design', comment: 'Brief agreed in the client meeting' });
    expect(n.t).toBe('Moved to Design · Brief agreed in the client meeting · by ' + a.me().n);
    expect(a.state.notes.some(x => x.to === a.managerOf('creative') && /moved to Design/i.test(x.t) && /Brief agreed in the client meeting/.test(x.s))).toBe(true);
    a.setState({ projectId: id });
    expect(a.renderVals().PV.feed.some(e => e.t === 'Step · Design' && /Brief agreed/.test(e.s))).toBe(true);
  });

  it('moving on without a comment still works', () => {
    const a = app('ceo');
    const id = a.newProject({ client: 'Kilimo Bank', name: 'Store Opening' });
    expect(a.advanceProject(id)).toBe('');
    expect(proj(a, id).flow).toBe('design');
    expect(lastNote(a, id).t).toBe('Moved to Design · by ' + a.me().n);
    expect(a.advanceProject(id, '')).toBe('');
    expect(proj(a, id).flow).toBe('proposal');
  });

  it('keeps each step’s rules: open designs, the proposal file, the budget, approvals, open tasks', () => {
    const a = app('ceo');
    // Design with a brief not yet approved.
    const id = a.newProject({ client: 'Kilimo Bank', name: 'Store Opening' });
    a.createBrief({ t: 'Backdrop', p: id });
    expect(proj(a, id).flow).toBe('design');
    expect(lastNote(a, id).t).toMatch(/^Moved to Design · Design brief sent to Creative · by /);
    expect(a.advanceProject(id, 'done')).toMatch(/not approved/);
    // Proposal and budget need their own action.
    a.setProject(id, { flow: 'proposal' });
    expect(a.advanceProject(id, 'x')).toMatch(/Upload the proposal/);
    a.setProject(id, { flow: 'budget' });
    expect(a.advanceProject(id, 'x')).toMatch(/Submit the budget/);
    // Staff cannot move a project on.
    const s = app('staff');
    const sid = s.newProject({ client: 'Kilimo Bank', name: 'X' });
    expect(s.advanceProject(sid, 'hi')).toMatch(/Client Service/);
    expect(proj(s, sid).flow).toBe('brief');
  });

  it('submitting the budget and Management’s approval carry the comment', () => {
    const ops = app('operations');
    const id = ops.newProject({ client: 'Kilimo Bank', name: 'Store Opening' });
    ops.setProject(id, { flow: 'budget' });
    expect(ops.submitBudget(id, { pm: 'SK', lines: [{ item: 'Stage', qty: 1, cost: 1000000 }], value: 2000000 }, 'Two quotes compared')).toBe('');
    expect(proj(ops, id).flow).toBe('approval');
    expect(lastNote(ops, id).t).toMatch(/^Moved to Approval · Budget submitted .* · Two quotes compared · by /);
    expect(ops.state.notes.some(n => n.to === ops.ROLES.gm.k && /Two quotes compared/.test(n.s))).toBe(true);

    const ceo = app('ceo');
    ceo.setState({ projects: ops.state.projects });
    expect(ceo.approveBudget(id, 'Go ahead')).toBe('');
    expect(proj(ceo, id).flow).toBe('execution');
    expect(lastNote(ceo, id)).toMatchObject({ step: 'execution', comment: 'Go ahead' });
    expect(ceo.state.notes.some(n => n.to === ceo.ROLES.finance.k && /ready to invoice/.test(n.s) && /Go ahead/.test(n.s))).toBe(true);
  });

  it('sending the budget back is a step back, noted with the reason', () => {
    const gm = app('gm');
    expect(gm.returnBudget('PRJ-0224', 'Get a second quote')).toBe('');
    expect(proj(gm, 'PRJ-0224').flow).toBe('budget');
    expect(lastNote(gm, 'PRJ-0224').t).toBe('Moved back to Budget · Budget sent back · Get a second quote · by ' + gm.me().n);
  });

  it('closing needs every task done and takes a comment', () => {
    const a = app('ceo');
    const id = a.newProject({ client: 'Kilimo Bank', name: 'Store Opening' });
    a.setProject(id, { flow: 'execution' });
    a.setState(x => ({ tasks: [{ id: 'T1', t: 'Set up', p: id, who: 'GM', st: 'todo', pri: 'med', due: 'Fri' }, ...x.tasks] }));
    a.setState({ projectId: id });
    expect(a.renderVals().PV.now).toMatchObject({ next: 'Closed', closeBlock: 'Finish the 1 open task(s) first' });
    expect(a.closeProject(id, 'x')).toMatch(/still open/);
    a.setState(x => ({ tasks: x.tasks.map(t => (t.id === 'T1' ? Object.assign({}, t, { st: 'done' }) : t)) }));
    expect(a.advanceProject(id, 'Client signed off the event')).toBe('');
    expect(proj(a, id)).toMatchObject({ flow: 'closed', st: 'done' });
    expect(lastNote(a, id).t).toBe('Moved to Closed · Project closed · Client signed off the event · by ' + a.me().n);
  });
});
