import { test, expect } from '@playwright/test';
import { openAs, watchErrors, side, toast, btn, saved, fillModal, modal } from './helpers';

let errors;
test.beforeEach(async ({ page }) => { errors = watchErrors(page); page.on('dialog', d => d.accept()); });
test.afterEach(() => expect(errors).toEqual([]));

const switchTo = async (page, portal) => {
  await page.locator('header div[style*="cursor: pointer"]').last().click();
  await page.getByText(portal, { exact: true }).click();
};

test('a money request travels the whole chain: staff → finance → management → paid float → reconciled', async ({ page }) => {
  await openAs(page, 'staff', 'staffportal');
  await btn(page, 'Request money').click();
  await fillModal(page, { 'Amount (TZS)': '120000', Purpose: 'Taxi to Mlimani site' });
  await modal(page).locator('button').last().click();
  await toast(page, 'REQ-0427 submitted · waiting for Project Manager');
  let r = (await saved(page)).reqs.find(x => x.id === 'REQ-0427');
  expect(r).toMatchObject({ who: 'GM', step: 1, st: 'pending' });

  // Management signs off the Project Manager and Operations steps on their behalf.
  await switchTo(page, 'Management · Command Center');
  await side(page, 'Requests & Floats');
  await btn(page, /^All ·/).click();
  await page.getByText('REQ-0427').first().click();
  await btn(page, 'Approve').click();
  await toast(page, 'REQ-0427 approved · sent to Operations');
  await btn(page, 'Approve').click();
  await toast(page, 'REQ-0427 approved · sent to Finance');
  expect((await saved(page)).notes.find(n => n.to === 'RT').t).toBe('REQ-0427 needs your approval');

  await switchTo(page, 'Finance portal');
  const row = page.locator('div').filter({ hasText: /^Grace Mrema/ }).filter({ has: page.getByRole('button', { name: 'Verify & send to Management' }) }).last();
  await btn(row, 'Verify & send to Management').click();
  await toast(page, 'REQ-0427 verified · sent to Management');

  await switchTo(page, 'Management · Command Center');
  await side(page, 'Requests & Floats');
  await btn(page, /^Awaiting me ·/).click();
  await page.getByText('REQ-0427').first().click();
  await expect(page.getByText('Taxi to Mlimani site')).toBeVisible();
  await btn(page, 'Approve').click();
  await toast(page, 'REQ-0427 approved · sent to Finance for payment');

  // Finance pays it.
  await switchTo(page, 'Finance portal');
  await side(page, 'Requests & Floats');
  await btn(page, /^Approved ·/).click();
  await page.getByText('REQ-0427').first().click();
  await btn(page, 'Mark paid · open float').click();
  await toast(page, 'Paid via M-Pesa · float opened for Grace Mrema');
  r = (await saved(page)).reqs.find(x => x.id === 'REQ-0427');
  expect(r.st).toBe('paid');
  expect((await saved(page)).staff.find(p => p.k === 'GM').fl).toBe(300000);

  // Reconcile the float once receipts are in.
  const float = page.locator('div').filter({ hasText: /^GM/ }).filter({ has: page.getByRole('button', { name: 'Reconcile' }) }).last();
  await btn(float, 'Reconcile').click();
  await toast(page, 'Float reconciled · Grace Mrema');
  expect((await saved(page)).staff.find(p => p.k === 'GM').fl).toBe(0);
});

test('requests: reject, ask for info and reminders reach the right person', async ({ page }) => {
  await openAs(page, 'ceo', 'requests');
  await page.getByText('REQ-0421').first().click();
  await btn(page, 'Ask for info').click();
  await toast(page, 'Question sent to Neema Lyimo');
  await btn(page, 'Reject').click();
  await toast(page, 'REQ-0421 rejected · Neema notified');
  await btn(page, /^Rejected ·/).click();
  await expect(page.getByText('REQ-0421').first()).toBeVisible();

  await btn(page, /^All ·/).click();
  await page.getByText('REQ-0425').first().click();
  await btn(page, 'Send reminder').click();
  await toast(page, 'Reminder sent to Rose Temba');

  // The reminder appears for Rose (finance), not for management.
  const notes = (await saved(page)).notes;
  expect(notes.find(n => n.to === 'RT').t).toBe('REQ-0425 is waiting for your approval');
  await side(page, 'Notifications');
  await expect(page.getByText('REQ-0425 is waiting for your approval')).toHaveCount(0);
  await switchTo(page, 'Finance portal');
  await side(page, 'Notifications');
  await expect(page.getByText('REQ-0425 is waiting for your approval')).toBeVisible();
});

test('opening a paid request shows its history', async ({ page }) => {
  await openAs(page, 'ceo', 'requests');
  await btn(page, /^All ·/).click();
  await page.getByText('REQ-0412').first().click();
  await expect(page.getByText('Paid · float open').first()).toBeVisible();
});

test('finance: invoices are sent and paid, and receivables update', async ({ page }) => {
  await openAs(page, 'ceo', 'finance');
  const draft = page.locator('div').filter({ hasText: /^INV-0198/ }).last();
  await btn(draft, 'Send').click();
  await toast(page, 'INV-0198 sent to Nyota Insurance');
  const overdue = page.locator('div').filter({ hasText: /^INV-0187/ }).last();
  await btn(overdue, 'Mark paid').click();
  await toast(page, 'INV-0187 marked paid · TZS 18.6M received');
  const inv = (await saved(page)).invoices;
  expect(inv.find(i => i.id === 'INV-0187').st).toBe('paid');
  expect(inv.find(i => i.id === 'INV-0198').st).toBe('sent');
  await expect(page.getByText('1 overdue')).toBeVisible();

  await btn(page, 'New invoice').click();
  await fillModal(page, { 'Amount (TZS M)': '9.5', 'Due date': '30 Nov' });
  await modal(page).locator('button').last().click();
  await expect(page.getByText('INV-0199', { exact: true })).toBeVisible();
});

test('rejecting asks first; cancelling leaves the request untouched', async ({ page }) => {
  page.removeAllListeners('dialog');
  let asked = '';
  page.once('dialog', d => { asked = d.message(); d.dismiss(); });
  await openAs(page, 'ceo', 'requests');
  await page.getByText('REQ-0418').first().click();
  await btn(page, 'Reject').click();
  expect(asked).toBe('Reject REQ-0418 (TZS 300,000)? John will be notified.');
  expect((await saved(page)).reqs?.find(r => r.id === 'REQ-0418')?.st ?? 'pending').toBe('pending');
});
