// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function ReceptionPage({ v }) {
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
          OFFICE FRONT · RECEPTION
        </span>
        <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
          Front desk
        </h1>
        <span style={{ fontSize: "13px", color: "#6E6A7C" }}>
          Visitors and deliveries at the Trinity Mark office
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
        <div style={{ flex: "1.3 1 360px", minWidth: "0", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E8E4EF" }}>
            <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
              Visitor log
            </h3>
          </div>
          {(v.RC.visitors || []).map((item, _i0) => (
            <Fragment key={_i0}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px", borderBottom: "1px solid #F1EEF6", fontSize: "13px", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 180px", display: "flex", flexDirection: "column", gap: "2px" }}>
                  <b style={{ fontWeight: "600" }}>
                    {item.name}
                  </b>
                  <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
                    <span>{item.co}</span>{" · "}<span>{item.purpose}</span>{" · to see "}<span>{item.host}</span>
                  </span>
                </div>
                <span style={{ font: "500 11.5px 'IBM Plex Mono',monospace", color: "#6E6A7C" }}>
                  {item.time}
                </span>
                <span style={{ fontSize: "10.5px", fontWeight: "700", padding: "3px 7px", borderRadius: "6px", background: item.stbg, color: item.stfg }}>
                  {item.stl}
                </span>
                {item.canOut ? (
                  <>
                    <button className="tm-h3" onClick={item.checkout} style={{ height: "32px", padding: "0 12px", border: "1px solid #E8E4EF", background: "#fff", borderRadius: "8px", fontSize: "12px", fontWeight: "600" }}>
                      Check out
                    </button>
                  </>
                ) : null}
              </div>
            </Fragment>
          ))}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", padding: "14px 20px", background: "#FAF9FC" }}>
            <input className="tm-f13" value={v.NV.name ?? ''} onChange={v.NV.onName} placeholder="Visitor name" style={{ flex: "1 1 130px", height: "38px", border: "1px solid #E8E4EF", borderRadius: "8px", padding: "0 10px", fontSize: "13px", outline: "none", minWidth: "0" }} />
            {' '}
            <input className="tm-f13" value={v.NV.co ?? ''} onChange={v.NV.onCo} placeholder="Company" style={{ flex: "1 1 110px", height: "38px", border: "1px solid #E8E4EF", borderRadius: "8px", padding: "0 10px", fontSize: "13px", outline: "none", minWidth: "0" }} />
            {' '}
            <input className="tm-f13" value={v.NV.purpose ?? ''} onChange={v.NV.onPurpose} placeholder="Purpose" style={{ flex: "1 1 130px", height: "38px", border: "1px solid #E8E4EF", borderRadius: "8px", padding: "0 10px", fontSize: "13px", outline: "none", minWidth: "0" }} />
            {' '}
            <select value={v.NV.host ?? ''} onChange={v.NV.onHost} style={{ height: "38px", border: "1px solid #E8E4EF", borderRadius: "8px", padding: "0 8px", fontSize: "13px", background: "#fff" }}>
              {(v.people || []).map((o, _i0) => (
                <Fragment key={_i0}>
                  <option value={o.v ?? ''}>
                    {o.l}
                  </option>
                </Fragment>
              ))}
            </select>
            {' '}
            <button className="tm-h9" onClick={v.NV.add} style={{ height: "38px", padding: "0 14px", border: "none", borderRadius: "8px", background: "#6D3CC2", color: "#fff", fontSize: "12.5px", fontWeight: "700" }}>
              Check in
            </button>
          </div>
        </div>
        <div style={{ flex: "1 1 280px", minWidth: "0", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E8E4EF" }}>
            <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
              Deliveries
            </h3>
          </div>
          {(v.RC.deliveries || []).map((d, _i0) => (
            <Fragment key={_i0}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px", borderBottom: "1px solid #F1EEF6", fontSize: "13px" }}>
                <span style={{ width: "32px", height: "32px", borderRadius: "9px", background: "#F4F1FA", color: "#6D3CC2", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.ic.truck} />
                  </svg>
                </span>
                <div style={{ flex: "1", minWidth: "0", display: "flex", flexDirection: "column", gap: "2px" }}>
                  <b style={{ fontWeight: "600" }}>
                    {d.from}
                  </b>
                  <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
                    <span>{d.items}</span>{" · "}<span>{d.time}</span>
                  </span>
                </div>
                {d.canArrive ? (
                  <>
                    <button onClick={d.arrive} style={{ height: "32px", padding: "0 12px", border: "none", borderRadius: "8px", background: "#2B1459", color: "#fff", fontSize: "12px", fontWeight: "600" }}>
                      Mark arrived
                    </button>
                  </>
                ) : null}
                {d.arrived ? (
                  <>
                    <span style={{ fontSize: "10.5px", fontWeight: "700", padding: "3px 7px", borderRadius: "6px", background: "#E6F4EC", color: "#1F7549" }}>
                      Arrived
                    </span>
                  </>
                ) : null}
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </>
  );
}
