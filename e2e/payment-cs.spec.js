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

test('a request that was not approved can be corrected and resubmitted by the requester', async ({ page }) => {
  page.on('dialog', d => d.accept());
  await openAs(page, 'staff', 'staffportal');
  await btn(page, 'Request money').click();
  await chooseRequest(page, 'Project request');
  await fillModal(page, { 'Amount (TZS)': 90000, 'Purpose': 'Fuel for the site generator' });
  await modal(page).getByRole('button', { name: 'Submit request' }).click();
  let data = await saved(page); const id = data.reqs[0].id;
  await openAs(page, 'gm', 'requests', {}, false);
  await page.getByText(id).first().click();
  await page.getByRole('button', { name: 'Reject', exact: true }).last().click();
  data = await saved(page); expect(data.reqs.find(r => r.id === id).st).toBe('rejected');

  await openAs(page, 'staff', 'requests', {}, false);
  await page.locator('[data-req="' + id + '"] .mr-row').click();
  const fx = page.getByRole('region', { name: 'Correct my request' });
  await expect(fx).toContainText('Not approved');
  await fx.getByLabel('Reply').fill('Wrong number, corrected');
  await fx.getByLabel('Payee number').fill('0713 000 111');
  await fx.getByRole('button', { name: 'Correct and resubmit' }).click();
  data = await saved(page);
  const r = data.reqs.find(x => x.id === id);
  expect(r.st).toBe('pending'); expect(r.pay.no).toBe('0713 000 111');

  // The GM and Management see their own requests too.
  await openAs(page, 'gm', 'requests', {}, false);
  await expect(page.getByText(/^My requests ·/)).toBeVisible();
});
