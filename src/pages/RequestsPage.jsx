// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function RequestsPage({ v }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
            MONEY
          </span>
          <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
            Requests & floats
          </h1>
        </div>
        <button className="tm-h9" onClick={v.newReq} style={{ height: "40px", padding: "0 16px", border: "none", background: "#6D3CC2", color: "#fff", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={v.ic.plus} />
          </svg>
          New request
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: "14px" }}>
        {(v.floatKpis || []).map((k, _i0) => (
          <Fragment key={_i0}>
            <div style={{ background: k.bg, border: `1px solid ${k.bd}`, borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "11.5px", fontWeight: "700", color: k.lc, letterSpacing: ".06em", textTransform: "uppercase" }}>
                {k.l}
              </span>
              <b style={{ fontSize: "24px", color: k.vc, letterSpacing: "-.01em" }}>
                {k.v}
              </b>
              <span style={{ fontSize: "12px", color: k.nc }}>
                {k.n}
              </span>
            </div>
          </Fragment>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 340px", minWidth: "0", maxWidth: "100%", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "10px", borderBottom: "1px solid #E8E4EF", display: "flex", gap: "2px", flexWrap: "wrap" }}>
            {(v.reqTabs || []).map((t, _i0) => (
              <Fragment key={_i0}>
                <button onClick={t.on} style={{ border: "none", padding: "7px 11px", borderRadius: "7px", background: t.bg, color: t.c, fontSize: "12px", fontWeight: "600" }}>
                  {t.l}
                </button>
              </Fragment>
            ))}
          </div>
          {(v.reqList || []).map((r, _i0) => (
            <Fragment key={_i0}>
              <div className="tm-h11" onClick={r.on} style={{ padding: "14px 16px", background: r.bg, borderLeft: `3px solid ${r.bd}`, display: "flex", flexDirection: "column", gap: "6px", borderBottom: "1px solid #F1EEF6", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                  <b style={{ fontSize: "13.5px" }}>
                    {r.name}
                  </b>
                  <b style={{ fontSize: "13.5px", whiteSpace: "nowrap" }}>
                    {r.amt}
                  </b>
                </div>
                <span style={{ fontSize: "12.5px", color: "#6E6A7C" }}>
                  {r.cat}
                </span>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <span style={{ font: "500 11px 'IBM Plex Mono',monospace", color: "#6E6A7C" }}>
                    <span>{r.id}</span>{" · "}<span>{r.need}</span>
                  </span>
                  <span style={{ fontSize: "10.5px", fontWeight: "700", padding: "2px 7px", borderRadius: "5px", background: r.stbg, color: r.stfg, whiteSpace: "nowrap" }}>
                    {r.stl}
                  </span>
                </div>
              </div>
            </Fragment>
          ))}
          {v.reqEmpty ? (
            <>
              <div style={{ padding: "40px 20px", textAlign: "center", display: "flex", flexDirection: "column", gap: "8px", alignItems: "center", color: "#6E6A7C", fontSize: "13px" }}>
                <span style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#E6F4EC", color: "#1F7549", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.ic.check} />
                  </svg>
                </span>
                All clear — nothing here.
              </div>
            </>
          ) : null}
        </div>
        {v.hasSel ? (
          <>
            <div style={{ flex: "2 1 560px", minWidth: "0", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", display: "flex", flexWrap: "wrap" }}>
              <div style={{ flex: "1.4 1 320px", minWidth: "0", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ font: "600 11.5px 'IBM Plex Mono',monospace", color: "#6E6A7C" }}>
                    <span>{v.R.id}</span>{" · "}<span>{v.R.cat}</span>
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <h2 style={{ margin: "0", fontSize: "30px", fontWeight: "700", letterSpacing: "-.02em" }}>
                      {v.R.amt}
                    </h2>
                    <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 9px", borderRadius: "6px", background: v.R.stbg, color: v.R.stfg }}>
                      {v.R.stl}
                    </span>
                  </div>
                  <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.6", maxWidth: "520px", textWrap: "pretty" }}>
                    {v.R.purpose}
                  </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "14px", fontSize: "13px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    <span style={{ fontSize: "11.5px", color: "#6E6A7C" }}>
                      Project
                    </span>
                    <a href="#" onClick={v.R.projGo} style={{ fontWeight: "600" }}>
                      {v.R.proj}
                    </a>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    <span style={{ fontSize: "11.5px", color: "#6E6A7C" }}>
                      Requested by
                    </span>
                    <b style={{ fontWeight: "600" }}>
                      {v.R.who}
                    </b>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    <span style={{ fontSize: "11.5px", color: "#6E6A7C" }}>
                      Needed
                    </span>
                    <b style={{ fontWeight: "600" }}>
                      {v.R.need}
                    </b>
                  </div>
                </div>
                <div style={{ border: "1px solid #E8E4EF", borderRadius: "10px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", gap: "8px" }}>
                    <b style={{ fontWeight: "600" }}>
                      Budget impact
                    </b>
                    <span style={{ color: "#6E6A7C" }}>
                      {v.R.budLine}
                    </span>
                  </div>
                  <div style={{ height: "8px", borderRadius: "4px", background: "#F1EEF6", display: "flex", overflow: "hidden" }}>
                    <span style={{ width: v.R.w1, background: "#2B1459" }} />
                    <span style={{ width: v.R.w2, background: "#B49A5A" }} />
                  </div>
                  <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
                    <span>{v.R.budFrom}</span>{" used now → "}<span>{v.R.budTo}</span>{" after this request"}
                  </span>
                </div>
                {v.R.canDecide ? (
                  <>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button className="tm-h14" onClick={v.R.approve} style={{ height: "44px", padding: "0 22px", border: "none", borderRadius: "10px", background: "#2E9B63", color: "#fff", fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d={v.ic.check} />
                        </svg>
                        Approve
                      </button>
                      <button className="tm-h3" onClick={v.R.ask} style={{ height: "44px", padding: "0 18px", border: "1px solid #E8E4EF", background: "#fff", borderRadius: "10px", fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d={v.ic.message} />
                        </svg>
                        Ask for info
                      </button>
                      <button className="tm-h8" onClick={v.R.reject} style={{ height: "44px", padding: "0 18px", border: "1px solid #F0C9CD", background: "#fff", color: "#B23A46", borderRadius: "10px", fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d={v.ic.x} />
                        </svg>
                        Reject
                      </button>
                    </div>
                  </>
                ) : null}
                {v.R.canPay ? (
                  <>
                    <button className="tm-h2" onClick={v.R.pay} style={{ alignSelf: "flex-start", height: "44px", padding: "0 20px", border: "none", borderRadius: "10px", background: "#2B1459", color: "#fff", fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d={v.ic.wallet} />
                      </svg>
                      Mark paid · open float
                    </button>
                  </>
                ) : null}
                {v.R.waiting ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "13px", color: "#6E6A7C" }}>
                        {v.R.waitLabel}
                      </span>
                      <button className="tm-h3" onClick={v.R.nudge} style={{ height: "36px", padding: "0 14px", border: "1px solid #E8E4EF", background: "#fff", borderRadius: "9px", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "7px" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d={v.ic.bell} />
                        </svg>
                        Send reminder
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
              <div style={{ flex: "1 1 260px", minWidth: "0", padding: "22px 24px", borderLeft: "1px solid #E8E4EF", background: "#FDFCFF", display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#6E6A7C", letterSpacing: ".06em", textTransform: "uppercase", paddingBottom: "14px" }}>
                  Approval chain · audit trail
                </span>
                {(v.R.chain || []).map((c, _i0) => (
                  <Fragment key={_i0}>
                    <div style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: "12px" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <span style={{ width: "24px", height: "24px", borderRadius: "50%", border: `2px solid ${c.dotBd}`, background: c.dotBg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d={c.icon} />
                          </svg>
                        </span>
                        {c.notLast ? (
                          <>
                            <span style={{ flex: "1", width: "2px", background: c.lineC, minHeight: "18px" }} />
                          </>
                        ) : null}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", paddingBottom: "14px" }}>
                        <b style={{ fontSize: "13px", color: c.lc }}>
                          {c.l}
                        </b>
                        <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
                          <span>{c.who}</span>{" · "}<span>{c.time}</span>
                        </span>
                      </div>
                    </div>
                  </Fragment>
                ))}
                <div style={{ marginTop: "auto", padding: "10px 12px", borderRadius: "8px", background: "#F4F1FA", fontSize: "11.5px", color: "#6E6A7C", lineHeight: "1.5" }}>
                  Each step is logged with person and time. Financial records can't be edited — only reversed with a new entry.
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
      <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #E8E4EF" }}>
          <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
            Open staff floats
          </h3>
          <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
            Receipts due within 3 days of payment
          </span>
        </div>
        {(v.floats || []).map((f, _i0) => (
          <Fragment key={_i0}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 20px", borderBottom: "1px solid #F1EEF6", fontSize: "13px", flexWrap: "wrap" }}>
              <span style={{ width: "32px", height: "32px", borderRadius: "50%", background: f.c, color: "#fff", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                {f.i}
              </span>
              <div style={{ flex: "1 1 160px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <b style={{ fontWeight: "600" }}>
                  {f.n}
                </b>
                <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
                  <span>{f.role}</span>{" · open "}<span>{f.age}</span>
                </span>
              </div>
              <b style={{ width: "130px" }}>
                {f.amt}
              </b>
              <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "6px", background: f.stbg, color: f.stfg, width: "130px", textAlign: "center" }}>
                {f.stl}
              </span>
              <button className="tm-h3" onClick={f.rec} style={{ height: "32px", padding: "0 12px", border: "1px solid #E8E4EF", background: "#fff", borderRadius: "8px", fontSize: "12.5px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6D3CC2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={v.ic.receipt} />
                </svg>
                Reconcile
              </button>
            </div>
          </Fragment>
        ))}
        {v.floatsEmpty ? (
          <>
            <div style={{ padding: "30px", textAlign: "center", color: "#6E6A7C", fontSize: "13px" }}>
              No open floats.
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
