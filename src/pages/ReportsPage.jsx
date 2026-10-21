// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function ReportsPage({ v }) {
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "0" }}>
        <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
          RECORDS
        </span>
        <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
          Reports
        </h1>
        <span style={{ fontSize: "13px", color: "#6E6A7C", textWrap: "pretty" }}>
          Generate on demand · CSV buttons export the live data
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "14px" }}>
        {(v.repRows || []).map((r, _i0) => (
          <Fragment key={_i0}>
            <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <span style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#F4F1FA", color: "#6D3CC2", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={r.ic} />
                  </svg>
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: "0" }}>
                  <b style={{ fontSize: "14px" }}>
                    {r.t}
                  </b>
                  <span style={{ fontSize: "12.5px", color: "#6E6A7C", lineHeight: "1.45" }}>
                    {r.d}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", paddingTop: "10px", borderTop: "1px solid #F1EEF6", marginTop: "auto" }}>
                <span style={{ fontSize: "11.5px", color: "#6E6A7C" }}>
                  {"Last run "}<span>{r.last}</span>
                </span>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button className="tm-h3" onClick={r.pdf} style={{ height: "34px", padding: "0 12px", border: "1px solid #E8E4EF", background: "#fff", borderRadius: "8px", fontSize: "12.5px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                    PDF
                  </button>
                  <button className="tm-h2" onClick={r.csv} style={{ height: "34px", padding: "0 12px", border: "none", borderRadius: "8px", background: "#2B1459", color: "#fff", fontSize: "12.5px", fontWeight: "600", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={v.ic.download} />
                    </svg>
                    CSV
                  </button>
                </div>
              </div>
            </div>
          </Fragment>
        ))}
      </div>
    </>
  );
}
