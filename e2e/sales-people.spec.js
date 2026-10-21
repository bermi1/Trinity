import { test, expect } from '@playwright/test';
import { openAs, watchErrors, side, toast, btn, saved, modal, rowOf } from './helpers';

let errors;
test.beforeEach(async ({ page }) => { errors = watchErrors(page); page.on('dialog', d => d.accept()); });
test.afterEach(() => expect(errors).toEqual([]));

test('CRM: a lead moves to won and becomes a project', async ({ page }) => {
  await openAs(page, 'ceo', 'crm');
  const card = page.locator('div[style*="border-radius: 11px"]').filter({ hasText: 'Serena Hotels' });
  for (let i = 0; i < 3; i++) await btn(card, 'Advance').click();
  await btn(card, 'Mark won').click();
  await toast(page, 'Won · Serena Hotels — create the project');
  await expect(modal(page).getByText('New project')).toBeVisible();
  await expect(modal(page).locator('input').first()).toHaveValue('Serena Hotels');
  await modal(page).locator('button').last().click();
  await toast(page, 'Project PRJ-0236 created');
  await expect(page.getByText('Lobby & signage refresh').first()).toBeVisible();
});

test('proposals: stages, print to PDF, rejection, and conversion to a project', async ({ page, context }) => {
  await openAs(page, 'ceo', 'proposals');
  const row = () => rowOf(page, 'PRO-0152');
  for (const step of ['Submit for review', 'Approve', 'Send to client']) await btn(row(), step).click();
  await btn(row(), 'Not accepted').click();
  await toast(page, 'PRO-0152 marked not accepted');
  await btn(page, /^Rejected/).click();
  await expect(page.getByText('PRO-0152', { exact: true })).toBeVisible();
  await btn(page, /^All/).first().click();

  const [doc] = await Promise.all([context.waitForEvent('page'), btn(rowOf(page, 'PRO-0148'), 'PDF').click()]);
  await expect(doc.getByText('Branch rebrand · 18 branches').first()).toBeVisible();
  await expect(doc.getByText('Prepared for Kilimo Bank')).toBeVisible();
  await expect(doc.getByRole('button', { name: 'Print / Save as PDF' })).toBeVisible();
  await doc.close();

  for (const step of ['Mark viewed', 'Negotiate', 'Mark accepted']) await btn(rowOf(page, 'PRO-0148'), step).click();
  await btn(rowOf(page, 'PRO-0148'), 'Convert to project').click();
  await modal(page).locator('button').last().click();
  await toast(page, 'Project PRJ-0236 created');
  await side(page, 'Sales & Proposals');
  await expect(rowOf(page, 'PRO-0148').getByText('Project created')).toBeVisible();
});

test('staff: reminders reach the person, who sees them and reports back', async ({ page }) => {
  await openAs(page, 'ceo', 'staff');
  await btn(page, 'Remind missing staff').click();
  await toast(page, 'Reminder sent to 4 staff');
  await btn(rowOf(page, 'Peter Laizer'), 'Remind').click();
  const notes = (await saved(page)).notes.filter(n => n.to);
  expect(notes.map(n => n.to).sort()).toEqual(['FH', 'JA', 'PL', 'PL', 'RS']);
});

test('notifications: open one, then mark all read', async ({ page }) => {
  await openAs(page, 'ceo', 'notifications');
  await page.getByText('Low stock · Vinyl 1.37m gloss').click();
  await expect(page.getByPlaceholder('Search items, SKU, category')).toBeVisible();
  await side(page, 'Notifications');
  await btn(page, 'Mark all as read').click();
  expect((await saved(page)).notes.every(n => n.read)).toBe(true);
  await expect(page.locator('header button[title="Notifications"] span')).toHaveCount(0);
});

test('field app: the person’s own tasks, money request, photo and daily report', async ({ page }) => {
  await openAs(page, 'ceo', 'field');
  await expect(page.getByText('Mobile app · John Mwakyusa')).toBeVisible();
  await expect(page.getByText('1 of 5 done')).toBeVisible();
  await btn(rowOf(page, 'Check printing production · print floor'), 'Start').click();
  await btn(rowOf(page, 'Check printing production · print floor'), 'Complete').click();
  await toast(page, 'Task completed · synced to office');
  expect((await saved(page)).tasks.find(t => t.id === 'T15').st).toBe('done');

  // Site photo goes to Documents.
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), btn(page, 'Photo').first().click()]);
  await chooser.setFiles({ name: 'outlet4.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('fake-jpeg') });
  await toast(page, 'Photo saved to Documents');
  expect((await saved(page)).docs[0].n).toMatch(/Site photo · John · .* · outlet4\.jpg/);

  await btn(page, 'Money').click();
  await btn(page, 'Submit request').click();
  await toast(page, 'Enter an amount and a purpose');
  await page.getByPlaceholder('300000').fill('40000');
  await page.getByPlaceholder('What is the money for?').fill('Ladder hire');
  await btn(page, 'Submit request').click();
  await toast(page, 'REQ-0427 sent · waiting for Project Manager');

  await btn(page, 'Report').click();
  await page.getByPlaceholder('e.g. Outlet 4 wall is damp — returning Thursday.').fill('Outlet 4 done, outlet 5 tomorrow');
  await btn(page, 'Submit report').click();
  await expect(page.getByText(/Asante John/)).toBeVisible();
  const d = await saved(page);
  expect(d.reportsToday.JM).toBe(true);
  expect(d.reportsSub).toBe(45);
});

test('staff portal: own tasks, money request and daily report', async ({ page }) => {
  await openAs(page, 'staff', 'staffportal');
  await expect(page.getByText(/Good (morning|afternoon|evening), Grace/)).toBeVisible();
  await rowOf(page, 'Confirm venue permits · Musoma & Bukoba').locator('button').first().click();
  expect((await saved(page)).tasks.find(t => t.id === 'T2').st).toBe('done');
  await btn(page, 'Submit report').click();
  await toast(page, 'Write your report first');
  await page.getByPlaceholder('What did you complete, and what remains?').fill('Permits confirmed for both towns');
  await btn(page, 'Submit report').click();
  await toast(page, 'Daily report submitted');
  const d = await saved(page);
  expect(d.reportsToday.GM).toBe(true);
  await expect(page.getByText('Sent', { exact: true })).toBeVisible();
  // Staff see an Approvals page for requests waiting on them.
  await side(page, 'Approvals');
  await expect(btn(page, /^Awaiting me · 0/)).toBeVisible();
});

test('meeting rooms: book a free slot, cancel it, and see who holds the others', async ({ page }) => {
  await openAs(page, 'ceo', 'rooms');
  await page.locator('input').first().fill('Budget review');
  const free = page.getByText('Free', { exact: true }).first();
  await free.click();
  await toast(page, /booked · 0?\d:00/);
  await page.getByText('Budget review').click();
  await toast(page, /Booking cancelled/);
  await page.getByText('Serengeti contract review').first().click();
  await toast(page, 'Booked by Sarah Kimaro · Serengeti contract review');
});
