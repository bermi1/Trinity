// The attendee's personal pass: a designed image (1080×1500) with their name, number and QR code,
// drawn in the browser so it can be saved to the phone or shared on WhatsApp.
import QRCode from 'qrcode';
import { badge, passCode } from './api';

const G = '#0B5A2A', G2 = '#063A1B', GOLD = '#F5C04A', ORANGE = '#F2A33A', INK = '#13261A';
const load = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
const font = (w, px) => `${w} ${px}px Manrope, 'Segoe UI', Arial, sans-serif`;

// Line icons drawn on the pass (same shapes as icons.jsx).
const ICON = { calendar: ['M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M3 10h18', 'M8 3v4', 'M16 3v4'], pin: ['M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z', 'M14.5 9a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z'] };
function icon(c, n, x, y, size, color) {
  c.save(); c.translate(x, y); c.scale(size / 24, size / 24); c.strokeStyle = color; c.lineWidth = 2; c.lineCap = 'round'; c.lineJoin = 'round';
  ICON[n].forEach(d => c.stroke(new Path2D(d))); c.restore();
}
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function lines(c, text, max) {
  const out = []; let cur = '';
  String(text || '').split(/\s+/).forEach(w => { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > max && cur) { out.push(cur); cur = w; } else cur = t; });
  if (cur) out.push(cur);
  return out;
}
function fit(c, text, weight, px, max) { let s = px; c.font = font(weight, s); while (c.measureText(text).width > max && s > 18) { s -= 2; c.font = font(weight, s); } return s; }

