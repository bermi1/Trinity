import { useEffect, useState } from 'react';
import Icon, { Logo } from './Icon';

// Top bar: back button on inner screens, the screen title once the page's big title scrolls away,
// and search, assistant, alerts and profile.
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
            <Icon d={ic.chevL} size={24} width={2.2} /><span>Back</span>
          </button>
        ) : (
          <button className="m-brand" onClick={() => v.goHome()} aria-label="Home">
            <Logo size={22} />
          </button>
        )}
      </div>
      <div className="m-header-title" aria-live="polite">
        <b>{v.pageTitle}</b>
        <span>360 · {v.me.label}</span>
      </div>
      <div className="m-header-actions">
        <button className="m-hbtn" title="Search" aria-label="Search" onClick={v.openCmd}><Icon d={ic.search} size={20} /></button>
        <button className="m-hbtn is-gold" title="Trinity Intelligence" aria-label="Trinity Intelligence" onClick={v.openAI}><Icon d={ic.sparkle} size={20} /></button>
        <button className="m-avatar" style={{ background: v.me.c }} onClick={v.toggleMenu} aria-label={'Account · ' + v.me.n}>{v.me.i}</button>
      </div>
    </header>
  );
}
