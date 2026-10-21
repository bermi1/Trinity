// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function NotificationsPage({ v }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
            OVERVIEW
          </span>
          <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
            Notifications
          </h1>
        </div>
        <button className="tm-h3" onClick={v.markAllRead} style={{ height: "38px", padding: "0 14px", border: "1px solid #E8E4EF", background: "#fff", borderRadius: "9px", fontSize: "13px", fontWeight: "600" }}>
          Mark all as read
        </button>
      </div>
      <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", overflow: "hidden", maxWidth: "880px" }}>
        {(v.noteRows || []).map((n, _i0) => (
          <Fragment key={_i0}>
            <div className="tm-h3" onClick={n.on} style={{ display: "flex", gap: "14px", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #F1EEF6", background: n.bg, cursor: "pointer" }}>
              <span style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#F4F1FA", color: "#6D3CC2", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={n.ic} />
                </svg>
              </span>
              <div style={{ flex: "1", minWidth: "0", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "13.5px", fontWeight: n.fw }}>
                  {n.t}
                </span>
                <span style={{ fontSize: "12.5px", color: "#6E6A7C" }}>
                  {n.s}
                </span>
              </div>
              <span style={{ font: "500 11.5px 'IBM Plex Mono',monospace", color: "#6E6A7C" }}>
                {n.time}
              </span>
              {n.unread ? (
                <>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6D3CC2", flex: "none" }} />
                </>
              ) : null}
            </div>
          </Fragment>
        ))}
      </div>
    </>
  );
}
