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
      <div className="fr-plot">
      <div className="fr-axis" aria-hidden="true">{R.ticks.map(t => <span key={t.pct} style={{ bottom: 'calc(18px + (100% - 24px) * ' + t.pct / 100 + ')' }}>{t.l}</span>)}</div>
      <div className="fr-bars" onMouseLeave={() => setHover(-1)}>
        <div className="fr-grid" aria-hidden="true">{R.ticks.map(t => <i key={t.pct} style={{ bottom: t.pct + '%' }} />)}</div>
        {R.chart.map((c, i) => (
          <button key={c.k} type="button" className={'fr-col' + (hover === i || pick === i ? ' is-on' : '')} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onClick={() => setPick(pick === i ? -1 : i)} aria-pressed={pick === i} aria-label={c.k + ': in ' + c.tin + ', out ' + c.tout}>
            <span className="fr-pair"><i className="is-in" style={{ height: c.hi + '%' }} /><i className="is-out" style={{ height: c.ho + '%' }} /></span>
            <small>{i % R.showEvery === 0 || R.chart.length <= 16 ? c.l : ''}</small>
          </button>
        ))}
      </div>
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
          <h3>{R.showProfit ? 'Projects · money in and out' : 'Projects · invoiced, received and spent'}</h3>
          <div className="fr-table-wrap">
            <table className="fr-table">
              <thead><tr><th>Project</th><th>Invoiced</th><th>Received</th><th>Spent</th>{R.showProfit ? <th>Profit</th> : null}</tr></thead>
              <tbody>{R.projects.map(p => <tr key={p.id}><td><b>{p.c}</b><small>{p.n}</small></td><td>{p.invoiced}</td><td>{p.got}</td><td>{p.spent}</td>{R.showProfit ? <td className={p.neg ? 'is-red' : 'is-green'}>{p.profit}<small>{p.margin}</small></td> : null}</tr>)}</tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

// Record money in or out: amount, what for, who. Everything else is optional and folded away.
const TOP_OUT = ['Suppliers & production', 'Salaries', 'Fuel & transport', 'Rent', 'Utilities', 'Office supplies'];
function AddEntry({ R, onDone }) {
  const [f, setF] = useState({ dir: 'out', amt: '', cat: '', party: '', p: '', method: 'Bank', ref: '', at: '', fee: '' });
  const [more, setMore] = useState(false);
  const [allCats, setAllCats] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => { setErr(''); setF(x => Object.assign({}, x, { [k]: v })); };
  const all = f.dir === 'in' ? R.inCats : R.outCats;
  const cats = f.dir === 'in' || allCats ? all : TOP_OUT.concat(f.cat && !TOP_OUT.includes(f.cat) ? [f.cat] : []);
  const save = () => { const m = R.add(f); if (m) setErr(m); else onDone(); };
  return (
    <section className={'fh-card me is-' + f.dir} aria-label="Record money">
      <div className="me-seg" role="radiogroup" aria-label="Money in or out">
        {[['out', 'Money out'], ['in', 'Money in']].map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={f.dir === k} className={f.dir === k ? 'is-on' : ''} onClick={() => { setF(x => Object.assign({}, x, { dir: k, cat: '' })); setAllCats(false); }}>{l}</button>)}
      </div>
      <label className="me-amt"><span>TZS</span><input inputMode="numeric" autoFocus value={f.amt ? n(f.amt) : ''} onChange={e => set('amt', digits(e.target.value))} placeholder="0" aria-label="Amount" /></label>
      <label className="me-fee"><span>Transaction charges (TZS)</span><input inputMode="numeric" value={f.fee ? n(f.fee) : ''} onChange={e => set('fee', digits(e.target.value))} placeholder="0 · bank or mobile money fee" aria-label="Transaction charges" /></label>
      <div className="me-cats" role="radiogroup" aria-label="What for">
        {cats.map(c => <button key={c} type="button" role="radio" aria-checked={f.cat === c} className={f.cat === c ? 'is-on' : ''} onClick={() => set('cat', c)}>{c}</button>)}
        {f.dir === 'out' && !allCats ? <button type="button" className="me-more" onClick={() => setAllCats(true)}>More…</button> : null}
      </div>
      <input className="me-who" value={f.party} onChange={e => set('party', e.target.value)} placeholder={f.dir === 'in' ? 'Received from (e.g. CRDB Bank PLC)' : 'Paid to (e.g. Vinyl House)'} aria-label={f.dir === 'in' ? 'Received from' : 'Paid to'} />
      {more ? (
        <div className="me-extra">
          <label><span>Date</span><input type="date" value={f.at} onChange={e => set('at', e.target.value)} /></label>
          <label><span>Reference</span><input value={f.ref} onChange={e => set('ref', e.target.value)} placeholder="Receipt or transfer no." /></label>
          <div className="me-row"><span>Paid by</span><div className="me-mini">{['Bank', 'Cash', 'Mobile money'].map(m => <button key={m} type="button" className={f.method === m ? 'is-on' : ''} onClick={() => set('method', m)}>{m}</button>)}</div></div>
          <div className="me-row"><span>Project</span><div className="me-mini">{R.projOpts.map(p => <button key={p.v} type="button" className={f.p === p.v ? 'is-on' : ''} onClick={() => set('p', f.p === p.v ? '' : p.v)}>{p.l}</button>)}</div></div>
        </div>
      ) : <button type="button" className="me-link" onClick={() => setMore(true)}>+ Date, reference, payment method, project</button>}
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
      <div className="me-foot">
        <button type="button" className="me-cancel" onClick={onDone}>Cancel</button>
        <button type="button" className="me-save" onClick={save}>{f.dir === 'in' ? 'Save money in' : 'Save money out'}</button>
      </div>
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
