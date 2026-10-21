// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function ProductionPage({ v }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "0" }}>
          <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
            OPERATIONS
          </span>
          <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
            Production
          </h1>
          <span style={{ fontSize: "13px", color: "#6E6A7C", textWrap: "pretty" }}>
            Brief → design → client approval → production → quality check → packaging → delivery
          </span>
        </div>
        <button className="tm-h9" onClick={v.newJob} style={{ height: "40px", padding: "0 16px", border: "none", background: "#6D3CC2", color: "#fff", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", flex: "none" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={v.ic.plus} />
          </svg>
          New job
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "14px" }}>
        {(v.jobKpis || []).map((k, _i0) => (
          <Fragment key={_i0}>
            <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#6E6A7C", letterSpacing: ".06em", textTransform: "uppercase" }}>
                {k.l}
              </span>
              <b style={{ fontSize: "24px", letterSpacing: "-.01em" }}>
                {k.v}
              </b>
              <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
                {k.n}
              </span>
            </div>
          </Fragment>
        ))}
      </div>
      <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", overflow: "hidden" }}>
        {(v.jobRows || []).map((j, _i0) => (
          <Fragment key={_i0}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 20px", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #F1EEF6" }}>
              <div style={{ flex: "1 1 240px", minWidth: "0", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ font: "600 11px 'IBM Plex Mono',monospace", color: "#6E6A7C" }}>
                    {j.id}
                  </span>
                  <span style={{ fontSize: "11.5px", fontWeight: "600", color: "#6D3CC2" }}>
                    {j.client}
                  </span>
                </div>
                <b style={{ fontSize: "13.5px", fontWeight: "600" }}>
                  {j.t}
                </b>
                <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
                  {j.meta}
                </span>
              </div>
              <div style={{ flex: "1 1 200px", minWidth: "0", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", gap: "3px" }}>
                  {(j.steps || []).map((g, _i1) => (
                    <Fragment key={_i1}>
                      <span style={{ flex: "1", height: "5px", borderRadius: "3px", background: g.c }} />
                    </Fragment>
                  ))}
                </div>
                <span style={{ fontSize: "11.5px", fontWeight: "700", color: j.stageC }}>
                  {j.stage}
                </span>
              </div>
              <div style={{ flex: "0 0 140px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#6E6A7C" }}>
                <span title={j.whoN} style={{ width: "26px", height: "26px", borderRadius: "50%", background: j.whoC, color: "#fff", fontSize: "10px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  {j.who}
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                  <span>
                    {"due "}<span>{j.due}</span>
                  </span>
                  <span style={{ color: j.wc, fontWeight: "600" }}>
                    {j.waste}
                  </span>
                </div>
              </div>
              <b style={{ flex: "0 0 80px", fontSize: "13px" }}>
                {j.cost}
              </b>
              {j.canAdv ? (
                <>
                  <button className="tm-h2" onClick={j.adv} style={{ height: "34px", padding: "0 12px", border: "none", borderRadius: "8px", background: "#2B1459", color: "#fff", fontSize: "12.5px", fontWeight: "600", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}>
                    {j.advL}
                  </button>
                </>
              ) : null}
            </div>
          </Fragment>
        ))}
      </div>
    </>
  );
}
