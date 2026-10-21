// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function LogisticsPage({ v }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "0" }}>
          <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
            OPERATIONS
          </span>
          <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
            Logistics
          </h1>
          <span style={{ fontSize: "13px", color: "#6E6A7C", textWrap: "pretty" }}>
            Vehicles, drivers and every trip — each linked to its project
          </span>
        </div>
        <button className="tm-h9" onClick={v.newTrip} style={{ height: "40px", padding: "0 16px", border: "none", background: "#6D3CC2", color: "#fff", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", flex: "none" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={v.ic.plus} />
          </svg>
          Schedule trip
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "14px" }}>
        {(v.vehRows || []).map((item, _i0) => (
          <Fragment key={_i0}>
            <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "16px 18px", display: "flex", gap: "12px", alignItems: "center" }}>
              <span style={{ width: "42px", height: "42px", borderRadius: "11px", background: "#F4F1FA", color: "#6D3CC2", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={v.ic.truck} />
                </svg>
              </span>
              <div style={{ flex: "1", minWidth: "0", display: "flex", flexDirection: "column", gap: "3px" }}>
                <b style={{ font: "700 13.5px 'IBM Plex Mono',monospace" }}>
                  {item.reg}
                </b>
                <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
                  {item.type}
                </span>
                <span style={{ fontSize: "10.5px", fontWeight: "700", padding: "2px 7px", borderRadius: "5px", background: item.stbg, color: item.stfg, width: "fit-content" }}>
                  {item.stl}
                </span>
              </div>
            </div>
          </Fragment>
        ))}
      </div>
      <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E8E4EF" }}>
          <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
            Trips
          </h3>
        </div>
        {(v.tripRows || []).map((t, _i0) => (
          <Fragment key={_i0}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 20px", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #F1EEF6" }}>
              <div style={{ flex: "1 1 220px", minWidth: "0", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ font: "600 11px 'IBM Plex Mono',monospace", color: "#6E6A7C" }}>
                    {t.id}
                  </span>
                  <span style={{ fontSize: "11.5px", fontWeight: "600", color: "#6D3CC2" }}>
                    {t.client}
                  </span>
                </div>
                <b style={{ fontSize: "13.5px", fontWeight: "600" }}>
                  {t.what}
                </b>
                <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#6E6A7C" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.ic.mapPin} />
                  </svg>
                  <span>{t.to}</span>{" · "}<span>{t.veh}</span>
                </span>
              </div>
              <div style={{ flex: "1 1 180px", minWidth: "0", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", gap: "3px" }}>
                  {(t.steps || []).map((g, _i1) => (
                    <Fragment key={_i1}>
                      <span style={{ flex: "1", height: "5px", borderRadius: "3px", background: g.c }} />
                    </Fragment>
                  ))}
                </div>
                <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#5A2FA8" }}>
                  <span>{t.stage}</span>{" · "}<span>{t.date}</span>
                </span>
              </div>
              {t.canAdv ? (
                <>
                  <button className="tm-h2" onClick={t.adv} style={{ height: "34px", padding: "0 12px", border: "none", borderRadius: "8px", background: "#2B1459", color: "#fff", fontSize: "12.5px", fontWeight: "600", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}>
                    {t.advL}
                  </button>
                </>
              ) : null}
            </div>
          </Fragment>
        ))}
      </div>
    </>
  );
}
