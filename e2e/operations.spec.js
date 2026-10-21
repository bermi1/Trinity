import { test, expect } from '@playwright/test';
import { openAs, watchErrors, side, toast, btn, saved, fillModal, modal, rowOf } from './helpers';

let errors;
test.beforeEach(async ({ page }) => { errors = watchErrors(page); page.on('dialog', d => d.accept()); });
test.afterEach(() => expect(errors).toEqual([]));

const qty = async (page, sku) => (await saved(page)).stock.find(i => i.sku === sku).q;

test('store: search, issue (cannot exceed stock), receive and reorder', async ({ page }) => {
  await openAs(page, 'ceo', 'store');
  await page.getByPlaceholder('Search items, SKU, category').fill('roll-up');
  await expect(page.getByText('Roll-up stand 85×200')).toBeVisible();
  await expect(page.getByText('Gazebo tent 3×3')).toHaveCount(0);

  await btn(rowOf(page, 'RLU-850'), 'Issue').click();
  await fillModal(page, { Quantity: '50' });
  await modal(page).locator('button').last().click();
  await expect(modal(page).getByText('Only 18 pcs in store.')).toBeVisible();
  await fillModal(page, { Quantity: '5' });
  await modal(page).locator('button').last().click();
  await toast(page, /Issued 5 pcs of Roll-up stand/);
  expect(await qty(page, 'RLU-850')).toBe(13);

  await btn(rowOf(page, 'RLU-850'), 'Receive').click();
  await fillModal(page, { 'Quantity received': '7', Supplier: 'Chapa Supplies' });
  await modal(page).locator('button').last().click();
  expect(await qty(page, 'RLU-850')).toBe(20);

  await page.getByPlaceholder('Search items, SKU, category').fill('VNL-137G');
  await btn(rowOf(page, 'VNL-137G'), 'Reorder').click();
  await toast(page, 'Purchase request PR-0213 created for Vinyl 1.37m gloss');
  expect((await saved(page)).proc[0]).toMatchObject({ id: 'PR-0213', sku: 'VNL-137G', qty: 17, s: 0 });
});

test('procurement to stock: request → quote → approve → PO → delivered → received raises stock', async ({ page }) => {
  await openAs(page, 'ceo', 'procurement');
  const card = page.locator('div[style*="border-radius: 11px"]').filter({ hasText: 'PR-0212' });
  for (const step of ['Get quotes', 'Approve', 'Issue PO', 'Mark delivered']) await btn(card, step).click();
  await toast(page, 'PR-0212 delivered · waiting at the store to be received');
  const before = await qty(page, 'ADH-SPR');

  // The storekeeper receives it into stock.
  await page.locator('header div[style*="cursor: pointer"]').last().click();
  await page.getByText('Storekeeper portal', { exact: true }).click();
  await expect(page.getByText('Fatma’s store')).toBeVisible();
  await btn(rowOf(page, 'Spray adhesive × 24'), 'Receive into store').click();
  await toast(page, /Spray adhesive × 24 received · Spray adhesive now 29 cans/);
  expect(await qty(page, 'ADH-SPR')).toBe(before + 24);
});

test('storekeeper: low stock reorder, quick issue and deliveries', async ({ page }) => {
  await openAs(page, 'store', 'storekeeper');
  await btn(rowOf(page, 'Spray adhesive'), 'Reorder').click();
  await toast(page, /Purchase request PR-0213 created for Spray adhesive/);
  await btn(rowOf(page, 'Vinyl 1.37m gloss', 1), 'Issue').click();
  await toast(page, 'Issued 1 roll of Vinyl 1.37m gloss');
  expect(await qty(page, 'VNL-137G')).toBe(2);
  await btn(rowOf(page, 'Vinyl rolls × 12'), 'Receive into store').click();
  expect(await qty(page, 'VNL-137G')).toBe(14);
  await expect(page.getByText('Received').first()).toBeVisible();
});

test('reception: check visitors in and out, deliveries arrive for the store', async ({ page }) => {
  await openAs(page, 'reception', 'reception');
  await btn(page, 'Check in').click();
  await toast(page, 'Enter the visitor’s name');
  await page.getByPlaceholder('Visitor name').fill('Halima Said');
  await page.getByPlaceholder('Company').fill('Azam Media');
  await page.getByPlaceholder('Purpose').fill('Proposal meeting');
  await btn(page, 'Check in').click();
  await toast(page, 'Halima Said checked in');
  await btn(rowOf(page, 'Halima Said'), 'Check out').click();
  await toast(page, 'Halima Said checked out');
  await btn(rowOf(page, 'Stand graphics proof'), 'Mark arrived').click();
  await toast(page, 'DLV-402 marked arrived');
  expect((await saved(page)).deliveries.find(d => d.id === 'DLV-402').st).toBe('arrived');
});

test('production and logistics move jobs and trips through every stage', async ({ page }) => {
  await openAs(page, 'ceo', 'production');
  for (const step of ['Approved · produce', 'Send to QC', 'Pass QC', 'Packed · dispatch', 'Mark delivered']) await btn(rowOf(page, 'JOB-0313'), step).click();
  await toast(page, 'JOB-0313 → Delivered');
  expect((await saved(page)).jobs.find(j => j.id === 'JOB-0313').s).toBe(7);
  await btn(page, 'New job').click();
  await fillModal(page, { Job: 'Table cloths × 40', Quantity: '40' });
  await modal(page).locator('button').last().click();
  await toast(page, 'Production job JOB-0317 created');

  await side(page, 'Logistics');
  for (const step of ['Dispatch', 'Mark arrived', 'Mark delivered', 'Mark returned']) await btn(rowOf(page, 'TRP-0092'), step).click();
  expect((await saved(page)).trips.find(t => t.id === 'TRP-0092').s).toBe(4);
  await btn(page, 'Schedule trip').click();
  await fillModal(page, { Load: '6 gazebo tents', Destination: 'Arusha' });
  await modal(page).locator('button').last().click();
  await toast(page, 'Trip TRP-0094 scheduled · Arusha');
});
