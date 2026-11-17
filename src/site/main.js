// Trinity Mark Solutions · public website behaviour: menu, header, reveal on scroll,
// the job tracker animation and the enquiry form.
import './site.css';
import { validateEnquiry, sendEnquiry } from '../lib/enquiries';

document.documentElement.classList.add('js');
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The staff portal used to live at /, so an older installed copy may still have a service worker
// for the whole site. Remove it; the portal now registers its own under /app/.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => { if (new URL(r.scope).pathname === '/') r.unregister(); })).catch(() => {});
}

// Header: solid once the page scrolls.
const hdr = $('.hdr');
const onScroll = () => hdr.classList.toggle('is-solid', window.scrollY > 24);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Phone menu.
const nav = $('#nav'), menuBtn = $('.menu-btn');
const setMenu = open => {
  nav.classList.toggle('is-open', open);
  hdr.classList.toggle('is-menu', open);
  document.body.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
};
menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); } });
window.addEventListener('resize', () => { if (window.innerWidth > 900 && nav.classList.contains('is-open')) setMenu(false); });

// Highlight the menu item of the section in view.
const links = $$('.nav a[href^="#"]:not(.btn)');
if ('IntersectionObserver' in window) {
  const spy = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const s = $(a.getAttribute('href')); if (s) spy.observe(s); });
}

// Reveal on scroll, staggered within each group.
const reveals = $$('.reveal');
if (reduceMotion || !('IntersectionObserver' in window)) {
  reveals.forEach(el => el.classList.add('is-in'));
} else {
  const groups = new Map();
  reveals.forEach(el => { const p = el.parentElement; const i = groups.get(p) || 0; groups.set(p, i + 1); el.style.setProperty('--d', Math.min(i, 6) * 0.07 + 's'); });
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  reveals.forEach(el => io.observe(el));
}

// Job tracker: steps complete one by one when it comes into view, then the cycle repeats.
const steps = $$('.tracker-steps li');
const showStep = n => steps.forEach((li, i) => { li.classList.toggle('is-done', i < n); li.classList.toggle('is-now', i === n); });
if (steps.length) {
  if (reduceMotion || !('IntersectionObserver' in window)) showStep(4);
  else {
    let n = 0, timer = null;
    const tick = () => { showStep(n); n = n >= steps.length ? 0 : n + 1; };
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !timer) { tick(); timer = setInterval(tick, 900); }
      else if (!en.isIntersecting && timer) { clearInterval(timer); timer = null; }
    }, { threshold: 0.35 }).observe($('.tracker'));
  }
}

// "Ask about …" links choose the service in the form.
const form = $('#enquiry');
$$('[data-service]').forEach(a => a.addEventListener('click', () => { form.elements.service.value = a.dataset.service; }));

// Enquiry form.
const card = $('.form-card'), sent = $('.sent', card), alertBox = $('.form-alert', form), submitBtn = $('button[type=submit]', form);
const FIELDS = ['name', 'company', 'email', 'phone', 'service', 'event_date', 'message'];
const values = () => Object.fromEntries(FIELDS.map(k => [k, form.elements[k].value]));
const showErrors = errs => {
  ['name', 'company', 'email', 'phone', 'message'].forEach(k => {
    const input = form.elements[k], msg = errs[k] || '';
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    $('#e-' + k).textContent = msg;
  });
};
// Fix errors as people type, once they have tried to send.
let tried = false;
form.addEventListener('input', () => { if (tried) showErrors(validateEnquiry(values())); });

form.addEventListener('submit', async e => {
  e.preventDefault();
  tried = true;
  alertBox.hidden = true;
  const f = values(), errs = validateEnquiry(f);
  showErrors(errs);
  const first = FIELDS.find(k => errs[k]);
  if (first) { form.elements[first].focus(); return; }

  const done = () => {
    $('.sent-name', sent).textContent = ', ' + f.name.trim().split(/\s+/)[0];
    form.hidden = true;
    sent.hidden = false;
    sent.focus();
  };
  // Bots fill the hidden field; they get the thank-you page and nothing is sent.
  if (form.elements.website.value) { done(); return; }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spin" aria-hidden="true"></span>Sending…';
  const res = await sendEnquiry(f, { url: import.meta.env.VITE_SUPABASE_URL, key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY });
  submitBtn.disabled = false;
  submitBtn.textContent = 'Send enquiry';
  if (res.ok) { form.reset(); tried = false; done(); }
  else { alertBox.textContent = res.error; alertBox.hidden = false; }
});

$('[data-again]', sent).addEventListener('click', () => {
  sent.hidden = true;
  form.hidden = false;
  form.elements.name.focus();
});

$$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
