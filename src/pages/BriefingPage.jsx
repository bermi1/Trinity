// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function BriefingPage({ v }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
            MONDAY BRIEFING · W39
          </span>
          <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
            Week of 21 – 25 September 2026
          </h1>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "7px", height: "36px", padding: "0 12px", borderRadius: "9px", background: "#FBEDEE", color: "#B23A46", fontSize: "12.5px", fontWeight: "700" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#D9535F", animation: "tmPulse 1.4s infinite" }} />
            In session
          </span>
          <button className="tm-h2" onClick={v.publishMinutes} style={{ height: "36px", padding: "0 14px", border: "none", background: "#2B1459", color: "#fff", borderRadius: "9px", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={v.ic.send} />
            </svg>
            End & publish minutes
          </button>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
        <div style={{ flex: "1 1 380px", minWidth: "0", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
              Previous week · W38
            </h3>
            <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
              14 – 18 Sep
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "1px", background: "#E8E4EF", border: "1px solid #E8E4EF", borderRadius: "10px", overflow: "hidden" }}>
            {(v.lastWeek || []).map((x, _i0) => (
              <Fragment key={_i0}>
                <div style={{ background: "#fff", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "3px" }}>
                  <span style={{ fontSize: "11.5px", color: "#6E6A7C" }}>
                    {x.l}
                  </span>
                  <b style={{ fontSize: "20px", color: x.c }}>
                    {x.v}
                  </b>
                </div>
              </Fragment>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#6E6A7C", letterSpacing: ".06em", textTransform: "uppercase", paddingBottom: "6px" }}>
              Major issues
            </span>
            {(v.issues || []).map((x, _i0) => (
              <Fragment key={_i0}>
                <div className="tm-h11" onClick={x.on} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "10px 6px", borderTop: "1px solid #F1EEF6", fontSize: "13px", cursor: "pointer", borderRadius: "6px" }}>
                  <span style={{ fontSize: "10.5px", fontWeight: "700", padding: "3px 7px", borderRadius: "5px", background: x.bg, color: x.fg, flex: "none" }}>
                    {x.tag}
                  </span>
                  <span style={{ flex: "1" }}>
                    {x.t}
                  </span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6E6A7C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.ic.chevR} />
                  </svg>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
        <div style={{ flex: "1.3 1 480px", minWidth: "0", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
            <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
              This week · W39
            </h3>
            <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
              Expected spend TZS 64.8M · 31 staff deployed
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: "8px" }}>
            {(v.week || []).map((d, _i0) => (
              <Fragment key={_i0}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", padding: "6px 8px", borderRadius: "7px", background: d.hbg, color: d.hc }}>
                    {d.d}
                  </span>
                  {(d.items || []).map((x, _i1) => (
                    <Fragment key={_i1}>
                      <div style={{ border: `1px solid ${x.bd}`, background: x.bg, borderRadius: "8px", padding: "8px", display: "flex", flexDirection: "column", gap: "3px" }}>
                        <span style={{ fontSize: "9.5px", fontWeight: "700", letterSpacing: ".04em", color: x.tc }}>
                          {x.k}
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: "600", lineHeight: "1.35", color: x.c }}>
                          {x.t}
                        </span>
                      </div>
                    </Fragment>
                  ))}
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
        <div style={{ flex: "0 1 300px", minWidth: "260px", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "2px" }}>
          <h3 style={{ margin: "0 0 10px", fontSize: "15px", fontWeight: "700" }}>
            Agenda
          </h3>
          {(v.agenda || []).map((x, _i0) => (
            <Fragment key={_i0}>
              <div className="tm-h3" onClick={x.on} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "9px 10px", borderRadius: "8px", fontSize: "13px", cursor: "pointer", color: x.c, textDecoration: x.td }}>
                <span style={{ width: "20px", height: "20px", borderRadius: "50%", border: `1.5px solid ${x.bd}`, background: x.bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.ic.check} />
                  </svg>
                </span>
                <span>{x.l}</span>
              </div>
            </Fragment>
          ))}
          <span style={{ fontSize: "11.5px", color: "#6E6A7C", padding: "10px 10px 0" }}>
            Click an item to mark it covered.
          </span>
        </div>
        <div style={{ flex: "1 1 560px", minWidth: "0", background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap", padding: "18px 20px" }}>
            <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
              Decisions & actions
            </h3>
            <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
              Every action becomes an assigned task
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: "780px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1.3fr) 160px 130px 130px", gap: "14px", padding: "10px 20px", background: "#FAF9FC", borderTop: "1px solid #E8E4EF", borderBottom: "1px solid #E8E4EF", fontSize: "11px", fontWeight: "700", letterSpacing: ".06em", textTransform: "uppercase", color: "#6E6A7C" }}>
                <span>
                  Decision
                </span>
                <span>
                  Action
                </span>
                <span>
                  Responsible
                </span>
                <span>
                  Deadline
                </span>
                <span>
                  Task
                </span>
              </div>
              {(v.actions || []).map((a, _i0) => (
                <Fragment key={_i0}>
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1.3fr) 160px 130px 130px", gap: "14px", padding: "13px 20px", borderBottom: "1px solid #F1EEF6", fontSize: "13px", alignItems: "center" }}>
                    <span style={{ fontWeight: "600" }}>
                      {a.d}
                    </span>
                    <span>
                      {a.a}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: a.oc, color: "#fff", fontSize: "10px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                        {a.o}
                      </span>
                      <span>{a.oname}</span>
                    </span>
                    <span>
                      {a.dl}
                    </span>
                    <span onClick={v.goTasks} style={{ display: "flex", alignItems: "center", gap: "5px", font: "600 11px 'IBM Plex Mono',monospace", padding: "4px 8px", borderRadius: "6px", background: "#E6F4EC", color: "#1F7549", width: "fit-content", cursor: "pointer" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d={v.ic.check} />
                      </svg>
                      <span>{a.task}</span>
                    </span>
                  </div>
                </Fragment>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1.3fr) 160px 130px 130px", gap: "14px", padding: "12px 20px", alignItems: "center", background: "#FDFCFF" }}>
                <input className="tm-f13" value={v.na.d ?? ''} onChange={v.naD} placeholder="New decision…" style={{ height: "36px", border: "1px solid #E8E4EF", borderRadius: "8px", padding: "0 10px", fontSize: "13px", outline: "none", minWidth: "0" }} />
                {' '}
                <input className="tm-f13" value={v.na.a ?? ''} onChange={v.naA} placeholder="Action to take…" style={{ height: "36px", border: "1px solid #E8E4EF", borderRadius: "8px", padding: "0 10px", fontSize: "13px", outline: "none", minWidth: "0" }} />
                {' '}
                <select value={v.na.o ?? ''} onChange={v.naO} style={{ height: "36px", border: "1px solid #E8E4EF", borderRadius: "8px", padding: "0 8px", fontSize: "13px", background: "#fff" }}>
                  {(v.people || []).map((o, _i0) => (
                    <Fragment key={_i0}>
                      <option value={o.v ?? ''}>
                        {o.l}
                      </option>
                    </Fragment>
                  ))}
                </select>
                {' '}
                <input className="tm-f13" value={v.na.dl ?? ''} onChange={v.naDl} placeholder="Deadline" style={{ height: "36px", border: "1px solid #E8E4EF", borderRadius: "8px", padding: "0 10px", fontSize: "13px", outline: "none", minWidth: "0" }} />
                {' '}
                <button className="tm-h9" onClick={v.addAction} style={{ height: "36px", border: "none", borderRadius: "8px", background: "#6D3CC2", color: "#fff", fontWeight: "600", fontSize: "12.5px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.ic.plus} />
                  </svg>
                  Add task
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
          <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700" }}>
            Team updates & presentations
          </h3>
          <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
            Staff can add their own report or presentation before the meeting starts
          </span>
        </div>
        {(v.teamUpdates || []).map((u, _i0) => (
          <Fragment key={_i0}>
            <div style={{ display: "flex", gap: "12px", padding: "12px 0", borderTop: "1px solid #F1EEF6" }}>
              <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: u.c, color: "#fff", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                {u.i}
              </span>
              <div style={{ flex: "1", minWidth: "0", display: "flex", flexDirection: "column", gap: "3px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <b style={{ fontWeight: "600", fontSize: "13.5px" }}>
                    {u.n}
                  </b>
                  {u.pres ? (
                    <>
                      <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 7px", borderRadius: "5px", background: "#EFE8FA", color: "#5A2FA8" }}>
                        PRESENTING TODAY
                      </span>
                    </>
                  ) : null}
                  <span style={{ fontSize: "11.5px", color: "#6E6A7C" }}>
                    {u.time}
                  </span>
                </div>
                <span style={{ fontSize: "13px", lineHeight: "1.5", color: "#17152A", textWrap: "pretty" }}>
                  {u.t}
                </span>
              </div>
            </div>
          </Fragment>
        ))}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "12px", borderTop: "1px solid #F1EEF6" }}>
          <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#6E6A7C", letterSpacing: ".06em", textTransform: "uppercase" }}>
            Add your update
          </span>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-start" }}>
            <select value={v.nu.who ?? ''} onChange={v.nuWho} style={{ height: "44px", border: "1px solid #E8E4EF", borderRadius: "10px", padding: "0 10px", fontSize: "13px", background: "#fff", flex: "0 1 180px" }}>
              {(v.people || []).map((o, _i0) => (
                <Fragment key={_i0}>
                  <option value={o.v ?? ''}>
                    {o.l}
                  </option>
                </Fragment>
              ))}
            </select>
            {' '}
            <textarea className="tm-f13" value={v.nu.t ?? ''} onChange={v.nuText} placeholder="What did you do, or what will you present today?" rows="2" style={{ flex: "1 1 260px", minWidth: "0", border: "1px solid #E8E4EF", borderRadius: "10px", padding: "11px 12px", fontSize: "13.5px", outline: "none", resize: "none" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }} onClick={v.nuTogglePres}>
              <span style={{ width: "16px", height: "16px", borderRadius: "4px", background: v.nuPresBg, border: `1.5px solid ${v.nuPresBd}`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {v.nu.pres ? (
                  <>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={v.ic.check} />
                    </svg>
                  </>
                ) : null}
              </span>
              I'm presenting today
            </label>
            {' '}
            <button className="tm-h9" onClick={v.addUpdate} style={{ height: "38px", padding: "0 16px", border: "none", borderRadius: "9px", background: "#6D3CC2", color: "#fff", fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={v.ic.plus} />
              </svg>
              Post update
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
