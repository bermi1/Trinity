import { expect } from '@playwright/test';

// Opens the app already signed in to a portal and page, on fresh demo data.
export async function openAs(page, role = 'ceo', where, extra = {}) {
  await page.goto('/');
  await page.evaluate(([role, where, extra]) => {
    localStorage.clear();
    localStorage.setItem('tm360', JSON.stringify(Object.assign({ auth: true, role, page: where, projectId: 'PRJ-0231' }, extra)));
  }, [role, where, extra]);
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

export const side = (page, label) => page.locator('aside').getByText(label, { exact: true }).click();
export const toast = (page, text) => expect(page.getByText(text).last()).toBeVisible();
export const btn = (scope, name) => scope.getByRole('button', { name, exact: true });

// Reads the data the app saved to the browser (written 300ms after a change).
export async function saved(page) {
  await page.waitForTimeout(450);
  return page.evaluate(() => JSON.parse(localStorage.getItem('tm360data') || '{}'));
}

// Fills the open form modal: { 'Label': value } for inputs and selects.
export async function fillModal(page, values) {
  const modal = page.locator('div[style*="max-height: 90vh"], .m-sheet');
  for (const [label, value] of Object.entries(values)) {
    const field = modal.locator('label').filter({ has: page.getByText(label, { exact: true }) }).locator('input, select').first();
    if (await field.evaluate(el => el.tagName) === 'SELECT') await field.selectOption({ label: value });
    else await field.fill(String(value));
  }
  return modal;
}
export const modal = page => page.locator('div[style*="max-height: 90vh"], .m-sheet');

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
