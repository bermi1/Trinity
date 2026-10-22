import { PageHead, Kpis, Card, Btn, Avatar, Empty } from '../../ui/kit';

// Printing department home: jobs on the floor, what they're waiting for, and materials received.
export default function PrintFloorPage({ v }) {
  const P = v.PS;
  return (
    <>
      <PageHead kicker="Printing department" title={P.greet} sub="Your jobs, the materials they need from the store, and what the store has sent.">
        <Btn kind="ghost" icon={v.ic.package} onClick={P.newReq}>Request from store</Btn>
      </PageHead>
      <Kpis items={P.kpis} />
      <div className="k-row">
        <Card title="Jobs on the floor" pad={false} className="k-grow">
          {P.jobs.length === 0 ? <Empty>No active jobs.</Empty> : (
            <div className="k-timeline" style={{ padding: '4px 20px 8px' }}>
              {P.jobs.map(j => (
                <div key={j.id} data-job={j.id} style={{ alignItems: 'flex-start' }}>
                  <Avatar p={j.who} size={28} />
                  <div style={{ flex: '1 1 200px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <button className="k-link" style={{ fontSize: 14, textAlign: 'left', color: '#17152A' }} onClick={j.open}>{j.t}</button>
                    <span className="k-sub">{j.id} · {j.client} · {j.stage} · due {j.due}</span>
                    <span className={'k-state is-' + (j.ready ? 'done' : 'part')}>{j.ready ? 'Materials ready' : j.mat.charAt(0).toUpperCase() + j.mat.slice(1)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {j.canRequest ? <Btn kind="dark" onClick={j.request}>Request materials</Btn> : null}
                    <Btn kind="ghost" onClick={j.open}>Open</Btn>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title="Received from the store">
          {P.issues.length === 0 ? <Empty>Nothing issued yet.</Empty> : (
            <div className="k-timeline">{P.issues.map((m, i) => <div key={i}><span className="k-mono">{m.d}</span><span style={{ flex: 1 }}>{m.t}</span><span className="k-sub">{m.ref} · {m.client}</span></div>)}</div>
          )}
        </Card>
      </div>
    </>
  );
}
