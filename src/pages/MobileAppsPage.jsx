// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function MobileAppsPage({ v }) {
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "0" }}>
        <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
          MOBILE
        </span>
        <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
          Mobile apps
        </h1>
        <span style={{ fontSize: "13px", color: "#6E6A7C", textWrap: "pretty" }}>
          The complete Trinity Mark 360 system on a phone — every module, same data, synced live with this desktop
        </span>
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {(v.devTabs || []).map((c, _i0) => (
          <Fragment key={_i0}>
            <button onClick={c.on} style={{ height: "34px", padding: "0 14px", borderRadius: "17px", border: `1px solid ${c.bd}`, background: c.bg, color: c.c, fontSize: "12.5px", fontWeight: "600" }}>
              {c.l}
            </button>
          </Fragment>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "28px", alignItems: "flex-start", justifyContent: "center" }}>
        <div style={{ flex: "none", width: "390px", maxWidth: "100%", height: "844px", borderRadius: "54px", background: "#17152A", padding: "12px", boxShadow: "0 30px 70px rgba(29,16,61,.3)" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "42px", overflow: "hidden", background: "#fff", display: "flex", flexDirection: "column" }}>
            <div style={{ flex: "none", height: "46px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", fontSize: "13.5px", fontWeight: "700", background: "#fff", color: "#17152A" }}>
              <span>
                {v.clock}
              </span>
              <span style={{ width: "100px", height: "28px", borderRadius: "15px", background: "#17152A" }} />
              <span style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <svg width="17" height="11" viewBox="0 0 17 11" fill="#17152A">
                  <rect x="0" y="7" width="3" height="4" rx="1" />
                  <rect x="4.5" y="5" width="3" height="6" rx="1" />
                  <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
                  <rect x="13.5" y="0" width="3" height="11" rx="1" />
                </svg>
                <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
                  <rect x=".5" y=".5" width="20" height="11" rx="3" stroke="#17152A" opacity=".5" />
                  <rect x="2" y="2" width="15" height="8" rx="1.8" fill="#17152A" />
                  <rect x="21.5" y="4" width="2" height="4" rx="1" fill="#17152A" opacity=".5" />
                </svg>
              </span>
            </div>
            <iframe src={v.devSrc} title="Trinity Mark 360 mobile app" style={{ flex: "1", width: "100%", border: "none", display: "block", background: "#F4F1FA" }} />
          </div>
        </div>
        <div style={{ flex: "1 1 300px", minWidth: "0", maxWidth: "520px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "22px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".14em", color: "#8A7239" }}>
              LIVE APP
            </span>
            <h2 style={{ margin: "0", fontSize: "22px", fontWeight: "700", letterSpacing: "-.01em" }}>
              {v.dev.title}
            </h2>
            <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.6", textWrap: "pretty" }}>
              {v.dev.d}
            </p>
          </div>
          <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <b style={{ fontSize: "13px" }}>
              Bottom navigation
            </b>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {(v.dev.tabs || []).map((t, _i0) => (
                <Fragment key={_i0}>
                  <span style={{ fontSize: "12px", fontWeight: "600", padding: "6px 11px", borderRadius: "8px", background: "#2B1459", color: "#fff" }}>
                    {t.l}
                  </span>
                </Fragment>
              ))}
            </div>
            <b style={{ fontSize: "13px", paddingTop: "6px" }}>
              Inside More
            </b>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {(v.dev.more || []).map((t, _i0) => (
                <Fragment key={_i0}>
                  <span style={{ fontSize: "12px", fontWeight: "600", padding: "6px 11px", borderRadius: "8px", background: "#F4F1FA", color: "#2B1459" }}>
                    {t.l}
                  </span>
                </Fragment>
              ))}
            </div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", lineHeight: "1.5" }}>
            <b style={{ fontSize: "13px" }}>
              Try it
            </b>
            <span>
              Approve a request or complete a task on the phone — the desktop behind it updates instantly.
            </span>
            <span>
              Tap More for every module, portal switching and Trinity AI.
            </span>
            <span>
              On a real phone the same layout runs full screen and can be added to the home screen.
            </span>
            <a href={v.devSrc} target="_blank" style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", paddingTop: "4px" }}>
              Open full screen
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={v.ic.arrowR} />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
