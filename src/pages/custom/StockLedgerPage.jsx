import { useState } from 'react';
import { PageHead, Kpis, Chips, Pill, Btn, Card, Empty } from '../../ui/kit';

// Every stock movement in one ledger, plus the stock count form.
export default function StockLedgerPage({ v }) {
  const L = v.LED;
  const [sku, setSku] = useState(L.items[0] ? L.items[0].v : '');
  const [counted, setCounted] = useState('');
  const [reason, setReason] = useState('');
  const sel = L.items.find(i => i.v === sku);
  const post = e => {
    e.preventDefault();
    if (counted === '' || +counted < 0) return;
    if (L.adjust(sku, counted, reason)) { setCounted(''); setReason(''); }
  };
  return (
    <>
      <PageHead kicker="Store · Ledger" title="Stock ledger" sub="Every receipt, issue, return and count, with who did it and which project it was charged to.">
        <Btn kind="ghost" icon={v.ic.download} onClick={L.csv}>Export CSV</Btn>
      </PageHead>
      <Kpis items={L.kpis} />
      {L.canCount ? (
        <Card title="Stock count" aside={<span className="k-sub">Enter what is physically on the shelf</span>}>
          <form className="k-form" onSubmit={post}>
            <label>Item<select value={sku} onChange={e => setSku(e.target.value)}>{L.items.map(i => <option key={i.v} value={i.v}>{i.l}</option>)}</select></label>
            <label style={{ flex: '0 1 140px' }}>Counted {sel ? '(' + sel.u + ')' : ''}<input type="number" min="0" inputMode="numeric" value={counted} onChange={e => setCounted(e.target.value)} placeholder={sel ? String(sel.q) : ''} /></label>
            <label>Reason<input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. 2 rolls damaged by water" /></label>
            <Btn kind="dark" type="submit">Post count</Btn>
          </form>
        </Card>
      ) : null}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chips items={L.chips} />
        <div className="k-form" style={{ flex: '1 1 220px' }}><label><input value={L.q} onChange={L.onQ} placeholder="Search item, reference or client" aria-label="Search ledger" /></label></div>
      </div>
      <Card pad={false}>
        {L.rows.length === 0 ? <Empty>No movements match.</Empty> : (
          <div className="k-scroll">
            <table className="k-table" style={{ minWidth: 760 }}>
              <thead><tr><th>When</th><th>Item</th><th>Movement</th><th className="num">Qty</th><th>Reference</th><th>Charged to</th><th>By</th><th className="num">Value</th></tr></thead>
              <tbody>
                {L.rows.map(m => (
                  <tr key={m.id}>
                    <td className="k-mono">{m.d}</td>
                    <td><div style={{ fontWeight: 600 }}>{m.n}</div><div className="k-sub">{m.sku}</div></td>
                    <td><Pill l={m.stl} bg={m.stbg} fg={m.stfg} /></td>
                    <td className="num" style={{ fontWeight: 700, color: m.up ? '#1F7549' : '#17152A' }}>{m.qty}</td>
                    <td>{m.ref}</td>
                    <td>{m.client}</td>
                    <td>{m.by}</td>
                    <td className="num">{m.v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
