// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function ProjectsPage({ v }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
            OPERATIONS
          </span>
          <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
            Projects
          </h1>
        </div>
        <button className="tm-h9" onClick={v.newProject} style={{ height: "40px", padding: "0 16px", border: "none", background: "#6D3CC2", color: "#fff", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={v.ic.plus} />
          </svg>
          New project
        </button>
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {(v.projChips || []).map((c, _i0) => (
          <Fragment key={_i0}>
            <button onClick={c.on} style={{ height: "34px", padding: "0 14px", borderRadius: "17px", border: `1px solid ${c.bd}`, background: c.bg, color: c.c, fontSize: "12.5px", fontWeight: "600" }}>
              {c.l}
            </button>
          </Fragment>
        ))}
      </div>
      {v.phone ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {(v.projRows || []).map((p, _i0) => (
              <Fragment key={_i0}>
                <div onClick={p.on} style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: "0" }}>
                      <b style={{ fontSize: "14px" }}>
                        {p.client}
                      </b>
                      <span style={{ fontSize: "12.5px", color: "#6E6A7C" }}>
                        {p.name}
                      </span>
                    </div>
                    <span style={{ fontSize: "10.5px", fontWeight: "700", padding: "3px 8px", borderRadius: "6px", background: p.stbg, color: p.stfg, whiteSpace: "nowrap" }}>
                      {p.stl}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ flex: "1", height: "6px", borderRadius: "3px", background: "#F1EEF6", overflow: "hidden" }}>
                      <span style={{ display: "block", width: p.progW, height: "100%", background: p.progC }} />
                    </span>
                    <b style={{ fontSize: "12px" }}>
                      {p.prog}
                    </b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", fontSize: "12px", color: "#6E6A7C" }}>
                    <span>
                      <span>{p.pmName}</span>{" · due "}<span>{p.due}</span>
                    </span>
                    <span>
                      {"Budget "}
                      <b style={{ color: p.usedC }}>
                        {p.used}
                      </b>
                    </span>
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </>
      ) : null}
      <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", overflow: "hidden", display: v.deskDisp }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: "1100px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(240px,2.2fr) 170px 150px 90px 110px 90px 110px", gap: "16px", padding: "12px 20px", background: "#FAF9FC", borderBottom: "1px solid #E8E4EF", fontSize: "11px", fontWeight: "700", letterSpacing: ".06em", textTransform: "uppercase", color: "#6E6A7C" }}>
              <span>
                Project
              </span>
              <span>
                Project manager
              </span>
              <span>
                Progress
              </span>
              <span>
                Budget
              </span>
              <span>
                Value
              </span>
              <span>
                Due
              </span>
              <span>
                Status
              </span>
            </div>
            {(v.projRows || []).map((p, _i0) => (
              <Fragment key={_i0}>
                <div className="tm-h11" onClick={p.on} style={{ display: "grid", gridTemplateColumns: "minmax(240px,2.2fr) 170px 150px 90px 110px 90px 110px", gap: "16px", padding: "14px 20px", borderBottom: "1px solid #F1EEF6", fontSize: "13px", alignItems: "center", cursor: "pointer" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: "0" }}>
                    <b style={{ fontWeight: "600" }}>
                      <span>{p.client}</span>{" · "}<span>{p.name}</span>
                    </b>
                    <span style={{ font: "500 11.5px 'IBM Plex Mono',monospace", color: "#6E6A7C" }}>
                      {p.id}
                    </span>
                  </div>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: p.pmC, color: "#fff", fontSize: "10px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                      {p.pmI}
                    </span>
                    <span>{p.pmName}</span>
                  </span>
                  {' '}
                  <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ flex: "1", height: "6px", borderRadius: "3px", background: "#F1EEF6", overflow: "hidden" }}>
                      <span style={{ display: "block", width: p.progW, height: "100%", background: p.progC, borderRadius: "3px" }} />
                    </span>
                    <b style={{ fontSize: "12px", width: "34px" }}>
                      {p.prog}
                    </b>
                  </span>
                  {' '}
                  <b style={{ color: p.usedC, fontWeight: "600" }}>
                    {p.used}
                  </b>
                  <span>
                    {p.val}
                  </span>
                  <span>
                    {p.due}
                  </span>
                  {' '}
                  <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 9px", borderRadius: "6px", background: p.stbg, color: p.stfg, width: "fit-content", whiteSpace: "nowrap" }}>
                    {p.stl}
                  </span>
                </div>
              </Fragment>
            ))}
            {v.projEmpty ? (
              <>
                <div style={{ padding: "40px", textAlign: "center", color: "#6E6A7C", fontSize: "13px" }}>
                  No projects with this status.
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
