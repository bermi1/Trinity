import { test, expect } from '@playwright/test';
import { openAs, btn, chooseRequest, fillModal, modal, saved, side } from './helpers';

test('money request asks how to pay; Finance sees where to send it', async ({ page }) => {
  await openAs(page, 'staff', 'staffportal');
  await btn(page, 'Request money').click();
  await chooseRequest(page, 'Project request');
  await fillModal(page, { 'Amount (TZS)': 120000, 'Purpose': 'Transport for the site visit', 'Pay by': 'Bank', 'Name on the account / recipient': 'Grace Mrema', 'Phone or account number': '0150 1234 5678' });
  await modal(page).getByRole('button', { name: 'Submit request' }).click();
  await expect(modal(page)).toContainText('Enter the bank name');
  await fillModal(page, { 'Bank (for bank transfers)': 'CRDB' });
  await modal(page).getByRole('button', { name: 'Submit request' }).click();
  const data = await saved(page);
  expect(data.reqs[0].pay).toEqual({ by: 'Bank', name: 'Grace Mrema', no: '0150 1234 5678', bank: 'CRDB' });
  await openAs(page, 'gm', 'requests', {}, false);
  await page.getByText(data.reqs[0].id).first().click();
  await expect(page.locator('.rq-pay')).toContainText('Bank · CRDB · Grace Mrema · 0150 1234 5678');
});

test('a Client Service team member on the staff portal gets their own clients & leads', async ({ page }) => {
  await openAs(page, 'gm', 'team');
  const grace = page.locator('.tp-list li', { hasText: 'Grace Mrema' });
  await grace.locator('.tp-row').click();
  await grace.getByRole('radio', { name: 'Client Service' }).click();
  await saved(page);
  await openAs(page, 'staff', 'staffportal', {}, false);
  await side(page, 'My clients & leads');
  await expect(page.locator('main')).toBeVisible();
});
