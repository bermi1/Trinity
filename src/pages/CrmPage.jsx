// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function CrmPage({ v }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
            COMMERCIAL
          </span>
          <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
            CRM & sales pipeline
          </h1>
        </div>
        <button className="tm-h9" onClick={v.newLead} style={{ height: "40px", padding: "0 16px", border: "none", background: "#6D3CC2", color: "#fff", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={v.ic.plus} />
          </svg>
          New lead
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "14px" }}>
        {(v.crmKpis || []).map((k, _i0) => (
          <Fragment key={_i0}>
            <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#6E6A7C", letterSpacing: ".06em", textTransform: "uppercase" }}>
                {k.l}
              </span>
              <b style={{ fontSize: "24px" }}>
                {k.v}
              </b>
            </div>
          </Fragment>
        ))}
      </div>
      {v.phone ? (
        <>
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
            {(v.leadTabs || []).map((tb, _i0) => (
              <Fragment key={_i0}>
                <button onClick={tb.on} style={{ flex: "none", height: "36px", padding: "0 14px", borderRadius: "18px", border: `1px solid ${tb.bd}`, background: tb.bg, color: tb.c, fontSize: "12.5px", fontWeight: "600", whiteSpace: "nowrap" }}>
                  {tb.l}
                </button>
              </Fragment>
            ))}
          </div>
        </>
      ) : null}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "12px", alignItems: "start" }}>
        {(v.leadColsV || []).map((col, _i0) => (
          <Fragment key={_i0}>
            <div style={{ background: "#EDE9F5", borderRadius: "14px", padding: "12px", display: "flex", flexDirection: "column", gap: "10px", minHeight: "180px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 4px" }}>
                <b style={{ fontSize: "13px" }}>
                  <span>{col.l}</span>{' '}
                  <span style={{ color: "#6E6A7C", fontWeight: "600" }}>
                    {"· "}<span>{col.n}</span>
                  </span>
                </b>
                <span style={{ fontSize: "11.5px", color: "#6E6A7C", fontWeight: "600" }}>
                  {col.tot}
                </span>
              </div>
              {(col.cards || []).map((x, _i1) => (
                <Fragment key={_i1}>
                  <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "11px", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                      <b style={{ fontSize: "13.5px" }}>
                        {x.c}
                      </b>
                      <b style={{ fontSize: "12.5px", color: "#5A2FA8", whiteSpace: "nowrap" }}>
                        {x.v}
                      </b>
                    </div>
                    <span style={{ fontSize: "12.5px", lineHeight: "1.4" }}>
                      {x.t}
                    </span>
                    {' '}
                    <span style={{ fontSize: "11px", fontWeight: "600", color: "#6E6A7C" }}>
                      {x.src}
                    </span>
                    {x.canR ? (
                      <>
                        <button className="tm-h3" onClick={x.right} style={{ height: "32px", border: "1px solid #E8E4EF", borderRadius: "8px", background: "#fff", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          <span>{x.rl}</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d={v.ic.chevR} />
                          </svg>
                        </button>
                      </>
                    ) : null}
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
