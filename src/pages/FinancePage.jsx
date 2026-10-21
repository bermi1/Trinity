// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function FinancePage({ v }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
            COMMERCIAL
          </span>
          <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
            Finance
          </h1>
        </div>
        <button className="tm-h9" onClick={v.newInvoice} style={{ height: "40px", padding: "0 16px", border: "none", background: "#6D3CC2", color: "#fff", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={v.ic.plus} />
          </svg>
          New invoice
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: "14px" }}>
        {(v.finKpis || []).map((k, _i0) => (
          <Fragment key={_i0}>
            <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "18px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#6E6A7C", letterSpacing: ".06em", textTransform: "uppercase" }}>
                {k.l}
              </span>
              <b style={{ fontSize: "26px", letterSpacing: "-.02em" }}>
                {k.v}
              </b>
              <span style={{ fontSize: "12px", fontWeight: "600", color: k.c }}>
                {k.n}
              </span>
            </div>
          </Fragment>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
        <div style={{ flex: "2 1 520px", minWidth: "0", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
              Monthly net profit
            </h3>
            <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
              TZS millions · last 12 months
            </span>
          </div>
          <div style={{ height: "230px", display: "flex", alignItems: "flex-end", gap: "clamp(4px,1vw,12px)", borderBottom: "1px solid #E8E4EF", paddingTop: "20px" }}>
            {(v.netBars || []).map((b, _i0) => (
              <Fragment key={_i0}>
                <div className="tm-h15" style={{ flex: "1", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: "6px" }}>
                  <span style={{ font: "600 10.5px 'IBM Plex Mono',monospace", color: "#6E6A7C" }}>
                    {b.v}
                  </span>
                  <div style={{ width: "100%", maxWidth: "38px", height: b.h, background: b.c, borderRadius: "6px 6px 2px 2px", transition: "height .4s" }} />
                </div>
              </Fragment>
            ))}
          </div>
          <div style={{ display: "flex", gap: "clamp(4px,1vw,12px)" }}>
            {(v.netBars || []).map((b, _i0) => (
              <Fragment key={_i0}>
                <span style={{ flex: "1", textAlign: "center", font: "500 10.5px 'IBM Plex Mono',monospace", color: "#6E6A7C" }}>
                  {b.l}
                </span>
              </Fragment>
            ))}
          </div>
        </div>
        <div style={{ flex: "1 1 300px", minWidth: "0", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
              Receivables aging
            </h3>
            {(v.aging || []).map((a, _i0) => (
              <Fragment key={_i0}>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                    <span style={{ color: "#6E6A7C" }}>
                      {a.l}
                    </span>
                    <b>
                      {a.v}
                    </b>
                  </div>
                  <div style={{ height: "8px", borderRadius: "4px", background: "#F1EEF6", overflow: "hidden" }}>
                    <div style={{ width: a.w, height: "100%", background: a.c, borderRadius: "4px", transition: "width .4s" }} />
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
          <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
                Where money went
              </h3>
              <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
                September
              </span>
            </div>
            <div style={{ display: "flex", height: "12px", borderRadius: "6px", overflow: "hidden", gap: "2px" }}>
              {(v.expCats || []).map((e, _i0) => (
                <Fragment key={_i0}>
                  <span style={{ width: e.w, background: e.c }} />
                </Fragment>
              ))}
            </div>
            {(v.expCats || []).map((e, _i0) => (
              <Fragment key={_i0}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12.5px" }}>
                  <span style={{ width: "9px", height: "9px", borderRadius: "3px", background: e.c }} />
                  <span style={{ flex: "1" }}>
                    {e.l}
                  </span>
                  <span style={{ color: "#6E6A7C", width: "36px", textAlign: "right" }}>
                    {e.p}
                  </span>
                  <b style={{ width: "84px", textAlign: "right" }}>
                    {e.v}
                  </b>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
      <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: "820px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
              <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
                Invoices
              </h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "110px minmax(0,1.2fr) minmax(0,1.3fr) 110px 120px 100px 130px", gap: "14px", padding: "10px 20px", background: "#FAF9FC", borderTop: "1px solid #E8E4EF", borderBottom: "1px solid #E8E4EF", fontSize: "11px", fontWeight: "700", letterSpacing: ".06em", textTransform: "uppercase", color: "#6E6A7C" }}>
              <span>
                Invoice
              </span>
              <span>
                Client
              </span>
              <span>
                Project
              </span>
              <span>
                Amount
              </span>
              <span>
                Due
              </span>
              <span>
                Status
              </span>
              <span />
            </div>
            {(v.invRows || []).map((i, _i0) => (
              <Fragment key={_i0}>
                <div style={{ display: "grid", gridTemplateColumns: "110px minmax(0,1.2fr) minmax(0,1.3fr) 110px 120px 100px 130px", gap: "14px", padding: "12px 20px", borderBottom: "1px solid #F1EEF6", fontSize: "13px", alignItems: "center" }}>
                  <span style={{ font: "600 12px 'IBM Plex Mono',monospace" }}>
                    {i.id}
                  </span>
                  <b style={{ fontWeight: "600" }}>
                    {i.c}
                  </b>
                  <span style={{ color: "#6E6A7C" }}>
                    {i.proj}
                  </span>
                  <b>
                    {i.v}
                  </b>
                  <span>
                    {i.due}
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "6px", background: i.stbg, color: i.stfg, width: "fit-content" }}>
                    {i.stl}
                  </span>
                  <span style={{ display: "flex", justifyContent: "flex-end" }}>
                    {i.canPay ? (
                      <>
                        <button onClick={i.pay} style={{ height: "30px", padding: "0 12px", border: "1px solid #BFE3CE", background: "#E6F4EC", color: "#1F7549", borderRadius: "7px", fontSize: "12px", fontWeight: "700" }}>
                          Mark paid
                        </button>
                      </>
                    ) : null}
                    {i.canSend ? (
                      <>
                        <button onClick={i.send} style={{ height: "30px", padding: "0 12px", border: "none", background: "#2B1459", color: "#fff", borderRadius: "7px", fontSize: "12px", fontWeight: "700" }}>
                          Send
                        </button>
                      </>
                    ) : null}
                  </span>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
