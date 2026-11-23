import { test, expect } from '@playwright/test';
import { openAs, watchErrors, saved, toast, btn } from './helpers';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

// Staff say what they are working on and post updates; the head sees it live, comments, assigns,
// and at the end of the day sends a department report built from the team's day.
test('the head sees what the team is working on, comments, and sends the day report', async ({ page }) => {
  const errors = watchErrors(page);
  await openAs(page, 'staff', 'today');
  await page.getByLabel('Plan', { exact: true }).fill('Load the truck for Arusha');
  await page.getByLabel('Plan', { exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Working on it: Load the truck for Arusha' }).click();
  await page.locator('.td-item').filter({ hasText: 'Load the truck for Arusha' }).getByRole('button', { name: 'Post update' }).click();
  await page.getByLabel('Update on Load the truck for Arusha').fill('Half loaded, waiting for 2 gazebos');
  await page.getByLabel('Update on Load the truck for Arusha').press('Enter');
  let data = await saved(page);
  const todo = data.todos.find(i => i.t === 'Load the truck for Arusha');
  expect(todo).toMatchObject({ st: 'prog', k: 'GM' });
  expect(todo.posts[0].t).toBe('Half loaded, waiting for 2 gazebos');
  expect(data.notes.some(n => n.to === 'MM' && n.s === 'Half loaded, waiting for 2 gazebos')).toBe(true);

  await openAs(page, 'operations', 'today', {}, false);
  await page.getByRole('button', { name: 'Team' }).click();
  const grace = page.locator('[data-person="GM"]');
  const item = grace.locator('[data-item="Load the truck for Arusha"]');
  await expect(item).toContainText('Working on it');
  await expect(item).toContainText('Half loaded, waiting for 2 gazebos');
  await item.getByRole('button', { name: 'Comment' }).click();
  await item.getByLabel('Comment on Load the truck for Arusha').fill('Take the gazebos from the store at 2pm');
  await item.getByLabel('Comment on Load the truck for Arusha').press('Enter');
  data = await saved(page);
  expect(data.notes.some(n => n.to === 'GM' && n.s === 'Take the gazebos from the store at 2pm')).toBe(true);

  await grace.getByRole('button', { name: 'Assign a task to Grace Mrema' }).click();
  await expect(page.getByRole('dialog')).toContainText('New task');
  await page.keyboard.press('Escape');

  await btn(page, 'Create today’s department report').click();
  const form = page.getByRole('region', { name: 'New report' });
  await expect(form.getByLabel('Next')).toHaveValue(/Grace: Load the truck for Arusha \(Take the gazebos from the store at 2pm\)/);
  await btn(form, 'Send report').click();
  await toast(page, 'Report sent to Joseph and Daniel');
  data = await saved(page);
  expect(data.reports[0]).toMatchObject({ by: 'MM', kind: 'daily', to: ['GN', 'DK'] });
  expect(errors).toEqual([]);
});

// Everyone can add a profile picture; it shows wherever their face appears.
test('a staff member adds a profile picture', async ({ page }) => {
  await openAs(page, 'staff', 'today');
  await page.locator('header').getByText('Grace Mrema').click();
  await page.getByLabel('Change my photo').setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: PNG });
  await toast(page, 'Photo saved · Grace Mrema');
  const data = await saved(page);
  expect(data.photos.GM).toMatch(/^data:image\/jpeg/);
  await openAs(page, 'operations', 'today', {}, false);
  await page.getByRole('button', { name: 'Team' }).click();
  await expect(page.locator('[data-person="GM"] .k-avatar')).toHaveAttribute('style', /url\("data:image\/jpeg/);
});
