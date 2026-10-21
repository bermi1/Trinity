// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function StaffPage({ v }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
            PEOPLE
          </span>
          <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
            Staff & daily reports
          </h1>
          <span style={{ fontSize: "13px", color: "#6E6A7C" }}>
            {v.staffSummary}
          </span>
        </div>
        {v.hasMissing ? (
          <>
            <button className="tm-h2" onClick={v.remindAll} style={{ height: "40px", padding: "0 16px", border: "none", background: "#2B1459", color: "#fff", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={v.ic.bell} />
              </svg>
              Remind missing staff
            </button>
          </>
        ) : null}
      </div>
      <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: "780px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.6fr) 130px 110px 130px 120px 110px", gap: "14px", padding: "12px 20px", background: "#FAF9FC", borderBottom: "1px solid #E8E4EF", fontSize: "11px", fontWeight: "700", letterSpacing: ".06em", textTransform: "uppercase", color: "#6E6A7C" }}>
              <span>
                Name
              </span>
              <span>
                Department
              </span>
              <span>
                Tasks
              </span>
              <span>
                Open float
              </span>
              <span>
                Yesterday
              </span>
              <span />
            </div>
            {(v.staffRows || []).map((p, _i0) => (
              <Fragment key={_i0}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.6fr) 130px 110px 130px 120px 110px", gap: "14px", padding: "12px 20px", borderBottom: "1px solid #F1EEF6", fontSize: "13px", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "0" }}>
                    <span style={{ width: "34px", height: "34px", borderRadius: "50%", background: p.c, color: "#fff", fontSize: "11.5px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                      {p.i}
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <b style={{ fontWeight: "600" }}>
                        {p.n}
                      </b>
                      <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
                        {p.role}
                      </span>
                    </div>
                  </div>
                  <span>
                    {p.dept}
                  </span>
                  <span>
                    {p.tasks}
                  </span>
                  <span>
                    {p.fl}
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "6px", background: p.stbg, color: p.stfg, width: "fit-content" }}>
                    {p.stl}
                  </span>
                  <span style={{ display: "flex", justifyContent: "flex-end" }}>
                    {p.miss ? (
                      <>
                        <button className="tm-h3" onClick={p.remind} style={{ height: "30px", padding: "0 12px", border: "1px solid #E8E4EF", background: "#fff", borderRadius: "7px", fontSize: "12px", fontWeight: "600" }}>
                          Remind
                        </button>
                      </>
                    ) : null}
                  </span>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
