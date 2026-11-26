import { describe, it, expect, vi } from 'vitest';
import TrinityApp from '../logic/TrinityApp';

const app = role => { const a = new TrinityApp(); a.confirm = () => true; a.setState({ role }); return a; };

describe('memo WhatsApp reminders', () => {
  it('the sender reminds the department head, then the person it is assigned to', () => {
    const a = app('ceo'), me = a.me().k, head = a.managerOf('creative');
    a.phones = { [head]: '0754000111', GM: '0754000222' };
    a.setState({ memos: [{ id: 'MM1', from: me, to: head, dept: 'creative', cat: 'project', text: 'Design the Kilimo banner', st: 'sent', at: '2026-11-26', log: [] }] });
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    let m = a.renderVals().MEMO.sent[0];
    expect(m.remind.map(p => p.k)).toEqual([head]);
    expect(m.remind[0].wa()).toBe('');
    expect(open).toHaveBeenCalledTimes(1);
    const url = open.mock.calls[0][0];
    expect(url).toContain('https://wa.me/255754000111?text=');
    expect(decodeURIComponent(url)).toContain('Design the Kilimo banner');
    expect(decodeURIComponent(url)).toContain('/?go=memo:MM1');
    expect(a.memoById('MM1').log.at(-1).t).toBe('WhatsApp reminder to ' + a.av(head).n);
    expect(a.state.notes.some(n => n.to === head && /Reminder · memo/.test(n.t))).toBe(true);

    a.setState({ memos: a.state.memos.map(x => Object.assign({}, x, { who: 'GM', st: 'assigned' })) });
    m = a.renderVals().MEMO.sent[0];
    expect(m.remind.map(p => p.k)).toEqual(['GM']);
    open.mockRestore();
  });

  it('no number saved: says so and opens nothing; done memos have no reminders', () => {
    const a = app('ceo'), me = a.me().k, head = a.managerOf('creative');
    a.phones = {};
    a.setState({ memos: [{ id: 'MM2', from: me, to: head, dept: 'creative', cat: 'project', text: 'Costing please', st: 'sent', at: '2026-11-26', log: [] }] });
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const m = a.renderVals().MEMO.sent[0];
    expect(m.remind[0].has).toBe(false);
    expect(m.remind[0].wa()).toMatch(/has not added a WhatsApp number/);
    expect(open).not.toHaveBeenCalled();
    a.setState({ memos: a.state.memos.map(x => Object.assign({}, x, { st: 'done' })) });
    expect(a.renderVals().MEMO.sent[0].remind).toEqual([]);
    open.mockRestore();
  });
});
