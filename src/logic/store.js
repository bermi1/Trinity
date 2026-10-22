// Store management: requisitions from printing, issuing, shortfalls to purchasing,
// receiving, returns and stock counts. Every stock change is written to the ledger
// (`movements`) and material costs are charged to the job and its project.
// Mixed into TrinityApp, so `this` is the app.

export const REQ_STATUS = {
  pending: ['Waiting to issue', '#FBF1DD', '#8A6414'],
  partial: ['Part issued', '#E9EFFA', '#3559A8'],
  issued: ['Issued', '#E6F4EC', '#1F7549'],
  cancelled: ['Cancelled', '#F1EEF6', '#6E6A7C']
};

export const MOVE_TYPE = {
  receipt: ['Received', '#E6F4EC', '#1F7549'],
  issue: ['Issued', '#EFE8FA', '#5A2FA8'],
  return: ['Returned', '#E9EFFA', '#3559A8'],
  adjust: ['Count adjustment', '#FBF1DD', '#8A6414']
};

export const JOB_STAGES = ['Brief', 'Design', 'Client approval', 'Production', 'Quality check', 'Packaging', 'Delivery'];
export const JOB_NEXT = ['Start design', 'Send for approval', 'Approved · produce', 'Send to QC', 'Pass QC', 'Packed · dispatch', 'Mark delivered'];

const stamp = app => 'Today · ' + app.now();

