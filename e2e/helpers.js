import { expect } from '@playwright/test';

// Opens the app already signed in to a portal and page, on fresh demo data
// (fresh = false keeps the data, to follow work from one portal to the next).
export async function openAs(page, role = 'ceo', where, extra = {}, fresh = true) {
  if (!fresh) await page.waitForTimeout(450);
  await page.goto('/');
  await page.evaluate(([role, where, extra, fresh]) => {
    if (fresh) localStorage.clear();
    localStorage.setItem('tm360', JSON.stringify(Object.assign({ auth: true, role, page: where, projectId: 'PRJ-0231' }, extra)));
  }, [role, where, extra, fresh]);
  await page.reload();
  await expect(page.locator('main')).toBeVisible();
}

// Collects uncaught errors so every test can assert the app stayed healthy.
export function watchErrors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|fonts\.g/.test(m.text())) errors.push(m.text()); });
  return errors;
}

// Clicks a sidebar page, opening "More" first when the page lives there.
export async function side(page, label) {
  // Notifications open from the bell in the top bar, not the side menu.
  if (label === 'Notifications') { await page.locator('header').getByRole('button', { name: 'Notifications' }).click(); return; }
  const aside = page.locator('aside');
  const item = aside.getByText(label, { exact: true }).first();
  await expect(async () => {
    if (!(await item.isVisible())) {
      const more = aside.getByRole('button', { name: 'More' });
      if (await more.count()) await more.click();
    }
    await item.click({ timeout: 2000 });
  }).toPass({ timeout: 15000 });
}
export const toast = (page, text) => expect(page.getByText(text).last()).toBeVisible();
export const btn = (scope, name) => scope.getByRole('button', { name, exact: true });

// Reads the data the app saved to the browser (written 300ms after a change).
export async function saved(page) {
  await page.waitForTimeout(450);
  return page.evaluate(() => JSON.parse(localStorage.getItem('tm360data') || '{}'));
}

// Request money first asks which kind of request; this picks it.
export async function chooseRequest(page, type = 'Project request') {
  const m = modal(page);
  await m.locator('[data-field="Type of request"]').getByRole('radio', { name: type, exact: true }).click();
  await m.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(modal(page).getByText(type, { exact: true }).first()).toBeVisible();
}

// Fills the open form: { 'Label': value }. Text and amounts are typed; chips and people are tapped;
// long lists are opened and the option chosen.
export async function fillModal(page, values) {
  const m = modal(page);
  for (const [label, value] of Object.entries(values)) {
    const field = m.locator('[data-field="' + label + '"]').first();
    const input = field.locator('input:not([type=file]):not(.ff-search), textarea').first();
    if (await input.count()) { await input.fill(String(value)); continue; }
    const radio = field.getByRole('radio', { name: String(value), exact: true });
    if (await radio.count()) { await radio.first().click(); continue; }
    await field.locator('.ff-pick-btn').click();
    await field.getByRole('option', { name: String(value), exact: true }).click();
  }
  // Money requests ask how to pay; fill a mobile-money payee unless the test chose its own.
  const payBy = m.locator('[data-field="Pay by"]').first();
  const payName = m.locator('[data-field="Name on the account / recipient"] input').first();
  if (!('Pay by' in values) && !('Name on the account / recipient' in values) && await payBy.count() && !(await payName.inputValue())) {
    await payBy.getByRole('radio', { name: 'M-Pesa', exact: true }).click();
    await m.locator('[data-field="Name on the account / recipient"] input').first().fill('Test Payee');
    await m.locator('[data-field="Phone or account number"] input').first().fill('0754 123 456');
  }
  return m;
}
export const modal = page => page.locator('.fm, .m-sheet');

// The closest block around an exact text that contains buttons (a table row or card).
export const rowOf = (page, text, nth = 0) => page.getByText(text, { exact: true }).nth(nth).locator('xpath=ancestor::div[.//button][1]');

// Drags a finger vertically on the page (touch events), e.g. to swipe a sheet down or pull to refresh.
export async function swipe(page, selector, fromY, toY, x = 195) {
  await page.evaluate(([selector, fromY, toY, x]) => {
    const el = document.querySelector(selector);
    const t = y => new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
    el.dispatchEvent(new TouchEvent('touchstart', { touches: [t(fromY)], bubbles: true }));
    for (let i = 1; i <= 8; i++) el.dispatchEvent(new TouchEvent('touchmove', { touches: [t(fromY + (toY - fromY) * i / 8)], bubbles: true }));
    el.dispatchEvent(new TouchEvent('touchend', { changedTouches: [t(toY)], bubbles: true }));
  }, [selector, fromY, toY, x]);
}
