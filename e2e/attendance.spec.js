import { test, expect } from '@playwright/test';
import { openAs, watchErrors, saved, side } from './helpers';

test('attendance: staff check in and out on the reception screen; the GM sees the day', async ({ page }) => {
  const errors = watchErrors(page);
  await openAs(page, 'reception', 'reception');
  await side(page, 'Staff check-in');
  const tile = page.locator('.att-tile').first();
  const name = (await tile.locator('b').textContent()).trim();
  await page.getByLabel('Find your name').fill(name.split(' ')[0]);
  await page.getByRole('button', { name: 'Check in ' + name }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Check in' }).click();
  await expect(page.locator('.att-msg')).toContainText('Karibu, ' + name.split(' ')[0]);
  await page.getByRole('button', { name: 'Check out ' + name }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Check out' }).click();
  await expect(page.locator('.att-msg')).toContainText('Kwaheri, ' + name.split(' ')[0]);
  const data = await saved(page);
  expect(data.attendance[0]).toMatchObject({ in: expect.any(String), out: expect.any(String) });

  await openAs(page, 'gm', 'attendance', {}, false);
  await expect(page.locator('.att-feed')).toContainText(name);
  await expect(page.locator('.att-table')).toContainText(name);
  // Staff cannot open it.
  await openAs(page, 'staff', 'attendance', {}, false);
  await expect(page.locator('.att')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('company goal: a won project with an agreed value is taken off the goal', async ({ page }) => {
  // Any change saves the demo data; a check-in is the quickest.
  await openAs(page, 'gm', 'attendance');
  await page.locator('.att-tile').first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Check in' }).click();
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
});
