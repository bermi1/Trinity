// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function StaffPortalPage({ v }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
            STAFF PORTAL
          </span>
          <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
            {v.SP.greet}
          </h1>
          <span style={{ fontSize: "13px", color: "#6E6A7C" }}>
            Your tasks, requests and reports · works on desktop, tablet or phone
          </span>
        </div>
        <button className="tm-h9" onClick={v.SP.newReq} style={{ height: "40px", padding: "0 16px", border: "none", background: "#6D3CC2", color: "#fff", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={v.ic.plus} />
          </svg>
          Request money
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "14px" }}>
        {(v.SP.kpis || []).map((k, _i0) => (
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
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
        <div style={{ flex: "1.4 1 340px", minWidth: "0", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E8E4EF" }}>
            <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
              My tasks
            </h3>
          </div>
          {(v.SP.tasks || []).map((t, _i0) => (
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
                    <span>{t.proj}</span>{" · "}<span>{t.due}</span>
                  </span>
                </div>
              </div>
            </Fragment>
          ))}
          {v.SP.tasksEmpty ? (
            <>
              <div style={{ padding: "30px", textAlign: "center", color: "#6E6A7C", fontSize: "13px" }}>
                No tasks assigned.
              </div>
            </>
          ) : null}
        </div>
        <div style={{ flex: "1 1 280px", minWidth: "0", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
              My money requests
            </h3>
            {(v.SP.reqs || []).map((r, _i0) => (
              <Fragment key={_i0}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", padding: "8px 0", borderTop: "1px solid #F1EEF6", fontSize: "13px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <b>
                      {r.amt}
                    </b>
                    <span style={{ fontSize: "11.5px", color: "#6E6A7C" }}>
                      {r.cat}
                    </span>
                  </div>
                  <span style={{ fontSize: "10.5px", fontWeight: "700", padding: "3px 7px", borderRadius: "6px", background: r.stbg, color: r.stfg }}>
                    {r.stl}
                  </span>
                </div>
              </Fragment>
            ))}
            {v.SP.reqsEmpty ? (
              <>
                <span style={{ fontSize: "12.5px", color: "#6E6A7C" }}>
                  No requests yet.
                </span>
              </>
            ) : null}
          </div>
          <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
              Submit today's report
            </h3>
            <textarea className="tm-f13" value={v.SP.reportText ?? ''} onChange={v.SP.onReport} placeholder="What did you complete, and what remains?" rows="3" style={{ border: "1px solid #E8E4EF", borderRadius: "10px", padding: "10px 12px", fontSize: "13.5px", outline: "none", resize: "none" }} />
            {' '}
            <button className="tm-h2" onClick={v.SP.sendReport} style={{ height: "40px", border: "none", borderRadius: "9px", background: "#2B1459", color: "#fff", fontSize: "13px", fontWeight: "700" }}>
              Submit report
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
