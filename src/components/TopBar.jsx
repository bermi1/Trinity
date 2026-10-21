// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.

export default function TopBar({ v }) {
  return (
    <>
      <header style={{ position: "sticky", top: "0", zIndex: "20", display: "flex", alignItems: "center", gap: "12px", height: "64px", padding: "0 clamp(14px,2.4vw,32px)", borderBottom: "1px solid #E8E4EF", background: "rgba(255,255,255,.94)", backdropFilter: "blur(8px)" }}>
        {v.tabletNav ? (
          <>
            <button onClick={v.openDrawer} style={{ width: "40px", height: "40px", border: "1px solid #E8E4EF", borderRadius: "10px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={v.ic.menu} />
              </svg>
            </button>
          </>
        ) : null}
        {v.phone ? (
          <>
            <div onClick={v.goHome} style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "0", flex: "1", cursor: "pointer" }}>
              <svg width="22" height="25" viewBox="138 118 176 196" fill="none" stroke="#B49A5A" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
                <path d="M153 130 V186 Q153 214 182 214 H274 Q304 214 284 240 L214 298 Q205 306 196 298 L168 248" />
                <path d="M201 158 H266" />
              </svg>
              <div style={{ display: "flex", flexDirection: "column", minWidth: "0", lineHeight: "1.2" }}>
                <b style={{ fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {v.pageTitle}
                </b>
                <span style={{ font: "600 9.5px 'IBM Plex Mono',monospace", letterSpacing: ".14em", color: "#8A7239" }}>
                  {"360 · "}<span>{v.me.label}</span>
                </span>
              </div>
            </div>
            <button onClick={v.openCmd} title="Search" style={{ width: "40px", height: "40px", border: "1px solid #E8E4EF", borderRadius: "10px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={v.ic.search} />
              </svg>
            </button>
          </>
        ) : null}
        {v.notPhone ? (
          <>
            <div className="tm-h6" onClick={v.openCmd} style={{ flex: "1", maxWidth: "480px", height: "40px", border: "1px solid #E8E4EF", borderRadius: "10px", background: "#F4F1FA", display: "flex", alignItems: "center", gap: "10px", padding: "0 12px", color: "#6E6A7C", fontSize: "13px", cursor: "text", minWidth: "0" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
                <path d={v.ic.search} />
              </svg>
              <span style={{ flex: "1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Search or run a command…
              </span>
              <span style={{ font: "500 11px 'IBM Plex Mono',monospace", border: "1px solid #E8E4EF", background: "#fff", borderRadius: "5px", padding: "2px 6px", flex: "none" }}>
                Ctrl K
              </span>
            </div>
            <div style={{ flex: "1" }} />
          </>
        ) : null}
        {v.wide ? (
          <>
            <span style={{ font: "600 10.5px 'IBM Plex Mono',monospace", letterSpacing: ".08em", padding: "4px 8px", borderRadius: "6px", background: "#F7EFDD", color: "#8A6414" }}>
              {v.dataBadge}
            </span>
            <span style={{ fontSize: "13px", color: "#6E6A7C", whiteSpace: "nowrap" }}>
              {v.dateLabel}
            </span>
          </>
        ) : null}
        <button className="tm-h7" onClick={v.openAI} title="Trinity Intelligence" style={{ width: "40px", height: "40px", border: "1px solid #E4D6B3", borderRadius: "10px", background: "#FBF6EA", color: "#8A6414", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={v.ic.sparkle} />
          </svg>
        </button>
        {' '}
        <button className="tm-h3" onClick={v.goNotes} title="Notifications" style={{ position: "relative", width: "40px", height: "40px", border: "1px solid #E8E4EF", borderRadius: "10px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={v.ic.bell} />
          </svg>
          {v.hasUnread ? (
            <>
              <span style={{ position: "absolute", top: "-5px", right: "-5px", minWidth: "18px", height: "18px", padding: "0 5px", borderRadius: "9px", background: "#D9535F", color: "#fff", fontSize: "10.5px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>
                {v.unread}
              </span>
            </>
          ) : null}
        </button>
        <div style={{ position: "relative", flex: "none" }}>
          <div className="tm-h3" onClick={v.toggleMenu} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "4px", borderRadius: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: v.me.c, color: "#fff", fontWeight: "700", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {v.me.i}
            </div>
            {v.wide ? (
              <>
                <div style={{ display: "flex", flexDirection: "column", lineHeight: "1.25" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700" }}>
                    {v.me.n}
                  </span>
                  <span style={{ fontSize: "11.5px", color: "#6E6A7C" }}>
                    {v.me.t}
                  </span>
                </div>
              </>
            ) : null}
          </div>
          {v.menu ? (
            <>
              <div style={{ position: "absolute", right: "0", top: "50px", width: "270px", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "12px", boxShadow: "0 12px 32px rgba(29,16,61,.14)", padding: "6px", display: "flex", flexDirection: "column", animation: "tmIn .15s ease" }}>
                <div style={{ padding: "10px 12px", fontSize: "11px", fontWeight: "700", letterSpacing: ".08em", color: "#6E6A7C" }}>
                  SWITCH PORTAL
                </div>
                <div className="tm-h3" onClick={v.asCeo} style={{ padding: "10px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", display: "flex", gap: "10px", alignItems: "center", cursor: "pointer" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6D3CC2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.ic.grid} />
                  </svg>
                  Management · Command Center
                </div>
                <div className="tm-h3" onClick={v.asCeoMobile} style={{ padding: "10px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", display: "flex", gap: "10px", alignItems: "center", cursor: "pointer" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6D3CC2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.ic.phone} />
                  </svg>
                  Mobile apps · phone preview
                </div>
                <div className="tm-h3" onClick={v.asStaffMobile} style={{ padding: "10px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", display: "flex", gap: "10px", alignItems: "center", cursor: "pointer" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6D3CC2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.ic.phone} />
                  </svg>
                  Field capture app
                </div>
                <div className="tm-h3" onClick={v.asStaff} style={{ padding: "10px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", display: "flex", gap: "10px", alignItems: "center", cursor: "pointer" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6D3CC2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.ic.user} />
                  </svg>
                  Staff portal
                </div>
                <div className="tm-h3" onClick={v.asFinance} style={{ padding: "10px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", display: "flex", gap: "10px", alignItems: "center", cursor: "pointer" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6D3CC2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.ic.banknote} />
                  </svg>
                  Finance portal
                </div>
                <div className="tm-h3" onClick={v.asReception} style={{ padding: "10px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", display: "flex", gap: "10px", alignItems: "center", cursor: "pointer" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6D3CC2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.ic.message} />
                  </svg>
                  Office front · Reception
                </div>
                <div className="tm-h3" onClick={v.asStore} style={{ padding: "10px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", display: "flex", gap: "10px", alignItems: "center", cursor: "pointer" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6D3CC2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.ic.package} />
                  </svg>
                  Storekeeper portal
                </div>
                <div style={{ height: "1px", background: "#E8E4EF", margin: "6px 0" }} />
                <div className="tm-h3" onClick={v.resetDemo} style={{ padding: "10px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", display: "flex", gap: "10px", alignItems: "center", cursor: "pointer" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6E6A7C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.ic.refresh} />
                  </svg>
                  Reset demo data
                </div>
                <div className="tm-h8" onClick={v.signOut} style={{ padding: "10px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", display: "flex", gap: "10px", alignItems: "center", cursor: "pointer", color: "#B23A46" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.ic.logout} />
                  </svg>
                  Sign out
                </div>
              </div>
            </>
          ) : null}
        </div>
      </header>
    </>
  );
}
