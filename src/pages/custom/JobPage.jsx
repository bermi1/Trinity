import { useState } from 'react';
import { PageHead, Card, Pill, Btn, Avatar, Empty, qty } from '../../ui/kit';

// One production job: stages, the materials it needs from the store, costs, returns and wastage.
export default function JobPage({ v }) {
  const J = v.JOB;
  const [ret, setRet] = useState({ sku: '', qty: '' });
  const [waste, setWaste] = useState('');
  if (!J) return <Empty>This job no longer exists.</Empty>;
  const retSku = ret.sku || (J.returnable[0] && J.returnable[0].v) || '';
  return (
    <>
      <PageHead kicker={'Production · ' + J.id} title={J.t} sub={J.client + ' · ' + J.project + ' · due ' + J.due}>
        {v.phone ? null : <Btn kind="ghost" icon={v.ic.chevL} onClick={J.back}>Back</Btn>}
        {J.canAdv ? <Btn kind={J.blocked ? 'ghost' : 'dark'} onClick={J.adv} title={J.blocked ? 'Waiting for materials' : ''}>{J.advL}</Btn> : null}
      </PageHead>

      <Card title="Workflow" aside={<span className="k-sub">Stage: <b style={{ color: '#17152A' }}>{J.stage}</b></span>}>
        <div className="k-steps">{J.stages.map(s => <div key={s.l} className={'k-step is-' + s.state}><i /><span>{s.l}</span></div>)}</div>
        {J.blocked ? <div className="k-alert" style={{ marginTop: 14 }}>Printing can start once the store has issued every material on the list.</div> : null}
      </Card>

      <div className="k-row">
        <Card title="Materials from the store" aside={J.req ? <span className="k-req-meta"><button className="k-link" onClick={J.req.open}>{J.req.id}</button><Pill l={J.req.stl} bg={J.req.stbg} fg={J.req.stfg} /></span> : <span className="k-sub">{J.matLabel}</span>}>
          {J.bom.length === 0 ? <Empty>No materials listed for this job.</Empty> : (
            <div className="k-scroll">
              <table className="k-table">
                <thead><tr><th>Item</th><th className="num">Needed</th><th className="num">Issued</th><th className="num">In store</th><th className="num">Est. cost</th></tr></thead>
                <tbody>
                  {J.bom.map(b => (
                    <tr key={b.sku}>
                      <td><div style={{ fontWeight: 600 }}>{b.n}</div><div className="k-sub">{b.sku}{b.returned ? ' · ' + b.returned + ' returned' : ''}</div></td>
                      <td className="num">{qty(b.need, b.u)}</td>
                      <td className="num" style={{ color: b.issued >= b.need ? '#1F7549' : '#17152A', fontWeight: 700 }}>{b.issued}</td>
                      <td className="num" style={{ color: b.have < b.need - b.issued ? '#B23A46' : '#17152A' }}>{b.have}</td>
                      <td className="num">{b.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {J.canRequest ? <div style={{ marginTop: 14 }}><Btn kind="dark" icon={v.ic.package} onClick={J.request}>Request materials from store</Btn></div> : null}
          {J.ready && J.bom.length ? <div className="k-alert is-ok" style={{ marginTop: 14 }}>All materials issued · ready to print</div> : null}
        </Card>

        <Card title="Cost & quality">
          <div className="k-timeline">
            <div><span style={{ flex: 1 }}>Materials issued to this job</span><b>{J.matValue}</b></div>
            <div><span style={{ flex: 1 }}>Total job cost</span><b>{J.cost}</b></div>
            <div><span style={{ flex: 1 }}>Project</span><span className="k-sub">{J.budget}</span></div>
            <div><span style={{ flex: 1 }}>Assigned to</span><Avatar p={J.who} size={22} />{J.who.n}</div>
            <div><span style={{ flex: 1 }}>Wastage</span><b style={{ color: J.waste > 4 ? '#B23A46' : '#17152A' }}>{J.waste}%</b></div>
          </div>
          <form className="k-form" style={{ marginTop: 12 }} onSubmit={e => { e.preventDefault(); if (waste !== '') { J.setWaste(waste); setWaste(''); } }}>
            <label>Record wastage %<input type="number" min="0" max="100" inputMode="numeric" value={waste} onChange={e => setWaste(e.target.value)} placeholder={String(J.waste)} /></label>
            <Btn kind="ghost" type="submit">Save</Btn>
          </form>
        </Card>
      </div>

      <div className="k-row">
        <Card title="Return unused material">
          {J.returnable.length === 0 ? <Empty>Nothing issued yet, so nothing to return.</Empty> : (
            <form className="k-form" onSubmit={e => { e.preventDefault(); if (J.doReturn(retSku, ret.qty)) setRet({ sku: retSku, qty: '' }); }}>
              <label>Item<select value={retSku} onChange={e => setRet({ ...ret, sku: e.target.value })}>{J.returnable.map(i => <option key={i.v} value={i.v}>{i.l}</option>)}</select></label>
              <label style={{ flex: '0 1 120px' }}>Quantity<input type="number" min="1" inputMode="numeric" value={ret.qty} onChange={e => setRet({ ...ret, sku: retSku, qty: e.target.value })} /></label>
              <Btn kind="ghost" type="submit">Return to store</Btn>
            </form>
          )}
        </Card>
        <Card title="Material history">
          {J.history.length === 0 ? <Empty>No stock has moved for this job yet.</Empty> : (
            <div className="k-timeline">{J.history.map((h, i) => <div key={i}><span className="k-mono">{h.d}</span><Pill l={h.stl} bg={h.stbg} fg={h.stfg} /><span style={{ flex: 1 }}>{h.t}</span><span className="k-sub">{h.v}</span></div>)}</div>
          )}
        </Card>
      </div>
    </>
  );
}
