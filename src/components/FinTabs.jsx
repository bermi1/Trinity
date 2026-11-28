// Finance's grouped pages: "Pay & approve" (My queue · Requests · Receipts) and "Invoices & finance"
// (Overview · Invoices · Company cash book · Finance reports) — one menu item, the pages as tabs.
export default function FinTabs({ v }) {
  if (!v.finTabs) return null;
  return (
    <div className="rc-smart fin-tabs" role="tablist" aria-label="Pages in this group">
      {v.finTabs.map(t => (
        <button key={t.k} type="button" role="tab" aria-selected={t.on} className={t.on ? 'is-on' : ''} onClick={t.go}>
          <span>{t.l}</span>{t.n ? <b className="fin-n">{t.n}</b> : null}
        </button>
      ))}
    </div>
  );
}
