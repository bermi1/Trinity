// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function AssistantPanel({ v }) {
  return (
    <>
      <div onClick={v.closeAI} style={{ position: "fixed", inset: "0", zIndex: "75", background: "rgba(23,21,42,.3)" }} />
      <div style={{ position: "fixed", top: "0", right: "0", bottom: "0", zIndex: "76", width: "min(420px,100%)", background: "#fff", boxShadow: "-12px 0 40px rgba(29,16,61,.18)", display: "flex", flexDirection: "column", animation: "tmIn .2s ease" }}>
        <div style={{ background: "#1D103D", padding: "18px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ width: "36px", height: "36px", borderRadius: "10px", border: "1px solid rgba(180,154,90,.5)", color: "#E2CE98", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={v.ic.sparkle} />
            </svg>
          </span>
          <div style={{ flex: "1", display: "flex", flexDirection: "column", gap: "2px" }}>
            <b style={{ color: "#fff", fontSize: "14px" }}>
              Trinity Intelligence
            </b>
            <span style={{ color: "rgba(255,255,255,.6)", fontSize: "12px" }}>
              Answers from live company data
            </span>
          </div>
          <button onClick={v.closeAI} style={{ width: "34px", height: "34px", border: "none", borderRadius: "8px", background: "rgba(255,255,255,.1)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={v.ic.x} />
            </svg>
          </button>
        </div>
        <div ref={v.aiScroll} style={{ flex: "1", overflowY: "auto", padding: "18px", display: "flex", flexDirection: "column", gap: "10px", background: "#FAF9FC" }}>
          {(v.aiMsgs || []).map((m, _i0) => (
            <Fragment key={_i0}>
              {m.ai ? (
                <>
                  <div style={{ alignSelf: "flex-start", maxWidth: "88%", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "4px 14px 14px 14px", padding: "11px 14px", fontSize: "13.5px", lineHeight: "1.55", whiteSpace: "pre-wrap" }}>
                    {m.t}
                  </div>
                </>
              ) : null}
              {m.me ? (
                <>
                  <div style={{ alignSelf: "flex-end", maxWidth: "85%", background: "#2B1459", color: "#fff", borderRadius: "14px 4px 14px 14px", padding: "10px 14px", fontSize: "13.5px", lineHeight: "1.5" }}>
                    {m.t}
                  </div>
                </>
              ) : null}
            </Fragment>
          ))}
          {v.aiBusy ? (
            <>
              <div style={{ alignSelf: "flex-start", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "11px 14px", fontSize: "13px", color: "#6E6A7C", animation: "tmPulse 1s infinite" }}>
                Reading company data…
              </div>
            </>
          ) : null}
        </div>
        <div style={{ padding: "12px 16px", display: "flex", gap: "6px", flexWrap: "wrap", borderTop: "1px solid #E8E4EF" }}>
          {(v.aiSugs || []).map((g, _i0) => (
            <Fragment key={_i0}>
              <button onClick={g.on} style={{ height: "30px", padding: "0 11px", border: "1px solid #E4D6B3", background: "#FBF6EA", color: "#8A6414", borderRadius: "15px", fontSize: "12px", fontWeight: "600" }}>
                {g.t}
              </button>
            </Fragment>
          ))}
        </div>
        <div style={{ padding: "0 16px 16px", display: "flex", gap: "8px" }}>
          <input className="tm-f13" value={v.aiQ ?? ''} onChange={v.onAiQ} onKeyDown={v.aiKey} placeholder="Ask anything about the business…" style={{ flex: "1", height: "46px", border: "1px solid #E8E4EF", borderRadius: "12px", padding: "0 14px", fontSize: "14px", outline: "none", minWidth: "0" }} />
          <button onClick={v.aiSend} style={{ width: "46px", height: "46px", border: "none", borderRadius: "12px", background: "#6D3CC2", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={v.ic.send} />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
