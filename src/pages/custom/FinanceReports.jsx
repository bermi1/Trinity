import { useState } from 'react';
import { Btn, Empty } from '../../ui/kit';

const digits = v => String(v || '').replace(/\D/g, '');
const n = v => Math.round(+v || 0).toLocaleString('en-US');

export function Periods({ R }) {
  return (
    <div className="fr-perwrap">
      <div className="k-chips fr-per" role="tablist" aria-label="Period">{R.periods.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={R.per === k} className={R.per === k ? 'is-on' : ''} onClick={() => (k === 'custom' ? R.setRange(R.from, R.to) : R.setPer(k))}>{l}</button>)}</div>
      {R.per === 'custom' ? (
        <div className="fr-range">
          <label>From<input type="date" value={R.from} max={R.to} onChange={e => R.setRange(e.target.value, R.to)} /></label>
          <label>To<input type="date" value={R.to} min={R.from} onChange={e => R.setRange(R.from, e.target.value)} /></label>
        </div>
      ) : null}
    </div>
  );
}

export function RepKpis({ R }) {
  return (
    <div className="fh-kpis">
      {R.kpis.map(k => (
        <div key={k.l} className={'fh-kpi is-' + k.tone}>
          <span>{k.l}</span><b>{k.v}</b>
          <small>{k.d == null ? R.label : <><em className={(k.d >= 0) === k.good ? 'fr-up' : 'fr-down'}>{k.d >= 0 ? '▲' : '▼'} {Math.abs(k.d)}%</em> vs previous period</>}</small>
        </div>
      ))}
    </div>
  );
}

// Money in and out, side by side, for each day (or month).
export function CashChart({ R }) {
  const [hover, setHover] = useState(-1);
  const [pick, setPick] = useState(-1);
  const h = R.chart[hover >= 0 ? hover : pick];
  const sel = R.chart[pick];
  return (
    <section className="fh-card fr-chart">
      <header className="fr-chart-h">
        <h3>Money in and out · {R.label}</h3>
        <span className="fr-legend"><i className="is-in" />In <i className="is-out" />Out</span>
      </header>
      <div className="fr-tip">{h ? <><b>{h.k}</b> · In {h.tin} · Out {h.tout}</> : <span className="k-sub">Highest: {R.maxT}</span>}</div>
      <div className="fr-bars" onMouseLeave={() => setHover(-1)}>
        {R.chart.map((c, i) => (
          <button key={c.k} type="button" className={'fr-col' + (hover === i || pick === i ? ' is-on' : '')} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onClick={() => setPick(pick === i ? -1 : i)} aria-pressed={pick === i} aria-label={c.k + ': in ' + c.tin + ', out ' + c.tout}>
            <span className="fr-pair"><i className="is-in" style={{ height: c.hi + '%' }} /><i className="is-out" style={{ height: c.ho + '%' }} /></span>
            <small>{i % R.showEvery === 0 || R.chart.length <= 16 ? c.l : ''}</small>
          </button>
        ))}
      </div>
      {sel ? (
        <div className="fr-drill">
          <header><b>{sel.k}</b><span>In {sel.tin} · Out {sel.tout}</span><button type="button" className="td-x" onClick={() => setPick(-1)} aria-label="Close">×</button></header>
          {sel.items.length ? <ul>{sel.items.map(e => <li key={e.id}><span><b>{e.cat}</b><small>{e.party} · {e.at}</small></span><em className={e.dir === 'in' ? 'is-green' : 'is-red'}>{e.dir === 'in' ? '+' : '−'} {e.amt}</em></li>)}</ul> : <p className="k-sub">Nothing on this day.</p>}
        </div>
      ) : <p className="k-sub fr-hint">Tap a bar to see every payment behind it.</p>}
    </section>
  );
}

function Breakdown({ title, items, tone, empty }) {
  return (
    <section className="fh-card">
      <h3>{title}</h3>
      {items.length ? (
        <ul className="fr-break">
          {items.map(x => <li key={x.l}><span className="fr-break-l"><b>{x.l}</b><small>{x.pct}%</small></span><span className="fr-break-bar"><i className={'is-' + tone} style={{ width: Math.max(2, x.pct) + '%' }} /></span><b className="fr-break-v">{x.t}</b></li>)}
        </ul>
      ) : <Empty>{empty}</Empty>}
    </section>
  );
}

