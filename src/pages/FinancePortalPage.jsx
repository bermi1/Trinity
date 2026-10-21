// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function FinancePortalPage({ v }) {
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
          FINANCE PORTAL
        </span>
        <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
          {v.FP.title}
        </h1>
        <span style={{ fontSize: "13px", color: "#6E6A7C" }}>
          Verify requests, chase invoices, watch open floats
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "14px" }}>
        {(v.FP.kpis || []).map((k, _i0) => (
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
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
        <div style={{ flex: "1.3 1 340px", minWidth: "0", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E8E4EF" }}>
            <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
              Requests awaiting finance verification
            </h3>
          </div>
          {(v.FP.reqs || []).map((r, _i0) => (
            <Fragment key={_i0}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 20px", borderBottom: "1px solid #F1EEF6", fontSize: "13px", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 180px", display: "flex", flexDirection: "column", gap: "2px" }}>
                  <b style={{ fontWeight: "600" }}>
                    <span>{r.who}</span>{" · "}<span>{r.amt}</span>
                  </b>
                  <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
                    <span>{r.cat}</span>{" · "}<span>{r.proj}</span>
                  </span>
                </div>
                <button className="tm-h2" onClick={r.verify} style={{ height: "34px", padding: "0 14px", border: "none", borderRadius: "8px", background: "#2B1459", color: "#fff", fontSize: "12.5px", fontWeight: "600" }}>
                  Verify & send to Management
                </button>
              </div>
            </Fragment>
          ))}
          {v.FP.reqsEmpty ? (
            <>
              <div style={{ padding: "30px", textAlign: "center", color: "#6E6A7C", fontSize: "13px" }}>
                Nothing waiting on Finance.
              </div>
            </>
          ) : null}
        </div>
        <div style={{ flex: "1 1 280px", minWidth: "0", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
            Overdue invoices
          </h3>
          {(v.FP.overdue || []).map((i, _i0) => (
            <Fragment key={_i0}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", padding: "9px 0", borderTop: "1px solid #F1EEF6", fontSize: "13px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <b style={{ fontWeight: "600" }}>
                    {i.c}
                  </b>
                  <span style={{ fontSize: "11.5px", color: "#6E6A7C" }}>
                    <span>{i.id}</span>{" · "}<span>{i.due}</span>
                  </span>
                </div>
                <b>
                  {i.v}
                </b>
              </div>
            </Fragment>
          ))}
          {v.FP.overdueEmpty ? (
            <>
              <span style={{ fontSize: "12.5px", color: "#6E6A7C" }}>
                No overdue invoices.
              </span>
            </>
          ) : null}
        </div>
      </div>
      <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
          Open floats to reconcile
        </h3>
        {(v.FP.floats || []).map((f, _i0) => (
          <Fragment key={_i0}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "10px 0", borderTop: "1px solid #F1EEF6", fontSize: "13px", flexWrap: "wrap" }}>
              <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: f.c, color: "#fff", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {f.i}
              </span>
              <div style={{ flex: "1 1 140px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <b style={{ fontWeight: "600" }}>
                  {f.n}
                </b>
                <span style={{ fontSize: "11.5px", color: "#6E6A7C" }}>
                  {"open "}<span>{f.age}</span>
                </span>
              </div>
              <b style={{ width: "120px" }}>
                {f.amt}
              </b>
              <button className="tm-h3" onClick={f.rec} style={{ height: "32px", padding: "0 12px", border: "1px solid #E8E4EF", background: "#fff", borderRadius: "8px", fontSize: "12px", fontWeight: "600" }}>
                Reconcile
              </button>
            </div>
          </Fragment>
        ))}
      </div>
    </>
  );
}
