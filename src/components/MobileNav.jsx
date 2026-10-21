// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function MobileNav({ v }) {
  return (
    <>
      {v.moreOpen ? (
        <>
          <div onClick={v.closeMore} style={{ position: "fixed", inset: "0", zIndex: "44", background: "rgba(23,21,42,.45)" }} />
          <div style={{ position: "fixed", left: "0", right: "0", bottom: "0", zIndex: "45", background: "#fff", borderRadius: "22px 22px 0 0", maxHeight: "80vh", overflowY: "auto", padding: "10px 16px 96px", display: "flex", flexDirection: "column", gap: "14px", animation: "tmIn .2s ease", boxShadow: "0 -12px 40px rgba(29,16,61,.2)" }}>
            <span style={{ alignSelf: "center", width: "40px", height: "4px", borderRadius: "2px", background: "#D5CFE0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <b style={{ fontSize: "17px" }}>
                All modules
              </b>
              <span style={{ font: "600 10px 'IBM Plex Mono',monospace", letterSpacing: ".14em", color: "#8A7239" }}>
                {"360 · "}<span>{v.me.label}</span>
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "8px" }}>
              {(v.moreItems || []).map((m, _i0) => (
                <Fragment key={_i0}>
                  <button onClick={m.on} style={{ position: "relative", minHeight: "86px", border: `1px solid ${m.bd}`, background: m.bg, borderRadius: "14px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 6px", fontSize: "11.5px", fontWeight: "600", textAlign: "center", lineHeight: "1.25", color: "#17152A" }}>
                    <span style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#F4F1FA", color: "#6D3CC2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d={m.ic} />
                      </svg>
                    </span>
                    <span>{m.l}</span>
                    {m.hb ? (
                      <>
                        <span style={{ position: "absolute", top: "8px", right: "8px", minWidth: "18px", height: "18px", padding: "0 5px", borderRadius: "9px", background: "#D9535F", color: "#fff", fontSize: "10px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {m.b}
                        </span>
                      </>
                    ) : null}
                  </button>
                </Fragment>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".08em", color: "#6E6A7C" }}>
                SWITCH PORTAL
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {(v.portalChips || []).map((pc, _i0) => (
                  <Fragment key={_i0}>
                    <button onClick={pc.on} style={{ height: "38px", padding: "0 14px", borderRadius: "19px", border: `1px solid ${pc.bd}`, background: pc.bg, color: pc.c, fontSize: "12.5px", fontWeight: "600" }}>
                      {pc.l}
                    </button>
                  </Fragment>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <button onClick={v.openAI} style={{ height: "46px", border: "1px solid #E4D6B3", background: "#FBF6EA", color: "#8A6414", borderRadius: "12px", fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={v.ic.sparkle} />
                </svg>
                Trinity AI
              </button>
              <button onClick={v.signOut} style={{ height: "46px", border: "1px solid #F0C9CD", background: "#fff", color: "#B23A46", borderRadius: "12px", fontSize: "13px", fontWeight: "700" }}>
                Sign out
              </button>
            </div>
          </div>
        </>
      ) : null}
      <nav style={{ position: "fixed", left: "0", right: "0", bottom: "0", zIndex: "46", height: "74px", background: "rgba(255,255,255,.97)", backdropFilter: "blur(8px)", borderTop: "1px solid #E8E4EF", display: "grid", gridTemplateColumns: "repeat(5,1fr)", padding: "0 4px 10px" }}>
        {(v.mobileTabs || []).map((t, _i0) => (
          <Fragment key={_i0}>
            <button onClick={t.on} style={{ position: "relative", border: "none", background: "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: "4px", color: t.c, fontSize: "10.5px", fontWeight: t.fw, padding: "0", minHeight: "44px" }}>
              <span style={{ width: "26px", height: "3px", borderRadius: "2px", background: t.bar, marginBottom: "6px" }} />
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={t.ic} />
              </svg>
              <span>{t.l}</span>
              {t.hb ? (
                <>
                  <span style={{ position: "absolute", top: "8px", left: "calc(50% + 5px)", minWidth: "17px", height: "17px", padding: "0 4px", borderRadius: "9px", background: "#D9535F", color: "#fff", fontSize: "10px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>
                    {t.b}
                  </span>
                </>
              ) : null}
            </button>
          </Fragment>
        ))}
      </nav>
    </>
  );
}
