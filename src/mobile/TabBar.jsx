import Icon from './Icon';

// Bottom tab bar, sized for thumbs and the home indicator.
export default function TabBar({ v, hidden }) {
  return (
    <nav className={'m-tabbar' + (hidden ? ' is-hidden' : '')} aria-label="Main">
      {v.mobileTabs.map(t => {
        const on = t.bar !== 'transparent';
        return (
          <button key={t.l} className={'m-tab' + (on ? ' is-on' : '')} aria-current={on ? 'page' : undefined} onClick={() => { v.haptic(6); t.on(); }}>
            <span className="m-tab-icon">
              <Icon d={t.ic} size={23} width={on ? 2.1 : 1.8} />
              {t.hb ? <span className="m-badge">{t.b > 99 ? '99+' : t.b}</span> : null}
            </span>
            <span className="m-tab-label">{t.l}</span>
          </button>
        );
      })}
    </nav>
  );
}
