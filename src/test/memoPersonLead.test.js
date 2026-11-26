import { describe, it, expect, vi } from 'vitest';
import TrinityApp from '../logic/TrinityApp';

const app = role => { const a = new TrinityApp(); a.confirm = () => true; a.setState({ role }); return a; };

describe('memo to one person', () => {
  it('goes straight to the person; they see it, the head of another department does not', async () => {
    const a = app('clientservice'), me = a.me().k;
    const M = a.renderVals().MEMO;
    const pick = M.people.find(p => p.v !== a.managerOf('creative') && a.deptOf(p.v) !== 'creative' && p.v !== a.ROLES.gm.k && p.v !== a.ROLES.ceo.k);
    expect(pick).toBeTruthy();
    expect(M.people.some(p => p.v === me)).toBe(false);
    const k = pick.v;
    expect(await a.sendMemo({ dept: 'person', to: k, cat: 'internal', text: 'Please send me the venue photos' })).toBe('');
    const m = a.state.memos[0];
    expect(m).toMatchObject({ dept: 'person', to: k, who: k, st: 'assigned', from: me });
    expect(a.state.tasks.some(t => t.memo === m.id && t.who === k)).toBe(true);
    expect(a.state.notes.some(n => n.to === k && /Memo to you from/.test(n.t))).toBe(true);
    // The sender can remind the person on WhatsApp.
    expect(a.renderVals().MEMO.sent[0].remind.map(p => p.k)).toEqual([k]);

    // The recipient: in "For me", pops up, can work on it.
    a.me = () => ({ ...a.av(k), k });
    a.setState({ role: 'staff' });
    let V = a.renderVals().MEMO;
    const row = V.inbox.find(x => x.id === m.id);
    expect(row).toBeTruthy();
    expect(row.direct).toBe(true);
    expect(row.canWork).toBe(true);
    expect(row.canAssign).toBe(false);
    expect(V.pop && V.pop.id).toBe(m.id);
    a.openMemo(m.id);
    expect(a.state.notes.some(n => n.to === me && /Memo seen by/.test(n.t))).toBe(true);
    expect(a.memoDone(m.id, 'Sent them')).toBe('');
    expect(a.state.notes.some(n => n.to === me && /Memo done/.test(n.t))).toBe(true);

    // The Creative head (another department) does not see the private memo.
    const head = a.managerOf('creative');
    a.me = () => ({ ...a.av(head), k: head });
    a.setState({ role: 'creative', memoId: m.id });
    V = a.renderVals().MEMO;
    expect(V.inbox.some(x => x.id === m.id)).toBe(false);
    expect(V.cur).toBe(null);
    expect(a.canSeeMemo(a.memoById(m.id))).toBe(false);
  });

  it('the head of the person’s own department does not see it either; Management does', async () => {
    const a = app('ceo');
    const k = a.teamOf('creative').find(x => x !== a.managerOf('creative'));
    expect(await a.sendMemo({ dept: 'person', to: k, text: 'A private word about Friday' })).toBe('');
    const id = a.state.memos[0].id, head = a.managerOf('creative');
    expect(a.renderVals().MEMO.all.some(x => x.id === id)).toBe(true);
    a.me = () => ({ ...a.av(head), k: head });
    a.setState({ role: 'creative' });
    expect(a.renderVals().MEMO.inbox.some(x => x.id === id)).toBe(false);
    expect(a.renderVals().MEMO.pop).toBe(null);
  });

  it('cannot send to nobody or to yourself', async () => {
    const a = app('ceo');
    expect(await a.sendMemo({ dept: 'person', text: 'Hello there' })).toMatch(/Choose the person/);
    expect(await a.sendMemo({ dept: 'person', to: a.me().k, text: 'Hello there' })).toMatch(/other than yourself/);
  });

  it('"Also send on WhatsApp" opens wa.me to the person, or to the department head', async () => {
    const a = app('ceo'), head = a.managerOf('creative');
    const k = a.renderVals().MEMO.people.find(p => p.v !== head).v;
    a.phones = { [k]: '0754000333', [head]: '0754000111' };
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    expect(await a.sendMemo({ dept: 'person', to: k, text: 'Call the client back today', wa: true })).toBe('');
    expect(open).toHaveBeenCalledTimes(1);
    let url = open.mock.calls[0][0];
    expect(url).toContain('https://wa.me/255754000333?text=');
    expect(decodeURIComponent(url)).toContain('Call the client back today');
    expect(a.state.memos[0].log.at(-1).t).toMatch(/Sent on WhatsApp/);
    expect(await a.sendMemo({ dept: 'creative', text: 'Banner artwork for Kilimo', wa: true })).toBe('');
    url = open.mock.calls[1][0];
    expect(url).toContain('https://wa.me/255754000111?text=');
    expect(await a.sendMemo({ dept: 'creative', text: 'No WhatsApp for this one' })).toBe('');
    expect(open).toHaveBeenCalledTimes(2);
    open.mockRestore();
  });
});

describe('lead pipeline: files are optional, and can be artwork', () => {
  const lead = (a, s) => { const id = 'LX' + s; a.setState({ leads: [{ id, sv: 2, c: 'Acme', t: 'Launch', v: 50, s, owner: a.me().k, at: '2026-11-20', hist: [] }, ...a.state.leads] }); return id; };

  it('moves to Proposal sent and on to Negotiation without a file', () => {
    const a = app('ceo'), id = lead(a, 2);
    expect(a.moveLead(id, 3, {})).toBe('');
    expect(a.state.leads.find(l => l.id === id).s).toBe(3);
    expect(a.moveLead(id, 4, {})).toBe('');
    const l = a.state.leads.find(x => x.id === id);
    expect(l.s).toBe(4);
    expect(l.proposal).toBeUndefined();
    // Won still opens a new project for it.
    expect(a.moveLead(id, 5, { value: 60 })).toBe('');
    const won = a.state.leads.find(x => x.id === id);
    expect(won.job).toBeTruthy();
    expect(a.state.projects.some(p => p.id === won.job && p.client === 'Acme')).toBe(true);
  });

  it('a file attached as artwork is labelled artwork and is not the proposal', () => {
    const a = app('ceo'), id = lead(a, 2);
    expect(a.moveLead(id, 3, { proposal: { name: 'Stage.pdf', size: 1000, url: '' }, kind: 'artwork' })).toBe('');
    let l = a.state.leads.find(x => x.id === id);
    expect(l.proposal).toBeUndefined();
    expect(l.files[0]).toMatchObject({ name: 'Stage.pdf', kind: 'artwork' });
    a.setState({ leadSel: id });
    let L = a.renderVals().CR.sel;
    expect(L.files[0].label).toBe('Artwork · Stage.pdf');
    expect(L.offerFile).toBe(true);
    // A proposal added later becomes l.proposal, the artwork stays.
    expect(a.attachLeadFile(id, { name: 'Acme proposal.pdf', size: 2000 }, 'proposal')).toBe('');
    l = a.state.leads.find(x => x.id === id);
    expect(l.proposal).toMatchObject({ name: 'Acme proposal.pdf', kind: 'proposal' });
    L = a.renderVals().CR.sel;
    expect(L.files.map(f => f.label)).toEqual(['Artwork · Stage.pdf', 'Proposal · Acme proposal.pdf']);
  });

  it('older leads with a proposal still show it as a proposal', () => {
    const a = app('ceo'), l = a.state.leads.find(x => x.proposal && !x.files);
    a.setState({ leadSel: l.id });
    const L = a.renderVals().CR.sel;
    expect(L.files[0].label).toBe('Proposal · ' + l.proposal.name);
  });
});
