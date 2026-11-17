import { test, expect } from '@playwright/test';
import { watchErrors, side, toast, btn, modal, saved } from './helpers';

let errors;
test.beforeEach(async ({ page }) => {
  errors = watchErrors(page);
  page.on('dialog', d => d.accept());
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});
test.afterEach(() => expect(errors).toEqual([]));

const form = page => page.locator('#enquiry');
const field = (page, label) => form(page).getByLabel(label, { exact: false });
const enquiries = page => page.evaluate(() => JSON.parse(localStorage.getItem('tm360-enquiries') || '[]'));

async function sendEnquiry(page, f) {
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Contact' }).click();
  await field(page, 'Your name').fill(f.name);
  if (f.company) await field(page, 'Company').fill(f.company);
  await field(page, 'Email').fill(f.email);
  if (f.phone) await field(page, 'Phone').fill(f.phone);
  if (f.service) await field(page, 'What do you need?').selectOption(f.service);
  if (f.when) await field(page, 'When is it?').fill(f.when);
  await field(page, 'Tell us about the project').fill(f.message);
  await btn(form(page), 'Send enquiry').click();
}

test('public home page: every section, the menu and the staff login', async ({ page }) => {
  await expect(page).toHaveTitle('Trinity Mark Solutions · Events, branding and print in Tanzania');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('We make brands impossible to miss.');
  await expect(page.locator('h1')).toHaveCount(1);

  for (const [link, heading] of [
    ['Services', 'Everything your brand needs to show up, and stand out.'],
    ['How we work', 'From brief to report: one team, one plan.'],
    ['In-house', 'Under one roof, so nothing falls between the cracks.'],
    ['Why us', 'Creative work, delivered with discipline.'],
    ['Contact', 'Let\'s talk about your next project.']
  ]) {
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: link, exact: true }).click();
    const h = page.getByRole('heading', { name: heading });
    await expect(h).toBeInViewport();
    await expect(h).toBeVisible();
  }
  await expect(page.locator('.hdr')).toHaveClass(/is-solid/);
  await expect(page.locator('.svc')).toHaveCount(8);
  await expect(page.locator('.step')).toHaveCount(6);

  // The job tracker steps through the seven production stages.
  await page.locator('#capabilities').scrollIntoViewIfNeeded();
  await expect(page.locator('.tracker-steps li.is-done').first()).toBeVisible({ timeout: 5000 });

  // Everything that should be readable is visible once scrolled to (reveal animation done).
  await page.locator('.ftr').scrollIntoViewIfNeeded();
  await expect(page.locator('.ftr')).toContainText('Trinity Mark Solutions Ltd');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);

  // Staff login opens the staff portal's sign-in screen.
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Staff login' }).click();
  await expect(page).toHaveURL(/\/app\/$/);
  await expect(page.getByText('Sign in to your Trinity Mark workspace.')).toBeVisible();
});

test('a service card chooses that service in the contact form', async ({ page }) => {
  await page.getByRole('link', { name: 'Wrap your fleet' }).click();
  await expect(page.getByRole('heading', { name: 'Let\'s talk about your next project.' })).toBeInViewport();
  await expect(field(page, 'What do you need?')).toHaveValue('Vehicle & fleet branding');
  await page.getByRole('link', { name: 'Plan a roadshow' }).click();
  await expect(field(page, 'What do you need?')).toHaveValue('Roadshows & tours');
});

test('the form explains what is missing and sends nothing until it is right', async ({ page }) => {
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await btn(form(page), 'Send enquiry').click();
  await expect(page.getByText('Please tell us your name.')).toBeVisible();
  await expect(page.getByText('Please enter your email so we can reply.')).toBeVisible();
  await expect(page.getByText('Tell us a little about your project (at least 10 characters).')).toBeVisible();
  await expect(field(page, 'Your name')).toBeFocused();
  await expect(field(page, 'Your name')).toHaveAttribute('aria-invalid', 'true');

  await field(page, 'Your name').fill('Neema Lyimo');
  await expect(page.getByText('Please tell us your name.')).toHaveCount(0);
  await field(page, 'Email').fill('neema@kilimo');
  await field(page, 'Phone').fill('call me');
  await btn(form(page), 'Send enquiry').click();
  await expect(page.getByText('That email address doesn’t look right.')).toBeVisible();
  await expect(page.getByText('Use digits only, e.g. +255 7xx xxx xxx.')).toBeVisible();
  await expect(field(page, 'Email')).toBeFocused();
  expect(await enquiries(page)).toEqual([]);
  await expect(page.locator('.sent')).toBeHidden();
});

