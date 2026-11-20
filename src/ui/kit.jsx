// Building blocks for hand-written screens, matching the design's look (see src/styles/kit.css).
import Icon from '../mobile/Icon';

export const PageHead = ({ kicker, title, sub, children }) => (
  <div className="k-head">
    <div className="k-head-text">
      {kicker ? <span className="k-kicker">{kicker}</span> : null}
      <h1>{title}</h1>
      {sub ? <p>{sub}</p> : null}
    </div>
    {children ? <div className="k-head-actions">{children}</div> : null}
  </div>
);

export const Card = ({ title, aside, children, pad = true, className = '' }) => (
  <section className={'k-card ' + className}>
    {title ? <div className="k-card-head"><h3>{title}</h3>{aside}</div> : null}
    <div className={pad ? 'k-card-body' : ''}>{children}</div>
  </section>
);

export const Kpis = ({ items }) => (
  <div className="k-kpis">
    {items.map(k => (
      <div key={k.l} className="k-kpi">
        <span className="k-kpi-l">{k.l}</span>
        <b className={k.warn ? 'is-warn' : ''}>{k.v}</b>
        {k.n ? <span className="k-kpi-n">{k.n}</span> : null}
      </div>
    ))}
  </div>
);

export const Chips = ({ items }) => (
  <div className="k-chips" role="group" aria-label="Filter">
    {items.map(c => <button key={c.l} aria-pressed={c.on} className={c.on ? 'is-on' : ''} onClick={c.set}>{c.l}</button>)}
  </div>
);

export const Pill = ({ l, bg, fg }) => <span className="k-pill" style={{ background: bg, color: fg }}>{l}</span>;

export const Btn = ({ kind = 'primary', icon, children, ...rest }) => (
  <button className={'k-btn is-' + kind} {...rest}>{icon ? <Icon d={icon} size={15} width={2} /> : null}{children}</button>
);

// A person's face: their photo when they have one, else initials on their colour.
export const faceStyle = (p, extra) => Object.assign({ background: p && p.ph ? 'center / cover no-repeat url("' + p.ph + '")' : (p && p.c) || '#6E6A7C' }, extra || {});
export const faceText = p => (p && p.ph ? '' : (p && p.i) || '');
export const Avatar = ({ p, size = 26 }) => (
  <span className="k-avatar" title={p.n} style={faceStyle(p, { width: size, height: size, fontSize: size * 0.38 })}>{faceText(p)}</span>
);

// "1 roll", "3 rolls": units are stored in the plural.
export const qty = (n, u) => n + ' ' + (n === 1 && u && u.endsWith('s') ? u.slice(0, -1) : u);

export const Empty = ({ children }) => <div className="k-empty">{children}</div>;
