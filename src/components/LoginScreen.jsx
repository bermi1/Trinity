// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function LoginScreen({ v }) {
  return (
    <>
      <div style={{ minHeight: "100vh", display: "flex", flexWrap: "wrap", background: "#fff" }}>
        <div style={{ flex: "1.25 1 480px", minHeight: "420px", background: "#1D103D", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "40px", padding: "clamp(28px,5vw,64px)" }}>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: "0", opacity: ".55" }} viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice">
            <g fill="none" stroke="#B49A5A" strokeOpacity=".22">
              <path d="M420 900 L620 120 L820 900" />
              <path d="M470 900 L620 300 L770 900" />
              <path d="M520 700 L720 700 M500 780 L740 780 M545 600 L695 600 M570 500 L670 500 M595 400 L645 400" />
              <path d="M520 700 L570 500 M720 700 L670 500 M500 780 L545 600 M740 780 L695 600" />
            </g>
            <g fill="none" stroke="#6D3CC2" strokeOpacity=".4">
              <path d="M0 640 H360 M0 660 H300 M0 680 H240" />
              <rect x="80" y="180" width="220" height="130" rx="2" />
              <path d="M190 310 V420 M150 420 H230" />
            </g>
          </svg>
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "16px" }}>
            <svg width="40" height="46" viewBox="138 118 176 196" fill="none" stroke="#B49A5A" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round">
              <path d="M153 130 V186 Q153 214 182 214 H274 Q304 214 284 240 L214 298 Q205 306 196 298 L168 248" />
              <path d="M201 158 H266" />
            </svg>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ color: "#B49A5A", fontWeight: "700", fontSize: "16px", letterSpacing: ".3em" }}>
                TRINITY MARK
              </span>
              <span style={{ color: "rgba(255,255,255,.6)", fontSize: "11px", letterSpacing: ".42em" }}>
                SOLUTIONS
              </span>
            </div>
          </div>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "22px", maxWidth: "600px" }}>
            <span style={{ font: "600 12px 'IBM Plex Mono',monospace", letterSpacing: ".2em", color: "#B49A5A" }}>
              TRINITY MARK 360
            </span>
            <h1 style={{ margin: "0", color: "#fff", fontSize: "clamp(38px,5vw,60px)", lineHeight: "1.03", fontWeight: "800", letterSpacing: "-.03em" }}>
              One system.
              <br />
              All operations.
              <br />
              <span style={{ color: "#B49A5A" }}>
                Total visibility.
              </span>
            </h1>
            <p style={{ margin: "0", color: "rgba(255,255,255,.74)", fontSize: "16px", lineHeight: "1.6", textWrap: "pretty" }}>
              From the first client request to the final project report, Trinity Mark 360 connects the people, projects, money, materials and operations that make Trinity Mark work.
            </p>
          </div>
          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", color: "rgba(255,255,255,.55)", fontSize: "13px" }}>
            <span>
              Ideas. Events. Brands. Real Impact.
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "11.5px" }}>
              Dar es Salaam · EAT
            </span>
          </div>
        </div>
        <div style={{ flex: "1 1 400px", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
          <div style={{ width: "100%", maxWidth: "380px", display: "flex", flexDirection: "column", gap: "26px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <h2 style={{ margin: "0", fontSize: "30px", fontWeight: "700", letterSpacing: "-.02em" }}>
                Welcome back
              </h2>
              <p style={{ margin: "0", color: "#6E6A7C", fontSize: "14px" }}>
                Sign in to your Trinity Mark workspace.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "7px", fontSize: "12.5px", fontWeight: "600" }}>
                Email or username
                <input className="tm-f1" value={v.email ?? ''} onChange={v.onEmail} onKeyDown={v.loginKey} style={{ height: "46px", border: "1px solid #E8E4EF", borderRadius: "10px", padding: "0 14px", fontSize: "14px", outline: "none" }} />
              </label>
              {' '}
              <label style={{ display: "flex", flexDirection: "column", gap: "7px", fontSize: "12.5px", fontWeight: "600" }}>
                Password
                <input className="tm-f1" type="password" value={v.pw ?? ''} onChange={v.onPw} onKeyDown={v.loginKey} style={{ height: "46px", border: "1px solid #E8E4EF", borderRadius: "10px", padding: "0 14px", fontSize: "14px", outline: "none" }} />
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "7px", fontSize: "12.5px", fontWeight: "600" }}>
                Sign in to portal
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {(v.loginRoles || []).map((lr, _i0) => (
                    <Fragment key={_i0}>
                      <button onClick={lr.on} style={{ height: "34px", padding: "0 13px", borderRadius: "17px", border: `1px solid ${lr.bd}`, background: lr.bg, color: lr.c, fontSize: "12.5px", fontWeight: "600" }}>
                        {lr.l}
                      </button>
                    </Fragment>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                <span onClick={v.toggleRemember} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <span style={{ width: "16px", height: "16px", borderRadius: "4px", background: v.rememberBg, border: `1.5px solid ${v.rememberBd}`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d={v.ic.check} />
                    </svg>
                  </span>
                  Remember me
                </span>
                <a href="#" onClick={v.forgot} style={{ fontWeight: "600" }}>
                  Forgot password?
                </a>
              </div>
              {v.loginErr ? (
                <>
                  <div style={{ fontSize: "13px", color: "#B23A46", background: "#FBEDEE", borderRadius: "8px", padding: "10px 12px" }}>
                    {v.loginErr}
                  </div>
                </>
              ) : null}
            </div>
            <button className="tm-h2" onClick={v.signIn} style={{ height: "48px", border: "none", borderRadius: "10px", background: "#2B1459", color: "#fff", fontWeight: "700", fontSize: "14px", letterSpacing: ".06em" }}>
              SIGN IN
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#6E6A7C", fontSize: "12px" }}>
              <span style={{ flex: "1", height: "1px", background: "#E8E4EF" }} />
              or continue with
              <span style={{ flex: "1", height: "1px", background: "#E8E4EF" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button className="tm-h3" onClick={v.signInGoogle} style={{ height: "44px", border: "1px solid #E8E4EF", background: "#fff", borderRadius: "10px", fontSize: "13px", fontWeight: "600" }}>
                Google
              </button>
              <button className="tm-h3" onClick={v.signInMicrosoft} style={{ height: "44px", border: "1px solid #E8E4EF", background: "#fff", borderRadius: "10px", fontSize: "13px", fontWeight: "600" }}>
                Microsoft
              </button>
            </div>
            <p style={{ margin: "0", fontSize: "12px", color: "#6E6A7C", textAlign: "center" }}>
              {v.loginNote}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
