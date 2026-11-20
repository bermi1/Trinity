import { test, expect } from '@playwright/test';
import { openAs, watchErrors } from './helpers';

// A customer's card shows what Trinity Mark has done with them: projects now running, finished projects and deals.
test('customer history: ongoing and past projects, open one from the card', async ({ page }) => {
  const errors = watchErrors(page);
  await openAs(page, 'clientservice', 'clients');
  await page.getByRole('tab', { name: /Customers/ }).click();

  const kilimo = page.locator('[data-customer="Kilimo Bank"]');
  await kilimo.getByRole('button', { name: /History · 2 ongoing · 0 past/ }).click();
  const hist = kilimo.getByLabel('History of Kilimo Bank');
  await expect(hist).toContainText('Ongoing projects · 2');
  await expect(hist).toContainText('No finished projects yet.');

  const bahari = page.locator('[data-customer="Bahari Logistics"]');
  await bahari.getByRole('button', { name: /History · 0 ongoing · 1 past/ }).click();
  await expect(bahari.getByLabel('History of Bahari Logistics')).toContainText('Past projects · 1');
  await expect(bahari.getByLabel('History of Bahari Logistics')).toContainText('Closed');

  // Opening a project from the history goes to the project record.
  const first = hist.getByRole('button', { name: /^Open project / }).first();
  const name = (await first.getAttribute('aria-label')).replace('Open project ', '');
  await first.click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
  expect(errors).toEqual([]);
});
