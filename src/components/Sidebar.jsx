// Side navigation: light and quiet, like Zoho and Odoo. Everyday pages first; the rest fold under "More".
export default function Sidebar({ v }) {
  return (
    <aside className="sn" style={{ position: v.sb.pos, zIndex: v.sb.z }}>
      <button type="button" className="sn-brand" onClick={v.goHome} aria-label="Home">
        <svg width="22" height="26" viewBox="138 118 176 196" fill="none" stroke="#B49A5A" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round">
          <path d="M153 130 V186 Q153 214 182 214 H274 Q304 214 284 240 L214 298 Q205 306 196 298 L168 248" /><path d="M201 158 H266" />
        </svg>
        <span><b>Trinity Mark</b><small>{v.me.label.charAt(0) + v.me.label.slice(1).toLowerCase()}</small></span>
      </button>
      <nav className="sn-nav">
        {(v.nav || []).map((g, gi) => (
          <div key={gi} className="sn-group">
            {g.more ? (
              <button type="button" className="sn-more" aria-expanded={g.open} onClick={g.toggle}>
                <span>{g.open ? 'Less' : 'More'}</span>
                {!g.open && g.count ? <span className="sn-n">{g.count}</span> : null}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ transform: g.open ? 'rotate(180deg)' : 'none' }}><path d="M6 9l6 6 6-6" /></svg>
              </button>
            ) : null}
            {(g.open ? g.items || [] : []).map(it => (
              <button key={it.l} type="button" className={'sn-item' + (it.on ? ' is-on' : '')} aria-current={it.on ? 'page' : undefined} onClick={it.go}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={it.ic} /></svg>
                <span>{it.l}</span>
                {it.hb ? <span className="sn-n">{it.b}</span> : null}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
