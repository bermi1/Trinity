// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function FieldAppPage({ v }) {
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
          FIELD STAFF VIEW
        </span>
        <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
          Mobile app · John Mwakyusa
        </h1>
        <span style={{ fontSize: "13px", color: "#6E6A7C" }}>
          Everything done here syncs live to the office — check the dashboard activity feed.
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 30px" }}>
        <div style={{ width: "390px", maxWidth: "100%", height: "800px", borderRadius: "44px", background: "#17152A", padding: "10px", boxShadow: "0 24px 60px rgba(29,16,61,.28)" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "36px", overflow: "hidden", background: "#F4F1FA", display: "flex", flexDirection: "column", position: "relative" }}>
            <div style={{ background: "#2B1459", padding: "14px 22px 20px", display: "flex", flexDirection: "column", gap: "16px", borderRadius: "0 0 22px 22px", flex: "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#fff", fontSize: "13px", fontWeight: "700" }}>
                <span>
                  {v.clock}
                </span>
                <span style={{ width: "90px", height: "22px", borderRadius: "12px", background: "#000", marginTop: "-4px" }} />
                <span style={{ fontSize: "11px" }}>
                  4G
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="18" height="20" viewBox="138 118 176 196" fill="none" stroke="#B49A5A" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M153 130 V186 Q153 214 182 214 H274 Q304 214 284 240 L214 298 Q205 306 196 298 L168 248" />
                    <path d="M201 158 H266" />
                  </svg>
                  <span style={{ color: "#B49A5A", fontWeight: "700", fontSize: "11px", letterSpacing: ".26em" }}>
                    TRINITY MARK
                  </span>
                </span>
                <span style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#2E9B63", color: "#fff", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  JM
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <h2 style={{ margin: "0", color: "#fff", fontSize: "24px", fontWeight: "700", letterSpacing: "-.02em" }}>
                  Habari, John
                </h2>
                <span style={{ color: "rgba(255,255,255,.7)", fontSize: "13.5px" }}>
                  Here's your work for today
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ flex: "1", height: "6px", borderRadius: "3px", background: "rgba(255,255,255,.15)" }}>
                  <div style={{ width: v.fW, height: "100%", borderRadius: "3px", background: "#B49A5A", transition: "width .4s" }} />
                </div>
                <span style={{ color: "#fff", fontSize: "12.5px", fontWeight: "600" }}>
                  {v.fDone}
                </span>
              </div>
            </div>
            <div style={{ flex: "1", overflowY: "auto", padding: "16px" }}>
              {v.fTab.home ? (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {(v.fTasks || []).map((t, _i0) => (
                      <Fragment key={_i0}>
                        <div style={{ background: "#fff", border: `1.5px solid ${t.bd}`, borderRadius: "14px", padding: "14px", display: "flex", flexDirection: "column", gap: "12px", opacity: t.op }}>
                          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                            <span style={{ font: "600 12px 'IBM Plex Mono',monospace", color: "#6E6A7C", width: "40px", paddingTop: "2px" }}>
                              {t.time}
                            </span>
                            <div style={{ flex: "1", display: "flex", flexDirection: "column", gap: "3px" }}>
                              <b style={{ fontSize: "14.5px", textDecoration: t.td }}>
                                {t.t}
                              </b>
                              <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
                                {t.s}
                              </span>
                            </div>
                            {t.done ? (
                              <>
                                <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#2E9B63", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d={v.ic.check} />
                                  </svg>
                                </span>
                              </>
                            ) : null}
                          </div>
                          {t.todo ? (
                            <>
                              <button onClick={t.start} style={{ height: "44px", border: "none", borderRadius: "10px", background: "#F4F1FA", color: "#2B1459", fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d={v.ic.play} />
                                </svg>
                                Start
                              </button>
                            </>
                          ) : null}
                          {t.prog ? (
                            <>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                <button onClick={v.goFieldReport} style={{ height: "44px", border: "1px solid #E8E4EF", borderRadius: "10px", background: "#fff", fontSize: "13.5px", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6D3CC2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d={v.ic.camera} />
                                  </svg>
                                  Photo
                                </button>
                                <button onClick={t.complete} style={{ height: "44px", border: "none", borderRadius: "10px", background: "#2B1459", color: "#fff", fontSize: "13.5px", fontWeight: "700" }}>
                                  Complete
                                </button>
                              </div>
                            </>
                          ) : null}
                        </div>
                      </Fragment>
                    ))}
                    <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#6E6A7C", letterSpacing: ".06em", textTransform: "uppercase", padding: "8px 2px 0" }}>
                      My money requests
                    </span>
                    {(v.myReqs || []).map((r, _i0) => (
                      <Fragment key={_i0}>
                        <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "12px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <b style={{ fontSize: "13.5px" }}>
                              {r.amt}
                            </b>
                            <span style={{ fontSize: "11.5px", color: "#6E6A7C" }}>
                              <span>{r.id}</span>{" · "}<span>{r.cat}</span>
                            </span>
                          </div>
                          <span style={{ fontSize: "10.5px", fontWeight: "700", padding: "3px 7px", borderRadius: "6px", background: r.stbg, color: r.stfg }}>
                            {r.stl}
                          </span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </>
              ) : null}
              {v.fTab.req ? (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <b style={{ fontSize: "18px" }}>
                      Request money
                    </b>
                    {' '}
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "700", color: "#6E6A7C", letterSpacing: ".04em" }}>
                      AMOUNT (TZS)
                      <input className="tm-f13" type="number" value={v.fr.amt ?? ''} onChange={v.frAmt} placeholder="300000" style={{ height: "52px", border: "1px solid #E8E4EF", borderRadius: "12px", padding: "0 14px", fontSize: "20px", fontWeight: "700", outline: "none", background: "#fff" }} />
                    </label>
                    {' '}
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "700", color: "#6E6A7C", letterSpacing: ".04em" }}>
                      CATEGORY
                      <select value={v.fr.cat ?? ''} onChange={v.frCat} style={{ height: "48px", border: "1px solid #E8E4EF", borderRadius: "12px", padding: "0 12px", fontSize: "14px", background: "#fff" }}>
                        {(v.catOpts || []).map((o, _i0) => (
                          <Fragment key={_i0}>
                            <option value={o.v ?? ''}>
                              {o.l}
                            </option>
                          </Fragment>
                        ))}
                      </select>
                    </label>
                    {' '}
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "700", color: "#6E6A7C", letterSpacing: ".04em" }}>
                      PROJECT
                      <select value={v.fr.p ?? ''} onChange={v.frP} style={{ height: "48px", border: "1px solid #E8E4EF", borderRadius: "12px", padding: "0 12px", fontSize: "14px", background: "#fff" }}>
                        {(v.projOpts || []).map((o, _i0) => (
                          <Fragment key={_i0}>
                            <option value={o.v ?? ''}>
                              {o.l}
                            </option>
                          </Fragment>
                        ))}
                      </select>
                    </label>
                    {' '}
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "700", color: "#6E6A7C", letterSpacing: ".04em" }}>
                      PURPOSE
                      <textarea className="tm-f13" value={v.fr.purpose ?? ''} onChange={v.frPurpose} placeholder="What is the money for?" rows="3" style={{ border: "1px solid #E8E4EF", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", outline: "none", resize: "none", background: "#fff" }} />
                    </label>
                    <div style={{ fontSize: "12px", color: "#6E6A7C", lineHeight: "1.5", background: "#fff", borderRadius: "12px", padding: "12px 14px", border: "1px solid #E8E4EF" }}>
                      Goes to your PM → Operations → Finance → Management. Once paid it becomes a float — upload receipts within 3 days.
                    </div>
                    <button onClick={v.frSubmit} style={{ height: "52px", border: "none", borderRadius: "12px", background: "#6D3CC2", color: "#fff", fontSize: "15px", fontWeight: "700" }}>
                      Submit request
                    </button>
                  </div>
                </>
              ) : null}
              {v.fTab.report ? (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <b style={{ fontSize: "18px" }}>
                      Daily report
                    </b>
                    {v.reportOpen ? (
                      <>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span style={{ fontSize: "12px", fontWeight: "700", color: "#6E6A7C", letterSpacing: ".04em" }}>
                            COMPLETED TODAY
                          </span>
                          {(v.fDoneList || []).map((d, _i0) => (
                            <Fragment key={_i0}>
                              <div style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "13.5px", minHeight: "42px", padding: "0 12px", borderRadius: "10px", background: "#E6F4EC" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1F7549" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <path d={v.ic.check} />
                                </svg>
                                <span>{d.t}</span>
                              </div>
                            </Fragment>
                          ))}
                        </div>
                        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "700", color: "#6E6A7C", letterSpacing: ".04em" }}>
                          WHAT REMAINS / PROBLEMS
                          <textarea className="tm-f13" value={v.reportText ?? ''} onChange={v.onReport} placeholder="e.g. Outlet 4 wall is damp — returning Thursday." rows="4" style={{ border: "1px solid #E8E4EF", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", outline: "none", resize: "none", background: "#fff" }} />
                        </label>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span style={{ fontSize: "12px", fontWeight: "700", color: "#6E6A7C", letterSpacing: ".04em" }}>
                            PHOTOS
                          </span>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "6px" }}>
                            <span style={{ aspectRatio: "1", borderRadius: "10px", background: "#E8E4EF" }} />
                            <span style={{ aspectRatio: "1", borderRadius: "10px", background: "#E8E4EF" }} />
                            <span style={{ aspectRatio: "1", borderRadius: "10px", border: "1.5px dashed #D5CFE0", display: "flex", alignItems: "center", justifyContent: "center", color: "#6D3CC2", background: "#fff" }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d={v.ic.camera} />
                              </svg>
                            </span>
                          </div>
                        </div>
                        <button onClick={v.sendReport} style={{ height: "52px", border: "none", borderRadius: "12px", background: "#2B1459", color: "#fff", fontSize: "15px", fontWeight: "700" }}>
                          Submit report
                        </button>
                      </>
                    ) : null}
                    {v.reportSent ? (
                      <>
                        <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "28px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", textAlign: "center" }}>
                          <span style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#E6F4EC", color: "#1F7549", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                              <path d={v.ic.check} />
                            </svg>
                          </span>
                          <b style={{ fontSize: "16px" }}>
                            Report submitted
                          </b>
                          <span style={{ fontSize: "13px", color: "#6E6A7C" }}>
                            Asante John. Your PM can see it now.
                          </span>
                        </div>
                      </>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
            <div style={{ flex: "none", height: "78px", background: "#fff", borderTop: "1px solid #E8E4EF", display: "grid", gridTemplateColumns: "repeat(3,1fr)", padding: "0 10px 16px" }}>
              {(v.fTabs || []).map((t, _i0) => (
                <Fragment key={_i0}>
                  <button onClick={t.on} style={{ border: "none", background: "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: "5px", color: t.c, fontSize: "11px", fontWeight: "700", padding: "0" }}>
                    <span style={{ width: "28px", height: "3px", borderRadius: "2px", background: t.bar, marginBottom: "6px" }} />
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={t.ic} />
                    </svg>
                    <span>{t.l}</span>
                  </button>
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
