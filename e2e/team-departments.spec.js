import { test, expect } from '@playwright/test';
import { openAs, watchErrors, side } from './helpers';

test('team: the General Manager places staff in departments; staff cannot open the page', async ({ page }) => {
  const errors = watchErrors(page);
  await openAs(page, 'gm', 'dashboard');
  await side(page, 'Team & departments');
  await expect(page.getByRole('heading', { name: 'Team & departments' })).toBeVisible();
  const row = page.locator('.tp-list li').first();
  const name = (await row.locator('.tp-who b').textContent()).trim();
  await row.locator('.tp-row').click();
  await row.getByRole('radio', { name: 'Finance' }).click();
  await expect(page.locator('.tp-list li', { hasText: name }).locator('.tp-dept')).toHaveText('Finance');
  await page.getByRole('button', { name: /^Finance · / }).click();
  await expect(page.locator('.tp-list li', { hasText: name })).toBeVisible();
  // Staff are sent back to their own portal.
  await openAs(page, 'staff', 'team');
  await expect(page.locator('.tp')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('sign-in screen asks for the first name and explains the first password', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByLabel('First name or email')).toBeVisible();
  await expect(page.getByText('use your first name in small letters as the password')).toBeVisible();
});

test('team: the General Manager saves a phone number', async ({ page }) => {
  await openAs(page, 'gm', 'team');
  const row = page.locator('.tp-list li').first();
  const name = (await row.locator('.tp-who b').textContent()).trim();
  await row.locator('.tp-row').click();
  await row.getByLabel('Phone number for ' + name).fill('0712 345 678');
  await row.getByRole('button', { name: 'Save' }).click();
  await expect(row.getByRole('status')).toHaveText('Saved');
  await expect(page.locator('.tp-list li', { hasText: name }).locator('.tp-who small')).toContainText('0712 345 678');
});
