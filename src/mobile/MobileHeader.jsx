import { faceStyle, faceText } from '../ui/kit';
import { useEffect, useState } from 'react';
import Icon, { Logo } from './Icon';

// Top bar: back button on inner screens, the screen title once the page's big title scrolls away,
// and search, profile and notifications.
export default function MobileHeader({ v }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 56);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [v.pageKey]);
  const ic = v.ic;

  return (
    <header className={'m-header' + (scrolled ? ' is-scrolled' : '')}>
      <div className="m-header-left">
        {v.showBack ? (
          <button className="m-back" onClick={() => { v.haptic(6); v.goBack(); }} aria-label="Back">
            <Icon d={ic.chevL} size={24} width={2.2} />
          </button>
        ) : (
          <button className="m-brand" onClick={() => v.goHome()} aria-label="Home">
            <Logo size={22} />
          </button>
        )}
        <span className="m-htitle"><b>{v.pageTitle}</b><small>Trinity Mark · {v.me.label.charAt(0) + v.me.label.slice(1).toLowerCase()}</small></span>
      </div>

      <div className="m-header-actions">
        <button className="m-hbtn" title="Search" aria-label="Search" onClick={v.openCmd}><Icon d={ic.search} size={20} /></button>
        <button className="m-avatar" style={faceStyle(v.me)} onClick={v.toggleMenu} aria-label={'Account · ' + v.me.n}>{faceText(v.me)}</button>
        <button className="m-hbtn m-bell" title="Notifications" aria-label="Notifications" onClick={v.goNotes}><Icon d={ic.bell} size={20} />{v.hasUnread ? <span className="m-badge">{v.unread > 99 ? '99+' : v.unread}</span> : null}</button>
      </div>
    </header>
  );
}