export function Reports({ R }) {
  return (
    <>
      <Periods R={R} />
      <RepKpis R={R} />
      <CashChart R={R} />
      <div className="fr-two">
        <Breakdown title="Where the money went" items={R.outCat} tone="out" empty="No spending in this period." />
        <Breakdown title="Where the money came from" items={R.inCli} tone="in" empty="No money in this period." />
      </div>
      <div className="fr-two">
        <section className="fh-card">
          <h3>How long clients have owed us</h3>
          <ul className="fr-break">
            {R.aging.map(a => <li key={a.l}><span className="fr-break-l"><b>{a.l}</b><small>{a.n} invoices</small></span><span className="fr-break-bar"><i className={a.l.startsWith('0') ? 'is-in' : 'is-out'} style={{ width: Math.max(2, Math.round(a.v / R.agingMax * 100)) + '%' }} /></span><b className="fr-break-v">{a.t}</b></li>)}
          </ul>
        </section>
        <section className="fh-card fr-proj">
          <h3>Projects · money in and out</h3>
          <div className="fr-table-wrap">
            <table className="fr-table">
              <thead><tr><th>Project</th><th>Invoiced</th><th>Received</th><th>Spent</th><th>Profit</th></tr></thead>
              <tbody>{R.projects.map(p => <tr key={p.id}><td><b>{p.c}</b><small>{p.n}</small></td><td>{p.invoiced}</td><td>{p.got}</td><td>{p.spent}</td><td className={p.neg ? 'is-red' : 'is-green'}>{p.profit}<small>{p.margin}</small></td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

function AddEntry({ R, onDone }) {
  const [f, setF] = useState({ dir: 'out', amt: '', cat: '', party: '', p: '', method: 'Bank', ref: '', at: '' });
  const [err, setErr] = useState('');
  const set = (k, v) => setF(x => Object.assign({}, x, { [k]: v }));
  const cats = f.dir === 'in' ? R.inCats : R.outCats;
  return (
    <section className="fh-card fr-add">
      <div className="ff-chips fr-dir">{[['out', 'Money out'], ['in', 'Money in']].map(([k, l]) => <button key={k} type="button" className={f.dir === k ? 'is-on is-' + k : ''} onClick={() => setF(x => Object.assign({}, x, { dir: k, cat: '' }))}>{l}</button>)}</div>
      <label className="fh-amt"><span>TZS</span><input inputMode="numeric" value={f.amt ? n(f.amt) : ''} onChange={e => set('amt', digits(e.target.value))} placeholder="0" aria-label="Amount" /></label>
      <div className="ff"><span className="ff-l">What for</span><div className="ff-chips">{cats.map(c => <button key={c} type="button" className={f.cat === c ? 'is-on' : ''} onClick={() => set('cat', c)}>{c}</button>)}</div></div>
      <div className="fh-two">
        <label className="ff"><span className="ff-l">{f.dir === 'in' ? 'Received from' : 'Paid to'}</span><input value={f.party} onChange={e => set('party', e.target.value)} placeholder={f.dir === 'in' ? 'e.g. CRDB Bank PLC' : 'e.g. Vinyl House'} /></label>
        <label className="ff"><span className="ff-l">Date</span><input type="date" value={f.at} onChange={e => set('at', e.target.value)} /></label>
      </div>
      <div className="ff"><span className="ff-l">Project (optional)</span><div className="ff-chips">{R.projOpts.map(p => <button key={p.v} type="button" className={f.p === p.v ? 'is-on' : ''} onClick={() => set('p', f.p === p.v ? '' : p.v)}>{p.l}</button>)}</div></div>
      <div className="fh-two">
        <div className="ff"><span className="ff-l">Paid by</span><div className="ff-chips">{['Bank', 'Cash', 'Mobile money', 'Cheque'].map(m => <button key={m} type="button" className={f.method === m ? 'is-on' : ''} onClick={() => set('method', m)}>{m}</button>)}</div></div>
        <label className="ff"><span className="ff-l">Reference</span><input value={f.ref} onChange={e => set('ref', e.target.value)} placeholder="Receipt / transfer no." /></label>
      </div>
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
      <div className="fh-row"><Btn kind="dark" onClick={() => { const m = R.add(f); if (m) setErr(m); else onDone(); }}>Save</Btn><Btn kind="ghost" onClick={onDone}>Cancel</Btn></div>
    </section>
  );
}

export function CashBook({ R, canAdd }) {
  const [adding, setAdding] = useState(false);
  const [dir, setDir] = useState('all');
  const list = R.book.filter(e => dir === 'all' || e.dir === dir);
  return (
    <>
      <div className="fr-bookbar">
        <Periods R={R} />
        <div className="fh-row">
          {canAdd ? <Btn kind="dark" onClick={() => setAdding(!adding)}>Record money in / out</Btn> : null}
          <Btn kind="ghost" onClick={R.export}>Download (Excel CSV)</Btn>
        </div>
      </div>
      {adding ? <AddEntry R={R} onDone={() => setAdding(false)} /> : null}
      <RepKpis R={R} />
      <section className="fh-card">
        <div className="k-chips">{[['all', 'All · ' + R.bookCount], ['in', 'Money in'], ['out', 'Money out']].map(([k, l]) => <button key={k} type="button" className={dir === k ? 'is-on' : ''} onClick={() => setDir(k)}>{l}</button>)}</div>
        {list.length ? (
          <div className="fr-table-wrap">
            <table className="fr-table fr-book">
              <thead><tr><th>Date</th><th>Details</th><th className="r">In</th><th className="r">Out</th><th className="r">Balance</th></tr></thead>
              <tbody>
                {list.map(e => (
                  <tr key={e.id + e.at}>
                    <td className="fr-date">{e.at.slice(5)}</td>
                    <td><b>{e.cat}</b><small>{[e.party, e.proj, e.ref].filter(Boolean).join(' · ')}</small></td>
                    <td className="r is-green">{e.dir === 'in' ? e.amt : ''}</td>
                    <td className="r is-red">{e.dir === 'out' ? e.amt : ''}</td>
                    <td className="r">{e.run}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty>Nothing recorded in this period.</Empty>}
      </section>
    </>
  );
}
