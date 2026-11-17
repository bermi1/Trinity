import { test, expect } from '@playwright/test';
import { watchErrors, btn } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('sign-in: email and password, or one tap on a demo portal', async ({ page }) => {
  const errors = watchErrors(page);
  await expect(page.getByText('Demo workspace · any password of 4+ characters')).toBeVisible();
  await page.locator('input[type=password]').fill('12');
  await btn(page, 'SIGN IN').click();
  await expect(page.getByText('Enter your email and a password of at least 4 characters.')).toBeVisible();

  // No Google or Microsoft sign-in.
  await expect(page.getByRole('button', { name: 'Google' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Microsoft' })).toHaveCount(0);

  // An email and password still sign in (the administrator and real accounts).
  await page.locator('input.tm-f1').first().fill('admin@trinitymark.co.tz');
  await page.locator('input[type=password]').fill('demo1234');
  await page.locator('input[type=password]').press('Enter');
  await page.getByRole('button', { name: 'Not now' }).click();
  await expect(page.getByText('COMPANY COMMAND CENTER').first()).toBeVisible();
  await page.locator('header div[style*="cursor: pointer"]').last().click();
  await page.getByText('Sign out', { exact: true }).click();

  // Demo portals open with one tap: no password, no PIN prompt.
  await expect(page.getByRole('group', { name: 'Demo portals' })).toBeVisible();
  for (const [portal, landing] of [['Staff', /Good (morning|afternoon|evening), Grace/], ['Finance', 'Rose Temba’s queue'], ['Reception', 'OFFICE FRONT · RECEPTION'], ['Store', 'Fatma’s store'], ['Printing', /Good (morning|afternoon|evening), Juma/], ['Management', 'COMPANY COMMAND CENTER']]) {
    await btn(page.getByRole('group', { name: 'Demo portals' }), portal).click();
    await expect(page.getByText(landing).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Not now' })).toHaveCount(0);
    await page.locator('header div[style*="cursor: pointer"]').last().click();
    await page.getByText('Sign out', { exact: true }).click();
    await expect(btn(page, 'SIGN IN')).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('forgot password confirms the reset link', async ({ page }) => {
  await page.locator('input.tm-f1').first().fill('daniel.k@trinitymark.co.tz');
  await page.getByText('Forgot password?').click();
  await expect(page.getByText(/A reset link has been sent to daniel\.k@trinitymark\.co\.tz/)).toBeVisible();
});

test('"Remember me" off ends the session when the browser closes', async ({ page, context }) => {
  await page.getByText('Remember me').click();
  await page.locator('input.tm-f1').first().fill('daniel.k@trinitymark.co.tz');
  await page.locator('input[type=password]').fill('demo1234');
  await btn(page, 'SIGN IN').click();
  await page.getByRole('button', { name: 'Not now' }).click();
  await expect(page.getByText('COMPANY COMMAND CENTER')).toBeVisible();
  await page.reload();
  await expect(page.getByText('COMPANY COMMAND CENTER')).toBeVisible();
  // A new tab starts a new browser session.
  const fresh = await context.newPage();
  await fresh.goto('/');
  await expect(btn(fresh, 'SIGN IN')).toBeVisible();
});

test('sign-in persists across reloads when remembered', async ({ page }) => {
  await page.locator('input.tm-f1').first().fill('daniel.k@trinitymark.co.tz');
  await page.locator('input[type=password]').fill('demo1234');
  await btn(page, 'SIGN IN').click();
  await page.goto('/');
  await expect(page.getByText('COMPANY COMMAND CENTER')).toBeVisible();
});