export async function drawPass(ev, reg) {
  try { await document.fonts.ready; } catch (e) { /* fonts optional */ }
  const W = 1080, H = 1500, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  const [logos, pylons, qr] = await Promise.all([
    load('/event/logos.png'), load('/event/pylons.jpg'),
    QRCode.toDataURL(passCode(reg), { width: 520, margin: 1, errorCorrectionLevel: 'M', color: { dark: G2, light: '#FFFFFF' } }).then(load)
  ]);

  // Background: deep green with a warm sunrise glow and the pylons along the bottom.
  const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, G); bg.addColorStop(1, G2); c.fillStyle = bg; c.fillRect(0, 0, W, H);
  const glow = c.createRadialGradient(W - 120, 140, 20, W - 120, 140, 620); glow.addColorStop(0, 'rgba(245,192,74,.45)'); glow.addColorStop(1, 'rgba(245,192,74,0)'); c.fillStyle = glow; c.fillRect(0, 0, W, H);
  if (pylons) { c.globalAlpha = 0.22; const ph = (W / pylons.width) * pylons.height; c.drawImage(pylons, 0, H - ph - 40, W, ph); c.globalAlpha = 1; }

  // Partner logos on a white strip.
  rr(c, 60, 56, W - 120, 150, 30); c.fillStyle = '#fff'; c.fill();
  if (logos) { const lw = W - 200, lh = (lw / logos.width) * logos.height; c.drawImage(logos, 100, 56 + (150 - lh) / 2, lw, lh); }

  // Title block.
  c.fillStyle = GOLD; c.font = font(800, 26); c.letterSpacing = '6px'; c.fillText('PASI YA MSHIRIKI · ATTENDEE PASS', 72, 280); c.letterSpacing = '0px';
  c.fillStyle = '#fff'; c.font = font(800, 68);
  let y = 360; lines(c, (ev.title || '').toUpperCase(), W - 144).forEach(l => { c.fillText(l, 72, y); y += 74; });
  c.fillStyle = 'rgba(255,255,255,.82)'; c.font = font(500, 28);
  lines(c, ev.subtitle, W - 144).slice(0, 3).forEach(l => { c.fillText(l, 72, y + 4); y += 38; });
  if (ev.tagline) { c.font = font(800, 30); const tw = c.measureText(ev.tagline).width + 48; rr(c, 72, y + 24, tw, 58, 16); c.fillStyle = ORANGE; c.fill(); c.fillStyle = G2; c.fillText(ev.tagline, 96, y + 64); y += 82; }

  // The ticket card.
  const ty = Math.max(y + 50, 720), th = 560;
  c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 40; c.shadowOffsetY = 16; rr(c, 60, ty, W - 120, th, 36); c.fillStyle = '#FFFDF7'; c.fill(); c.restore();
  // Tear-off notches and dashed line between the details and the QR code.
  const cut = W - 120 - 380 + 60;
  c.fillStyle = G2; [ty, ty + th].forEach(yy => { c.beginPath(); c.arc(cut, yy, 26, 0, Math.PI * 2); c.fill(); });
  c.strokeStyle = '#E3DCC8'; c.setLineDash([12, 12]); c.lineWidth = 3; c.beginPath(); c.moveTo(cut, ty + 40); c.lineTo(cut, ty + th - 40); c.stroke(); c.setLineDash([]);

  // Details.
  const lx = 108, lw = cut - lx - 40;
  c.fillStyle = '#7A6A3A'; c.font = font(800, 22); c.letterSpacing = '4px'; c.fillText('JINA · NAME', lx, ty + 74); c.letterSpacing = '0px';
  c.fillStyle = INK; let ny = ty + 128; const nameSize = fit(c, reg.full_name, 800, 50, lw);
  c.font = font(800, nameSize); lines(c, reg.full_name, lw).slice(0, 2).forEach(l => { c.fillText(l, lx, ny); ny += nameSize + 8; });
  c.fillStyle = '#4B5E51'; c.font = font(600, 26);
  [reg.position, reg.organization].filter(Boolean).forEach(t => { c.fillText(lines(c, t, lw)[0], lx, ny + 4); ny += 36; });
  if (reg.category) { c.font = font(700, 24); const cw = c.measureText(reg.category).width + 36; rr(c, lx, ny + 18, cw, 46, 23); c.fillStyle = '#EAF6EE'; c.fill(); c.fillStyle = G; c.fillText(reg.category, lx + 18, ny + 50); }
  c.fillStyle = '#7A6A3A'; c.font = font(800, 22); c.letterSpacing = '4px'; c.fillText('NAMBA · NO.', lx, ty + th - 130); c.letterSpacing = '0px';
  c.fillStyle = G; c.font = `800 104px 'IBM Plex Mono', ui-monospace, Menlo, monospace`; c.fillText(badge(reg.badge_no), lx - 4, ty + th - 40);

  // QR code.
  const qs = 300, qx = cut + (W - 60 - cut - qs) / 2, qy = ty + 90;
  if (qr) c.drawImage(qr, qx, qy, qs, qs);
  c.fillStyle = '#4B5E51'; c.font = font(700, 22); c.textAlign = 'center';
  c.fillText('Onyesha mezani', qx + qs / 2, qy + qs + 50); c.font = font(500, 20); c.fillText('Show at the desk', qx + qs / 2, qy + qs + 80); c.textAlign = 'left';

  // When and where, then the Trinity footer.
  const when = [ev.event_date, ev.event_time].filter(Boolean).join(' · ');
  let wy = ty + th + 80; c.fillStyle = '#fff'; c.font = font(700, 30);
  if (when) { icon(c, 'calendar', 72, wy - 28, 34, GOLD); c.fillText(when, 122, wy); wy += 52; }
  if (ev.venue) { icon(c, 'pin', 72, wy - 28, 34, GOLD); c.fillText(lines(c, ev.venue, W - 220)[0], 122, wy); }
  c.fillStyle = 'rgba(255,255,255,.75)'; c.font = font(600, 22); c.textAlign = 'center'; c.fillText('Imeandaliwa na · Prepared by  TRINITY MARK SOLUTIONS', W / 2, H - 40); c.textAlign = 'left';
  return cv.toDataURL('image/png');
}

// Saves the pass to the phone, or opens the share sheet (WhatsApp, etc.) where the phone allows it.
export async function sharePass(url, reg) {
  const name = 'Pasi-Nishati-' + badge(reg.badge_no) + '.png';
  try {
    const blob = await (await fetch(url)).blob(), file = new File([blob], name, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Pasi yangu · Mpango wa Nishati wa Taifa' }); return; }
  } catch (e) { /* fall back to download */ }
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
