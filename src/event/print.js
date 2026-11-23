// Printable attendee list and QR poster (print or "Save as PDF"), with the Trinity Mark footer on every page.
import { badge, registerUrl } from './api';

const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const open = html => { const w = window.open('', '_blank'); if (!w) return 'Ruhusu pop-ups ili kufungua · Allow pop-ups to open the PDF'; w.document.open(); w.document.write(html); w.document.close(); return ''; };
const BASE = `body{font:12px/1.45 Arial,Helvetica,sans-serif;color:#13261A;background:#EDEAE2;margin:0}.p{background:#fff;margin:14px auto;padding:12mm}
.bar{position:fixed;top:10px;right:10px}.bar button{padding:9px 16px;border:none;border-radius:9px;background:#0B5A2A;color:#fff;font-weight:700;cursor:pointer}
@media print{.bar{display:none}body{background:#fff}.p{margin:0;box-shadow:none}}
.tm{display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:2px solid #0B5A2A;padding-top:6px;margin-top:12px;font-size:10px;color:#3E5546}
.tm span{display:flex;align-items:center;gap:8px}.tm img{height:18px}.tm b{color:#1B2A4A;letter-spacing:.04em}
@media print{.tm{position:fixed;left:8mm;right:8mm;bottom:4mm;margin:0;background:#fff}.p{padding-bottom:16mm}}`;
const FOOT = (o, extra) => `<div class=tm><span>Imeandaliwa na · Prepared by <img src="${o}/brand/trinity-logo-full.png" alt=""><b>TRINITY MARK SOLUTIONS</b></span><span>${extra || ''}</span></div>`;

export function printList(ev, regs, filterLabel) {
  const o = location.origin, when = [ev.event_date, ev.event_time, ev.venue].filter(Boolean).join(' · ');
  const qr = regs.filter(r => r.mode === 'qr').length, walk = regs.length - qr, inn = regs.filter(r => r.checked_in).length;
  const rows = regs.map((r, i) => `<tr><td>${i + 1}</td><td class=m>${badge(r.badge_no)}</td><td><b>${esc(r.full_name)}</b></td><td>${esc(r.phone)}</td><td>${esc(r.organization)}</td><td>${esc(r.position)}</td><td>${esc([r.region, r.district].filter(Boolean).join(', '))}</td><td>${esc(r.category)}</td><td>${r.mode === 'qr' ? 'QR' : 'Walk-in'}</td><td class=c>${r.checked_in ? '✓' : ''}</td><td class=sig></td></tr>`).join('');
  return open(`<!doctype html><html><head><meta charset=utf-8><title>Orodha ya Washiriki · ${esc(ev.title)}</title><style>${BASE}
.p{width:277mm}.hd{text-align:center;border-bottom:3px solid #0B5A2A;padding-bottom:8px}.hd img{height:44px}.hd h1{margin:8px 0 2px;font-size:20px;color:#0B5A2A;letter-spacing:.02em}.hd p{margin:0;color:#3E5546}
.sum{display:flex;gap:10px;margin:10px 0}.sum div{flex:1;background:#F4F1E6;border-radius:8px;padding:8px 10px}.sum b{display:block;font-size:18px;color:#0B5A2A}
table{width:100%;border-collapse:collapse}th{background:#0B5A2A;color:#fff;text-align:left;padding:6px 5px;font-size:10.5px;text-transform:uppercase;letter-spacing:.04em}td{padding:6px 5px;border-bottom:1px solid #E4E0D4;vertical-align:top}
tr:nth-child(even) td{background:#FBFAF5}.m{font-family:monospace;font-weight:700}.c{text-align:center;color:#0B5A2A;font-weight:700}.sig{width:70px}@page{size:A4 landscape;margin:8mm}</style></head><body><div class=bar><button onclick="print()">Print / Save PDF</button></div><div class=p>
<div class=hd><img src="${o}/event/logos.png" alt=""><h1>${esc(ev.title).toUpperCase()}</h1><p>${esc(ev.subtitle)}</p>${when ? `<p><b>${esc(when)}</b></p>` : ''}</div>
<div class=sum><div><b>${regs.length}</b>Washiriki${filterLabel ? ' · ' + esc(filterLabel) : ''}</div><div><b>${qr}</b>Walijisajili kwa QR</div><div><b>${walk}</b>Walk-in</div><div><b>${inn}</b>Wamefika (checked in)</div></div>
<table><thead><tr><th>#</th><th>Namba</th><th>Jina</th><th>Simu</th><th>Taasisi</th><th>Cheo</th><th>Mkoa / Wilaya</th><th>Kundi</th><th>Usajili</th><th>Amefika</th><th>Sahihi</th></tr></thead><tbody>${rows || '<tr><td colspan=11>Hakuna washiriki bado.</td></tr>'}</tbody></table>
${FOOT(o, 'Imechapishwa ' + new Date().toLocaleString('en-GB'))}</div></body></html>`);
}

export function printPoster(ev, qrDataUrl) {
  const o = location.origin, when = [ev.event_date, ev.event_time, ev.venue].filter(Boolean).join(' · ');
  return open(`<!doctype html><html><head><meta charset=utf-8><title>QR ya Usajili · ${esc(ev.title)}</title><style>${BASE}
.p{width:190mm;min-height:270mm;box-sizing:border-box;text-align:center;background:linear-gradient(#FFFDF6 55%,#FDE9C4);position:relative;overflow:hidden}
.p img.l{width:100%;max-width:170mm}.p h1{margin:12mm 0 3mm;font-size:34px;color:#0B5A2A;line-height:1.05}.p .s{font-size:14px;color:#2F4A39;margin:0 10mm}
.tag{display:inline-block;margin-top:5mm;background:#0B5A2A;color:#F5C04A;font-weight:800;padding:6px 14px;border-radius:8px;font-size:15px}
.qr{margin:7mm auto 4mm;background:#fff;padding:5mm;border-radius:6mm;display:inline-block;box-shadow:0 2mm 6mm rgba(0,0,0,.12)}.qr img{width:85mm;height:85mm;display:block}
.cta{font-size:22px;font-weight:800;color:#0B5A2A;margin:2mm 0}.en{color:#3E5546;font-size:14px}.url{font-family:monospace;font-size:12px;color:#3E5546;margin-top:3mm}.when{margin-top:4mm;font-weight:700;color:#13261A}
.pl{position:absolute;left:0;right:0;bottom:0;width:100%;opacity:.55}.pfoot{position:absolute;left:10mm;right:10mm;bottom:6mm}.pfoot .tm{position:static;background:transparent}
@page{size:A4;margin:8mm}</style></head><body><div class=bar><button onclick="print()">Print / Save PDF</button></div><div class=p>
<img class=pl src="${o}/event/pylons.jpg" alt=""><img class=l src="${o}/event/logos.png" alt="">
<h1>${esc(ev.title).toUpperCase()}</h1><p class=s>${esc(ev.subtitle)}</p>${ev.tagline ? `<div><span class=tag>${esc(ev.tagline)}</span></div>` : ''}
<div class=qr><img src="${qrDataUrl}" alt="QR"></div><div class=cta>Scan ujisajili</div><div class=en>Scan to register</div><div class=url>${esc(registerUrl())}</div>${when ? `<div class=when>${esc(when)}</div>` : ''}
<div class=pfoot>${FOOT(o, 'TRINITY.MARK.SOLUTIONS © ' + new Date().getFullYear())}</div></div></body></html>`);
}
