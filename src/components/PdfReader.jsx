import { useEffect, useRef, useState } from 'react';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Draws a PDF one page at a time, fitted to the space, and turns pages with a flip.
// Arrows, the keyboard (← → space) and a swipe move between pages.
export default function PdfReader({ url, name }) {
  const box = useRef(null), canvas = useRef(null), docRef = useRef(null), task = useRef(null), touch = useRef(null);
  const [n, setN] = useState(0), [page, setPage] = useState(1), [err, setErr] = useState(''), [dir, setDir] = useState(0), [flip, setFlip] = useState(0);

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        const doc = await pdfjs.getDocument({ url }).promise;
        if (off) return;
        docRef.current = doc; setN(doc.numPages); setPage(1);
      } catch (e) { console.error(e); if (!off) setErr('This PDF could not be opened.'); }
    })();
    return () => { off = true; if (docRef.current) docRef.current.destroy(); docRef.current = null; };
  }, [url]);

  const draw = async () => {
    const doc = docRef.current, el = box.current, cv = canvas.current;
    if (!doc || !el || !cv) return;
    const p = await doc.getPage(page);
    const base = p.getViewport({ scale: 1 });
    const scale = Math.min((el.clientWidth - 24) / base.width, (el.clientHeight - 24) / base.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const vp = p.getViewport({ scale: scale * dpr });
    if (task.current) { try { task.current.cancel(); } catch (e) { /* already done */ } }
    const off = document.createElement('canvas'); off.width = vp.width; off.height = vp.height;
    task.current = p.render({ canvasContext: off.getContext('2d'), viewport: vp });
    try { await task.current.promise; } catch (e) { return; }
    cv.width = vp.width; cv.height = vp.height;
    cv.style.width = Math.floor(vp.width / dpr) + 'px'; cv.style.height = Math.floor(vp.height / dpr) + 'px';
    cv.getContext('2d').drawImage(off, 0, 0);
    setFlip(f => f + 1);
  };
  useEffect(() => { draw(); }, [page, n]);
  useEffect(() => { const r = () => draw(); window.addEventListener('resize', r); return () => window.removeEventListener('resize', r); }, [page, n]);

  const go = d => { const to = Math.max(1, Math.min(n, page + d)); if (to !== page) { setDir(d); setPage(to); } };
  useEffect(() => {
    const key = e => { if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); go(1); } if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); } };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  });

  return (
    <div className="pdf" ref={box}
      onTouchStart={e => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={e => { const s = touch.current; touch.current = null; if (s == null) return; const dx = e.changedTouches[0].clientX - s; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); }}>
      {err ? <p className="pdf-msg">{err}</p> : !n ? <p className="pdf-msg">Opening {name || 'document'}…</p> : null}
      <div className="pdf-stage">
        <canvas key={flip} ref={canvas} className={'pdf-page' + (dir > 0 ? ' is-next' : dir < 0 ? ' is-prev' : '')} aria-label={n ? (name || 'Document') + ', page ' + page + ' of ' + n : ''} role="img" />
      </div>
      {n ? (
        <div className="pdf-nav">
          <button type="button" onClick={() => go(-1)} disabled={page <= 1} aria-label="Previous page">‹</button>
          <span>{page} / {n}</span>
          <button type="button" onClick={() => go(1)} disabled={page >= n} aria-label="Next page">›</button>
        </div>
      ) : null}
      {n > 1 && page > 1 ? <button type="button" className="pdf-side is-l" onClick={() => go(-1)} aria-label="Previous page (side)" /> : null}
      {n > 1 && page < n ? <button type="button" className="pdf-side is-r" onClick={() => go(1)} aria-label="Next page (side)" /> : null}
    </div>
  );
}
