import { describe, it, expect } from 'vitest';
import TrinityApp from '../logic/TrinityApp';

const app = role => { const a = new TrinityApp(); a.confirm = () => true; a.setState({ role }); return a; };
const pay = { payBy: 'M-Pesa', payName: 'Grace Mrema', payNo: '0754 123 456' };
const items = [{ d: 'Transport to Mwanza', amt: '150000' }, { d: 'Crew lunch', amt: '80,000' }, { d: 'Fuel', amt: '70000' }];
// Opens a project request form, fills it and submits it.
const submit = (a, form) => {
  a.openModal('reqProject');
  a.setState({ form: Object.assign({}, a.state.form, pay, { purpose: 'Site visit in Mwanza' }, form) });
  a.submitModal();
};
const field = a => a.renderVals().modalFields.find(f => f.k === 'items');

describe('money requests with several items', () => {
  it('the form starts with one empty item; the total is the sum of the items', () => {
    const a = app('staff');
    a.openModal('reqProject');
    expect(a.state.form.items).toEqual([{ d: '', amt: '' }]);
    expect(field(a)).toMatchObject({ kind: 'items', total: 'TZS 0' });
    field(a).set(items);
    expect(field(a).total).toBe('TZS 300,000');
    expect(field(a).rows).toHaveLength(3);
  });

  it('a multi-item request stores the items and the amount is their sum', () => {
    const a = app('staff');
    const before = a.state.reqs.length;
    submit(a, { items });
    expect(a.state.modalErr).toBe('');
    expect(a.state.modal).toBeNull();
    expect(a.state.reqs.length).toBe(before + 1);
    const r = a.state.reqs[0];
    expect(r.amt).toBe(300000);
    expect(r.items).toEqual([{ d: 'Transport to Mwanza', amt: 150000 }, { d: 'Crew lunch', amt: 80000 }, { d: 'Fuel', amt: 70000 }]);
    expect(r.purpose).toBe('Site visit in Mwanza');
  });

  it('one item stays quick: the description may be blank (it takes the purpose); blank rows are ignored', () => {
    const a = app('staff');
    submit(a, { items: [{ d: '', amt: '120000' }, { d: '', amt: '' }] });
    expect(a.state.modalErr).toBe('');
    const r = a.state.reqs[0];
    expect(r).toMatchObject({ amt: 120000, items: [{ d: 'Site visit in Mwanza', amt: 120000 }] });
    // A lone item that only repeats the purpose is not listed again.
    expect(a.reqItemsView(r)).toEqual([]);
  });

  it('validates the items', () => {
    const cases = [
      [[{ d: '', amt: '' }], /at least one item/i],
      [[{ d: 'Fuel', amt: '' }], /amount for “Fuel”/],
      [[{ d: 'Fuel', amt: '0' }], /whole number above 0/],
      [[{ d: 'Fuel', amt: '1500.50' }], /whole number above 0/],
      [[{ d: 'Fuel', amt: '-5' }], /whole number above 0/],
      [[{ d: 'Fuel', amt: '70000' }, { d: '', amt: '80000' }], /Describe item 2/]
    ];
    for (const [rows, err] of cases) {
      const a = app('staff');
      const before = a.state.reqs.length;
      submit(a, { items: rows });
      expect(a.state.modalErr).toMatch(err);
      expect(a.state.reqs.length).toBe(before);
    }
  });

  it('the items show in the approver view and in My requests; old requests show as before', () => {
    const a = app('ceo');
    a.setState({ role: 'staff' });
    submit(a, { items });
    const id = a.state.reqs[0].id;
    a.setState({ page: 'requests', reqSel: id });
    const V = a.renderVals();
    const row = (V.MR ? [...V.MR.open, ...V.MR.done] : []).find(x => x.id === id);
    expect(row.items).toEqual([{ d: 'Transport to Mwanza', amt: 'TZS 150,000' }, { d: 'Crew lunch', amt: 'TZS 80,000' }, { d: 'Fuel', amt: 'TZS 70,000' }]);
    expect(row.amt).toBe('TZS 300,000');
    // The approver (Management sees everything).
    a.setState({ role: 'ceo', reqFilter: 'all', reqSel: id });
    const R = a.renderVals().R;
    expect(R.id).toBe(id);
    expect(R.items.map(x => x.d)).toEqual(['Transport to Mwanza', 'Crew lunch', 'Fuel']);
    expect(R.amt).toBe('TZS 300,000');
    // An old request without items.
    const old = a.state.reqs.find(r => !r.items);
    a.setState({ reqSel: old.id });
    expect(a.renderVals().R.items).toEqual([]);
  });

  it('before the first approval the requester can change the items; the amount follows', () => {
    const a = app('staff');
    submit(a, { items });
    const r = a.state.reqs[0];
    expect(a.reqEditItems(r)).toEqual([{ d: 'Transport to Mwanza', amt: '150000' }, { d: 'Crew lunch', amt: '80000' }, { d: 'Fuel', amt: '70000' }]);
    const f = Object.assign({}, pay, { purpose: r.purpose, items: [{ d: 'Transport to Mwanza', amt: '150000' }, { d: 'Fuel', amt: '90000' }] });
    expect(a.fixReq(r.id, Object.assign({}, f, { items: [{ d: '', amt: '5' }, { d: 'Fuel', amt: '9' }] }))).toMatch(/Describe item 1/);
    expect(a.fixReq(r.id, f)).toBe('');
    const q = a.state.reqs.find(x => x.id === r.id);
    expect(q.amt).toBe(240000);
    expect(q.items).toEqual([{ d: 'Transport to Mwanza', amt: 150000 }, { d: 'Fuel', amt: 90000 }]);
    expect(q.thread.at(-1).t).toMatch(/Amount: TZS 300,000 → TZS 240,000/);
    expect(q.thread.at(-1).t).toMatch(/Items: Transport to Mwanza TZS 150,000 · Fuel TZS 90,000/);
    // An old request (no items) is edited as one item.
    const old = { id: 'REQ-9001', type: 'project', who: a.me().k, amt: 50000, purpose: 'Parking', st: 'pending', step: 1, log: ['09:00'], pay: { by: 'M-Pesa', name: 'Grace Mrema', no: '0754 123 456', bank: '' } };
    a.setState({ reqs: [old, ...a.state.reqs] });
    expect(a.reqEditItems(old)).toEqual([{ d: '', amt: '50000' }]);
    expect(a.fixReq(old.id, Object.assign({}, pay, { purpose: 'Parking', items: a.reqEditItems(old) }))).toMatch(/Change something/);
    expect(a.fixReq(old.id, Object.assign({}, pay, { purpose: 'Parking', items: [{ d: '', amt: '60000' }] }))).toBe('');
    expect(a.state.reqs.find(x => x.id === old.id)).toMatchObject({ amt: 60000, items: [{ d: 'Parking', amt: 60000 }] });
  });

  it('after an approval the items can no longer be changed', () => {
    const a = app('staff');
    submit(a, { items });
    const r = a.state.reqs[0];
    a.setState({ reqs: a.state.reqs.map(x => (x.id === r.id ? Object.assign({}, x, { step: x.step + 1, log: [...x.log, '10:00'] }) : x)) });
    expect(a.fixReq(r.id, Object.assign({}, pay, { reply: 'note', purpose: r.purpose, items: [{ d: 'Fuel', amt: '1000' }] }))).toBe('');
    expect(a.state.reqs.find(x => x.id === r.id)).toMatchObject({ amt: 300000, items: r.items });
  });

  it('Finance pays a request with items as usual, against its total', () => {
    const a = app('staff');
    submit(a, { items });
    const r0 = a.state.reqs[0];
    a.setState({ role: 'finance', reqs: a.state.reqs.map(x => (x.id === r0.id ? Object.assign({}, x, { st: 'approved', step: 5 }) : x)), staff: [{ k: r0.who, fl: 0 }] });
    const r = a.state.reqs.find(x => x.id === r0.id);
    expect(a.payReq(r)).toBeFalsy();
    const q = a.state.reqs.find(x => x.id === r0.id);
    expect(q.st).toBe('paid');
    expect(q.items).toHaveLength(3);
    expect(a.state.staff[0].fl).toBe(300000);
    expect(a.cashEntries().filter(e => e.ref.includes(r0.id)).reduce((t, e) => t + e.amt, 0)).toBe(300000);
  });
});
