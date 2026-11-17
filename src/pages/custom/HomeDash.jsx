import { CashChart } from './FinanceReports';

const TONE = { amber: ['#FFF4E0', '#9A6200'], purple: ['#F0EBFA', '#5A2FA8'], green: ['#E7F6EE', '#1F7549'], red: ['#FDECEE', '#B23A46'] };

// Company home: the few numbers that matter, then what needs attention today.
export default function HomeDash({ v }) {
  const H = v.HD;
  if (!H) return null;
  return (
    <div className="hd">
      <header className="hd-top">
        <div><h1>{H.hello}</h1><p>{H.date}</p></div>
        <div className="hd-acts">{H.actions.map((a, i) => <button key={a.l} type="button" className={'hd-btn' + (i === 0 ? ' is-pri' : '')} onClick={a.on}><i aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={v.ic[['plus', 'checkSquare', 'fileText', 'banknote'][i]]} /></svg></i><span>{a.l}</span></button>)}</div>
      </header>

      <section className="hd-kpis">
        {H.kpis.map(k => (
          <button key={k.l} type="button" className="hd-kpi" onClick={k.on}>
            <span>{k.l}</span><b>{k.v}</b><small className={k.warn ? 'is-warn' : ''}>{k.s}</small>
          </button>
        ))}
      </section>

      <div className="hd-grid">
        <section className="hd-card hd-att">
          <header><h3>Needs attention</h3><span>{H.att.length}</span></header>
          {H.att.length ? (
            <ul>
              {H.att.map((a, i) => (
                <li key={i}><button type="button" onClick={a.on}>
                  <em style={{ background: TONE[a.tone][0], color: TONE[a.tone][1] }}>{a.tag}</em>
                  <span><b>{a.t}</b><small>{a.s}</small></span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
                </button></li>
              ))}
            </ul>
          ) : <p className="hd-empty">Nothing waiting. All clear.</p>}
        </section>

        <section className="hd-card">
          <header><h3>Sales pipeline</h3><button type="button" className="hd-link" onClick={H.goClients}>Open</button></header>
          <ul className="hd-pipe">
            {H.stages.map(x => <li key={x.l}><span>{x.l}</span><i><b style={{ width: Math.max(4, x.w) + '%' }} /></i><em>{x.n}</em>{x.vt ? <small>{x.vt}</small> : null}</li>)}
          </ul>
          <footer className="hd-foot"><span><b>{H.won}</b> won</span><span><b>{H.customers}</b> customers</span></footer>
        </section>

        <section className="hd-card">
          <header><h3>Projects by stage</h3><button type="button" className="hd-link" onClick={H.goProjects}>Open</button></header>
          <div className="hd-stages">{H.pstages.map(p => <div key={p.l}><b>{p.n}</b><span>{p.l}</span></div>)}</div>
          <footer className="hd-foot"><button type="button" className="hd-link" onClick={H.goTeam}><b>{H.team.sent}</b> of {H.team.total} sent their day today →</button></footer>
        </section>

        {v.REP ? <div className="hd-wide"><CashChart R={v.REP} /></div> : null}

        <section className="hd-card hd-wide">
          <header><h3>Recent activity</h3></header>
          <ul className="hd-act">{H.activity.map((a, i) => <li key={i}><time>{a.time}</time><span><b>{a.t}</b><small>{a.s}</small></span></li>)}</ul>
        </section>
      </div>
    </div>
  );
}
