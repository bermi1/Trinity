// Values for store requisitions, the stock ledger, production job pages and the print floor.
import { REQ_STATUS, MOVE_TYPE, JOB_STAGES, JOB_NEXT } from '../store';

const pill = a => ({ stl: a[0], stbg: a[1], stfg: a[2] });

export function storeVals(s) {
  const V = {};
  const role = s.role || 'ceo';
  const keeper = role === 'store' || role === 'ceo';
  const fmtT = n => this.fmtT(n);
  const weekIssued = s.movements.filter(m => m.type === 'issue');

  // ---- Store requisitions
  const open = s.requisitions.filter(r => r.st === 'pending' || r.st === 'partial');
  const shortItems = open.flatMap(r => r.items.filter(it => this.outstanding(it) > this.item(it.sku).q));
  const f = s.srqFilter || 'open';
  const FL = { open: r => r.st === 'pending' || r.st === 'partial', issued: r => r.st === 'issued', cancelled: r => r.st === 'cancelled', all: () => true };
  V.SRQ = {
    keeper,
    kpis: [
      { l: 'Waiting to issue', v: String(open.filter(r => r.st === 'pending').length), n: 'requisitions from printing and staff' },
      { l: 'Part issued', v: String(open.filter(r => r.st === 'partial').length), n: 'waiting on purchases', warn: open.some(r => r.st === 'partial') },
      { l: 'Items short', v: String(shortItems.length), n: 'not enough in the store', warn: shortItems.length > 0 },
      { l: 'Issued to jobs', v: this.fmtM(weekIssued.reduce((a, m) => a + m.v, 0) / 1e6), n: 'material value this week' }
    ],
    chips: [['open', 'Open'], ['issued', 'Issued'], ['cancelled', 'Cancelled'], ['all', 'All']].map(([k, l]) => ({ l: l + ' · ' + s.requisitions.filter(FL[k]).length, on: f === k, set: () => this.setState({ srqFilter: k }) })),
    rows: s.requisitions.filter(FL[f]).map(r => {
      const items = r.items.map(it => {
        const st = this.item(it.sku), out = this.outstanding(it);
        return { n: st.n, sku: st.sku, u: st.u, qty: it.qty, issued: it.issued, out, have: st.q, loc: st.loc,
          state: out === 0 ? 'done' : st.q >= out ? 'ready' : st.q > 0 ? 'part' : 'short' };
      });
      const prs = s.proc.filter(pr => pr.srq === r.id).map(pr => ({ id: pr.id, t: pr.t, stage: ['Request', 'Quotation', 'Approved', 'PO issued', 'Delivered'][pr.s] || 'Delivered', done: pr.s >= 4 }));
      const live = r.st === 'pending' || r.st === 'partial';
      const openPr = s.proc.filter(pr => pr.srq === r.id && pr.s < 4).map(pr => pr.sku);
      const job = s.jobs.find(j => j.id === r.job);
      return Object.assign({ id: r.id, purpose: r.purpose, job: r.job, client: r.p ? this.proj(r.p).client : 'General use', by: this.av(r.by), d: r.d, items, prs,
        canIssue: keeper && live && items.some(it => it.out > 0 && it.have > 0),
        canShort: keeper && live && r.items.some(it => this.outstanding(it) > this.item(it.sku).q && !openPr.includes(it.sku)),
        canCancel: live && (keeper || r.by === this.me().k),
        issue: () => this.issueRequisition(r.id), shortfall: () => this.raiseShortfall(r.id), cancel: () => this.cancelRequisition(r.id),
        openJob: job ? () => this.go('job', { jobId: job.id }) : null }, pill(REQ_STATUS[r.st]));
    }),
    newReq: () => this.openModal('srq')
  };

  // ---- Stock ledger and stock count
  const lf = s.ledgerType || 'all', lq = (s.ledgerQ || '').toLowerCase();
  const recv = s.movements.filter(m => m.type === 'receipt'), iss = s.movements.filter(m => m.type === 'issue');
  V.LED = {
    kpis: [
      { l: 'Stock value', v: this.fmtM(s.stock.reduce((a, i) => a + i.q * i.cost, 0) / 1e6), n: s.stock.length + ' items at cost' },
      { l: 'Received', v: this.fmtM(recv.reduce((a, m) => a + m.v, 0) / 1e6), n: recv.length + ' receipts' },
      { l: 'Issued', v: this.fmtM(iss.reduce((a, m) => a + m.v, 0) / 1e6), n: iss.length + ' issues to jobs and staff' },
      { l: 'Below minimum', v: String(s.stock.filter(i => i.q < i.min).length), n: 'reorder recommended', warn: s.stock.some(i => i.q < i.min) }
    ],
    chips: [['all', 'All'], ['receipt', 'Received'], ['issue', 'Issued'], ['return', 'Returned'], ['adjust', 'Counts']].map(([k, l]) => ({ l, on: lf === k, set: () => this.setState({ ledgerType: k }) })),
    q: s.ledgerQ || '', onQ: e => this.setState({ ledgerQ: e.target.value }),
    rows: s.movements.filter(m => (lf === 'all' || m.type === lf) && (!lq || (this.item(m.sku).n + ' ' + m.sku + ' ' + m.ref + ' ' + (m.p ? this.proj(m.p).client : '')).toLowerCase().includes(lq)))
      .map(m => { const it = this.item(m.sku); return Object.assign({ id: m.id, d: m.d, n: it.n, sku: m.sku, qty: (m.qty > 0 ? '+' : '') + m.qty + ' ' + it.u, up: m.qty > 0, ref: m.ref, client: m.p ? this.proj(m.p).client : '—', by: this.av(m.by).n, v: fmtT(Math.abs(m.v)) }, pill(MOVE_TYPE[m.type])); }),
    items: s.stock.map(i => ({ v: i.sku, l: i.n + ' · ' + i.q + ' ' + i.u, q: i.q, u: i.u })),
    canCount: keeper,
    adjust: (sku, counted, reason) => this.adjustStock(sku, +counted, reason),
    csv: () => this.downloadCsv('stock-ledger.csv', [['Date', 'Item', 'SKU', 'Movement', 'Quantity', 'Reference', 'Project', 'By', 'Value (TZS)']].concat(s.movements.map(m => [m.d, this.item(m.sku).n, m.sku, MOVE_TYPE[m.type][0], m.qty, m.ref, m.p ? this.proj(m.p).name : '', this.av(m.by).n, m.v])))
  };

  // ---- Production job page
  const j = s.jobs.find(x => x.id === s.jobId);
  if (j) {
    const r = s.requisitions.find(q => q.id === j.req && q.st !== 'cancelled'), P = this.proj(j.p), done = j.s >= 7;
    const issuedVal = (j.bom || []).reduce((a, b) => { const line = r && r.items.find(it => it.sku === b.sku); return a + (line ? (line.issued - (line.returned || 0)) * this.item(b.sku).cost : 0); }, 0);
    const refs = [j.req, 'Unused from ' + j.id].filter(Boolean);
    V.JOB = {
      id: j.id, t: j.t, client: P.client, project: P.name, projectId: P.id, who: this.av(j.who), due: j.due, qty: j.qty, waste: j.waste,
      cost: this.fmtM(j.cost), matValue: fmtT(issuedVal), budget: this.fmtM(P.bud) + ' budget · ' + this.fmtM(P.spent) + ' spent',
      stages: JOB_STAGES.map((l, i) => ({ l, state: i < j.s || done ? 'done' : i === j.s ? 'cur' : 'todo' })),
      stage: done ? 'Delivered' : JOB_STAGES[j.s], canAdv: !done, advL: done ? '' : JOB_NEXT[j.s], adv: () => this.advanceJob(j.id),
      blocked: !done && j.s === 2 && !this.materialsReady(j),
      ready: this.materialsReady(j), matLabel: this.matLabel(j),
      bom: (j.bom || []).map(b => {
        const it = this.item(b.sku), line = r && r.items.find(x => x.sku === b.sku);
        return { sku: b.sku, n: it.n, u: it.u, need: b.qty, issued: line ? line.issued : 0, returned: line ? line.returned || 0 : 0, have: it.q, cost: fmtT(b.qty * it.cost) };
      }),
      req: r ? Object.assign({ id: r.id, d: r.d, open: () => this.go('requisitions', { srqFilter: 'all' }) }, pill(REQ_STATUS[r.st])) : null,
      canRequest: !r && !!(j.bom && j.bom.length) && !done,
      request: () => this.requestMaterials(j.id),
      returnable: r ? r.items.filter(it => it.issued - (it.returned || 0) > 0).map(it => ({ v: it.sku, l: this.item(it.sku).n + ' · up to ' + (it.issued - (it.returned || 0)), max: it.issued - (it.returned || 0) })) : [],
      doReturn: (sku, qty) => this.returnToStore(j.id, sku, +qty),
      setWaste: pct => this.setWaste(j.id, pct),
      history: s.movements.filter(m => refs.includes(m.ref)).map(m => Object.assign({ d: m.d, t: MOVE_TYPE[m.type][0] + ' · ' + this.item(m.sku).n + ' ' + (m.qty > 0 ? '+' : '') + m.qty + ' ' + this.item(m.sku).u, v: fmtT(Math.abs(m.v)) }, pill(MOVE_TYPE[m.type]))),
      back: () => this.goBack()
    };
  } else V.JOB = null;

  // ---- Print floor (printing department home)
  const active = s.jobs.filter(x => x.s < 7);
  const waiting = active.filter(x => !this.materialsReady(x));
  const pf = this.av(this.ROLES.production.k);
  V.PS = {
    greet: (new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening') + ', ' + pf.first,
    kpis: [
      { l: 'On the press', v: String(active.filter(x => x.s === 3).length), n: 'printing now' },
      { l: 'Waiting for materials', v: String(waiting.length), n: 'with the store or purchasing', warn: waiting.length > 0 },
      { l: 'Ready to print', v: String(active.filter(x => x.s === 2 && this.materialsReady(x)).length), n: 'approved, materials in hand' },
      { l: 'Average wastage', v: (s.jobs.reduce((a, x) => a + x.waste, 0) / Math.max(1, s.jobs.length)).toFixed(1) + '%', n: 'target under 4%' }
    ],
    jobs: active.map(x => ({ id: x.id, t: x.t, client: this.proj(x.p).client, stage: JOB_STAGES[x.s], due: x.due, who: this.av(x.who), mat: this.matLabel(x), ready: this.materialsReady(x),
      canRequest: !!(x.bom && x.bom.length) && !s.requisitions.some(q => q.id === x.req && q.st !== 'cancelled'),
      request: () => this.requestMaterials(x.id), open: () => this.go('job', { jobId: x.id }) })),
    issues: s.movements.filter(m => m.type === 'issue' && /^SRQ-/.test(m.ref)).slice(0, 6).map(m => ({ d: m.d, t: this.item(m.sku).n + ' × ' + -m.qty, ref: m.ref, client: m.p ? this.proj(m.p).client : '' })),
    newReq: () => this.openModal('srq')
  };
  return V;
}
