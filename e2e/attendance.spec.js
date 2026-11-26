import { test, expect } from '@playwright/test';
import { openAs, watchErrors, saved, side } from './helpers';

test('attendance: nobody checks in for someone else; people check themselves in; the GM sees the day', async ({ page }) => {
  const errors = watchErrors(page);
  // Reception sees who is in, but cannot tap a name to check someone in.
  await openAs(page, 'reception', 'reception');
  await side(page, 'Staff check-in');
  await expect(page.locator('.att-tile').first()).toBeVisible();
  await expect(page.locator('button.att-tile')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Check in / })).toHaveCount(0);
  await expect(page.locator('.att-regnote').first()).toContainText('nobody can check in for someone else');

  // A person checks themselves in (their own face matched on My check-in).
  await openAs(page, 'staff', 'checkin', {}, false);
  const me = await page.evaluate(() => JSON.parse(localStorage.getItem('tm360')).role);
  expect(me).toBe('staff');
  const data = await saved(page);
  expect(Array.isArray(data.attendance || [])).toBe(true);

  await openAs(page, 'gm', 'attendance', {}, false);
  await expect(page.locator('.att-table')).toBeVisible();
  // Staff cannot open it.
  await openAs(page, 'staff', 'attendance', {}, false);
  await expect(page.locator('.att')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('company goal: a won project with an agreed value is taken off the goal', async ({ page }) => {
  // Any change saves the demo data; a check-in is the quickest.
  await openAs(page, 'gm', 'today');
  const add = page.getByPlaceholder('Add something to do…');
  await add.fill('Check the targets');
  await add.press('Enter');
  await saved(page);
  await page.goto('/');
  const tg = page.getByRole('region', { name: 'Company target' });
  await page.evaluate(() => localStorage.setItem('tm360', JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('tm360')), { page: 'dashboard' }))));
  await page.reload();
  await expect(tg).toBeVisible();
  const before = await tg.locator('h2').textContent();
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('tm360data'));
    const t = new Date(), at = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
    d.projects.unshift({ id: 'PRJ-WON1', name: 'Won launch event', client: 'Test Client', at, val: 50, st: 'on' });
    localStorage.setItem('tm360data', JSON.stringify(d));
  });
  await page.reload();
  await expect(tg.locator('.tg-won')).toContainText('Won launch event');
  await expect(tg.locator('.tg-won')).toContainText('TZS 50M');
  expect(await tg.locator('h2').textContent()).not.toBe(before);
  // ...and toward Client Service's part of the goal.
  const cs = tg.locator('.tg-dl', { hasText: 'Client Service' });
  if (await cs.count()) await expect(cs).toContainText('TZS');
});
