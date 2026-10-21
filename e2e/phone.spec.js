import { test, expect } from '@playwright/test';
import { openAs, watchErrors, toast, btn, saved, fillModal, modal } from './helpers';

let errors;
test.beforeEach(async ({ page }) => { errors = watchErrors(page); page.on('dialog', d => d.accept()); });
test.afterEach(() => expect(errors).toEqual([]));

const tab = (page, label) => page.locator('nav').getByText(label, { exact: true }).click();

test('phone: sign in, bottom tabs, More sheet and portal switching', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('input[type=password]').fill('demo1234');
  await btn(page, 'SIGN IN').click();
  await expect(page.locator('header b').first()).toHaveText('Dashboard');
  await expect(page.locator('aside')).toHaveCount(0);

  await tab(page, 'Approvals');
  await expect(page.locator('header b').first()).toHaveText('Requests & Floats');
  await tab(page, 'Projects');
  await page.getByText('Lake Zone Roadshow').first().click();
  await expect(page.getByText(/Stage 9 of 15/)).toBeVisible();

  await tab(page, 'More');
  await expect(page.getByText('All modules')).toBeVisible();
  await page.getByRole('button', { name: 'Logistics' }).click();
  await expect(page.locator('header b').first()).toHaveText('Logistics');

  await tab(page, 'More');
  await btn(page, 'Store').click();
  await expect(page.getByText('Fatma’s store')).toBeVisible();
  await expect(page.locator('nav')).toContainText('Inventory');
});

test('phone: boards show one column at a time with status tabs', async ({ page }) => {
  await openAs(page, 'ceo', 'tasks');
  await btn(page, /^To do ·/).click();
  await expect(page.getByText('Print 2,000 Swahili flyers')).toBeVisible();
  await expect(page.getByText('QC 400 branded T-shirts')).toHaveCount(0);
  await btn(page, /^Done ·/).click();
  await expect(page.getByText('QC 400 branded T-shirts')).toBeVisible();
});

test('phone: forms, search and the assistant work on a small screen', async ({ page }) => {
  await openAs(page, 'staff', 'staffportal');
  await btn(page, 'Request money').click();
  await fillModal(page, { 'Amount (TZS)': '15000', Purpose: 'Bodaboda to site' });
  await modal(page).locator('button').last().click();
  await toast(page, /REQ-0427 submitted/);
  expect((await saved(page)).reqs[0]).toMatchObject({ who: 'GM', amt: 15000 });

  await page.locator('header button[title="Search"]').click();
  await page.getByPlaceholder('Search pages, projects, stock, or type an action…').fill('calendar');
  await page.getByPlaceholder('Search pages, projects, stock, or type an action…').press('Enter');
  await expect(page.locator('header b').first()).toHaveText('Calendar');

  await page.locator('header button[title="Trinity Intelligence"]').click();
  await page.getByRole('button', { name: 'Who has open floats?' }).click();
  await expect(page.getByText(/Open staff floats total/)).toBeVisible();
});

test.describe('tablet', () => {
  test.use({ viewport: { width: 820, height: 1180 } });
  test('the sidebar opens as a drawer', async ({ page }) => {
    await openAs(page, 'ceo', 'dashboard');
    await expect(page.locator('aside')).toHaveCount(0);
    await page.locator('header button').first().click();
    await page.locator('aside').getByText('Procurement', { exact: true }).click();
    await expect(page.locator('aside')).toHaveCount(0);
    await expect(btn(page, 'Purchase request')).toBeVisible();
  });
});
