// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function RoomsPage({ v }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
            FRONT OFFICE
          </span>
          <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
            Meeting rooms · today
          </h1>
          <span style={{ fontSize: "13px", color: "#6E6A7C" }}>
            {"Tap a free slot to book it · tap your own booking to cancel · "}<span>{v.roomsFree}</span>
          </span>
        </div>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "700", color: "#6E6A7C", letterSpacing: ".04em" }}>
          MEETING TITLE
          <input className="tm-f13" value={v.roomTitle ?? ''} onChange={v.onRoomTitle} style={{ height: "40px", width: "min(280px,80vw)", border: "1px solid #E8E4EF", borderRadius: "10px", padding: "0 12px", fontSize: "13.5px", outline: "none", background: "#fff", color: "#17152A", fontWeight: "500" }} />
        </label>
      </div>
      <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: "1040px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "grid", gridTemplateColumns: "170px repeat(9,minmax(0,1fr))", gap: "6px", padding: "12px 16px", background: "#FAF9FC", borderBottom: "1px solid #E8E4EF", font: "600 11px 'IBM Plex Mono',monospace", color: "#6E6A7C" }}>
              <span>
                ROOM
              </span>
              {(v.hours || []).map((hh, _i0) => (
                <Fragment key={_i0}>
                  <span>
                    {hh}
                  </span>
                </Fragment>
              ))}
            </div>
            {(v.roomRows || []).map((rm, _i0) => (
              <Fragment key={_i0}>
                <div style={{ display: "grid", gridTemplateColumns: "170px repeat(9,minmax(0,1fr))", gap: "6px", padding: "10px 16px", borderBottom: "1px solid #F1EEF6" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ width: "34px", height: "34px", borderRadius: "9px", background: "#F4F1FA", color: "#6D3CC2", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d={v.ic.calendar} />
                      </svg>
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <b style={{ fontSize: "13.5px" }}>
                        {rm.n}
                      </b>
                      <span style={{ fontSize: "11.5px", color: "#6E6A7C" }}>
                        {rm.cap}
                      </span>
                    </div>
                  </div>
                  {(rm.cells || []).map((c, _i1) => (
                    <Fragment key={_i1}>
                      <div className="tm-h16" onClick={c.on} style={{ minHeight: "60px", border: `1px solid ${c.bd}`, background: c.bg, borderRadius: "9px", padding: "7px 8px", cursor: "pointer", display: "flex", flexDirection: "column", gap: "3px", justifyContent: "center", transition: "border-color .15s" }}>
                        {c.booked ? (
                          <>
                            <span style={{ fontSize: "11px", fontWeight: "700", lineHeight: "1.3", color: "#2B1459" }}>
                              {c.label}
                            </span>
                            <span style={{ fontSize: "10.5px", color: "#6E6A7C" }}>
                              {c.who}
                            </span>
                          </>
                        ) : null}
                        {c.free ? (
                          <>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#A9A3B8", fontWeight: "600" }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d={v.ic.plus} />
                              </svg>
                              Free
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
        </div>
      </div>
    </>
  );
}
