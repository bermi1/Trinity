// Every event the registration system has run. The active one is what /register and the desk open;
// the others stay as history (their lists can still be opened and printed).
export const EVENTS = {
  'kilimo-sasa-2026': {
    id: 'kilimo-sasa-2026', code: 'KILIMO-2026', short: 'Kilimo Sasa', keepCase: true,
    title: 'iMbeju Kilimo Sasa', subtitle: 'Joint Programme Launch · Uzinduzi wa Programu ya Pamoja',
    tagline: 'Kilimo Sasa', event_date: '25 Novemba 2026', event_time: '', venue: 'Hyatt Regency (The Kilimanjaro), Dar es Salaam',
    message: 'Asante kwa kujisajili. Karibu kwenye uzinduzi wa iMbeju Kilimo Sasa. Tafadhali fika mapema na uonyeshe namba yako ya usajili mezani.',
    logos: '/event/kilimo/logos.png', logosAlt: 'CRDB Bank Foundation · iMbeju Kilimo Sasa · Rabo Foundation',
    hero: '/event/kilimo/hero.jpg', sky: '/event/kilimo/field.jpg',
    categories: ['Serikali', 'CRDB Bank Foundation', 'Rabo Foundation', 'iMbeju', 'Mkulima / Farmer', 'Taasisi ya Fedha', 'Vyombo vya Habari', 'Mengineyo'],
    theme: { g: '#1A8A3C', g2: '#2DB451', g3: '#0D5A26', gold: '#B9EB7A', o: '#7CCB4E', cream: '#F2FAF3', ink: '#10261A' }
  },
  'nishati-2026': {
    id: 'nishati-2026', code: 'NISHATI-2026', short: 'Nishati wa Taifa',
    title: 'Mpango wa Nishati wa Taifa', subtitle: 'Kikao cha Tathmini ya Utekelezaji wa Mpango wa Kuharakisha Uanganishaji wa Umeme kwa Kaya',
    tagline: 'Kila Kaya Itawaka', event_date: '', event_time: '', venue: '',
    message: 'Asante kwa kujisajili. Tunakukaribisha kuhudhuria kikao hiki muhimu. Tafadhali fika mapema na uonyeshe namba yako ya usajili mezani.',
    logos: '/event/logos.png', logosAlt: 'Serikali ya Tanzania · TANESCO · CRDB Bank Foundation · iMbeju Nuru',
    hero: '', sky: '/event/pylons.jpg',
    categories: ['Serikali', 'TANESCO', 'CRDB Bank Foundation', 'iMbeju Nuru', 'Kiongozi wa Jamii', 'Mwananchi / Kaya', 'Vyombo vya Habari', 'Mengineyo'],
    theme: { g: '#0B5A2A', g2: '#14833D', g3: '#063A1B', gold: '#F5C04A', o: '#F2A33A', cream: '#FFF8EA', ink: '#13261A' }
  }
};
export const ACTIVE_EVENT = 'kilimo-sasa-2026';
export const EVENT_ORDER = ['kilimo-sasa-2026', 'nishati-2026'];

// The event on screen: ?e=<id> in the address, else the one the desk picked, else the active one.
let picked = null;
export function eventId() {
  if (picked && EVENTS[picked]) return picked;
  try { const e = new URLSearchParams(location.search).get('e'); if (e && EVENTS[e]) return e; } catch (x) { /* no address bar */ }
  return ACTIVE_EVENT;
}
export const pickEvent = id => { picked = EVENTS[id] ? id : null; };
export const conf = id => EVENTS[id || eventId()];

// The page colours for an event, as CSS variables.
export function themeVars(c) {
  const t = (c || conf()).theme;
  return { '--g': t.g, '--g2': t.g2, '--g3': t.g3, '--gold': t.gold, '--o': t.o, '--cream': t.cream, '--ink': t.ink };
}
// Swaps the Nishati colours written in the print and pass templates for this event's colours.
const BASE = { '#0B5A2A': 'g', '#14833D': 'g2', '#063A1B': 'g3', '#0B3D1F': 'g3', '#F5C04A': 'gold', '#F2A33A': 'o', '#FFF8EA': 'cream', '#13261A': 'ink' };
export function recolor(text, c) {
  const t = (c || conf()).theme;
  return Object.keys(BASE).reduce((s, k) => s.split(k).join(t[BASE[k]]).split(k.toLowerCase()).join(t[BASE[k]]), text);
}
