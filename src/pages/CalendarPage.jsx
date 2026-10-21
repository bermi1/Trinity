// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function CalendarPage({ v }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "0" }}>
          <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
            OVERVIEW
          </span>
          <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
            Calendar
          </h1>
          <span style={{ fontSize: "13px", color: "#6E6A7C", textWrap: "pretty" }}>
            Week 39 · 21 – 26 September 2026 · meetings, deadlines, deliveries and events
          </span>
        </div>
        <button className="tm-h9" onClick={v.newMeet} style={{ height: "40px", padding: "0 16px", border: "none", background: "#6D3CC2", color: "#fff", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", flex: "none" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={v.ic.calendar} />
          </svg>
          Schedule meeting
        </button>
      </div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {(v.calLegend || []).map((l, _i0) => (
          <Fragment key={_i0}>
            <span style={{ fontSize: "11.5px", fontWeight: "700", padding: "4px 10px", borderRadius: "12px", background: l.bg, color: l.c }}>
              {l.l}
            </span>
          </Fragment>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "10px", alignItems: "start" }}>
        {(v.calDays || []).map((d, _i0) => (
          <Fragment key={_i0}>
            <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "10px 12px", background: d.hbg, color: d.hc, display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px", borderBottom: "1px solid #E8E4EF" }}>
                <b style={{ fontSize: "13px" }}>
                  {d.d}
                </b>
                <span style={{ fontSize: "11px" }}>
                  {d.n}
                </span>
              </div>
              <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "6px", minHeight: "110px" }}>
                {(d.ev || []).map((e, _i1) => (
                  <Fragment key={_i1}>
                    <div style={{ background: e.bg, color: e.c, borderRadius: "8px", padding: "8px 9px", display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ font: "600 10.5px 'IBM Plex Mono',monospace" }}>
                        <span>{e.t}</span>{" · "}<span>{e.k}</span>
                      </span>
                      <span style={{ fontSize: "12.5px", fontWeight: "600", lineHeight: "1.35" }}>
                        {e.n}
                      </span>
                    </div>
                  </Fragment>
                ))}
                {d.empty ? (
                  <>
                    <span style={{ fontSize: "12px", color: "#8A8698", padding: "6px" }}>
                      Nothing scheduled
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </Fragment>
        ))}
      </div>
    </>
  );
}
