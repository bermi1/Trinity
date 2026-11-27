// Keeps amounts and big numbers on one line, whatever their size (millions, billions): when a figure
// is wider than the space it has, its font is made smaller until it fits (never below MIN px).
// Runs on the whole page after every change, so every screen benefits without changing each one.

const MIN = 10;
// "TZS 2,849,700,000", "TZS 2.4B", "1,200", "85%", "−TZS 300K", "12 / 20" …
const FIGURE = /^[−-]?\s*(TZS\s*)?[−-]?\d[\d,.\s]*(\s?(B|M|K|bn|%|people|pax))?(\s*\/\s*\d[\d,.]*)?$/i;
const MONEY_IN_TEXT = /TZS\s?[−-]?\d/;
// Places that scroll sideways on purpose, or form fields, are left alone.
const SKIP = 'table, .k-scroll, [role=tablist], input, textarea, select, button.ff-pick-btn, .ff-quick, svg';

function candidates(root) {
  const out = [];
  root.querySelectorAll('b, strong, dd, h1, h2, h3, h4, em, span, div, small, p').forEach(el => {
    if (el.childElementCount) return;
    const t = (el.textContent || '').trim();
    if (!t || t.length > 32) return;
    if (!FIGURE.test(t) && !MONEY_IN_TEXT.test(t)) return;
    if (el.closest(SKIP)) return;
    out.push(el);
  });
  return out;
}

function overflows(el) {
  const p = el.parentElement;
  const own = el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1;
  return own || (p && p.clientWidth > 0 && p.scrollWidth > p.clientWidth + 1);
}

function fit(el) {
  // Start again from the page's own size each time (the space may have grown).
  if (el.dataset.fitFs) el.style.fontSize = '';
  el.style.whiteSpace = 'nowrap';
  if (!overflows(el)) { delete el.dataset.fitFs; return; }
  let fs = parseFloat(getComputedStyle(el).fontSize) || 16;
  el.dataset.fitFs = String(fs);
  while (fs > MIN && overflows(el)) { fs -= 1; el.style.fontSize = fs + 'px'; }
}

export function fitNumbers(root = document.body) {
  if (!root || typeof window === 'undefined') return;
  candidates(root).forEach(fit);
}

export function startFitNumbers(root = document.body) {
  if (typeof window === 'undefined' || !window.MutationObserver) return () => {};
  let t = null;
  const run = () => { if (t) clearTimeout(t); t = setTimeout(() => { t = null; try { fitNumbers(root); } catch (e) { /* never break the page */ } }, 120); };
  const mo = new MutationObserver(run);
  mo.observe(root, { childList: true, subtree: true, characterData: true });
  window.addEventListener('resize', run);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
  run();
  return () => { mo.disconnect(); window.removeEventListener('resize', run); };
}
