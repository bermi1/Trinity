import { describe, it, expect } from 'vitest';
import TrinityApp from '../logic/TrinityApp';

const app = role => { const a = new TrinityApp(); a.confirm = () => true; a.setState({ role }); return a; };
const pay = { payBy: 'M-Pesa', payName: 'Grace Mrema', payNo: '0754 123 456' };
const items = [{ d: 'Transport to Mwanza', qty: '1', price: '150000' }, { d: 'Crew lunch', qty: '1', price: '80,000' }, { d: 'Fuel', qty: '1', price: '70000' }];
const stored = [{ d: 'Transport to Mwanza', qty: 1, price: 150000, amt: 150000 }, { d: 'Crew lunch', qty: 1, price: 80000, amt: 80000 }, { d: 'Fuel', qty: 1, price: 70000, amt: 70000 }];
// The example from the brief: quantity × unit price per line.
const event = [{ d: 'Bottled water', qty: '24', price: '1,000' }, { d: 'Banner printing', qty: '3', price: '150000' }, { d: 'Transport', qty: '1', price: '50000' }];
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
    expect(a.state.form.items).toEqual([{ d: '', qty: '1', price: '' }]);
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
    expect(r.items).toEqual(stored);
    expect(r.purpose).toBe('Site visit in Mwanza');
  });

  it('one item stays quick: the description may be blank (it takes the purpose); blank rows are ignored', () => {
    const a = app('staff');
    submit(a, { items: [{ d: '', qty: '1', price: '120000' }, { d: '', qty: '1', price: '' }] });
    expect(a.state.modalErr).toBe('');
    const r = a.state.reqs[0];
    expect(r).toMatchObject({ amt: 120000, items: [{ d: 'Site visit in Mwanza', qty: 1, price: 120000, amt: 120000 }] });
    // A lone item that only repeats the purpose is not listed again.
    expect(a.reqItemsView(r)).toEqual([]);
  });

  it('validates the items', () => {
    const cases = [
      [[{ d: '', qty: '1', price: '' }], /at least one item/i],
      [[{ d: 'Fuel', qty: '1', price: '' }], /unit price for “Fuel”/],
      [[{ d: 'Fuel', qty: '1', price: '0' }], /unit price for “Fuel” must be a whole number above 0/],
      [[{ d: 'Fuel', qty: '1', price: '1500.50' }], /whole number above 0/],
      [[{ d: 'Fuel', qty: '1', price: '-5' }], /whole number above 0/],
      [[{ d: 'Water', qty: '0', price: '1000' }], /quantity for “Water” must be a whole number, 1 or more/],
      [[{ d: 'Water', qty: '2.5', price: '1000' }], /quantity for “Water”/],
      [[{ d: 'Water', qty: '-3', price: '1000' }], /quantity for “Water”/],
      [[{ d: 'Fuel', qty: '1', price: '70000' }, { d: '', qty: '3', price: '80000' }], /Describe item 2: what is the TZS 240,000 for/]
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
    expect(row.items.map(x => [x.d, x.calc, x.amt])).toEqual([['Transport to Mwanza', '1 × 150,000 = 150,000', 'TZS 150,000'], ['Crew lunch', '1 × 80,000 = 80,000', 'TZS 80,000'], ['Fuel', '1 × 70,000 = 70,000', 'TZS 70,000']]);
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
    expect(a.reqEditItems(r)).toEqual([{ d: 'Transport to Mwanza', qty: '1', price: '150000' }, { d: 'Crew lunch', qty: '1', price: '80000' }, { d: 'Fuel', qty: '1', price: '70000' }]);
    const f = Object.assign({}, pay, { purpose: r.purpose, items: [{ d: 'Transport to Mwanza', qty: '1', price: '150000' }, { d: 'Fuel', qty: '3', price: '30000' }] });
    expect(a.fixReq(r.id, Object.assign({}, f, { items: [{ d: '', qty: '1', price: '5' }, { d: 'Fuel', qty: '1', price: '9' }] }))).toMatch(/Describe item 1/);
    expect(a.fixReq(r.id, f)).toBe('');
    const q = a.state.reqs.find(x => x.id === r.id);
    expect(q.amt).toBe(240000);
    expect(q.items).toEqual([{ d: 'Transport to Mwanza', qty: 1, price: 150000, amt: 150000 }, { d: 'Fuel', qty: 3, price: 30000, amt: 90000 }]);
    expect(q.thread.at(-1).t).toMatch(/Amount: TZS 300,000 → TZS 240,000/);
    expect(q.thread.at(-1).t).toMatch(/Items: Transport to Mwanza TZS 150,000 · Fuel 3 × 30,000 = TZS 90,000/);
    // An old request (no items) is edited as one item.
    const old = { id: 'REQ-9001', type: 'project', who: a.me().k, amt: 50000, purpose: 'Parking', st: 'pending', step: 1, log: ['09:00'], pay: { by: 'M-Pesa', name: 'Grace Mrema', no: '0754 123 456', bank: '' } };
    a.setState({ reqs: [old, ...a.state.reqs] });
    expect(a.reqEditItems(old)).toEqual([{ d: '', qty: '1', price: '50000' }]);
    expect(a.fixReq(old.id, Object.assign({}, pay, { purpose: 'Parking', items: a.reqEditItems(old) }))).toMatch(/Change something/);
    expect(a.fixReq(old.id, Object.assign({}, pay, { purpose: 'Parking', items: [{ d: '', qty: '2', price: '30000' }] }))).toBe('');
    expect(a.state.reqs.find(x => x.id === old.id)).toMatchObject({ amt: 60000, items: [{ d: 'Parking', qty: 2, price: 30000, amt: 60000 }] });
  });

  it('after an approval the items can no longer be changed', () => {
    const a = app('staff');
    submit(a, { items });
    const r = a.state.reqs[0];
    a.setState({ reqs: a.state.reqs.map(x => (x.id === r.id ? Object.assign({}, x, { step: x.step + 1, log: [...x.log, '10:00'] }) : x)) });
    expect(a.fixReq(r.id, Object.assign({}, pay, { reply: 'note', purpose: r.purpose, items: [{ d: 'Fuel', qty: '1', price: '1000' }] }))).toBe('');
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

  it('each line is quantity × unit price; the request total is the sum of the lines', () => {
    const a = app('staff');
    a.openModal('reqProject');
    field(a).set(event);
    expect(field(a).total).toBe('TZS 524,000');
    expect(a.reqRowTotal(event[0])).toBe(24000);
    expect(a.reqRowTotal({ d: 'x', qty: '', price: '5000' })).toBe(5000);
    submit(a, { items: event });
    expect(a.state.modalErr).toBe('');
    const r = a.state.reqs[0];
    expect(r.amt).toBe(524000);
    expect(r.items).toEqual([
      { d: 'Bottled water', qty: 24, price: 1000, amt: 24000 },
      { d: 'Banner printing', qty: 3, price: 150000, amt: 450000 },
      { d: 'Transport', qty: 1, price: 50000, amt: 50000 }
    ]);
    expect(a.reqItemsView(r).map(x => x.calc)).toEqual(['24 × 1,000 = 24,000', '3 × 150,000 = 450,000', '1 × 50,000 = 50,000']);
    // The project page lists them in one line.
    expect(a.reqItemsView(r).map(x => x.text).join(' · ')).toBe('Bottled water 24 × 1,000 = TZS 24,000 · Banner printing 3 × 150,000 = TZS 450,000 · Transport TZS 50,000');
    // A blank quantity counts as 1; a single item of several units is still shown (it says more than the purpose).
    submit(a, { items: [{ d: '', qty: '', price: '15000' }] });
    expect(a.state.reqs[0]).toMatchObject({ amt: 15000, items: [{ qty: 1, price: 15000, amt: 15000 }] });
    expect(a.reqItemsView(a.state.reqs[0])).toEqual([]);
    submit(a, { items: [{ d: '', qty: '10', price: '2500' }] });
    expect(a.state.reqs[0]).toMatchObject({ amt: 25000, items: [{ d: 'Site visit in Mwanza', qty: 10, price: 2500, amt: 25000 }] });
    expect(a.reqItemsView(a.state.reqs[0]).map(x => x.calc)).toEqual(['10 × 2,500 = 25,000']);
  });

  it('items saved before quantities ({d, amt}) read as 1 × amt everywhere', () => {
    const a = app('staff');
    const old = { id: 'REQ-9002', type: 'project', who: a.me().k, amt: 230000, purpose: 'Site visit', items: [{ d: 'Taxi', amt: 150000 }, { d: 'Lunch', amt: 80000 }], st: 'pending', step: 1, log: ['09:00'], pay: { by: 'M-Pesa', name: 'Grace Mrema', no: '0754 123 456', bank: '' } };
    a.setState({ reqs: [old, ...a.state.reqs] });
    expect(a.reqItemsView(old).map(x => [x.d, x.qty, x.price, x.amt, x.calc])).toEqual([['Taxi', 1, 'TZS 150,000', 'TZS 150,000', '1 × 150,000 = 150,000'], ['Lunch', 1, 'TZS 80,000', 'TZS 80,000', '1 × 80,000 = 80,000']]);
    expect(a.reqEditItems(old)).toEqual([{ d: 'Taxi', qty: '1', price: '150000' }, { d: 'Lunch', qty: '1', price: '80000' }]);
    // Old-style rows are still accepted (amount = unit price, quantity 1).
    expect(a.reqItems([{ d: 'Taxi', amt: '150000' }], '')).toEqual({ items: [{ d: 'Taxi', qty: 1, price: 150000, amt: 150000 }], amt: 150000 });
    expect(a.reqRowTotal({ d: 'Taxi', amt: '150,000' })).toBe(150000);
    // Saving without a change is not an edit, although the stored shape is older.
    expect(a.fixReq(old.id, Object.assign({}, pay, { purpose: 'Site visit', items: a.reqEditItems(old) }))).toMatch(/Change something/);
    expect(a.fixReq(old.id, Object.assign({}, pay, { purpose: 'Site visit', items: [{ d: 'Taxi', qty: '2', price: '80000' }, { d: 'Lunch', qty: '1', price: '80000' }] }))).toBe('');
    expect(a.state.reqs.find(x => x.id === old.id)).toMatchObject({ amt: 240000, items: [{ d: 'Taxi', qty: 2, price: 80000, amt: 160000 }, { d: 'Lunch', qty: 1, price: 80000, amt: 80000 }] });
  });

  it('accounting after payment is pre-filled with each line total and shows what was asked', () => {
    const a = app('staff');
    submit(a, { items: event });
    const r = Object.assign({}, a.state.reqs[0], { st: 'paid', paidOn: a.fToday() });
    expect(a.accountInfo(r).items).toEqual([
      { d: 'Bottled water', amt: '24000', asked: 'Asked 24 × 1,000 = 24,000' },
      { d: 'Banner printing', amt: '450000', asked: 'Asked 3 × 150,000 = 450,000' },
      { d: 'Transport', amt: '50000', asked: '' }
    ]);
  });
});
