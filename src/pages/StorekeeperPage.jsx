// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function StorekeeperPage({ v }) {
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
          STOREKEEPER PORTAL
        </span>
        <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
          Fatma's store
        </h1>
        <span style={{ fontSize: "13px", color: "#6E6A7C" }}>
          Low stock, issues and deliveries to receive
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "14px" }}>
        {(v.SK.kpis || []).map((k, _i0) => (
          <Fragment key={_i0}>
            <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#6E6A7C", letterSpacing: ".06em", textTransform: "uppercase" }}>
                {k.l}
              </span>
              <b style={{ fontSize: "24px", color: k.c }}>
                {k.v}
              </b>
            </div>
          </Fragment>
        ))}
      </div>
      <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E8E4EF" }}>
          <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
            Items below minimum
          </h3>
        </div>
        {(v.SK.low || []).map((i, _i0) => (
          <Fragment key={_i0}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 20px", borderBottom: "1px solid #F1EEF6", fontSize: "13px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 170px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <b style={{ fontWeight: "600" }}>
                  {i.n}
                </b>
                <span style={{ fontSize: "11.5px", color: "#6E6A7C" }}>
                  <span>{i.sku}</span>{" · "}<span>{i.loc}</span>
                </span>
              </div>
              <b style={{ color: "#B23A46", width: "90px" }}>
                {i.q}
              </b>
              <span style={{ fontSize: "12px", color: "#6E6A7C", width: "100px" }}>
                {"min "}<span>{i.min}</span>
              </span>
              <button onClick={i.reorder} style={{ height: "32px", padding: "0 12px", border: "1px solid #F0C9CD", background: "#FBEDEE", color: "#B23A46", borderRadius: "8px", fontSize: "12px", fontWeight: "700" }}>
                Reorder
              </button>
            </div>
          </Fragment>
        ))}
        {v.SK.lowEmpty ? (
          <>
            <div style={{ padding: "26px", textAlign: "center", color: "#6E6A7C", fontSize: "13px" }}>
              Nothing below minimum right now.
            </div>
          </>
        ) : null}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
        <div style={{ flex: "1.2 1 320px", minWidth: "0", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E8E4EF" }}>
            <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
              Deliveries to receive
            </h3>
          </div>
          {(v.SK.deliveries || []).map((d, _i0) => (
            <Fragment key={_i0}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px", borderBottom: "1px solid #F1EEF6", fontSize: "13px", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 150px", display: "flex", flexDirection: "column", gap: "2px" }}>
                  <b style={{ fontWeight: "600" }}>
                    {d.from}
                  </b>
                  <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
                    {d.items}
                  </span>
                </div>
                {d.canReceive ? (
                  <>
                    <button onClick={d.receive} style={{ height: "32px", padding: "0 12px", border: "none", borderRadius: "8px", background: "#2B1459", color: "#fff", fontSize: "12px", fontWeight: "600" }}>
                      Receive into store
                    </button>
                  </>
                ) : null}
                {d.received ? (
                  <>
                    <span style={{ fontSize: "10.5px", fontWeight: "700", padding: "3px 7px", borderRadius: "6px", background: "#E6F4EC", color: "#1F7549" }}>
                      Received
                    </span>
                  </>
                ) : null}
              </div>
            </Fragment>
          ))}
        </div>
        <div style={{ flex: "1 1 260px", minWidth: "0", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
            Quick issue
          </h3>
          {(v.SK.quick || []).map((i, _i0) => (
            <Fragment key={_i0}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", padding: "8px 0", borderTop: "1px solid #F1EEF6", fontSize: "13px" }}>
                <span style={{ flex: "1", minWidth: "0" }}>
                  {i.n}
                </span>
                <span style={{ color: "#6E6A7C", width: "60px" }}>
                  {i.q}
                </span>
                <button className="tm-h3" onClick={i.issue} style={{ height: "30px", padding: "0 10px", border: "1px solid #E8E4EF", background: "#fff", borderRadius: "7px", fontSize: "12px", fontWeight: "600" }}>
                  Issue
                </button>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </>
  );
}
