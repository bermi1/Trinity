import { useEffect, useRef, useState } from 'react';

// Bottom sheet that slides up, and closes on a downward swipe, a tap outside or Escape.
export default function Sheet({ onClose, children, label, maxHeight = '88vh', footer }) {
  const [dy, setDy] = useState(0);
  const [closing, setClosing] = useState(false);
  const drag = useRef(null);
  const dyRef = useRef(0);
  const panel = useRef(null);

  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 200);
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Drag from the handle area, or anywhere when the content is scrolled to the top.
  const start = e => {
    const body = panel.current?.querySelector('[data-sheet-body]');
    if (body && body.scrollTop > 0 && !e.target.closest('[data-sheet-grip]')) return;
    drag.current = { y: e.touches[0].clientY, t: Date.now() };
  };
  const move = e => {
    if (!drag.current) return;
    const d = e.touches[0].clientY - drag.current.y;
    dyRef.current = Math.max(0, d);
    setDy(dyRef.current);
  };
  const end = () => {
    if (!drag.current) return;
    const moved = dyRef.current, fast = moved > 40 && Date.now() - drag.current.t < 250;
    drag.current = null; dyRef.current = 0;
    if (moved > 110 || fast) close(); else setDy(0);
  };

  return (
    <div className="m-sheet-root" role="presentation">
      <div className={'m-backdrop' + (closing ? ' is-out' : '')} onClick={close} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={'m-sheet' + (closing ? ' is-out' : '')}
        style={{ maxHeight, transform: dy ? `translateY(${dy}px)` : undefined, transition: dy && drag.current ? 'none' : undefined }}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
        onKeyDown={e => { if (e.key === 'Escape') close(); }}
      >
        <div data-sheet-grip className="m-sheet-grip"><span /></div>
        <div data-sheet-body className="m-sheet-body">{typeof children === 'function' ? children(close) : children}</div>
        {footer ? <div className="m-sheet-footer">{typeof footer === 'function' ? footer(close) : footer}</div> : null}
      </div>
    </div>
  );
}
