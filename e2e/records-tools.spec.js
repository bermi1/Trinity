import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { openAs, watchErrors, side, toast, btn, saved, fillModal, modal, rowOf } from './helpers';

let errors;
test.beforeEach(async ({ page }) => { errors = watchErrors(page); page.on('dialog', d => d.accept()); });
test.afterEach(() => expect(errors).toEqual([]));

test('documents: filter, search, upload a real file and open it', async ({ page, context }) => {
  await openAs(page, 'ceo', 'documents');
  await btn(page, 'Contract').click();
  await expect(page.getByText('Serengeti Telecom — signed contract.pdf')).toBeVisible();
  await expect(page.getByText('Lake Zone roadshow brief.pdf')).toHaveCount(0);
  await btn(page, 'All').click();
  await page.getByPlaceholder('Search documents').fill('mlimani');
  await expect(page.getByText('Mlimani stand — client approval.pdf')).toBeVisible();
  await page.getByPlaceholder('Search documents').fill('');

  // Seeded records have no file yet, and say so.
  await page.getByText('Lake Zone roadshow brief.pdf').click();
  await toast(page, 'Lake Zone roadshow brief.pdf has no file attached yet · upload it from Documents');

  await btn(page, 'Upload').click();
  await modal(page).locator('input[type=file]').setInputFiles({ name: 'Venue-plan.txt', mimeType: 'text/plain', buffer: Buffer.from('Stage left, bar right') });
  await expect(modal(page).getByText(/File · attached/)).toBeVisible();
  await expect(modal(page).locator('label').filter({ hasText: 'File name' }).locator('input')).toHaveValue('Venue-plan.txt');
  await fillModal(page, { Type: 'Design' });
  await modal(page).locator('button').last().click();
  await toast(page, 'Uploaded · Venue-plan.txt');

  const [tab] = await Promise.all([context.waitForEvent('page'), page.getByText('Venue-plan.txt').first().click()]);
  await tab.waitForLoadState();
  await expect(tab.locator('body')).toContainText('Stage left, bar right');
});

test('reports: CSV downloads contain live data, and PDF opens a printable report', async ({ page, context }) => {
  await openAs(page, 'ceo', 'reports');
  const [download] = await Promise.all([page.waitForEvent('download'), btn(rowOf(page, 'Store stock report'), 'CSV').click()]);
  expect(download.suggestedFilename()).toBe('store-stock-report.csv');
  const csv = readFileSync(await download.path(), 'utf8');
  expect(csv.split('\n')[0]).toBe('"SKU","Item","Category","Qty","Unit","Minimum","Bin"');
  expect(csv).toContain('"VNL-137G","Vinyl 1.37m gloss","Print media","3"');

  const [doc] = await Promise.all([context.waitForEvent('page'), btn(rowOf(page, 'Project P&L'), 'PDF').click()]);
  await expect(doc.getByRole('heading', { name: 'Project P&L' })).toBeVisible();
  await expect(doc.getByRole('cell', { name: 'PRJ-0231 Lake Zone Roadshow' })).toBeVisible();
});

test('calendar: scheduling a meeting puts it on the right day and notifies', async ({ page }) => {
  await openAs(page, 'ceo', 'calendar');
  await btn(page, 'Schedule meeting').click();
  await fillModal(page, { Title: 'Supplier review', Day: 'Thu 24', Time: '11:30' });
  await modal(page).locator('button').last().click();
  await toast(page, 'Meeting scheduled · Thu 24 11:30');
  await expect(page.getByText('Supplier review')).toBeVisible();
  expect((await saved(page)).events.at(-1)).toMatchObject({ n: 'Supplier review', d: 'Thu 24', t: '11:30' });
});

test('settings: notification switches and the signed-in profile', async ({ page }) => {
  await openAs(page, 'ceo', 'settings');
  await expect(page.getByText('daniel.k@trinitymark.co.tz')).toBeVisible();
  await page.getByText('SMS', { exact: true }).click();
  await toast(page, 'SMS turned on');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('tm360')).prefs.sms)).toBe(true);
  await page.reload();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('tm360')).prefs.sms)).toBe(true);
});

test('command palette searches pages, projects, stock and runs actions', async ({ page }) => {
  await openAs(page, 'ceo', 'dashboard');
  await page.keyboard.press('Control+k');
  const input = page.getByPlaceholder('Search pages, projects, stock, or type an action…');
  await input.fill('gazebo');
  await input.press('Enter');
  await expect(page.getByPlaceholder('Search items, SKU, category')).toHaveValue('Gazebo tent 3×3');
  await page.keyboard.press('Control+k');
  await input.fill('zzzz');
  await expect(page.getByText('No results')).toBeVisible();
  await input.fill('add task');
  await input.press('Enter');
  await expect(modal(page).getByText('New task')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+k');
  await input.fill('Expo Stand');
  await page.getByText('Mlimani Bank · Expo Stand 2026').click();
  await expect(page.getByText(/Stage 7 of 15/)).toBeVisible();
});

test('Trinity Intelligence answers from the live data', async ({ page }) => {
  await openAs(page, 'ceo', 'dashboard');
  await page.locator('header button[title="Trinity Intelligence"]').click();
  await expect(page.getByText('Habari Daniel. Ask me about projects')).toBeVisible();
  await btn(page, 'Which stock is low?').click();
  await expect(page.getByText(/items are below minimum/)).toBeVisible();
  await page.getByPlaceholder('Ask anything about the business…').fill('overdue invoices');
  await page.getByPlaceholder('Ask anything about the business…').press('Enter');
  await expect(page.getByText(/Overdue invoices total TZS 41.2M/)).toBeVisible();
});

test('mobile apps page runs each portal’s phone app, synced with the desktop', async ({ page }) => {
  await openAs(page, 'ceo', 'ceomobile');
  const phone = page.frameLocator('iframe');
  await expect(phone.locator('nav')).toContainText('Approvals');
  await btn(page, 'Store').click();
  await expect(phone.locator('nav')).toContainText('Inventory');
  await btn(page, 'Management').click();
  // Approve on the phone; the desktop sees it.
  await page.locator('iframe').evaluate(el => el.scrollIntoView({ block: 'end' }));
  await phone.locator('nav').getByText('Approvals').click();
  await phone.getByRole('button', { name: 'Approve', exact: true }).click();
  await side(page, 'Requests & Floats');
  await btn(page, /^Approved ·/).click();
  await expect(page.getByText('REQ-0418').first()).toBeVisible();
});

test('reset demo data restores the starting data', async ({ page }) => {
  await openAs(page, 'ceo', 'finance');
  await btn(rowOf(page, 'INV-0187'), 'Mark paid').click();
  await page.locator('header div[style*="cursor: pointer"]').last().click();
  await page.getByText('Reset demo data', { exact: true }).click();
  await toast(page, 'Demo data reset');
  expect((await saved(page)).invoices.find(i => i.id === 'INV-0187').st).toBe('overdue');
});
