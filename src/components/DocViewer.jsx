import { useEffect, useRef } from 'react';
import PdfReader from './PdfReader';

// Opens a PDF or picture inside the site, over the page, instead of a new tab or a download.
export default function DocViewer({ doc, onClose }) {
  const ref = useRef(null);
  const full = () => { const el = ref.current; try { if (document.fullscreenElement) document.exitFullscreen(); else if (el && el.requestFullscreen) el.requestFullscreen().catch(() => {}); } catch (e) { /* not supported */ } };
  const close = () => { try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { /* ignore */ } onClose(); };
  useEffect(() => { try { if (ref.current && ref.current.requestFullscreen) ref.current.requestFullscreen().catch(() => {}); } catch (e) { /* ignore */ } }, []);
  useEffect(() => {
    const key = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', key);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', key); document.body.style.overflow = prev; };
  }, []);
  return (
    <div className="dv" ref={ref} role="dialog" aria-label={'Viewing ' + doc.n}>
      <header className="dv-bar">
        <b title={doc.n}>{doc.n}</b>
        <div className="dv-acts">
          <button type="button" onClick={full} aria-label="Full screen">⛶</button>
          <a href={doc.url} download={doc.n}>Download</a>
          <button type="button" onClick={close} aria-label="Close document">✕</button>
        </div>
      </header>
      <div className="dv-body">
        {doc.kind === 'img' ? <img src={doc.url} alt={doc.n} /> : <PdfReader url={doc.url} name={doc.n} />}
      </div>
    </div>
  );
}
