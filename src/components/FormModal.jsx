// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function FormModal({ v }) {
  return (
    <>
      <div onClick={v.modalClose} style={{ position: "fixed", inset: "0", zIndex: "70", background: "rgba(23,21,42,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div onClick={v.stop} style={{ width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: "16px", boxShadow: "0 24px 60px rgba(29,16,61,.3)", display: "flex", flexDirection: "column", animation: "tmIn .18s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", padding: "22px 24px 6px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <h3 style={{ margin: "0", fontSize: "19px", fontWeight: "700" }}>
                {v.M.title}
              </h3>
              <span style={{ fontSize: "13px", color: "#6E6A7C" }}>
                {v.M.sub}
              </span>
            </div>
            <button onClick={v.modalClose} style={{ width: "34px", height: "34px", border: "none", borderRadius: "8px", background: "#F4F1FA", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={v.ic.x} />
              </svg>
            </button>
          </div>
          <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
            {(v.modalFields || []).map((f, _i0) => (
              <Fragment key={_i0}>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px", fontWeight: "600" }}>
                  <span>{f.l}</span>{' '}
                  {f.isSel ? (
                    <>
                      <select value={f.v ?? ''} onChange={f.on} style={{ height: "44px", border: "1px solid #E8E4EF", borderRadius: "10px", padding: "0 10px", fontSize: "14px", background: "#fff", fontWeight: "500" }}>
                        {(f.opts || []).map((o, _i1) => (
                          <Fragment key={_i1}>
                            <option value={o.v ?? ''}>
                              {o.l}
                            </option>
                          </Fragment>
                        ))}
                      </select>
                    </>
                  ) : null}
                  {f.isInput ? (
                    <>
                      <input className="tm-f17" type={f.type} value={f.v ?? ''} onChange={f.on} onKeyDown={v.modalKey} placeholder={f.ph} style={{ height: "44px", border: "1px solid #E8E4EF", borderRadius: "10px", padding: "0 12px", fontSize: "14px", outline: "none", fontWeight: "500" }} />
                    </>
                  ) : null}
                </label>
              </Fragment>
            ))}
            {v.modalErr ? (
              <>
                <div style={{ fontSize: "13px", color: "#B23A46", background: "#FBEDEE", borderRadius: "8px", padding: "10px 12px" }}>
                  {v.modalErr}
                </div>
              </>
            ) : null}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "14px 24px 22px", borderTop: "1px solid #F1EEF6" }}>
            <button onClick={v.modalClose} style={{ height: "42px", padding: "0 18px", border: "1px solid #E8E4EF", background: "#fff", borderRadius: "10px", fontSize: "13.5px", fontWeight: "600" }}>
              Cancel
            </button>
            <button className="tm-h2" onClick={v.modalSubmit} style={{ height: "42px", padding: "0 20px", border: "none", background: "#2B1459", color: "#fff", borderRadius: "10px", fontSize: "13.5px", fontWeight: "700" }}>
              {v.M.submit}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
