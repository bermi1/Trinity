import { describe, it, expect, vi } from 'vitest';
import { validateEnquiry, sendEnquiry, loadDemoEnquiries, updateDemoEnquiry, DEMO_KEY } from '../lib/enquiries';

const good = { name: 'Neema Lyimo', company: 'Kilimo Bank', email: 'neema@kilimo.co.tz', phone: '+255 712 345 678', service: 'Roadshows & tours', event_date: 'March 2027', message: 'A five-region roadshow for our new savings product.' };

const memory = () => {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
};

describe('validateEnquiry', () => {
  it('accepts a complete enquiry', () => {
    expect(validateEnquiry(good)).toEqual({});
  });

  it('requires a name, a valid email and a message', () => {
    expect(validateEnquiry({})).toEqual({
      name: 'Please tell us your name.',
      email: 'Please enter your email so we can reply.',
      message: 'Tell us a little about your project (at least 10 characters).'
    });
    expect(validateEnquiry({ ...good, email: 'neema@kilimo' }).email).toBe('That email address doesn’t look right.');
    expect(validateEnquiry({ ...good, message: 'Hi there' }).message).toMatch(/at least 10/);
  });

  it('ignores spaces around values and checks phone numbers only when given', () => {
    expect(validateEnquiry({ ...good, name: '  N  ' }).name).toBeTruthy();
    expect(validateEnquiry({ ...good, phone: '' })).toEqual({});
    expect(validateEnquiry({ ...good, phone: 'call me' }).phone).toMatch(/digits/);
  });

  it('matches the database limits', () => {
    expect(validateEnquiry({ ...good, message: 'x'.repeat(4001) }).message).toMatch(/4,000/);
    expect(validateEnquiry({ ...good, name: 'x'.repeat(121) }).name).toBeTruthy();
    expect(validateEnquiry({ ...good, company: 'x'.repeat(161) }).company).toBeTruthy();
  });
});

describe('sendEnquiry', () => {
  it('posts only the form fields to the enquiries table with the publishable key', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true });
    const res = await sendEnquiry({ ...good, website: 'spam', status: 'converted' }, { url: 'https://abc.supabase.co/', key: 'sb_publishable_x', fetchFn });
    expect(res).toEqual({ ok: true });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('https://abc.supabase.co/rest/v1/enquiries');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ apikey: 'sb_publishable_x', Authorization: 'Bearer sb_publishable_x', Prefer: 'return=minimal' });
    expect(JSON.parse(init.body)).toEqual(good);
  });

  it('explains a refused request and a lost connection', async () => {
    const refused = await sendEnquiry(good, { url: 'https://abc.supabase.co', key: 'k', fetchFn: vi.fn().mockResolvedValue({ ok: false, status: 400 }) });
    expect(refused).toEqual({ ok: false, error: expect.stringMatching(/try again/) });
    const offline = await sendEnquiry(good, { url: 'https://abc.supabase.co', key: 'k', fetchFn: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) });
    expect(offline.error).toMatch(/No connection/);
  });

  it('sends nothing when the enquiry is invalid', async () => {
    const fetchFn = vi.fn();
    const res = await sendEnquiry({ ...good, email: '' }, { url: 'https://abc.supabase.co', key: 'k', fetchFn });
    expect(res.ok).toBe(false);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('keeps enquiries in the browser in the demo, newest first, for the staff portal', async () => {
    const storage = memory();
    const now = () => new Date('2026-11-17T09:30:00Z');
    await sendEnquiry(good, { storage, now });
    await sendEnquiry({ ...good, name: 'Juma Ally', company: '' }, { storage, now: () => new Date('2026-11-17T10:00:00Z') });
    const list = loadDemoEnquiries(storage);
    expect(list.map(q => q.name)).toEqual(['Juma Ally', 'Neema Lyimo']);
    expect(list[1]).toMatchObject({ status: 'new', created_at: '2026-11-17T09:30:00.000Z', company: 'Kilimo Bank', service: 'Roadshows & tours' });
    expect(list[1].id).toMatch(/^ENQ-/);

    updateDemoEnquiry(list[1].id, { status: 'contacted' }, storage);
    expect(loadDemoEnquiries(storage).find(q => q.name === 'Neema Lyimo').status).toBe('contacted');
  });

  it('survives damaged demo storage', () => {
    const storage = memory();
    storage.setItem(DEMO_KEY, '{not json');
    expect(loadDemoEnquiries(storage)).toEqual([]);
  });
});
