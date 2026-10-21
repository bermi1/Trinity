// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function ProposalsPage({ v }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "0" }}>
          <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
            COMMERCIAL
          </span>
          <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
            Sales & proposals
          </h1>
          <span style={{ fontSize: "13px", color: "#6E6A7C", textWrap: "pretty" }}>
            Draft → internal review → approved → sent → viewed → negotiation → accepted → project
          </span>
        </div>
        <button className="tm-h9" onClick={v.newProposal} style={{ height: "40px", padding: "0 16px", border: "none", background: "#6D3CC2", color: "#fff", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", flex: "none" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={v.ic.plus} />
          </svg>
          New proposal
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "14px" }}>
        {(v.propKpis || []).map((k, _i0) => (
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
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {(v.propChips || []).map((c, _i0) => (
          <Fragment key={_i0}>
            <button onClick={c.on} style={{ height: "34px", padding: "0 14px", borderRadius: "17px", border: `1px solid ${c.bd}`, background: c.bg, color: c.c, fontSize: "12.5px", fontWeight: "600" }}>
              {c.l}
            </button>
          </Fragment>
        ))}
      </div>
      <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", overflow: "hidden" }}>
        {(v.propRows || []).map((p, _i0) => (
          <Fragment key={_i0}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 20px", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #F1EEF6" }}>
              <div style={{ flex: "1 1 240px", minWidth: "0", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ font: "600 11px 'IBM Plex Mono',monospace", color: "#6E6A7C" }}>
                    {p.id}
                  </span>
                  <span style={{ fontSize: "10.5px", fontWeight: "700", padding: "2px 7px", borderRadius: "5px", background: p.stbg, color: p.stfg }}>
                    {p.stl}
                  </span>
                </div>
                <b style={{ fontSize: "13.5px", fontWeight: "600" }}>
                  <span>{p.c}</span>{" · "}<span>{p.t}</span>
                </b>
                <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
                  <span>{p.own}</span>{" · valid until "}<span>{p.valid}</span>
                </span>
              </div>
              <div style={{ flex: "1 1 180px", minWidth: "0", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", gap: "3px" }}>
                  {(p.steps || []).map((g, _i1) => (
                    <Fragment key={_i1}>
                      <span style={{ flex: "1", height: "5px", borderRadius: "3px", background: g.c }} />
                    </Fragment>
                  ))}
                </div>
                <span style={{ fontSize: "11px", color: "#6E6A7C" }}>
                  {p.stepLabel}
                </span>
              </div>
              <b style={{ flex: "0 0 100px", fontSize: "14px" }}>
                {p.v}
              </b>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <button className="tm-h3" onClick={p.pdf} style={{ height: "34px", padding: "0 12px", border: "1px solid #E8E4EF", background: "#fff", borderRadius: "8px", fontSize: "12.5px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.ic.download} />
                  </svg>
                  PDF
                </button>
                {p.canReject ? (
                  <>
                    <button onClick={p.reject} style={{ height: "34px", padding: "0 12px", border: "1px solid #F0C9CD", background: "#fff", color: "#B23A46", borderRadius: "8px", fontSize: "12.5px", fontWeight: "600" }}>
                      Not accepted
                    </button>
                  </>
                ) : null}
                {p.canAdv ? (
                  <>
                    <button className="tm-h2" onClick={p.adv} style={{ height: "34px", padding: "0 12px", border: "none", borderRadius: "8px", background: "#2B1459", color: "#fff", fontSize: "12.5px", fontWeight: "600", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}>
                      {p.advL}
                    </button>
                  </>
                ) : null}
                {p.canConv ? (
                  <>
                    <button onClick={p.convert} style={{ height: "34px", padding: "0 12px", border: "none", borderRadius: "8px", background: "#B49A5A", color: "#fff", fontSize: "12.5px", fontWeight: "700", whiteSpace: "nowrap" }}>
                      Convert to project
                    </button>
                  </>
                ) : null}
                {p.conv ? (
                  <>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px", height: "34px", fontSize: "12px", fontWeight: "700", color: "#1F7549" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d={v.ic.check} />
                      </svg>
                      Project created
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </Fragment>
        ))}
        {v.propEmpty ? (
          <>
            <div style={{ padding: "40px", textAlign: "center", color: "#6E6A7C", fontSize: "13px" }}>
              No proposals in this view.
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
