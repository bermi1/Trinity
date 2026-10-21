import { useEffect, useRef, useState } from 'react';

const TRIGGER = 72;

// Pull down from the top of a screen to reload its data.
export default function PullToRefresh({ onRefresh, disabled }) {
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const start = useRef(null);
  const pulled = useRef(0);

  useEffect(() => {
    if (disabled) return;
    const down = e => { start.current = window.scrollY <= 0 && !busy ? e.touches[0].clientY : null; };
    const move = e => {
      if (start.current == null) return;
      const d = e.touches[0].clientY - start.current;
      pulled.current = d > 0 && window.scrollY <= 0 ? Math.min(120, d * 0.55) : 0;
      setPull(pulled.current);
    };
    const up = async () => {
      if (start.current == null) return;
      start.current = null;
      const amount = pulled.current;
      pulled.current = 0;
      if (amount >= TRIGGER) {
        setBusy(true); setPull(TRIGGER);
        try { await onRefresh(); } finally { setBusy(false); setPull(0); }
      } else setPull(0);
    };
    window.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', up);
    return () => { window.removeEventListener('touchstart', down); window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up); };
  }, [busy, disabled, onRefresh]);

  if (!pull && !busy) return null;
  return (
    <div className="m-ptr" style={{ height: pull }} aria-live="polite">
      <span className={'m-ptr-dot' + (busy ? ' is-busy' : '')} style={{ transform: `rotate(${pull * 4}deg)`, opacity: Math.min(1, pull / TRIGGER) }} />
      {busy ? <span className="m-ptr-label">Refreshing…</span> : pull >= TRIGGER ? <span className="m-ptr-label">Release to refresh</span> : null}
    </div>
  );
}
