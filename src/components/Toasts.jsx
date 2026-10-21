// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function Toasts({ v }) {
  return (
    <>
      <div style={{ position: "fixed", left: "50%", bottom: v.toastBottom, transform: "translateX(-50%)", zIndex: "90", display: "flex", flexDirection: "column", gap: "8px", alignItems: "center", pointerEvents: "none" }}>
        {(v.toasts || []).map((t, _i0) => (
          <Fragment key={_i0}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#1D103D", color: "#fff", borderRadius: "12px", padding: "12px 16px", fontSize: "13.5px", fontWeight: "600", boxShadow: "0 12px 32px rgba(29,16,61,.3)", animation: "tmIn .2s ease", maxWidth: "90vw" }}>
              <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#2E9B63", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d={v.ic.check} />
                </svg>
              </span>
              <span>{t.t}</span>
            </div>
          </Fragment>
        ))}
      </div>
    </>
  );
}
