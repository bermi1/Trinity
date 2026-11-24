// Printable attendee list and QR poster (print or "Save as PDF"), with the Trinity Mark footer on every page.
import { badge, registerUrl } from './api';
import { conf, recolor } from './events';

const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const open = raw => { const html = recolor(raw.split('/event/logos.png').join(conf().logos).split('/event/pylons.jpg').join(conf().sky)); const w = window.open('', '_blank'); if (!w) return 'Ruhusu pop-ups ili kufungua · Allow pop-ups to open the PDF'; w.document.open(); w.document.write(html); w.document.close(); return ''; };
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
  const rows = regs.map((r, i) => `<tr><td>${i + 1}</td><td class=m>${badge(r.badge_no)}</td><td><b>${esc(r.full_name)}</b></td><td>${esc(r.phone)}</td><td>${esc(r.organization)}</td><td>${esc(r.position)}</td><td>${esc([r.region, r.district].filter(Boolean).join(', '))}</td><td>${esc(r.category)}</td><td>${r.mode === 'qr' ? 'QR' : 'Walk-in'}</td><td class=c>${r.checked_in ? '<svg width=12 height=12 viewBox="0 0 24 24" fill=none stroke="#0B5A2A" stroke-width=3 stroke-linecap=round stroke-linejoin=round><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : ''}</td><td class=sig></td></tr>`).join('');
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

