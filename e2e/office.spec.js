import { test, expect } from '@playwright/test';
import { openAs, watchErrors, saved, toast, btn } from './helpers';

// A lead that only needs a piece of work: Client Service sends a memo; the department head
// sees it, replies and marks it done; Client Service sees the answer on the lead.
test('a memo from a lead reaches the department head and the answer comes back', async ({ page }) => {
  const errors = watchErrors(page);
  await openAs(page, 'clientservice', 'clients');
  await page.locator('[data-lead="L1"]').click();
  const panel = page.getByRole('dialog');
  await panel.getByRole('button', { name: 'Send memo to a department' }).click();
  await panel.getByRole('radio', { name: 'Operations' }).click();
  await panel.getByLabel('Memo', { exact: true }).fill('Please quote transport for 3 trucks to Arusha on 12 Dec');
  await panel.getByRole('button', { name: 'Send memo' }).click();
  await toast(page, 'Memo sent to Michael Mushi');
  let data = await saved(page);
  const memo = data.memos[0];
  expect(memo).toMatchObject({ dept: 'operations', to: 'MM', from: 'NL', lead: 'L1', st: 'sent' });
  expect(data.notes.some(n => n.to === 'MM' && /Memo from Neema Lyimo/.test(n.t))).toBe(true);

  await openAs(page, 'operations', 'dept', {}, false);
  const card = page.locator('[data-memo="' + memo.id + '"]');
  await expect(card).toContainText('Please quote transport for 3 trucks');
  await card.getByRole('button', { name: 'Mark seen' }).click();
  await card.getByLabel('Reply to memo from Neema Lyimo').fill('Quote is TZS 2.4M, sent by email');
  await btn(card, 'Done').click();
  await toast(page, 'Memo done · Neema Lyimo told');
  data = await saved(page);
  expect(data.memos[0]).toMatchObject({ st: 'done', reply: 'Quote is TZS 2.4M, sent by email' });

  await openAs(page, 'clientservice', 'clients', {}, false);
  await page.locator('[data-lead="L1"]').click();
  await expect(page.getByRole('dialog')).toContainText('Quote is TZS 2.4M, sent by email');
  expect(errors).toEqual([]);
});

// Any staff member registers a visitor; the front desk expects them and tells the host on arrival;
// the GM sees it on the calendar.
test('a staff member’s expected visitor reaches the front desk and the GM’s calendar', async ({ page }) => {
  await openAs(page, 'staff', 'meetings');
  await btn(page, 'I’m expecting a visitor').click();
  const form = page.getByRole('region', { name: 'Expected visitor' });
  await form.getByLabel('Visitor name').fill('Baraka Mushi');
  await form.getByLabel('From (company)').fill('Vodacom');
  await form.getByLabel('Reason').fill('Site plan review');
  await form.getByLabel('Time').fill('15:45');
  await btn(form, 'Tell the front desk').click();
  await toast(page, 'Front desk told · Baraka Mushi');
  let data = await saved(page);
  expect(data.visitors[0]).toMatchObject({ name: 'Baraka Mushi', host: 'GM', st: 'expected', time: '15:45' });
  expect(data.notes.some(n => n.to === 'AM' && /Expected visitor: Baraka Mushi from Vodacom/.test(n.t))).toBe(true);

  await openAs(page, 'gm', 'meetings', {}, false);
  await expect(page.getByText('Visitor: Baraka Mushi · Vodacom')).toBeVisible();

  await openAs(page, 'reception', 'reception', {}, false);
  const row = page.locator('.rd-list li').filter({ hasText: 'Baraka Mushi' });
  await btn(row, 'Arrived').click();
  await toast(page, 'Baraka Mushi checked in');
  data = await saved(page);
  expect(data.visitors.find(v => v.name === 'Baraka Mushi').st).toBe('in');
  expect(data.notes.some(n => n.to === 'GM' && /Your guest has arrived: Baraka Mushi/.test(n.t))).toBe(true);
});

// The PA runs Management's diary: sees every meeting and visitor, schedules for Management, no money.
test('the Personal Assistant schedules for Management and sees no money', async ({ page }) => {
  await openAs(page, 'pa', 'meetings');
  await expect(page.getByText('Gala planning with Safari Mobile')).toBeVisible();
  await btn(page, 'New meeting').click();
  await page.getByLabel('Title').fill('MD with CRDB marketing');
  await page.getByRole('button', { name: 'Client meeting' }).click();
  await page.getByLabel('Guest name').fill('Asha Mollel');
  await btn(page, 'Send invitation').click();
  await toast(page, 'Meeting sent');
  await expect(page.locator('aside').getByText('Finance', { exact: false })).toHaveCount(0);
  await openAs(page, 'ceo', 'dashboard', {}, false);
  await expect(page.getByRole('region', { name: 'Purchase orders' })).toContainText('PO not received');
});

// A customer's invoice details (TIN, VRN, address) are captured once and used on every invoice.
test('a new customer’s TIN, VRN and address flow into the invoice', async ({ page }) => {
  await openAs(page, 'clientservice', 'clients');
  await btn(page, 'Add client').click();
  const f = page.getByRole('dialog');
  for (const [l, v] of [['Company name', 'Azam Media Ltd'], ['Contact person', 'Rose Mkapa'], ['TIN', '104-555-210'], ['VRN', '10-031122-K'], ['P.O. Box', 'P.O. Box 2517'], ['City', 'Dar es Salaam']]) await f.locator('[data-field="' + l + '"] input').fill(v);
  await btn(f, 'Add client').click();
  await toast(page, 'Client added · Azam Media Ltd');
  await openAs(page, 'finance', 'invoices', {}, false);
  await btn(page, 'New invoice').click();
  const ed = page.getByRole('dialog');
  await ed.getByRole('button', { name: 'Azam Media Ltd', exact: true }).click();
  await expect(ed.locator('[data-field] input, label.ff input').nth(1)).toHaveValue('10-031122-K');
  await ed.getByLabel('Item 1').fill('Studio branding');
  await ed.getByLabel('Rate 1').fill('2500000');
  await btn(ed, 'Create invoice').click();
  const data = await saved(page);
  expect(data.invoices[0]).toMatchObject({ c: 'Azam Media Ltd', tin: '104-555-210', vrn: '10-031122-K', addr: 'P.O. Box 2517, Dar es Salaam' });
});
