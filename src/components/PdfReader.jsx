import { useEffect, useRef, useState } from 'react';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Older phones and browsers lack two things this PDF library uses; add them before it loads.
if (typeof Promise.withResolvers !== 'function') Promise.withResolvers = function () { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
if (typeof URL !== 'undefined' && typeof URL.parse !== 'function') URL.parse = (u, b) => { try { return new URL(u, b); } catch (e) { return null; } };

// Draws a PDF one page at a time, fitted to the space, and turns pages with a flip.
// Arrows, the keyboard (← → space) and a swipe move between pages.
export default function PdfReader({ url, name }) {
  const box = useRef(null), docRef = useRef(null), task = useRef(null), touch = useRef(null);
  const [n, setN] = useState(0), [page, setPage] = useState(1), [err, setErr] = useState(''), [dir, setDir] = useState(0), [flip, setFlip] = useState(0), [img, setImg] = useState(null), [pct, setPct] = useState(0);

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        // Range requests: the first page shows while the rest of a big file is still downloading.
        const loading = pdfjs.getDocument({ url, disableAutoFetch: true, rangeChunkSize: 262144 });
        loading.onProgress = p => { if (!off && p.total) setPct(Math.min(99, Math.round(p.loaded / p.total * 100))); };
        const doc = await loading.promise;
        if (off) return;
        docRef.current = doc; setN(doc.numPages); setPage(1);
      } catch (e) { console.error(e); if (!off) setErr('This PDF could not be shown here.'); }
    })();
    return () => { off = true; if (docRef.current) docRef.current.destroy(); docRef.current = null; };
  }, [url]);

  const draw = async () => {
    const doc = docRef.current, el = box.current;
    if (!doc || !el) return;
    const p = await doc.getPage(page);
    const base = p.getViewport({ scale: 1 });
    const scale = Math.min((el.clientWidth - 24) / base.width, (el.clientHeight - 24) / base.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const vp = p.getViewport({ scale: scale * dpr });
    if (task.current) { try { task.current.cancel(); } catch (e) { /* already done */ } }
    const off = document.createElement('canvas'); off.width = vp.width; off.height = vp.height;
    task.current = p.render({ canvasContext: off.getContext('2d'), viewport: vp });
    try { await task.current.promise; } catch (e) { return; }
    // The page is kept as a picture, so the flip animation (a new element) still shows it.
    setImg({ src: off.toDataURL('image/jpeg', 0.92), w: Math.floor(vp.width / dpr), h: Math.floor(vp.height / dpr) });
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
      {err ? <div className="pdf-msg"><p>{err}</p><a className="pdf-open" href={url} target="_blank" rel="noreferrer">Open the PDF</a></div> : !n || !img ? <p className="pdf-msg">Opening {name || 'document'}…{pct ? ' ' + pct + '%' : ''}</p> : null}
      <div className="pdf-stage">
        {img ? <img key={flip} src={img.src} width={img.w} height={img.h} className={'pdf-page' + (dir > 0 ? ' is-next' : dir < 0 ? ' is-prev' : '')} alt={(name || 'Document') + ', page ' + page + ' of ' + n} draggable={false} /> : null}
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
