import { test, expect } from '@playwright/test';
import { openAs, watchErrors, side, toast, btn, saved, fillModal, modal, chooseRequest } from './helpers';

let errors;
test.beforeEach(async ({ page }) => { errors = watchErrors(page); page.on('dialog', d => d.accept()); });
test.afterEach(() => expect(errors).toEqual([]));

const switchTo = async (page, portal) => {
  await page.locator('header div[style*="cursor: pointer"]').last().click();
  await page.getByText(portal, { exact: true }).click();
};

test('a large project request travels the whole chain: GM → Finance → Management → paid float → reconciled', async ({ page }) => {
  await openAs(page, 'staff', 'staffportal');
  await btn(page, 'Request money').click();
  await chooseRequest(page, 'Project request');
  await fillModal(page, { 'Amount (TZS)': '350000', Purpose: 'Taxi to Mlimani site' });
  await modal(page).locator('button').last().click();
  await toast(page, 'REQ-0427 submitted · waiting for General Manager');
  let r = (await saved(page)).reqs.find(x => x.id === 'REQ-0427');
  expect(r).toMatchObject({ type: 'project', who: 'GM', step: 2, st: 'pending' });
  expect((await saved(page)).notes.find(n => n.to === 'GN').t).toBe('REQ-0427 needs your approval');

  // The General Manager approves first.
  await switchTo(page, 'General Manager');
  await side(page, 'Approvals');
  await btn(page, /^Awaiting me ·/).click();
  await page.getByText('REQ-0427').first().click();
  await btn(page, 'Approve').click();
  await toast(page, 'REQ-0427 approved · sent to Finance');
  expect((await saved(page)).notes.find(n => n.to === 'RT').t).toBe('REQ-0427 needs your approval');

  await switchTo(page, 'Finance portal');
  const row = page.locator('div').filter({ hasText: /^Grace Mrema/ }).filter({ has: page.getByRole('button', { name: 'Verify & send to Management' }) }).last();
  await btn(row, 'Verify & send to Management').click();
  await toast(page, 'REQ-0427 verified · sent to Management');

  await switchTo(page, 'Management · Command Center');
  await side(page, 'Approvals');
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
  await toast(page, 'Paid · float opened for Grace Mrema');
  r = (await saved(page)).reqs.find(x => x.id === 'REQ-0427');
  expect(r.st).toBe('paid');
  expect((await saved(page)).staff.find(p => p.k === 'GM').fl).toBe(530000);

  // Grace reconciles: what she spent; Finance accepts the receipts.
  await switchTo(page, 'Staff portal');
  await side(page, 'My requests');
  const rowBtn = page.locator('[data-req="REQ-0427"] .mr-row');
  if ((await rowBtn.getAttribute('aria-expanded')) !== 'true') await rowBtn.click();
  await page.getByLabel('Amount spent').fill('320000');
  await btn(page, 'Send to Finance').click();
  await toast(page, 'Sent to Finance to check');
  await switchTo(page, 'Finance portal');
  await side(page, 'Requests & Floats');
  const float = page.locator('div').filter({ hasText: /^GM/ }).filter({ has: page.getByRole('button', { name: 'Accept receipts' }) }).last();
  await btn(float, 'Accept receipts').click();
  await toast(page, 'Reconciled · REQ-0427');
  r = (await saved(page)).reqs.find(x => x.id === 'REQ-0427');
  expect(r.rec).toMatchObject({ spent: 320000, back: 30000, st: 'ok' });
});

// Removed or redesigned in this phase: rewrite this test.
test.fixme('requests: reject, ask for info and reminders reach the right person', async ({ page }) => {
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

// Screen redesigned (My work, CRM, Finance hub, project by department): rewrite this test.
test.fixme('finance: invoices are sent and paid, and receivables update', async ({ page }) => {
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

// Screen redesigned (My work, CRM, Finance hub, project by department): rewrite this test.
test.fixme('internal, emergency and management requests follow their own routes', async ({ page }) => {
  // Internal office request: GM → Finance → Management → Finance pays.
  await openAs(page, 'staff', 'staffportal');
  await btn(page, 'Request money').click();
  await expect(modal(page).locator('select option')).toHaveText(['Project request', 'Internal office request', 'Emergency request']);
  await chooseRequest(page, 'Internal office request');
  await fillModal(page, { Title: 'Office internet, May', 'Amount (TZS)': '450000', Purpose: 'Monthly fibre bill' });
  await modal(page).locator('button').last().click();
  await toast(page, 'REQ-0427 submitted · waiting for General Manager');
  expect((await saved(page)).reqs[0]).toMatchObject({ type: 'internal', title: 'Office internet, May', step: 2 });

  // Emergency: GM → Management → Finance pays (no Finance check first).
  await btn(page, 'Request money').click();
  await chooseRequest(page, 'Emergency request');
  await fillModal(page, { Title: 'Generator repair on site', 'Amount (TZS)': '600000', 'What happened, and what is it for?': 'Generator failed during setup' });
  await modal(page).locator('button').last().click();
  await toast(page, 'REQ-0428 submitted · waiting for General Manager');

  await switchTo(page, 'General Manager');
  await side(page, 'Approvals');
  await btn(page, /^Awaiting me · 2/).click();
  await page.getByText('REQ-0428').first().click();
  await expect(page.getByText('Emergency request · Generator repair on site')).toBeVisible();
  await btn(page, 'Approve').click();
  await toast(page, 'REQ-0428 approved · sent to Management');
  await page.getByText('REQ-0427').first().click();
  await btn(page, 'Approve').click();
  await toast(page, 'REQ-0427 approved · sent to Finance');
  // The GM cannot act on a request that has moved past their step.
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toHaveCount(0);

  // Management's own request: only Finance checks it before paying. Staff never see this type.
  await switchTo(page, 'Management · Command Center');
  await side(page, 'Approvals');
  await btn(page, 'New request').click();
  await chooseRequest(page, 'Management request');
  await fillModal(page, { Title: 'Client dinner', 'Amount (TZS)': '300000', Purpose: 'Dinner with Kilimo Bank' });
  await modal(page).locator('button').last().click();
  await toast(page, 'REQ-0429 submitted · waiting for Finance');
  const r = (await saved(page)).reqs.find(x => x.id === 'REQ-0429');
  expect(r).toMatchObject({ type: 'management', step: 3 });
  expect(r.log.filter(t => t === 'Not needed')).toHaveLength(2);
});
