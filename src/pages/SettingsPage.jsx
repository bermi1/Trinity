// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function SettingsPage({ v }) {
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "0" }}>
        <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
          SYSTEM
        </span>
        <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
          Settings
        </h1>
        <span style={{ fontSize: "13px", color: "#6E6A7C", textWrap: "pretty" }}>
          Profile, notifications, company and access
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
        <div style={{ flex: "1 1 300px", minWidth: "0", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
            Profile
          </h3>
          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            <span style={{ width: "56px", height: "56px", borderRadius: "50%", background: v.meP.c, color: "#fff", fontSize: "18px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              {v.meP.i}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: "0" }}>
              <b style={{ fontSize: "16px" }}>
                {v.meP.n}
              </b>
              <span style={{ fontSize: "13px", color: "#6E6A7C" }}>
                {v.meP.t}
              </span>
              <span style={{ fontSize: "12.5px", color: "#6D3CC2", overflow: "hidden", textOverflow: "ellipsis" }}>
                {v.meP.e}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", borderRadius: "10px", background: "#F4F1FA", fontSize: "12.5px", color: "#2B1459", fontWeight: "600" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={v.ic.shield} />
            </svg>
            {"Portal access · "}<span>{v.meP.role}</span>
          </div>
        </div>
        <div style={{ flex: "1 1 300px", minWidth: "0", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <h3 style={{ margin: "0 0 8px", fontSize: "15px", fontWeight: "700" }}>
            Notifications
          </h3>
          {(v.prefRows || []).map((p, _i0) => (
            <Fragment key={_i0}>
              <div onClick={p.toggle} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderTop: "1px solid #F1EEF6", cursor: "pointer" }}>
                <div style={{ flex: "1", minWidth: "0", display: "flex", flexDirection: "column", gap: "2px" }}>
                  <b style={{ fontSize: "13.5px", fontWeight: "600" }}>
                    {p.l}
                  </b>
                  <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
                    {p.d}
                  </span>
                </div>
                <span style={{ position: "relative", width: "42px", height: "24px", borderRadius: "12px", background: p.tbg, flex: "none", transition: "background .2s" }}>
                  <span style={{ position: "absolute", top: "2px", left: p.tx, width: "20px", height: "20px", borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.2)", transition: "left .2s" }} />
                </span>
              </div>
            </Fragment>
          ))}
        </div>
        <div style={{ flex: "1 1 300px", minWidth: "0", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <h3 style={{ margin: "0 0 8px", fontSize: "15px", fontWeight: "700" }}>
            Company
          </h3>
          {(v.company || []).map((c, _i0) => (
            <Fragment key={_i0}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "9px 0", borderTop: "1px solid #F1EEF6", fontSize: "13px" }}>
                <span style={{ color: "#6E6A7C" }}>
                  {c.k}
                </span>
                <b style={{ fontWeight: "600", textAlign: "right" }}>
                  {c.v}
                </b>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
      <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E8E4EF", display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
          <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
            Roles & permissions
          </h3>
          <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
            Each portal sees only what it needs
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: "980px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "130px repeat(10,minmax(0,1fr))", gap: "6px", padding: "10px 20px", background: "#FAF9FC", borderBottom: "1px solid #E8E4EF", fontSize: "10.5px", fontWeight: "700", letterSpacing: ".04em", textTransform: "uppercase", color: "#6E6A7C" }}>
              <span>
                Role
              </span>
              {(v.permHead || []).map((hd, _i0) => (
                <Fragment key={_i0}>
                  <span>
                    {hd.m}
                  </span>
                </Fragment>
              ))}
            </div>
            {(v.permRows || []).map((pr, _i0) => (
              <Fragment key={_i0}>
                <div style={{ display: "grid", gridTemplateColumns: "130px repeat(10,minmax(0,1fr))", gap: "6px", padding: "10px 20px", borderBottom: "1px solid #F1EEF6", alignItems: "center", fontSize: "12.5px" }}>
                  <b style={{ fontWeight: "600" }}>
                    {pr.r}
                  </b>
                  {(pr.cells || []).map((c, _i1) => (
                    <Fragment key={_i1}>
                      <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 8px", borderRadius: "6px", background: c.bg, color: c.c, width: "fit-content" }}>
                        {c.l}
                      </span>
                    </Fragment>
                  ))}
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
      <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", paddingBottom: "8px" }}>
          <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
            Audit trail
          </h3>
          <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
            Financial history can't be edited — only reversed with a new entry
          </span>
        </div>
        {(v.audit || []).map((a, _i0) => (
          <Fragment key={_i0}>
            <div style={{ display: "grid", gridTemplateColumns: "52px minmax(0,1fr)", gap: "10px", padding: "9px 0", borderTop: "1px solid #F1EEF6", fontSize: "13px" }}>
              <span style={{ font: "500 11.5px 'IBM Plex Mono',monospace", color: "#6E6A7C", paddingTop: "1px" }}>
                {a.time}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span>
                  {a.t}
                </span>
                <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
                  {a.s}
                </span>
              </div>
            </div>
          </Fragment>
        ))}
      </div>
    </>
  );
}
