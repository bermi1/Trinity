// Event registration data. On the live system it uses the Supabase tables `events` and
// `event_registrations` (the public can only call register_attendee()); without a database
// (demo and tests) it keeps everything in this browser.
import { supabase } from '../lib/supabase';

export const EVENT_ID = 'nishati-2026';
export const CATEGORIES = ['Serikali', 'TANESCO', 'CRDB Bank Foundation', 'iMbeju Nuru', 'Kiongozi wa Jamii', 'Mwananchi / Kaya', 'Vyombo vya Habari', 'Mengineyo'];
export const GENDERS = ['Mwanamke', 'Mwanaume'];

const DEFAULT_EVENT = {
  id: EVENT_ID, title: 'Mpango wa Nishati wa Taifa',
  subtitle: 'Kikao cha Tathmini ya Utekelezaji wa Mpango wa Kuharakisha Uanganishaji wa Umeme kwa Kaya',
  tagline: 'Kila Kaya Itwaka', event_date: '', event_time: '', venue: '',
  message: 'Asante kwa kujisajili. Tunakukaribisha kuhudhuria kikao hiki muhimu. Tafadhali fika mapema na uonyeshe namba yako ya usajili mezani.', open: true
};

const LK = 'tm-event-' + EVENT_ID;
const local = () => { try { return JSON.parse(localStorage.getItem(LK)) || { event: DEFAULT_EVENT, regs: [] }; } catch (e) { return { event: DEFAULT_EVENT, regs: [] }; } };
const saveLocal = d => { try { localStorage.setItem(LK, JSON.stringify(d)); } catch (e) { /* storage full */ } };
const digits = v => String(v || '').replace(/\D/g, '');
// The same number written as 07…, 7… or +255 7… is one person: compare the last 9 digits.
const phoneKey = v => digits(v).slice(-9);
const clean = e => String((e && e.message) || e || 'Something went wrong').replace(/^.*?ERROR:\s*/, '');

export async function getEvent() {
  if (!supabase) return local().event;
  // On a weak connection the page still shows the form; registering reports any connection problem.
  try {
    const late = new Promise((_, no) => setTimeout(() => no(new Error('slow')), 4000));
    const { data, error } = await Promise.race([supabase.from('events').select('*').eq('id', EVENT_ID).maybeSingle(), late]);
    if (error) throw error;
    return data || DEFAULT_EVENT;
  } catch (e) { return DEFAULT_EVENT; }
}

export async function saveEvent(patch) {
  if (!supabase) { const d = local(); d.event = Object.assign({}, d.event, patch); saveLocal(d); return ''; }
  const { error } = await supabase.from('events').update(patch).eq('id', EVENT_ID);
  return error ? clean(error) : '';
}

// Checks the form; returns an error message or ''.
export function checkForm(f) {
  if ((f.full_name || '').trim().length < 2) return 'Andika jina lako kamili · Enter your full name';
  if (digits(f.phone).length < 9) return 'Andika namba sahihi ya simu · Enter a valid phone number';
  if (f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) return 'Barua pepe si sahihi · Check the email address';
  if (!f.category) return 'Chagua kundi lako · Choose your category';
  return '';
}

// Registers an attendee; returns { id, badge_no, full_name, existing } or { error }.
export async function register(f, mode) {
  const bad = checkForm(f); if (bad) return { error: bad };
  if (!supabase) {
    const d = local();
    if (!d.event.open && mode === 'qr') return { error: 'Usajili umefungwa · Registration is closed' };
    const old = d.regs.find(r => phoneKey(r.phone) === phoneKey(f.phone));
    if (old) return { id: old.id, badge_no: old.badge_no, full_name: old.full_name, existing: true };
    const r = { id: 'R' + Date.now().toString(36), event_id: EVENT_ID, badge_no: d.regs.reduce((m, x) => Math.max(m, x.badge_no), 0) + 1, full_name: f.full_name.trim(), phone: f.phone.trim(), email: (f.email || '').trim(), organization: (f.organization || '').trim(), position: (f.position || '').trim(), region: (f.region || '').trim(), district: (f.district || '').trim(), gender: f.gender || '', category: f.category || '', mode, checked_in: mode === 'walkin', checked_in_at: mode === 'walkin' ? new Date().toISOString() : null, created_at: new Date().toISOString() };
    d.regs.push(r); saveLocal(d);
    return { id: r.id, badge_no: r.badge_no, full_name: r.full_name, existing: false };
  }
  const { data, error } = await supabase.rpc('register_attendee', { p_event: EVENT_ID, p_full_name: f.full_name, p_phone: f.phone, p_email: f.email || '', p_organization: f.organization || '', p_position: f.position || '', p_region: f.region || '', p_district: f.district || '', p_gender: f.gender || '', p_category: f.category || '', p_mode: mode });
  if (error) return { error: /fetch|network/i.test(error.message || '') ? 'Mtandao haupatikani, jaribu tena · No connection, please try again' : clean(error) };
  return data;
}

export async function listRegs() {
  if (!supabase) return local().regs.slice().sort((a, b) => a.badge_no - b.badge_no);
  const { data, error } = await supabase.from('event_registrations').select('*').eq('event_id', EVENT_ID).order('badge_no');
  if (error) throw new Error(clean(error));
  return data || [];
}

export async function checkIn(id, on) {
  const patch = { checked_in: on, checked_in_at: on ? new Date().toISOString() : null };
  if (!supabase) { const d = local(); d.regs = d.regs.map(r => (r.id === id ? Object.assign({}, r, patch) : r)); saveLocal(d); return ''; }
  const { error } = await supabase.from('event_registrations').update(patch).eq('id', id);
  return error ? clean(error) : '';
}

export const badge = n => String(n).padStart(3, '0');
export const registerUrl = () => (typeof location !== 'undefined' ? location.origin : '') + '/register';
