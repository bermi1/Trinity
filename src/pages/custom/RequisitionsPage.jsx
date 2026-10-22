import { PageHead, Kpis, Chips, Pill, Btn, Avatar, Empty, qty } from '../../ui/kit';

const STATE = { done: 'Issued', ready: 'In stock', part: 'Partly in stock', short: 'Out of stock' };

// Store requisitions: printing and staff ask, the storekeeper issues, shortfalls go to purchasing.
export default function RequisitionsPage({ v }) {
  const R = v.SRQ;
  return (
    <>
      <PageHead kicker="Store · Requisitions" title="Store requisitions" sub="Materials requested by printing and staff. Issue what's on the shelf; send what's short to purchasing.">
        <Btn icon={v.ic.plus} onClick={R.newReq}>New requisition</Btn>
      </PageHead>
      <Kpis items={R.kpis} />
      <Chips items={R.chips} />
      <div className="k-list">
        {R.rows.length === 0 ? <div className="k-card"><Empty>No requisitions here.</Empty></div> : null}
        {R.rows.map(r => (
          <article key={r.id} className="k-req" data-req={r.id}>
            <div className="k-req-head">
              <div className="k-req-title">
                <span className="k-req-meta"><span className="k-mono">{r.id}</span><Pill l={r.stl} bg={r.stbg} fg={r.stfg} /></span>
                <b>{r.purpose}</b>
                <span className="k-req-meta">
                  <Avatar p={r.by} size={20} />{r.by.n} · {r.client}{r.job ? <> · <button className="k-link" onClick={r.openJob}>{r.job}</button></> : null} · {r.d}
                </span>
              </div>
            </div>
            <div className="k-scroll">
              <table className="k-table">
                <thead><tr><th>Item</th><th className="num">Asked</th><th className="num">Issued</th><th className="num">In store</th><th>Status</th></tr></thead>
                <tbody>
                  {r.items.map(it => (
                    <tr key={it.sku}>
                      <td><div style={{ fontWeight: 600 }}>{it.n}</div><div className="k-sub">{it.sku} · bin {it.loc}</div></td>
                      <td className="num">{qty(it.qty, it.u)}</td>
                      <td className="num">{it.issued}</td>
                      <td className="num">{it.have}</td>
                      <td><span className={'k-state is-' + it.state}>{STATE[it.state]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {r.canIssue || r.canShort || r.canCancel || r.prs.length ? (
              <div className="k-req-foot">
                {r.canIssue ? <Btn kind="dark" icon={v.ic.package} onClick={r.issue}>Issue from store</Btn> : null}
                {r.canShort ? <Btn kind="ghost" icon={v.ic.cart} onClick={r.shortfall}>Raise purchase request</Btn> : null}
                {r.prs.map(pr => <span key={pr.id} className="k-pr"><b>{pr.id}</b>{pr.t} · <span style={{ color: pr.done ? '#1F7549' : '#5A2FA8', fontWeight: 700 }}>{pr.stage}</span></span>)}
                {r.canCancel ? <Btn kind="danger" style={{ marginLeft: 'auto' }} onClick={r.cancel}>Cancel</Btn> : null}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </>
  );
}
