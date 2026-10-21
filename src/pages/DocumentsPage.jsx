// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import { Fragment } from 'react';

export default function DocumentsPage({ v }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "0" }}>
          <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: ".16em", color: "#8A7239" }}>
            RECORDS
          </span>
          <h1 style={{ margin: "0", fontSize: "clamp(22px,2.4vw,28px)", fontWeight: "700", letterSpacing: "-.02em" }}>
            Documents
          </h1>
          <span style={{ fontSize: "13px", color: "#6E6A7C", textWrap: "pretty" }}>
            Contracts, designs, receipts and approvals — stored against projects
          </span>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ height: "40px", width: "min(260px,100%)", border: "1px solid #E8E4EF", borderRadius: "10px", background: "#fff", display: "flex", alignItems: "center", gap: "8px", padding: "0 12px", color: "#6E6A7C" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={v.ic.search} />
            </svg>
            <input value={v.docQ ?? ''} onChange={v.onDocQ} placeholder="Search documents" style={{ flex: "1", border: "none", outline: "none", fontSize: "13px", minWidth: "0", background: "transparent" }} />
          </div>
          <button className="tm-h9" onClick={v.newDoc} style={{ height: "40px", padding: "0 16px", border: "none", background: "#6D3CC2", color: "#fff", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", flex: "none" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={v.ic.upload} />
            </svg>
            Upload
          </button>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {(v.docChips || []).map((c, _i0) => (
          <Fragment key={_i0}>
            <button onClick={c.on} style={{ height: "34px", padding: "0 14px", borderRadius: "17px", border: `1px solid ${c.bd}`, background: c.bg, color: c.c, fontSize: "12.5px", fontWeight: "600" }}>
              {c.l}
            </button>
          </Fragment>
        ))}
      </div>
      <div style={{ background: "#fff", border: "1px solid #E8E4EF", borderRadius: "14px", overflow: "hidden" }}>
        {(v.docRows || []).map((d, _i0) => (
          <Fragment key={_i0}>
            <div className="tm-h11" onClick={d.open} style={{ display: "flex", gap: "14px", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid #F1EEF6", cursor: "pointer" }}>
              <span style={{ width: "42px", height: "42px", borderRadius: "10px", background: d.extBg, color: d.extC, font: "700 10px 'IBM Plex Mono',monospace", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                {d.ext}
              </span>
              <div style={{ flex: "1", minWidth: "0", display: "flex", flexDirection: "column", gap: "3px" }}>
                <b style={{ fontSize: "13.5px", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.n}
                </b>
                <span style={{ fontSize: "12px", color: "#6E6A7C" }}>
                  {d.meta}
                </span>
              </div>
              <span style={{ fontSize: "12px", color: "#6E6A7C", flex: "none" }}>
                {d.sz}
              </span>
            </div>
          </Fragment>
        ))}
        {v.docEmpty ? (
          <>
            <div style={{ padding: "40px", textAlign: "center", color: "#6E6A7C", fontSize: "13px" }}>
              No documents match your search.
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
