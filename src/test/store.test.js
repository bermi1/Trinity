import { describe, it, expect } from 'vitest';
import TrinityApp from '../logic/TrinityApp';

const app = () => { const a = new TrinityApp(); a.confirm = () => true; return a; };
const q = (a, sku) => a.state.stock.find(i => i.sku === sku).q;
const proj = (a, id) => a.state.projects.find(p => p.id === id);

describe('store requisitions', () => {
  it('issues what is in stock, keeps the rest outstanding, and charges the project and job', () => {
    const a = app(); a.setState({ role: 'production' });
    const spent = proj(a, 'PRJ-0231').spent, cost = a.state.jobs.find(j => j.id === 'JOB-0313').cost;
    a.requestMaterials('JOB-0313');
    const id = a.state.requisitions[0].id;
    expect(a.state.jobs.find(j => j.id === 'JOB-0313').req).toBe(id);
    a.setState({ role: 'store' });
    a.issueRequisition(id);
    const r = a.state.requisitions[0];
    expect(r.st).toBe('partial');
    expect(r.items.map(i => i.issued)).toEqual([1, 1]);
    expect(q(a, 'CST-VNL')).toBe(0);
    expect(proj(a, 'PRJ-0231').spent).toBeCloseTo(spent + 0.85, 6);
    expect(a.state.jobs.find(j => j.id === 'JOB-0313').cost).toBeCloseTo(cost + 0.85, 6);
    expect(a.materialsReady(a.state.jobs.find(j => j.id === 'JOB-0313'))).toBe(false);
  });

  it('a shortfall becomes one purchase request per short item, topped up to minimum, never duplicated', () => {
    const a = app();
    a.requestMaterials('JOB-0313');
    const id = a.state.requisitions[0].id;
    a.issueRequisition(id);
    a.raiseShortfall(id);
    expect(a.state.proc[0]).toMatchObject({ sku: 'CST-VNL', qty: 4, srq: id, s: 0 });
    const n = a.state.proc.length;
    a.raiseShortfall(id);
    expect(a.state.proc.length).toBe(n);
  });

  it('receiving a delivery raises stock, logs a GRN and tells whoever is waiting', () => {
    const a = app();
    a.requestMaterials('JOB-0313');
    const id = a.state.requisitions[0].id;
    a.issueRequisition(id);
    a.setState({ deliveries: [{ id: 'DLV-9', from: 'Chapa Supplies', items: 'Cast vinyl × 4', st: 'arrived', sku: 'CST-VNL', qty: 4 }, ...a.state.deliveries] });
    a.receiveDelivery(a.state.deliveries[0]);
    expect(q(a, 'CST-VNL')).toBe(4);
    expect(a.state.movements[0]).toMatchObject({ type: 'receipt', qty: 4, ref: 'GRN-0399 · Chapa Supplies' });
    expect(a.state.notes.some(n => n.to === 'DK' && n.t === 'Materials arrived for ' + id)).toBe(true);
    a.issueRequisition(id);
    expect(a.state.requisitions[0].st).toBe('issued');
    expect(a.materialsReady(a.state.jobs.find(j => j.id === 'JOB-0313'))).toBe(true);
  });

  it('jobs cannot enter production until materials are issued', () => {
    const a = app();
    a.advanceJob('JOB-0313');
    expect(a.state.jobs.find(j => j.id === 'JOB-0313').s).toBe(2);
    a.advanceJob('JOB-0311');
    expect(a.state.jobs.find(j => j.id === 'JOB-0311').s).toBe(4);
  });

  it('returns are limited to what was issued and credit the project', () => {
    const a = app();
    const spent = proj(a, 'PRJ-0231').spent;
    expect(a.returnToStore('JOB-0312', 'RLU-850', 25)).toBe(false);
    expect(a.returnToStore('JOB-0312', 'RLU-850', 4)).toBe(true);
    expect(q(a, 'RLU-850')).toBe(22);
    expect(proj(a, 'PRJ-0231').spent).toBeCloseTo(spent - 0.312, 6);
  });

  it('stock counts need a reason and record only the difference', () => {
    const a = app();
    expect(a.adjustStock('INK-ECO-C', 2, '')).toBe(false);
    expect(a.adjustStock('INK-ECO-C', 4, 'match')).toBe(false);
    expect(a.adjustStock('INK-ECO-C', 2, 'leaking container')).toBe(true);
    expect(q(a, 'INK-ECO-C')).toBe(2);
    expect(a.state.movements[0]).toMatchObject({ type: 'adjust', qty: -2, v: -190000 });
  });
});
