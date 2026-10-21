// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function CommandPalette({ v }) {
  return (
    <>
      <div onClick={v.closeCmd} style={{ position: "fixed", inset: "0", zIndex: "80", background: "rgba(23,21,42,.45)", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "12vh 16px 16px" }}>
        <div onClick={v.stop} style={{ width: "100%", maxWidth: "600px", background: "#fff", borderRadius: "16px", boxShadow: "0 24px 60px rgba(29,16,61,.3)", overflow: "hidden", animation: "tmIn .15s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0 18px", height: "58px", borderBottom: "1px solid #E8E4EF" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6E6A7C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={v.ic.search} />
            </svg>
            <input autoFocus={v.true} value={v.cmdQ ?? ''} onChange={v.onCmdQ} onKeyDown={v.cmdKey} placeholder="Search pages, projects, stock, or type an action…" style={{ flex: "1", border: "none", outline: "none", fontSize: "15px", background: "transparent", minWidth: "0" }} />
            <span style={{ font: "500 11px 'IBM Plex Mono',monospace", border: "1px solid #E8E4EF", borderRadius: "5px", padding: "2px 6px", color: "#6E6A7C" }}>
              Esc
            </span>
          </div>
          <div style={{ maxHeight: "420px", overflowY: "auto", padding: "6px" }}>
            {(v.cmdItems || []).map((c, _i0) => (
              <Fragment key={_i0}>
                <div className="tm-h3" onClick={c.on} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "9px", background: c.bg, cursor: "pointer" }}>
                  <span style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#fff", border: "1px solid #E8E4EF", color: "#6D3CC2", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={c.ic} />
                    </svg>
                  </span>
                  <span style={{ flex: "1", fontSize: "13.5px", fontWeight: "600" }}>
                    {c.l}
                  </span>
                  <span style={{ fontSize: "11.5px", color: "#6E6A7C" }}>
                    {c.s}
                  </span>
                </div>
              </Fragment>
            ))}
            {v.cmdEmpty ? (
              <>
                <div style={{ padding: "30px", textAlign: "center", color: "#6E6A7C", fontSize: "13px" }}>
                  No results
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