// The self-registration QR poster: 'a3' prints on A3 paper (portrait), 'screen' fills a 16:9 TV or projector (1920×1080).
// No date or venue, so it stays valid whatever changes.
const SV = {
  scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M7 12h10"/>',
  form: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  pass: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M15 6v12" stroke-dasharray="2 2"/><path d="M7 10h4M7 14h3"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor" stroke="none"/>'
};
const sv = (n, s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${SV[n]}</svg>`;

export function posterHtml(ev, qrDataUrl, format, o, url) {
  const screen = format === 'screen', W = screen ? 1920 : 1123, H = screen ? 1080 : 1587;
  const steps = [['scan', 'Scan QR', 'Tumia kamera ya simu'], ['form', 'Jaza fomu fupi', 'Dakika moja tu'], ['pass', 'Pata pasi yako', 'Onyesha mezani']];
  const stepsHtml = steps.map(([ic, a, b], i) => `<div class=st><i>${sv(ic, screen ? 40 : 34)}</i><div><small>Hatua ${i + 1}</small><b>${a}</b><span>${b}</span></div></div>`).join('');
  const qrCard = `<div class=qrc><div class=rib>SCAN · UJISAJILI</div><span class="cn a"></span><span class="cn b"></span><span class="cn c"></span><span class="cn d"></span><img src="${qrDataUrl}" alt="QR"><div class=url>${esc(url.replace(/^https?:\/\//, ''))}</div></div>`;
  const head = `<div class=k><i></i>Usajili wa washiriki · Self-registration</div><h1${conf().keepCase ? ' style="text-transform:none"' : ''}>${esc(ev.title)}</h1><p class=sub>${esc(ev.subtitle)}</p>${ev.tagline ? `<div class=tag>${sv('bolt', screen ? 30 : 26)}${esc(ev.tagline)}</div>` : ''}`;
  const foot = `<div class=ft><span>Imeandaliwa na · Prepared by <img src="${o}/brand/trinity-logo-full.png" alt=""><b>TRINITY MARK SOLUTIONS</b></span><span>${esc(ev.tagline || '')}</span></div>`;
  return `<!doctype html><html lang=sw><head><meta charset=utf-8><title>Bango la QR · ${esc(ev.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet"><style>
*{box-sizing:border-box}html,body{margin:0;background:#2a2a2a}body{font-family:Manrope,'Segoe UI',Arial,sans-serif;color:#13261A;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.bar{position:fixed;top:12px;right:12px;z-index:9}.bar button{padding:10px 18px;border:none;border-radius:10px;background:#0B5A2A;color:#fff;font:700 14px Manrope,Arial;cursor:pointer}
.pg{position:relative;width:${W}px;height:${H}px;margin:0 auto;overflow:hidden;background:radial-gradient(${screen ? '900px 700px at 100% 0%' : '800px 700px at 100% 0%'},#FFE2A3 0%,transparent 60%),radial-gradient(700px 600px at 0% 40%,#E2F3E7 0%,transparent 60%),linear-gradient(170deg,#FFFDF8 0%,#FFF5DF 60%,#FDE3B4 100%)}
.edge{position:absolute;left:0;top:0;bottom:0;width:${screen ? 16 : 14}px;background:linear-gradient(#0B5A2A,#F5C04A 55%,#F2A33A)}
.py{position:absolute;left:0;right:0;bottom:0;height:${screen ? 300 : 330}px;background:url(${o}/event/pylons.jpg) bottom center/auto 100% repeat-x;opacity:.42;-webkit-mask-image:linear-gradient(to top,#000 40%,transparent);mask-image:linear-gradient(to top,#000 40%,transparent)}
.logos{position:absolute;background:#fff;border-radius:28px;display:flex;align-items:center;justify-content:center;box-shadow:0 14px 34px rgba(11,90,42,.12)}
.logos img{height:100%;max-width:100%;object-fit:contain}
.k{display:inline-flex;align-items:center;gap:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#9A6A00;background:rgba(245,192,74,.2);border-radius:999px}
.k i{width:12px;height:12px;border-radius:50%;background:#F2A33A;box-shadow:0 0 0 6px rgba(242,163,58,.2)}
h1{margin:0;font-weight:800;text-transform:uppercase;letter-spacing:-.02em;line-height:.96;color:#0B5A2A}
.sub{margin:0;font-weight:600;color:#24472F;line-height:1.35}
.tag{display:inline-flex;align-items:center;gap:12px;background:linear-gradient(135deg,#14833D,#0B5A2A 55%,#063A1B);color:#F5C04A;font-weight:800;border-radius:16px;box-shadow:0 14px 26px -10px rgba(11,90,42,.55)}
.qrc{position:relative;background:#fff;border-radius:36px;box-shadow:0 40px 70px -30px rgba(6,58,27,.55),0 0 0 1px rgba(11,90,42,.06);display:grid;justify-items:center}
.qrc img{display:block}
.rib{position:absolute;left:50%;transform:translateX(-50%);background:#0B5A2A;color:#fff;font-weight:800;letter-spacing:.18em;border-radius:999px;white-space:nowrap;box-shadow:0 10px 20px -8px rgba(11,90,42,.6)}
.cn{position:absolute;border:6px solid #F2A33A}.cn.a{border-right:0;border-bottom:0;border-top-left-radius:16px}.cn.b{border-left:0;border-bottom:0;border-top-right-radius:16px}.cn.c{border-right:0;border-top:0;border-bottom-left-radius:16px}.cn.d{border-left:0;border-top:0;border-bottom-right-radius:16px}
.url{font-weight:700;color:#3E5546;letter-spacing:.02em}
.sts{display:grid;gap:14px}.st{display:flex;align-items:center;gap:16px;background:rgba(255,255,255,.78);border:1px solid rgba(255,255,255,.95);border-radius:20px;box-shadow:0 10px 24px -14px rgba(19,38,26,.3)}
.st i{flex:none;display:grid;place-items:center;border-radius:16px;background:linear-gradient(135deg,#14833D,#0B5A2A);color:#fff}
.st small{display:block;font-size:.62em;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#9A6A00}.st b{display:block;font-weight:800;color:#0B5A2A}.st span{display:block;font-weight:600;color:#56685B;font-size:.78em}
.ft{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;align-items:center;font-weight:700;color:#24472F;background:rgba(255,253,248,.88);border-top:3px solid #0B5A2A}
.ft span{display:flex;align-items:center;gap:12px}.ft img{height:1.9em}.ft b{color:#1B2A4A;letter-spacing:.05em}
${screen ? `
.logos{left:80px;right:80px;top:48px;height:120px;padding:16px 40px}
.L{position:absolute;left:96px;top:230px;width:960px;display:grid;gap:26px;justify-items:start}
.k{font-size:22px;padding:10px 20px}h1{font-size:104px}.sub{font-size:30px;max-width:900px}.tag{font-size:34px;padding:14px 26px}
.sts{grid-template-columns:repeat(3,1fr);width:960px;margin-top:10px;font-size:26px}.st{padding:16px 18px}.st i{width:66px;height:66px}
.qrc{position:absolute;right:120px;top:236px;width:620px;padding:64px 60px 34px}.qrc img{width:500px;height:500px}
.rib{top:-26px;font-size:24px;padding:12px 30px}.url{margin-top:18px;font-size:24px}
.cn{width:64px;height:64px}.cn.a{left:22px;top:22px}.cn.b{right:22px;top:22px}.cn.c{left:22px;bottom:84px}.cn.d{right:22px;bottom:84px}
.ft{height:72px;padding:0 80px;font-size:22px}
@page{size:1920px 1080px;margin:0}` : `
.logos{left:64px;right:64px;top:56px;height:132px;padding:18px 40px}
.T{position:absolute;left:0;right:0;top:236px;display:grid;justify-items:center;text-align:center;gap:20px;padding:0 80px}
.k{font-size:19px;padding:9px 18px}h1{font-size:86px}.sub{font-size:25px;max-width:900px}.tag{font-size:28px;padding:12px 24px}
.qrc{position:absolute;left:50%;transform:translateX(-50%);top:720px;width:560px;padding:58px 54px 30px}.qrc img{width:452px;height:452px}
.rib{top:-24px;font-size:21px;padding:11px 28px}.url{margin-top:16px;font-size:21px}
.cn{width:56px;height:56px}.cn.a{left:20px;top:20px}.cn.b{right:20px;top:20px}.cn.c{left:20px;bottom:76px}.cn.d{right:20px;bottom:76px}
.sts{position:absolute;left:64px;right:64px;top:1340px;grid-template-columns:repeat(3,1fr);font-size:22px}.st{padding:14px 16px}.st i{width:58px;height:58px}
.ft{height:66px;padding:0 64px;font-size:18px}
@page{size:A3 portrait;margin:0}`}
@media print{html,body{background:none}.bar{display:none}.pg{margin:0}}
</style></head><body><div class=bar><button onclick="print()">Print / Save PDF</button></div>
<div class=pg><div class=py></div><div class=edge></div><div class=logos><img src="${o}/event/logos.png" alt=""></div>
${screen ? `<div class=L>${head}<div class=sts>${stepsHtml}</div></div>${qrCard}` : `<div class=T>${head}</div>${qrCard}<div class=sts>${stepsHtml}</div>`}
${foot}</div></body></html>`;
}

export function printPoster(ev, qrDataUrl, format = 'a3') {
  return open(posterHtml(ev, qrDataUrl, format, location.origin, registerUrl()));
}
