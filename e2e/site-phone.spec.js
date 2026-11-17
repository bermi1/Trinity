import { test, expect } from '@playwright/test';
import { watchErrors, openAs, btn } from './helpers';

let errors;
test.beforeEach(async ({ page }) => {
  errors = watchErrors(page);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});
test.afterEach(() => expect(errors).toEqual([]));

const menuBtn = page => page.locator('.menu-btn');
const nav = page => page.getByRole('navigation', { name: 'Main' });

test('website on a phone: menu opens, navigates and closes; nothing scrolls sideways', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(nav(page).getByRole('link', { name: 'Services' })).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);

  await menuBtn(page).click();
  await expect(menuBtn(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(menuBtn(page)).toHaveAttribute('aria-label', 'Close menu');
  await expect(nav(page).getByRole('link', { name: 'Staff login' })).toBeVisible();
  expect(await page.evaluate(() => document.body.classList.contains('menu-open'))).toBe(true);

  await nav(page).getByRole('link', { name: 'How we work' }).click();
  await expect(menuBtn(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('heading', { name: 'From brief to report: one team, one plan.' })).toBeInViewport();

  await menuBtn(page).click();
  await page.keyboard.press('Escape');
  await expect(nav(page).getByRole('link', { name: 'Services' })).toBeHidden();
  await expect(menuBtn(page)).toBeFocused();

  // Scroll the whole page: every section stays within the screen width.
  await page.locator('.ftr').scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
});

test('website on a phone: send an enquiry with the phone keyboard fields', async ({ page }) => {
  await page.getByRole('link', { name: 'Start a project' }).first().click();
  await expect(page.locator('#f-email')).toHaveAttribute('type', 'email');
  await expect(page.locator('#f-phone')).toHaveAttribute('type', 'tel');
  // 16px text, so phones don't zoom in when typing.
  for (const id of ['#f-name', '#f-email', '#f-message', '#f-service']) {
    expect(await page.locator(id).evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
  }
  await page.locator('#f-name').fill('Grace Mrema');
  await page.locator('#f-email').fill('grace@example.com');
  await page.locator('#f-message').fill('Gazebo tents and branding for a two-day activation.');
  await btn(page.locator('#enquiry'), 'Send enquiry').click();
  await expect(page.getByRole('heading', { name: 'Thank you, Grace.' })).toBeVisible();
});

test('phone app: website enquiries appear at the top of CRM', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('tm360-enquiries', JSON.stringify([
    { id: 'ENQ-1', created_at: new Date().toISOString(), status: 'new', name: 'Peter Laizer', company: 'Laizer Foods', email: 'peter@example.com', phone: '', service: 'Events & activations', event_date: '', message: 'Product launch in Arusha.' }
  ])));
  await openAs(page, 'ceo', 'crm');
  await page.evaluate(() => localStorage.setItem('tm360-enquiries', JSON.stringify([
    { id: 'ENQ-1', created_at: new Date().toISOString(), status: 'new', name: 'Peter Laizer', company: 'Laizer Foods', email: 'peter@example.com', phone: '', service: 'Events & activations', event_date: '', message: 'Product launch in Arusha.' }
  ])));
  await page.reload();
  const panel = page.getByTestId('web-enquiries');
  await expect(panel).toContainText('Website enquiries · 1 new');
  await panel.getByRole('button', { name: /Peter Laizer/ }).click();
  await btn(panel, 'Add as lead').click();
  await expect(page.getByRole('dialog', { name: 'New lead' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
});
