// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function StorePage({ v }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
            OPERATIONS
          </span>
          <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
            Store & inventory
          </h1>
        </div>
        <div style={{ height: "40px", width: "min(320px,100%)", border: "1px solid #E8E4EF", borderRadius: "10px", background: "#fff", display: "flex", alignItems: "center", gap: "8px", padding: "0 12px" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6E6A7C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={v.ic.search} />
          </svg>
          <input value={v.stockQ ?? ''} onChange={v.onStockQ} placeholder="Search items, SKU, category" style={{ flex: "1", border: "none", outline: "none", fontSize: "13px", minWidth: "0", background: "transparent" }} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "14px" }}>
        {(v.stockKpis || []).map((k, _i0) => (
          <Fragment key={_i0}>
            <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#6E6A7C", letterSpacing: ".06em", textTransform: "uppercase" }}>
                {k.l}
              </span>
              <b style={{ fontSize: "24px", color: k.vc }}>
                {k.v}
              </b>
              <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
                {k.n}
              </span>
            </div>
          </Fragment>
        ))}
      </div>
      <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: "920px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.6fr) 120px 170px 90px 70px 70px 230px", gap: "14px", padding: "12px 20px", background: "#FAF9FC", borderBottom: "1px solid #E8E4EF", fontSize: "11px", fontWeight: "700", letterSpacing: ".06em", textTransform: "uppercase", color: "#6E6A7C" }}>
              <span>
                Item
              </span>
              <span>
                Category
              </span>
              <span>
                In stock
              </span>
              <span>
                Minimum
              </span>
              <span>
                Bin
              </span>
              <span>
                Status
              </span>
              <span />
            </div>
            {(v.stockRows || []).map((i, _i0) => (
              <Fragment key={_i0}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.6fr) 120px 170px 90px 70px 70px 230px", gap: "14px", padding: "12px 20px", borderBottom: "1px solid #F1EEF6", fontSize: "13px", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: "0" }}>
                    <b style={{ fontWeight: "600" }}>
                      {i.n}
                    </b>
                    <span style={{ font: "500 11px 'IBM Plex Mono',monospace", color: "#6E6A7C" }}>
                      {i.sku}
                    </span>
                  </div>
                  <span style={{ color: "#6E6A7C" }}>
                    {i.cat}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <b>
                      {i.q}
                    </b>
                    <span style={{ height: "5px", borderRadius: "3px", background: "#F1EEF6", overflow: "hidden" }}>
                      <span style={{ display: "block", width: i.w, height: "100%", background: i.c }} />
                    </span>
                  </div>
                  <span style={{ color: "#6E6A7C" }}>
                    {i.min}
                  </span>
                  <span style={{ font: "500 12px 'IBM Plex Mono',monospace" }}>
                    {i.loc}
                  </span>
                  {' '}
                  <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "6px", background: i.stbg, color: i.stfg, width: "fit-content" }}>
                    {i.stl}
                  </span>
                  {' '}
                  <span style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                    {i.low ? (
                      <>
                        <button onClick={i.reorder} style={{ height: "30px", padding: "0 10px", border: "1px solid #F0C9CD", background: "#FBEDEE", color: "#B23A46", borderRadius: "7px", fontSize: "12px", fontWeight: "700" }}>
                          Reorder
                        </button>
                      </>
                    ) : null}
                    <button className="tm-h3" onClick={i.receive} style={{ height: "30px", padding: "0 10px", border: "1px solid #E8E4EF", background: "#fff", borderRadius: "7px", fontSize: "12px", fontWeight: "600" }}>
                      Receive
                    </button>
                    <button className="tm-h2" onClick={i.issue} style={{ height: "30px", padding: "0 10px", border: "none", background: "#2B1459", color: "#fff", borderRadius: "7px", fontSize: "12px", fontWeight: "600" }}>
                      Issue
                    </button>
                  </span>
                </div>
              </Fragment>
            ))}
            {v.stockEmpty ? (
              <>
                <div style={{ padding: "40px", textAlign: "center", color: "#6E6A7C", fontSize: "13px" }}>
                  No items match your search.
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
