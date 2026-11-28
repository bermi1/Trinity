import { test, expect } from '@playwright/test';
import { openAs, btn, chooseRequest, fillModal, modal, saved, side } from './helpers';

test('money request asks how to pay; Finance sees where to send it', async ({ page }) => {
  await openAs(page, 'staff', 'staffportal');
  await btn(page, 'Request money').click();
  await chooseRequest(page, 'Project request');
  await fillModal(page, { 'Item 1 price': 120000, 'Purpose': 'Transport for the site visit', 'Pay by': 'Bank', 'Name on the account / recipient': 'Grace Mrema', 'Phone or account number': '0150 1234 5678' });
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
  await fillModal(page, { 'Item 1 price': 90000, 'Purpose': 'Fuel for the site generator' });
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

test('a request can be edited until someone approves it; WhatsApp reminders and number', async ({ page }) => {
  await openAs(page, 'staff', 'staffportal');
  // Everyone can add their WhatsApp number on their home page.
  await page.getByRole('textbox', { name: 'My WhatsApp number' }).first().fill('0754 222 333');
  await page.getByRole('button', { name: 'Save', exact: true }).first().click();
  await expect(page.getByText('WhatsApp reminders go to').first()).toBeVisible();
  await btn(page, 'Request money').click();
  await chooseRequest(page, 'Project request');
  await fillModal(page, { 'Item 1 price': 80000, 'Purpose': 'Printing samples' });
  await modal(page).getByRole('button', { name: 'Submit request' }).click();
  let data = await saved(page); const id = data.reqs[0].id;
  await openAs(page, 'staff', 'requests', {}, false);
  await page.locator('[data-req="' + id + '"] .mr-row').click();
  const fx = page.getByRole('region', { name: 'Correct my request' });
  await expect(fx).toContainText('nobody has approved it yet');
  await fx.getByRole('textbox', { name: 'Item 1 quantity', exact: true }).fill('2');
  await fx.getByRole('textbox', { name: 'Item 1 price', exact: true }).fill('47500');
  await expect(fx.locator('.ff-items-total')).toContainText('TZS 95,000');
  await fx.getByRole('textbox', { name: 'Purpose', exact: true }).fill('Printing samples and lamination');
  await fx.getByRole('button', { name: 'Save changes' }).click();
  data = await saved(page);
  const r = data.reqs.find(x => x.id === id);
  expect(r.amt).toBe(95000); expect(r.items[0]).toMatchObject({ qty: 2, price: 47500, amt: 95000 }); expect(r.purpose).toBe('Printing samples and lamination'); expect(r.st).toBe('pending');
  await expect(page.getByRole('button', { name: 'Remind approver on WhatsApp' })).toBeVisible();
});

test('Finance enters the amount paid; the request shows it; the approver sees every detail', async ({ page }) => {
  await openAs(page, 'staff', 'staffportal');
  await btn(page, 'Request money').click();
  await chooseRequest(page, 'Project request');
  await fillModal(page, { 'Item 1 price': 150000, 'Purpose': 'Hire of two vans', 'Needed by': 'Friday' });
  await modal(page).getByRole('button', { name: 'Submit request' }).click();
  let data = await saved(page); const id = data.reqs[0].id;
  // The approver sees what was filled in.
  await openAs(page, 'gm', 'requests', {}, false);
  await page.getByText(id).first().click();
  await expect(page.locator('.rq-det')).toContainText('Friday');
  // Paid to the person asking by default (their name is filled in).
  await expect(page.locator('.rq-pay')).toContainText('M-Pesa · Grace Mrema · 0754 123 456');
  // Approved; Finance pays part of it.
  await page.evaluate(id => { const d = JSON.parse(localStorage.getItem('tm360data')); d.reqs = d.reqs.map(r => (r.id === id ? Object.assign({}, r, { st: 'approved', step: 5 }) : r)); localStorage.setItem('tm360data', JSON.stringify(d)); }, id);
  await openAs(page, 'finance', 'requests', {}, false);
  await page.getByText(/^All ·/).click();
  await page.getByText(id).first().click();
  await page.getByRole('button', { name: 'Mark paid · TZS 150,000' }).click();
  const pay = page.getByRole('dialog', { name: 'Confirm payment' });
  await pay.getByLabel('Amount paid').fill('120000');
  await pay.getByRole('button', { name: 'Pay TZS 120,000' }).click();
  await expect(page.locator('.rq-paid')).toContainText('Paid TZS 120,000 of TZS 150,000');
  data = await saved(page);
  expect(data.reqs.find(r => r.id === id)).toMatchObject({ st: 'paid', paidAmt: 120000 });
});

test('a money request can list several items; the total is their sum and the approver sees each item', async ({ page }) => {
  await openAs(page, 'staff', 'staffportal');
  await btn(page, 'Request money').click();
  await chooseRequest(page, 'Project request');
  const m = modal(page);
  await fillModal(page, { 'Item 1': 'Transport to Mwanza', 'Item 1 price': '150000' });
  await m.getByRole('button', { name: '+ Add item' }).click();
  await fillModal(page, { 'Item 2': 'Crew lunch', 'Item 2 qty': '4', 'Item 2 price': '20000' });
  await expect(m.getByLabel('Item 2 total')).toHaveText('80,000');
  await m.getByRole('button', { name: '+ Add item' }).click();
  await fillModal(page, { 'Item 3 price': '70000' });
  await expect(m.locator('.ff-items-total')).toHaveText('3 items · Total TZS 300,000');
  await fillModal(page, { Purpose: 'Site visit in Mwanza' });
  await m.getByRole('button', { name: 'Submit request' }).click();
  await expect(m).toContainText('Describe item 3');
  await fillModal(page, { 'Item 3': 'Fuel' });
  await m.getByRole('button', { name: 'Remove item 2' }).click();
  await expect(m.locator('.ff-items-total')).toHaveText('2 items · Total TZS 220,000');
  await m.getByRole('button', { name: '+ Add item' }).click();
  await fillModal(page, { 'Item 3': 'Crew lunch', 'Item 3 qty': '4', 'Item 3 price': '20000' });
  await m.getByRole('button', { name: 'Submit request' }).click();
  await expect(m).toHaveCount(0);
  const data = await saved(page), r = data.reqs[0];
  expect(r.amt).toBe(300000);
  expect(r.items).toEqual([{ d: 'Transport to Mwanza', qty: 1, price: 150000, amt: 150000 }, { d: 'Fuel', qty: 1, price: 70000, amt: 70000 }, { d: 'Crew lunch', qty: 4, price: 20000, amt: 80000 }]);
  await openAs(page, 'gm', 'requests', {}, false);
  await page.getByText(r.id).first().click();
  const list = page.getByRole('list', { name: 'Items' });
  await expect(list).toContainText('Transport to Mwanza');
  await expect(list).toContainText('Crew lunch');
  await expect(list).toContainText('4 × 20,000 = 80,000');
  await expect(list.locator('li.is-total')).toContainText('TZS 300,000');
});