test('walkthrough: a visitor sends an enquiry, staff see it in CRM and turn it into a lead', async ({ page }) => {
  // 1. The visitor fills in the contact form on the public website.
  await sendEnquiry(page, {
    name: 'Neema Lyimo', company: 'Kilimo Bank', email: 'neema@kilimo.co.tz', phone: '+255 712 345 678',
    service: 'Branding & signage', when: 'March 2027', message: 'We are rebranding 40 branches and need signage and wall graphics.'
  });
  await expect(page.getByRole('heading', { name: 'Thank you, Neema.' })).toBeVisible();
  await expect(page.getByText('Your message has reached our team.')).toBeVisible();
  await expect(form(page)).toBeHidden();
  expect(await enquiries(page)).toEqual([expect.objectContaining({ name: 'Neema Lyimo', company: 'Kilimo Bank', service: 'Branding & signage', event_date: 'March 2027', status: 'new' })]);

  // "Send another message" brings back an empty form.
  await page.getByRole('button', { name: 'Send another message' }).click();
  await expect(field(page, 'Your name')).toHaveValue('');
  await expect(field(page, 'Your name')).toBeFocused();

  // 2. A manager signs in to the staff portal from the website.
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Staff login' }).click();
  await btn(page, 'Management').click();
  await page.locator('input[type=password]').fill('demo1234');
  await page.locator('input[type=password]').press('Enter');
  await page.getByRole('button', { name: 'Not now' }).click();
  await expect(page.getByText('COMPANY COMMAND CENTER').first()).toBeVisible();

  // 3. CRM shows the website enquiry with everything the visitor wrote.
  await side(page, 'CRM');
  const panel = page.getByTestId('web-enquiries');
  await expect(panel).toContainText('Website enquiries · 1 new');
  const item = panel.locator('[data-enquiry="neema@kilimo.co.tz"]');
  await expect(item).toContainText('Neema Lyimo');
  await expect(item).toContainText('Kilimo Bank');
  await item.getByRole('button', { name: /Neema Lyimo/ }).click();
  await expect(item).toContainText('We are rebranding 40 branches');
  await expect(item.getByRole('link', { name: 'neema@kilimo.co.tz' })).toHaveAttribute('href', 'mailto:neema@kilimo.co.tz');
  await expect(item.getByRole('link', { name: '+255 712 345 678' })).toHaveAttribute('href', 'tel:+255712345678');
  await expect(item).toContainText('March 2027');

  // 4. "Add as lead" opens the New lead form, filled in from the enquiry.
  await btn(item, 'Add as lead').click();
  const m = modal(page);
  await expect(m.getByText('New lead')).toBeVisible();
  await expect(m.locator('label').filter({ hasText: 'Client' }).locator('input')).toHaveValue('Kilimo Bank');
  await expect(m.locator('label').filter({ hasText: 'Opportunity' }).locator('input')).toHaveValue('Branding & signage · March 2027');
  await expect(m.locator('label').filter({ hasText: 'Source' }).locator('select')).toHaveValue('Website');
  await m.locator('label').filter({ hasText: 'Estimated value' }).locator('input').fill('120');
  await btn(m, 'Add lead').click();
  await toast(page, 'Lead added · Kilimo Bank');

  // 5. The lead is in the pipeline and the enquiry is marked as handled.
  await expect(page.getByText('Branding & signage · March 2027').first()).toBeVisible();
  await expect(panel).toContainText('No open enquiries');
  await btn(panel, 'Show all').click();
  await expect(panel.locator('[data-enquiry="neema@kilimo.co.tz"]')).toContainText('Lead created');
  expect((await enquiries(page))[0].status).toBe('converted');
  const { leads } = await saved(page);
  expect(leads[0]).toMatchObject({ c: 'Kilimo Bank', t: 'Branding & signage · March 2027', v: 120, s: 0, src: 'Website' });
});

