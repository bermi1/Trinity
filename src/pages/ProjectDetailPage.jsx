// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function ProjectDetailPage({ v }) {
  return (
    <>
      <button onClick={v.P.back} style={{ alignSelf: "flex-start", border: "none", background: "none", padding: "0", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600", color: "#6D3CC2" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={v.ic.chevL} />
        </svg>
        All projects
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "20px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "0" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ font: "600 11.5px 'IBM Plex Mono',monospace", color: "#6E6A7C" }}>
              {v.P.id}
            </span>
            <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "6px", background: v.P.stbg, color: v.P.stfg }}>
              {v.P.stl}
            </span>
          </div>
          <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
            <span>{v.P.client}</span>{" — "}<span>{v.P.name}</span>
          </h1>
          <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", fontSize: "13px", color: "#6E6A7C" }}>
            <span>
              {"PM "}
              <b style={{ color: "#17152A", fontWeight: "600" }}>
                {v.P.pmName}
              </b>
            </span>
            <span>
              {"Due "}
              <b style={{ color: "#17152A", fontWeight: "600" }}>
                {v.P.due}
              </b>
            </span>
            <span>
              {"Contract "}
              <b style={{ color: "#17152A", fontWeight: "600" }}>
                {v.P.val}
              </b>
            </span>
            <span>
              {"Expected margin "}
              <b style={{ color: "#1F7549", fontWeight: "600" }}>
                {v.P.margin}
              </b>
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button className="tm-h3" onClick={v.P.addTask} style={{ height: "38px", padding: "0 14px", border: "1px solid #E8E4EF", background: "#fff", borderRadius: "9px", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "7px" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6D3CC2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={v.ic.checkSquare} />
            </svg>
            Add task
          </button>
          {' '}
          <button className="tm-h3" onClick={v.P.reqMoney} style={{ height: "38px", padding: "0 14px", border: "1px solid #E8E4EF", background: "#fff", borderRadius: "9px", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "7px" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6D3CC2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={v.ic.banknote} />
            </svg>
            Request money
          </button>
          {' '}
          <button className="tm-h3" onClick={v.P.invoice} style={{ height: "38px", padding: "0 14px", border: "1px solid #E8E4EF", background: "#fff", borderRadius: "9px", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "7px" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6D3CC2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={v.ic.fileText} />
            </svg>
            Invoice
          </button>
        </div>
      </div>
      <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <h3 style={{ margin: "0", fontSize: "14px", fontWeight: "700" }}>
              Event workflow
            </h3>
            <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
              <span>{v.P.stageLabel}</span>{" · "}<span>{v.P.prog}</span>{" complete"}
            </span>
          </div>
          {v.P.isDone ? (
            <>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#2B1459" }}>
                Project closed
              </span>
            </>
          ) : null}
          {v.P.canAdvance ? (
            <>
              <button className="tm-h2" onClick={v.P.advance} style={{ height: "34px", padding: "0 14px", border: "none", borderRadius: "8px", background: "#2B1459", color: "#fff", fontSize: "12.5px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                Advance stage
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={v.ic.arrowR} />
                </svg>
              </button>
            </>
          ) : null}
        </div>
        <div style={{ overflowX: "auto", paddingBottom: "10px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(15,minmax(58px,1fr))", gap: "4px", minWidth: "880px" }}>
            {(v.P.stages || []).map((g, _i0) => (
              <Fragment key={_i0}>
                <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  <span style={{ height: "6px", borderRadius: "3px", background: g.col, transition: "background .3s" }} />
                  <span style={{ fontSize: "10.5px", lineHeight: "1.25", color: g.c, fontWeight: g.fw }}>
                    {g.l}
                  </span>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
        <div style={{ flex: "2 1 520px", minWidth: "0", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #E8E4EF" }}>
            <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
              Tasks
            </h3>
            <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
              {v.P.openCount}
            </span>
          </div>
          {(v.P.tasks || []).map((t, _i0) => (
            <Fragment key={_i0}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid #F1EEF6", fontSize: "13px" }}>
                <button onClick={t.toggle} style={{ width: "22px", height: "22px", borderRadius: "6px", border: `1.5px solid ${t.chkBd}`, background: t.chkBg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", padding: "0" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.ic.check} />
                  </svg>
                </button>
                <div style={{ flex: "1", minWidth: "0", display: "flex", flexDirection: "column", gap: "2px" }}>
                  <b style={{ fontWeight: "600", textDecoration: t.td }}>
                    {t.t}
                  </b>
                  <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
                    <span>{t.who}</span>{" · "}<span>{t.due}</span>
                  </span>
                </div>
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "6px", background: t.stbg, color: t.stfg, whiteSpace: "nowrap" }}>
                  {t.stl}
                </span>
              </div>
            </Fragment>
          ))}
          {v.P.tasksEmpty ? (
            <>
              <div style={{ padding: "30px", textAlign: "center", color: "#6E6A7C", fontSize: "13px" }}>
                No tasks yet.
              </div>
            </>
          ) : null}
        </div>
        <div style={{ flex: "1 1 300px", minWidth: "0", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
                Budget
              </h3>
              <span style={{ fontSize: "12px", fontWeight: "700", color: v.P.barC }}>
                {v.P.usedPct}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#6E6A7C" }}>
                <span>
                  {"Spent "}<span>{v.P.spent}</span>
                </span>
                <span>
                  {"of "}<span>{v.P.bud}</span>
                </span>
              </div>
              <div style={{ height: "10px", borderRadius: "5px", background: "#F1EEF6", overflow: "hidden" }}>
                <div style={{ width: v.P.spentW, height: "100%", background: v.P.barC, borderRadius: "5px", transition: "width .4s" }} />
              </div>
            </div>
            {v.P.over ? (
              <>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", padding: "10px 12px", borderRadius: "8px", background: "#FBEDEE", color: "#B23A46", fontSize: "12.5px", fontWeight: "600" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.ic.alert} />
                  </svg>
                  {"Over budget by "}<span>{v.P.overBy}</span>
                </div>
              </>
            ) : null}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "#E8E4EF", border: "1px solid #E8E4EF", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ background: "#fff", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "11.5px", color: "#6E6A7C" }}>
                  Remaining
                </span>
                <b style={{ fontSize: "15px" }}>
                  {v.P.remaining}
                </b>
              </div>
              <div style={{ background: "#fff", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "11.5px", color: "#6E6A7C" }}>
                  Expected profit
                </span>
                <b style={{ fontSize: "15px", color: "#1F7549" }}>
                  {v.P.profit}
                </b>
              </div>
              <div style={{ background: "#fff", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "2px", gridColumn: "span 2" }}>
                <span style={{ fontSize: "11.5px", color: "#6E6A7C" }}>
                  Invoiced to client
                </span>
                <b style={{ fontSize: "15px" }}>
                  {v.P.invoiced}
                </b>
              </div>
            </div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: "700" }}>
              Money requests
            </h3>
            {(v.P.reqs || []).map((r, _i0) => (
              <Fragment key={_i0}>
                <div className="tm-h11" onClick={r.on} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", padding: "8px 6px", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: "0" }}>
                    <b style={{ fontWeight: "600" }}>
                      {r.amt}
                    </b>
                    <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
                      <span>{r.who}</span>{" · "}<span>{r.cat}</span>
                    </span>
                  </div>
                  <span style={{ fontSize: "10.5px", fontWeight: "700", padding: "3px 7px", borderRadius: "6px", background: r.stbg, color: r.stfg, whiteSpace: "nowrap" }}>
                    {r.stl}
                  </span>
                </div>
              </Fragment>
            ))}
          </div>
          <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
              Team
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(v.P.team || []).map((m, _i0) => (
                <Fragment key={_i0}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                    <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: m.c, color: "#fff", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {m.i}
                    </span>
                    <span>{m.n}</span>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
