// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function Sidebar({ v }) {
  return (
    <>
      <aside style={{ width: "252px", flex: "none", background: "#2B1459", position: v.sb.pos, zIndex: v.sb.z, left: "0", top: "0", height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column", padding: "20px 14px 16px", gap: "20px" }}>
        <div onClick={v.goHome} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "2px 8px", cursor: "pointer" }}>
          <svg width="28" height="32" viewBox="138 118 176 196" fill="none" stroke="#B49A5A" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round">
            <path d="M153 130 V186 Q153 214 182 214 H274 Q304 214 284 240 L214 298 Q205 306 196 298 L168 248" />
            <path d="M201 158 H266" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <span style={{ color: "#B49A5A", fontWeight: "700", fontSize: "12.5px", letterSpacing: ".24em" }}>
              TRINITY MARK
            </span>
            <span style={{ color: "rgba(255,255,255,.55)", font: "500 10px 'IBM Plex Mono',monospace", letterSpacing: ".3em" }}>
              {"360 · "}<span>{v.me.label}</span>
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: "1" }}>
          {(v.nav || []).map((g, _i0) => (
            <Fragment key={_i0}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(255,255,255,.38)", padding: "0 10px 6px" }}>
                  {g.t}
                </div>
                {(g.items || []).map((it, _i1) => (
                  <Fragment key={_i1}>
                    <div className="tm-h4" onClick={it.go} style={{ display: "flex", alignItems: "center", gap: "11px", height: "34px", padding: "0 10px", borderRadius: "8px", background: it.bg, color: it.c, fontSize: "13px", fontWeight: it.fw, cursor: "pointer" }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={it.icc} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d={it.ic} />
                      </svg>
                      <span style={{ flex: "1" }}>
                        {it.l}
                      </span>
                      {it.hb ? (
                        <>
                          <span style={{ fontSize: "10.5px", fontWeight: "700", minWidth: "20px", textAlign: "center", padding: "2px 6px", borderRadius: "10px", background: "rgba(180,154,90,.22)", color: "#E2CE98" }}>
                            {it.b}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </Fragment>
                ))}
              </div>
            </Fragment>
          ))}
        </div>
        <div className="tm-h5" onClick={v.openAI} style={{ border: "1px solid rgba(180,154,90,.35)", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", gap: "8px", background: "rgba(29,16,61,.55)", cursor: "pointer" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px", color: "#E2CE98", fontSize: "11px", fontWeight: "700", letterSpacing: ".14em" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={v.ic.sparkle} />
            </svg>
            TRINITY INTELLIGENCE
          </span>
          {' '}
          <span style={{ color: "rgba(255,255,255,.8)", fontSize: "12.5px", lineHeight: "1.45" }}>
            Ask about projects, money, people or stock.
          </span>
        </div>
      </aside>
    </>
  );
}
