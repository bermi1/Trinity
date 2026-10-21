// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function DashboardPage({ v }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
            COMPANY COMMAND CENTER
          </span>
          <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
            <span>{v.greeting}</span>, Daniel
          </h1>
          <p style={{ margin: "0", color: "#6E6A7C", fontSize: "14px" }}>
            Here's what's happening across Trinity Mark today.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button className="tm-h3" onClick={v.goBrief} style={{ height: "40px", padding: "0 16px", border: "1px solid #D9CFEE", background: "#fff", color: "#2B1459", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={v.ic.presentation} />
            </svg>
            Monday Briefing
          </button>
          <button className="tm-h9" onClick={v.openCmd} style={{ height: "40px", padding: "0 16px", border: "none", background: "#6D3CC2", color: "#fff", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={v.ic.plus} />
            </svg>
            Create
          </button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "14px" }}>
        {(v.kpis || []).map((k, _i0) => (
          <Fragment key={_i0}>
            <div className="tm-h10" onClick={k.go} style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "18px", display: "flex", flexDirection: "column", gap: "10px", cursor: "pointer", transition: "border-color .15s,box-shadow .15s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#6E6A7C", letterSpacing: ".06em", textTransform: "uppercase" }}>
                  {k.l}
                </span>
                <span style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#F4F1FA", color: "#6D3CC2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={k.ic} />
                  </svg>
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "8px" }}>
                <span style={{ fontSize: "28px", fontWeight: "700", letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: "13px", color: "#6E6A7C", fontWeight: "600", marginRight: "4px" }}>
                    {k.u}
                  </span>
                  <span>{k.v}</span>
                </span>
                <svg width="84" height="30" viewBox="0 0 90 30" fill="none" style={{ flex: "0 1 84px", minWidth: "0", maxWidth: "84px" }}>
                  <path d={k.spf} fill={k.spc} fillOpacity=".1" stroke="none" />
                  <path d={k.sp} stroke={k.spc} strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
                <b style={{ color: k.dc }}>
                  {k.d}
                </b>
                {' '}<span>{k.n}</span>
              </span>
            </div>
          </Fragment>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
        <div style={{ flex: "2 1 560px", minWidth: "0", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
              Revenue vs expenses
            </h3>
            <div style={{ display: "flex", border: "1px solid #E8E4EF", borderRadius: "9px", padding: "2px" }}>
              {(v.rangeBtns || []).map((r, _i0) => (
                <Fragment key={_i0}>
                  <button onClick={r.on} style={{ border: "none", padding: "6px 12px", borderRadius: "7px", background: r.bg, color: r.c, fontSize: "12px", fontWeight: "600" }}>
                    {r.l}
                  </button>
                </Fragment>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "28px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6E6A7C" }}>
                <span style={{ width: "10px", height: "3px", borderRadius: "2px", background: "#6D3CC2" }} />
                Revenue
              </span>
              <span style={{ fontSize: "20px", fontWeight: "700" }}>
                {v.chart.totRev}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6E6A7C" }}>
                <span style={{ width: "10px", height: "3px", borderRadius: "2px", background: "#B49A5A" }} />
                Expenses
              </span>
              <span style={{ fontSize: "20px", fontWeight: "700" }}>
                {v.chart.totExp}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
                Net cash flow
              </span>
              <span style={{ fontSize: "20px", fontWeight: "700", color: "#1F7549" }}>
                {v.chart.net}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
                Margin
              </span>
              <span style={{ fontSize: "20px", fontWeight: "700" }}>
                {v.chart.margin}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", font: "500 10.5px 'IBM Plex Mono',monospace", color: "#6E6A7C", height: "240px", textAlign: "right", marginTop: "-6px" }}>
              {(v.chart.yl || []).map((y, _i0) => (
                <Fragment key={_i0}>
                  <span>
                    {y}
                  </span>
                </Fragment>
              ))}
            </div>
            <div style={{ flex: "1", minWidth: "0", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div onMouseLeave={v.chartLeave} style={{ position: "relative", height: "240px" }}>
                <div style={{ position: "absolute", inset: "0", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <span style={{ height: "1px", background: "#F1EEF6" }} />
                  <span style={{ height: "1px", background: "#F1EEF6" }} />
                  <span style={{ height: "1px", background: "#F1EEF6" }} />
                  <span style={{ height: "1px", background: "#F1EEF6" }} />
                  <span style={{ height: "1px", background: "#E8E4EF" }} />
                </div>
                <svg width="100%" height="100%" viewBox="0 0 1000 240" preserveAspectRatio="none" style={{ position: "absolute", inset: "0", overflow: "visible" }}>
                  <defs>
                    <linearGradient id="tmgR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#6D3CC2" stopOpacity=".22" />
                      <stop offset="1" stopColor="#6D3CC2" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="tmgE" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#B49A5A" stopOpacity=".2" />
                      <stop offset="1" stopColor="#B49A5A" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={v.chart.f1} fill="url(#tmgR)" />
                  <path d={v.chart.f2} fill="url(#tmgE)" />
                  <path d={v.chart.l1} fill="none" stroke="#6D3CC2" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                  <path d={v.chart.l2} fill="none" stroke="#B49A5A" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                </svg>
                {v.tip.show ? (
                  <>
                    <span style={{ position: "absolute", top: "0", bottom: "0", left: v.tip.left, width: "1px", background: "#D9CFEE" }} />
                    {' '}
                    <span style={{ position: "absolute", left: v.tip.left, top: v.tip.y1, width: "12px", height: "12px", margin: "-6px 0 0 -6px", borderRadius: "50%", background: "#fff", border: "3px solid #6D3CC2" }} />
                    {' '}
                    <span style={{ position: "absolute", left: v.tip.left, top: v.tip.y2, width: "12px", height: "12px", margin: "-6px 0 0 -6px", borderRadius: "50%", background: "#fff", border: "3px solid #B49A5A" }} />
                    <div style={{ position: "absolute", top: "8px", left: v.tip.left, transform: v.tip.tx, background: "#1D103D", color: "#fff", borderRadius: "10px", padding: "10px 12px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px", minWidth: "160px", pointerEvents: "none", boxShadow: "0 8px 24px rgba(29,16,61,.25)", zIndex: "2" }}>
                      <b style={{ fontSize: "11px", color: "#E2CE98", letterSpacing: ".06em" }}>
                        {v.tip.label}
                      </b>
                      <span style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                        <span style={{ color: "rgba(255,255,255,.7)" }}>
                          Revenue
                        </span>
                        <b>
                          {v.tip.rev}
                        </b>
                      </span>
                      <span style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                        <span style={{ color: "rgba(255,255,255,.7)" }}>
                          Expenses
                        </span>
                        <b>
                          {v.tip.exp}
                        </b>
                      </span>
                      <span style={{ display: "flex", justifyContent: "space-between", gap: "12px", borderTop: "1px solid rgba(255,255,255,.14)", paddingTop: "4px" }}>
                        <span style={{ color: "rgba(255,255,255,.7)" }}>
                          Net
                        </span>
                        <b style={{ color: "#7FD4A6" }}>
                          {v.tip.net}
                        </b>
                      </span>
                    </div>
                  </>
                ) : null}
                <div style={{ position: "absolute", inset: "0", display: "flex" }}>
                  {(v.chart.cols || []).map((c, _i0) => (
                    <Fragment key={_i0}>
                      <div onMouseEnter={c.on} onClick={c.on} style={{ flex: "1", height: "100%" }} />
                    </Fragment>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", font: "500 10.5px 'IBM Plex Mono',monospace", color: "#6E6A7C" }}>
                {(v.chart.labels || []).map((x, _i0) => (
                  <Fragment key={_i0}>
                    <span>
                      {x}
                    </span>
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div style={{ flex: "1 1 300px", minWidth: "0", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
              Project performance
            </h3>
            <a href="#" onClick={v.goProjects} style={{ fontSize: "12.5px", fontWeight: "600" }}>
              All projects
            </a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "22px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: "150px", height: "150px", flex: "none" }}>
              <svg width="150" height="150" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="52" fill="none" stroke="#F1EEF6" strokeWidth="16" />
                <g transform="rotate(-90 70 70)">
                  {(v.donut.segs || []).map((d, _i0) => (
                    <Fragment key={_i0}>
                      <circle cx="70" cy="70" r="52" fill="none" stroke={d.col} strokeWidth="16" strokeDasharray={d.da} strokeDashoffset={d.off} />
                    </Fragment>
                  ))}
                </g>
              </svg>
              <div style={{ position: "absolute", inset: "0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <b style={{ fontSize: "30px", letterSpacing: "-.02em" }}>
                  {v.donut.total}
                </b>
                <span style={{ fontSize: "11.5px", color: "#6E6A7C" }}>
                  projects
                </span>
              </div>
            </div>
            <div style={{ flex: "1", minWidth: "140px", display: "flex", flexDirection: "column", gap: "2px" }}>
              {(v.donut.legend || []).map((l, _i0) => (
                <Fragment key={_i0}>
                  <div className="tm-h3" onClick={l.on} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: l.col }} />
                    <span style={{ flex: "1" }}>
                      {l.l}
                    </span>
                    <b>
                      {l.n}
                    </b>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#6E6A7C", letterSpacing: ".06em", textTransform: "uppercase", paddingBottom: "6px" }}>
              Needs your attention
            </span>
            {(v.attention || []).map((a, _i0) => (
              <Fragment key={_i0}>
                <div className="tm-h11" onClick={a.on} style={{ display: "flex", gap: "12px", alignItems: "center", padding: "10px 8px", borderTop: "1px solid #F1EEF6", fontSize: "13px", cursor: "pointer", borderRadius: "8px" }}>
                  <span style={{ width: "30px", height: "30px", borderRadius: "8px", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: a.bg, color: a.fg }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={a.ic} />
                    </svg>
                  </span>
                  <div style={{ flex: "1", minWidth: "0", display: "flex", flexDirection: "column", gap: "2px" }}>
                    <b style={{ fontWeight: "600" }}>
                      {a.t}
                    </b>
                    <span style={{ color: "#6E6A7C", fontSize: "12px" }}>
                      {a.s}
                    </span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6E6A7C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.ic.chevR} />
                  </svg>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
        <div style={{ flex: "1.2 1 360px", minWidth: "0", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
              Today's activity
            </h3>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#1F7549", fontWeight: "600" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#2E9B63", animation: "tmPulse 1.6s infinite" }} />
              Live
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {(v.activity || []).map((e, _i0) => (
              <Fragment key={_i0}>
                <div style={{ display: "grid", gridTemplateColumns: "44px 30px minmax(0,1fr)", gap: "10px", padding: "9px 0", fontSize: "13px", borderBottom: "1px solid #F6F4F9", alignItems: "start" }}>
                  <span style={{ font: "500 11.5px 'IBM Plex Mono',monospace", color: "#6E6A7C", paddingTop: "7px" }}>
                    {e.time}
                  </span>
                  <span style={{ width: "30px", height: "30px", borderRadius: "8px", background: e.bg, color: e.fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={e.ic} />
                    </svg>
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span>
                      {e.t}
                    </span>
                    <span style={{ color: "#6E6A7C", fontSize: "12px" }}>
                      {e.s}
                    </span>
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
        <div style={{ flex: "1 1 320px", minWidth: "0", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
              Live workflow
            </h3>
            <a href="#" onClick={v.goReq} style={{ fontSize: "12.5px", fontWeight: "600" }}>
              Open approvals
            </a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#6E6A7C" }}>
              Money requests · approval chain
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: "4px" }}>
              {(v.pipe || []).map((p, _i0) => (
                <Fragment key={_i0}>
                  <div onClick={v.goReq} style={{ background: p.bg, border: `1px solid ${p.bd}`, borderRadius: "8px", padding: "9px 2px", display: "flex", flexDirection: "column", gap: "2px", alignItems: "center", cursor: "pointer" }}>
                    <b style={{ fontSize: "18px", color: p.fg }}>
                      {p.n}
                    </b>
                    <span style={{ fontSize: "10px", color: p.fg, fontWeight: "600" }}>
                      {p.l}
                    </span>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#6E6A7C" }}>
              Procurement
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: "4px" }}>
              {(v.procPipe || []).map((p, _i0) => (
                <Fragment key={_i0}>
                  <div onClick={v.goProc} style={{ background: "#F4F1FA", borderRadius: "8px", padding: "9px 2px", display: "flex", flexDirection: "column", gap: "2px", alignItems: "center", cursor: "pointer" }}>
                    <b style={{ fontSize: "16px" }}>
                      {p.n}
                    </b>
                    <span style={{ fontSize: "9.5px", color: "#6E6A7C", fontWeight: "600", textAlign: "center" }}>
                      {p.l}
                    </span>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
          <div onClick={v.goStaff} style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "12px", borderTop: "1px solid #F1EEF6", cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ fontWeight: "600", color: "#6E6A7C" }}>
                Staff daily reports
              </span>
              <b>
                <span>{v.reports.sub}</span>{" / "}<span>{v.reports.total}</span>{" submitted"}
              </b>
            </div>
            <div style={{ height: "8px", borderRadius: "4px", background: "#F1EEF6", overflow: "hidden" }}>
              <div style={{ width: v.reports.w, height: "100%", borderRadius: "4px", background: "linear-gradient(90deg,#6D3CC2,#2B1459)", transition: "width .4s" }} />
            </div>
            <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
              {v.reports.missing}
            </span>
          </div>
        </div>
        <div style={{ flex: ".8 1 240px", minWidth: "0", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
            Quick actions
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {(v.quick || []).map((q, _i0) => (
              <Fragment key={_i0}>
                <button className="tm-h12" onClick={q.on} style={{ height: "42px", borderRadius: "10px", border: `1px solid ${q.bd}`, background: q.bg, color: q.c, display: "flex", alignItems: "center", padding: "0 14px", fontSize: "13px", fontWeight: "600", gap: "10px", textAlign: "left" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={q.icc} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={q.ic} />
                  </svg>
                  <span>{q.l}</span>
                </button>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
