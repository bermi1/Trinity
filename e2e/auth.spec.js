import { test, expect } from '@playwright/test';
import { watchErrors, btn } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('sign-in validates the password and opens the chosen portal', async ({ page }) => {
  const errors = watchErrors(page);
  await expect(page.getByText('Demo workspace · any password of 4+ characters')).toBeVisible();
  await page.locator('input[type=password]').fill('12');
  await btn(page, 'SIGN IN').click();
  await expect(page.getByText('Enter your email and a password of at least 4 characters.')).toBeVisible();

  for (const [portal, landing] of [['Staff', /Good (morning|afternoon|evening), Grace/], ['Finance', 'Rose Temba’s queue'], ['Reception', 'OFFICE FRONT · RECEPTION'], ['Store', 'Fatma’s store'], ['Management', 'COMPANY COMMAND CENTER']]) {
    await btn(page, portal).click();
    await page.locator('input[type=password]').fill('demo1234');
    await page.locator('input[type=password]').press('Enter');
    await page.getByRole('button', { name: 'Not now' }).click();
    await expect(page.getByText(landing).first()).toBeVisible();
    await page.locator('header div[style*="cursor: pointer"]').last().click();
    await page.getByText('Sign out', { exact: true }).click();
    await expect(btn(page, 'SIGN IN')).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('forgot password confirms the reset link', async ({ page }) => {
  await page.getByText('Forgot password?').click();
  await expect(page.getByText(/A reset link has been sent to daniel\.k@trinitymark\.co\.tz/)).toBeVisible();
});

test('"Remember me" off ends the session when the browser closes', async ({ page, context }) => {
  await page.getByText('Remember me').click();
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
  await page.locator('input[type=password]').fill('demo1234');
  await btn(page, 'SIGN IN').click();
  await page.goto('/');
  await expect(page.getByText('COMPANY COMMAND CENTER')).toBeVisible();
});