test('staff mark enquiries contacted or close them; cancelling the lead form changes nothing', async ({ page }) => {
  await sendEnquiry(page, { name: 'Juma Ally', email: 'juma@example.com', message: 'Need 500 branded T-shirts for a staff day.' });
  await expect(page.getByRole('heading', { name: 'Thank you, Juma.' })).toBeVisible();
  await page.getByRole('button', { name: 'Send another message' }).click();
  await sendEnquiry(page, { name: 'Aisha Mbwana', email: 'aisha@example.com', message: 'Looking for an expo stand in July.' });
  await expect(page.getByRole('heading', { name: 'Thank you, Aisha.' })).toBeVisible();

  await page.goto('/app/');
  await btn(page, 'Management').click();
  await page.locator('input[type=password]').fill('demo1234');
  await page.locator('input[type=password]').press('Enter');
  await page.getByRole('button', { name: 'Not now' }).click();
  await side(page, 'CRM');
  const panel = page.getByTestId('web-enquiries');
  await expect(panel).toContainText('Website enquiries · 2 new');

  // Without a company, the lead takes the person's name; closing the form leaves the enquiry new.
  const juma = panel.locator('[data-enquiry="juma@example.com"]');
  await juma.getByRole('button', { name: /Juma Ally/ }).click();
  await btn(juma, 'Add as lead').click();
  await expect(modal(page).locator('label').filter({ hasText: 'Client' }).locator('input')).toHaveValue('Juma Ally');
  await expect(modal(page).locator('label').filter({ hasText: 'Opportunity' }).locator('input')).toHaveValue('Website enquiry');
  await page.keyboard.press('Escape');
  await expect(juma).toContainText('New');

  await btn(juma, 'Mark contacted').click();
  await toast(page, 'Juma Ally · contacted');
  await expect(juma).toContainText('Contacted');
  await expect(panel).toContainText('Website enquiries · 1 new');

  const aisha = panel.locator('[data-enquiry="aisha@example.com"]');
  await aisha.getByRole('button', { name: /Aisha Mbwana/ }).click();
  await btn(aisha, 'Close').click();
  await expect(aisha).toHaveCount(0);
  await expect(panel).toContainText('Website enquiries');
  await btn(panel, 'Show all').click();
  await expect(panel.locator('[data-enquiry="aisha@example.com"]')).toContainText('Closed');

  // Statuses are kept after a reload.
  await page.reload();
  await expect(page.getByTestId('web-enquiries')).toContainText('Juma Ally');
  const saved = await enquiries(page);
  expect(saved.map(q => [q.name, q.status])).toEqual([['Aisha Mbwana', 'closed'], ['Juma Ally', 'contacted']]);
});

test('reception sees website enquiries under Client enquiries', async ({ page }) => {
  await sendEnquiry(page, { name: 'Rose Temba', email: 'rose@example.com', message: 'Roll-up banners for a conference next week.' });
  await expect(page.getByRole('heading', { name: 'Thank you, Rose.' })).toBeVisible();
  await page.goto('/app/');
  await btn(page, 'Reception').click();
  await page.locator('input[type=password]').fill('demo1234');
  await page.locator('input[type=password]').press('Enter');
  await page.getByRole('button', { name: 'Not now' }).click();
  await side(page, 'Client enquiries');
  await expect(page.getByTestId('web-enquiries')).toContainText('Rose Temba');
});

test('a bot that fills the hidden field sees thanks, but nothing is sent', async ({ page }) => {
  await page.locator('#f-website').evaluate(el => { el.value = 'http://spam.example'; });
  await sendEnquiry(page, { name: 'Spam Bot', email: 'bot@example.com', message: 'Buy cheap followers now!!!' });
  await expect(page.getByRole('heading', { name: 'Thank you, Spam.' })).toBeVisible();
  expect(await enquiries(page)).toEqual([]);
});

test('the staff portal no longer takes over the public site', async ({ page, request }) => {
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest).toMatchObject({ start_url: '/app/', scope: '/app/' });
  // The website itself has no install manifest or app service worker.
  await expect(page.locator('link[rel=manifest]')).toHaveCount(0);
  await page.goto('/app/');
  await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistration('/app/'))?.scope || ''), { timeout: 10000 }).toMatch(/\/app\/$/);
  await page.goto('/');
  expect(await page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration('/')) && (await navigator.serviceWorker.getRegistration('/')).scope.endsWith('/app/') === false)).toBe(false);
});
