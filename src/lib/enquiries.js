// Enquiries from the public website's contact form.
// With the database configured they go to the `enquiries` table (visitors can only add one);
// in the demo they are kept in this browser, so the website and the staff portal share them.

export const SERVICES = [
  'Events & activations',
  'Roadshows & tours',
  'Exhibitions & expo stands',
  'Branding & signage',
  'Vehicle & fleet branding',
  'Large-format printing',
  'Branded merchandise',
  'Something else'
];

export const DEMO_KEY = 'tm360-enquiries';
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const FIELDS = ['name', 'company', 'email', 'phone', 'service', 'event_date', 'message'];

const clean = f => Object.fromEntries(FIELDS.map(k => [k, String((f && f[k]) || '').trim()]));

// Returns { field: message } for every problem; empty when the enquiry can be sent.
export function validateEnquiry(f) {
  const e = {}, v = clean(f);
  if (v.name.length < 2) e.name = 'Please tell us your name.';
  else if (v.name.length > 120) e.name = 'Please shorten your name.';
  if (!v.email) e.email = 'Please enter your email so we can reply.';
  else if (!EMAIL.test(v.email) || v.email.length > 200) e.email = 'That email address doesn’t look right.';
  if (v.phone && !/^[+\d][\d\s()-]{5,39}$/.test(v.phone)) e.phone = 'Use digits only, e.g. +255 7xx xxx xxx.';
  if (v.company.length > 160) e.company = 'Please shorten the company name.';
  if (v.message.length < 10) e.message = 'Tell us a little about your project (at least 10 characters).';
  else if (v.message.length > 4000) e.message = 'Please keep the message under 4,000 characters.';
  return e;
}

function readDemo(storage) {
  try { const list = JSON.parse(storage.getItem(DEMO_KEY) || '[]'); return Array.isArray(list) ? list : []; } catch (e) { return []; }
}

// Sends the enquiry. Resolves to { ok: true } or { ok: false, error }.
export async function sendEnquiry(f, { url, key, fetchFn = globalThis.fetch, storage = globalThis.localStorage, now = () => new Date() } = {}) {
  const v = clean(f);
  if (Object.keys(validateEnquiry(v)).length) return { ok: false, error: 'Please check the highlighted fields.' };
  if (url && key) {
    try {
      const res = await fetchFn(url.replace(/\/$/, '') + '/rest/v1/enquiries', {
        method: 'POST',
        headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(v)
      });
      if (res.ok) return { ok: true };
      return { ok: false, error: 'We couldn’t send your message just now. Please try again in a moment.' };
    } catch (e) {
      return { ok: false, error: 'No connection. Check your internet and try again.' };
    }
  }
  try {
    const list = readDemo(storage);
    list.unshift(Object.assign({ id: 'ENQ-' + now().getTime().toString(36).toUpperCase(), created_at: now().toISOString(), status: 'new' }, v));
    storage.setItem(DEMO_KEY, JSON.stringify(list.slice(0, 200)));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'We couldn’t send your message just now. Please try again in a moment.' };
  }
}

export const loadDemoEnquiries = (storage = globalThis.localStorage) => readDemo(storage);

export function updateDemoEnquiry(id, changes, storage = globalThis.localStorage) {
  const list = readDemo(storage).map(q => (q.id === id ? Object.assign({}, q, changes) : q));
  try { storage.setItem(DEMO_KEY, JSON.stringify(list)); } catch (e) { /* storage full or blocked */ }
  return list;
}