export const storeMethods = {
  item(sku) { return this.state.stock.find(i => i.sku === sku) || { sku, n: sku, u: '', q: 0, min: 0, cost: 0 }; },
  outstanding(it) { return Math.max(0, it.qty - it.issued); },
  reqStatus(items) {
    const out = items.reduce((a, it) => a + this.outstanding(it), 0), got = items.reduce((a, it) => a + it.issued, 0);
    return out === 0 ? 'issued' : got > 0 ? 'partial' : 'pending';
  },
  // Materials for a job are ready when its requisition is fully issued (jobs without a list need nothing).
  materialsReady(job) {
    if (!job.bom || !job.bom.length) return true;
    const r = this.state.requisitions.find(q => q.id === job.req);
    return !!r && r.st === 'issued';
  },

  // Short status for job lists: what the store has done for this job.
  matLabel(job) {
    if (!job.bom || !job.bom.length) return 'no materials needed';
    const r = this.state.requisitions.find(q => q.id === job.req);
    if (!r || r.st === 'cancelled') return 'materials not requested';
    return r.st === 'issued' ? 'materials issued' : r.st === 'partial' ? 'materials part issued' : 'waiting for the store';
  },

  // A ledger line plus the stock, job-cost and project-budget changes that go with it.
  // Returns a state updater; quantities are signed (+ into the store, − out of it).
  stockChange(lines, ref, p, jobId, by) {
    return x => {
      let moves = x.movements, stock = x.stock, value = 0;
      for (const { sku, qty, type } of lines) {
        if (!qty) continue;
        const it = stock.find(i => i.sku === sku);
        if (!it) continue;
        const v = Math.abs(qty) * it.cost;
        stock = stock.map(i => (i.sku === sku ? Object.assign({}, i, { q: Math.max(0, i.q + qty) }) : i));
        moves = [{ id: this.nextId('MV', moves), d: stamp(this), sku, type, qty, ref, p: p || '', by: by || this.me().k, v: type === 'adjust' && qty < 0 ? -v : v }, ...moves];
        if (type === 'issue') value += v; else if (type === 'return') value -= v;
      }
      const patch = { movements: moves, stock };
      if (value && p) patch.projects = x.projects.map(pr => (pr.id === p ? Object.assign({}, pr, { spent: Math.round((pr.spent + value / 1e6) * 1e6) / 1e6 }) : pr));
      if (value && jobId) patch.jobs = x.jobs.map(j => (j.id === jobId ? Object.assign({}, j, { cost: Math.round((j.cost + value / 1e6) * 1e6) / 1e6 }) : j));
      return patch;
    };
  },

  // Printing asks the store for everything on a job's material list.
  requestMaterials(jobId) {
    const job = this.state.jobs.find(j => j.id === jobId);
    if (!job || !job.bom || !job.bom.length) { this.toast('This job has no material list'); return; }
    if (job.req) { const r = this.state.requisitions.find(q => q.id === job.req); if (r && r.st !== 'cancelled') { this.toast(job.req + ' is already with the store'); return; } }
    const id = this.nextId('SRQ', this.state.requisitions);
    const req = { id, job: job.id, p: job.p, by: this.me().k, purpose: job.t, items: job.bom.map(b => ({ sku: b.sku, qty: b.qty, issued: 0 })), st: 'pending', d: stamp(this) };
    this.setState(x => ({ requisitions: [req, ...x.requisitions], jobs: x.jobs.map(j => (j.id === job.id ? Object.assign({}, j, { req: id }) : j)) }));
    this.remind(this.ROLES.store.k, 'New store requisition · ' + id, 'requisitions', 'package', job.t + ' · ' + req.items.length + ' items');
    this.toast(id + ' sent to the store');
    this.log('package', 'purple', 'Materials requested · ' + job.t, id + ' · ' + this.proj(job.p).client);
  },

  // A one-off request for a single item (not tied to a job).
  newRequisition(f) {
    const id = this.nextId('SRQ', this.state.requisitions);
    const req = { id, job: '', p: f.p || '', by: this.me().k, purpose: f.purpose || 'General use', items: [{ sku: f.sku, qty: +f.q, issued: 0 }], st: 'pending', d: stamp(this) };
    this.setState(x => ({ requisitions: [req, ...x.requisitions] }));
    this.remind(this.ROLES.store.k, 'New store requisition · ' + id, 'requisitions', 'package', this.item(f.sku).n + ' × ' + f.q);
    this.toast(id + ' sent to the store');
  },

  // The storekeeper issues whatever is on the shelf; the rest stays outstanding.
  issueRequisition(id) {
    const r = this.state.requisitions.find(q => q.id === id);
    if (!r || r.st === 'issued' || r.st === 'cancelled') return;
    const lines = [], items = r.items.map(it => {
      const give = Math.min(this.outstanding(it), this.item(it.sku).q);
      if (give > 0) lines.push({ sku: it.sku, qty: -give, type: 'issue' });
      return Object.assign({}, it, { issued: it.issued + give });
    });
    if (!lines.length) { this.toast('Nothing in stock to issue yet · raise a purchase request'); return; }
    const st = this.reqStatus(items);
    this.setState(this.stockChange(lines, id, r.p, r.job));
    this.setState(x => ({ requisitions: x.requisitions.map(q => (q.id === id ? Object.assign({}, q, { items, st }) : q)) }));
    const short = items.filter(it => this.outstanding(it) > 0);
    const what = lines.map(l => this.item(l.sku).n + ' × ' + -l.qty).join(', ');
    this.remind(r.by, st === 'issued' ? id + ' issued · collect from the store' : id + ' part issued', 'requisitions', 'package', what);
    this.log('package', 'dark', 'Store issued ' + id, what + (r.job ? ' · ' + r.job : ''));
    this.toast(st === 'issued' ? id + ' fully issued' : 'Issued what is in stock · ' + short.length + ' item' + (short.length === 1 ? '' : 's') + ' short');
  },

  // Turns the shortfall into purchase requests, topping each item back up to its minimum.
  raiseShortfall(id) {
    const r = this.state.requisitions.find(q => q.id === id);
    if (!r) return;
    const open = this.state.proc.filter(pr => pr.srq === id && pr.s < 4).map(pr => pr.sku);
    const needs = r.items.map(it => ({ it, stock: this.item(it.sku) })).filter(({ it, stock }) => this.outstanding(it) > stock.q && !open.includes(it.sku));
    if (!needs.length) { this.toast('Nothing to buy · stock covers this requisition'); return; }
    let proc = this.state.proc;
    const made = needs.map(({ it, stock }) => {
      const qty = this.outstanding(it) - stock.q + stock.min, pid = this.nextId('PR', proc);
      const pr = { id: pid, t: stock.n + ' × ' + qty, p: r.p, v: +(qty * stock.cost / 1e6).toFixed(2), s: 0, sup: '—', sku: it.sku, qty, srq: id };
      proc = [pr, ...proc];
      return pr;
    });
    this.setState({ proc });
    made.forEach(pr => this.remind(this.ROLES.ceo.k, 'Purchase request ' + pr.id + ' for ' + id, 'procurement', 'cart', pr.t + ' · ' + this.fmtM(pr.v)));
    this.log('cart', 'blue', 'Shortfall sent to purchasing · ' + id, made.map(pr => pr.t).join(', '));
    this.toast(made.map(pr => pr.id).join(', ') + ' raised for the shortfall');
  },

  cancelRequisition(id) {
    if (!this.confirm('Cancel ' + id + '? Items already issued stay issued.')) return;
    this.setState(x => ({ requisitions: x.requisitions.map(q => (q.id === id ? Object.assign({}, q, { st: 'cancelled' }) : q)) }));
    this.toast(id + ' cancelled');
  },

  // Goods arrive: stock goes up, and anyone waiting on that item hears about it.
  receiveDelivery(d) {
    const used = this.state.movements.map(m => (/GRN-(\d+)/.exec(m.ref) || [])[1]).filter(Boolean).map(Number);
    const ref = 'GRN-' + String(Math.max(0, ...used) + 1).padStart(4, '0') + ' · ' + d.from;
    if (d.sku && d.qty) this.setState(this.stockChange([{ sku: d.sku, qty: d.qty, type: 'receipt' }], ref, '', ''));
    this.setState(x => ({ deliveries: x.deliveries.map(y => (y.id === d.id ? Object.assign({}, y, { st: 'received', grn: ref.split(' · ')[0] }) : y)) }));
    const waiting = this.state.requisitions.filter(q => (q.st === 'pending' || q.st === 'partial') && q.items.some(it => it.sku === d.sku && this.outstanding(it) > 0));
    waiting.forEach(q => {
      this.remind(this.ROLES.store.k, q.id + ' can now be issued', 'requisitions', 'package', this.item(d.sku).n + ' received');
      this.remind(q.by, 'Materials arrived for ' + q.id, 'requisitions', 'package', this.item(d.sku).n + ' · the store will issue them');
    });
    const item = d.sku ? this.item(d.sku) : null;
    this.toast(item ? d.items + ' received · ' + item.n + ' now ' + item.q + ' ' + item.u + (waiting.length ? ' · ' + waiting.map(q => q.id).join(', ') + ' can be issued' : '') : d.items + ' received into store');
    this.log('package', 'green', 'Stock received · ' + d.items, 'from ' + d.from);
  },

  // Unused material comes back from the print floor; the job and project are credited.
  returnToStore(jobId, sku, qty) {
    const job = this.state.jobs.find(j => j.id === jobId), r = job && this.state.requisitions.find(q => q.id === job.req);
    const line = r && r.items.find(it => it.sku === sku);
    if (!line || !(qty > 0) || qty > line.issued) { this.toast('You can return at most what was issued' + (line ? ' (' + line.issued + ')' : '')); return false; }
    this.setState(this.stockChange([{ sku, qty, type: 'return' }], 'Unused from ' + jobId, job.p, jobId));
    this.setState(x => ({ requisitions: x.requisitions.map(q => (q.id === r.id ? Object.assign({}, q, { items: q.items.map(it => (it.sku === sku ? Object.assign({}, it, { returned: (it.returned || 0) + qty }) : it)) }) : q)) }));
    this.toast(qty + ' ' + this.item(sku).u + ' of ' + this.item(sku).n + ' returned to the store');
    this.log('package', 'blue', 'Returned to store · ' + this.item(sku).n + ' × ' + qty, jobId);
    return true;
  },

  // Stock count: set the counted quantity, with a reason for the ledger.
  adjustStock(sku, counted, reason) {
    const it = this.item(sku), delta = counted - it.q;
    if (!reason || !reason.trim()) { this.toast('Give a reason for the adjustment'); return false; }
    if (!delta) { this.toast('Count matches the system · nothing to adjust'); return false; }
    this.setState(this.stockChange([{ sku, qty: delta, type: 'adjust' }], 'Stock count · ' + reason.trim(), '', ''));
    this.toast(it.n + ' adjusted ' + (delta > 0 ? '+' : '') + delta + ' ' + it.u);
    this.log('clipboard', 'amber', 'Stock count adjustment · ' + it.n, (delta > 0 ? '+' : '') + delta + ' ' + it.u + ' · ' + reason.trim());
    return true;
  },

  // Moves a production job to its next stage. Printing can't start until the store has issued the materials.
  advanceJob(id) {
    const j = this.state.jobs.find(x => x.id === id);
    if (!j || j.s >= 7) return;
    const nx = j.s + 1;
    if (nx === 3 && !this.materialsReady(j)) { this.toast('Materials not issued yet · ' + (j.req ? j.req + ' is with the store' : 'request them from the store first')); return; }
    this.setState(x => ({ jobs: x.jobs.map(y => (y.id === id ? Object.assign({}, y, { s: nx }) : y)) }));
    this.toast(j.id + ' → ' + (nx >= 7 ? 'Delivered' : JOB_STAGES[nx]));
    if (nx === 3) this.log('printer', 'purple', 'Printing started · ' + j.t, this.proj(j.p).client);
    if (nx === 5) this.log('check', 'green', 'QC passed · ' + j.t, this.proj(j.p).client);
    if (nx >= 7) this.log('truck', 'green', 'Production delivered · ' + j.t, this.proj(j.p).client);
  },

  downloadCsv(name, rows) {
    try {
      const csv = rows.map(r => r.map(c => '"' + String(c ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = name; document.body.appendChild(a); a.click(); a.remove();
      this.toast(name + ' downloaded');
    } catch (e) { this.toast('The export could not be completed. Please try again.'); }
  },

  setWaste(jobId, pct) {
    const v = Math.max(0, Math.min(100, Math.round(+pct || 0)));
    this.setState(x => ({ jobs: x.jobs.map(j => (j.id === jobId ? Object.assign({}, j, { waste: v }) : j)) }));
    this.toast('Wastage recorded · ' + v + '%');
  }
};
