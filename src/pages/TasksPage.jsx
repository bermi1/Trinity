// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function TasksPage({ v }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
            OPERATIONS
          </span>
          <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
            Tasks
          </h1>
        </div>
        <button className="tm-h9" onClick={v.newTask} style={{ height: "40px", padding: "0 16px", border: "none", background: "#6D3CC2", color: "#fff", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={v.ic.plus} />
          </svg>
          New task
        </button>
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {(v.taskChips || []).map((c, _i0) => (
          <Fragment key={_i0}>
            <button onClick={c.on} style={{ height: "34px", padding: "0 14px", borderRadius: "17px", border: `1px solid ${c.bd}`, background: c.bg, color: c.c, fontSize: "12.5px", fontWeight: "600" }}>
              {c.l}
            </button>
          </Fragment>
        ))}
      </div>
      {v.phone ? (
        <>
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
            {(v.taskTabs || []).map((tb, _i0) => (
              <Fragment key={_i0}>
                <button onClick={tb.on} style={{ flex: "none", height: "36px", padding: "0 14px", borderRadius: "18px", border: `1px solid ${tb.bd}`, background: tb.bg, color: tb.c, fontSize: "12.5px", fontWeight: "600", whiteSpace: "nowrap" }}>
                  {tb.l}
                </button>
              </Fragment>
            ))}
          </div>
        </>
      ) : null}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: "14px", alignItems: "start" }}>
        {(v.taskColsV || []).map((col, _i0) => (
          <Fragment key={_i0}>
            <div style={{ background: "#EDE9F5", borderRadius: "14px", padding: "12px", display: "flex", flexDirection: "column", gap: "10px", minHeight: "200px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 4px 2px", fontSize: "13px", fontWeight: "700" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: col.dot }} />
                <span>{col.l}</span>
                <span style={{ marginLeft: "auto", fontSize: "11.5px", fontWeight: "700", color: "#6E6A7C", background: "#fff", borderRadius: "10px", padding: "2px 8px" }}>
                  {col.n}
                </span>
              </div>
              {(col.cards || []).map((t, _i1) => (
                <Fragment key={_i1}>
                  <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "11px", padding: "12px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "0 1px 2px rgba(29,16,61,.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                      <span onClick={t.open} style={{ fontSize: "11.5px", fontWeight: "600", color: "#6D3CC2", cursor: "pointer" }}>
                        {t.proj}
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 7px", borderRadius: "5px", background: t.pbg, color: t.pfg }}>
                        {t.pl}
                      </span>
                    </div>
                    <b style={{ fontSize: "13.5px", fontWeight: "600", lineHeight: "1.4" }}>
                      {t.t}
                    </b>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#6E6A7C" }}>
                      <span title={t.whoN} style={{ width: "24px", height: "24px", borderRadius: "50%", background: t.whoC, color: "#fff", fontSize: "9.5px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {t.who}
                      </span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d={v.ic.clock} />
                      </svg>
                      <span>{t.due}</span>{' '}
                      <span style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
                        {t.canL ? (
                          <>
                            <button className="tm-h3" onClick={t.left} title="Move back" style={{ width: "28px", height: "28px", border: "1px solid #E8E4EF", borderRadius: "7px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "0", color: "#6E6A7C" }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d={v.ic.chevL} />
                              </svg>
                            </button>
                          </>
                        ) : null}
                        {t.canR ? (
                          <>
                            <button className="tm-h2" onClick={t.right} style={{ height: "28px", padding: "0 10px", border: "none", borderRadius: "7px", background: "#2B1459", color: "#fff", fontSize: "11.5px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                              <span>{t.rl}</span>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d={v.ic.chevR} />
                              </svg>
                            </button>
                          </>
                        ) : null}
                      </span>
                    </div>
                  </div>
                </Fragment>
              ))}
              {col.empty ? (
                <>
                  <div style={{ border: "1.5px dashed #D5CFE0", borderRadius: "11px", padding: "20px", textAlign: "center", fontSize: "12px", color: "#6E6A7C" }}>
                    Nothing here
                  </div>
                </>
              ) : null}
            </div>
          </Fragment>
        ))}
      </div>
    </>
  );
}
