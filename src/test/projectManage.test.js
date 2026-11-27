import { describe, it, expect } from 'vitest';
import TrinityApp from '../logic/TrinityApp';

const app = role => { const a = new TrinityApp(); a.confirm = () => true; a.setState({ role }); return a; };
const proj = (a, id) => a.state.projects.find(p => p.id === id);

describe('GM / Management run a project directly', () => {
  it('the GM sets a brief project straight to Ongoing, then Completed, with open tasks and no budget', () => {
    const a = app('gm');
    a.setState({ projects: [{ id: 'P1', name: 'Booth', client: 'TCRA', flow: 'brief', st: 'on', notes: [] }], tasks: [{ id: 'T1', p: 'P1', st: 'todo', t: 'x' }] });
    expect(a.setProjectStage('P1', 'execution', 'Agreed by phone')).toBe('');
    expect(proj(a, 'P1').flow).toBe('execution');
    expect(proj(a, 'P1').notes.at(-1).t).toMatch(/Moved to Execution · Set directly by the GM \(steps skipped\) · Agreed by phone/);
    expect(a.setProjectStage('P1', 'closed', 'Delivered')).toBe('');
    expect(proj(a, 'P1')).toMatchObject({ flow: 'closed', st: 'done', prog: 100 });
    // And back to ongoing if it was closed by mistake.
    expect(a.setProjectStage('P1', 'execution')).toBe('');
    expect(proj(a, 'P1')).toMatchObject({ flow: 'execution', st: 'on', closedAt: null });
  });

  it('a waiting budget counts as approved when set to Ongoing', () => {
    const a = app('ceo');
    a.setState({ projects: [{ id: 'P1', name: 'X', client: 'C', flow: 'approval', st: 'on', budget: { st: 'gm', value: 5e6, lines: [] }, notes: [] }] });
    a.setProjectStage('P1', 'execution');
    expect(proj(a, 'P1').budget.st).toBe('approved');
  });

  it('value and budget are updated in TZS and noted; others cannot', () => {
    const a = app('gm');
    a.setState({ projects: [{ id: 'P1', name: 'X', client: 'C', flow: 'execution', st: 'on', val: 0, bud: 0, notes: [] }] });
    expect(a.setProjectMoney('P1', { val: '20,000,000', bud: '12000000', note: 'Second day added' })).toBe('');
    expect(proj(a, 'P1')).toMatchObject({ val: 20, bud: 12 });
    expect(a.projectValue(proj(a, 'P1'))).toBe(20e6);
    expect(proj(a, 'P1').notes.at(-1).t).toMatch(/Agreed value TZS 0 → TZS 20,000,000 · Budget TZS 0 → TZS 12,000,000 · Second day added/);
    expect(a.setProjectMoney('P1', { val: 'abc' })).toMatch(/number/);
    a.setState({ projects: [Object.assign({}, proj(a, 'P1'), { budget: { value: 20e6, st: 'approved', lines: [] } })] });
    a.setProjectMoney('P1', { val: '25000000' });
    expect(proj(a, 'P1').budget.value).toBe(25e6);
    for (const r of ['staff', 'operations', 'finance', 'pa']) {
      a.setState({ role: r });
      expect(a.setProjectStage('P1', 'closed')).toMatch(/Only the GM or Management/);
      expect(a.setProjectMoney('P1', { val: '1' })).toMatch(/Only the GM or Management/);
    }
  });

  it('the panel shows for the GM and Management only; the PA records the PO at any stage', async () => {
    const a = app('gm');
    a.setState({ projects: [{ id: 'P1', name: 'X', client: 'C', flow: 'brief', st: 'on', notes: [], team: [] }], page: 'project', projectId: 'P1' });
    const M = a.renderVals().PV.manage;
    expect(M.stages.map(s => s.l)).toEqual(['Brief', 'Design', 'Proposal', 'Budget', 'Approval', 'Ongoing', 'Completed']);
    a.setState({ role: 'pa' });
    const V = a.renderVals().PV;
    expect(V.manage).toBeNull();
    expect(V.po.can).toBe(true);
    expect(await a.recordPO('P1', { no: 'PO-77', date: '2026-11-27', vendor: 'V1' })).toBeFalsy();
    expect(proj(a, 'P1').po).toMatchObject({ no: 'PO-77' });
  });
});
