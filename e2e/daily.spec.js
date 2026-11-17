import { test, expect } from '@playwright/test';
import { openAs, watchErrors, side, toast, btn, saved, fillModal, modal, chooseRequest } from './helpers';

let errors;
test.beforeEach(async ({ page }) => { errors = watchErrors(page); page.on('dialog', d => d.accept()); });
test.afterEach(() => expect(errors).toEqual([]));

const switchTo = async (page, portal) => {
  await page.locator('header div[style*="cursor: pointer"]').last().click();
  await page.getByText(portal, { exact: true }).click();
};
const card = (page, title) => page.locator('section.k-card').filter({ has: page.getByRole('heading', { name: new RegExp('^' + title) }) });

test('daily to-do: plan, tick, add what was done, send the day and share it', async ({ page }) => {
  await openAs(page, 'staff', 'staffportal');
  await side(page, 'Daily to-do');
  await expect(page.getByRole('heading', { name: 'Daily to-do' })).toBeVisible();

  // Grace's sample list: one plan from yesterday is still open.
  const plan = card(page, 'To do'), done = card(page, 'Done today');
  await expect(plan.getByText('since', { exact: false })).toBeVisible();

  // Add a plan with Enter, and one from her open tasks with a tap.
  await plan.getByRole('textbox', { name: 'Plan' }).fill('Collect banners from the print floor');
  await plan.getByRole('textbox', { name: 'Plan' }).press('Enter');
  await expect(plan.getByText('Collect banners from the print floor')).toBeVisible();
  await expect(plan.getByRole('textbox', { name: 'Plan' })).toHaveValue('');
  const suggestion = plan.locator('.td-suggest button').first();
  const taskName = (await suggestion.innerText()).replace(/^\+\s*/, '');
  await suggestion.click();
  await expect(plan.getByText(taskName, { exact: true })).toBeVisible();

  // Tick it: it moves to Done today. Untick brings it back.
  await plan.getByRole('button', { name: 'Done: Collect banners from the print floor' }).click();
  await expect(done.getByText('Collect banners from the print floor')).toBeVisible();
  await done.getByRole('button', { name: 'Not done: Collect banners from the print floor' }).click();
  await expect(plan.getByText('Collect banners from the print floor')).toBeVisible();
  await plan.getByRole('button', { name: 'Done: Collect banners from the print floor' }).click();

  // Add something finished directly, and remove a mistake.
  await done.getByRole('textbox', { name: 'Done' }).fill('Called the venue about power');
  await done.getByRole('button', { name: 'Add · Done' }).click();
  await expect(done.getByText('Called the venue about power')).toBeVisible();
  await done.getByRole('textbox', { name: 'Done' }).fill('Typo entry');
  await done.getByRole('textbox', { name: 'Done' }).press('Enter');
  await done.getByRole('button', { name: 'Remove: Typo entry' }).click();
  await expect(page.getByText('Typo entry')).toHaveCount(0);

  const d = await saved(page);
  const mine = d.todos.filter(i => i.k === 'GM');
  expect(mine.find(i => i.t === 'Collect banners from the print floor')).toMatchObject({ st: 'done' });
  expect(mine.find(i => i.t === 'Called the venue about power')).toMatchObject({ st: 'done' });

  // Share on WhatsApp opens a message with the day's list.
  await page.evaluate(() => { window.__opened = []; window.open = url => { window.__opened.push(url); return null; }; });
  await btn(page, 'Share on WhatsApp').click();
  const url = (await page.evaluate(() => window.__opened))[0];
  expect(url).toMatch(/^https:\/\/wa\.me\/\?text=/);
  const text = decodeURIComponent(new URL(url).searchParams.get('text') || '');
  expect(text).toContain('Grace Mrema');
  expect(text).toContain('✓ Called the venue about power');

  // Send my day counts as the daily report.
  await btn(page, 'Send my day').click();
  await toast(page, 'Daily report submitted');
  await expect(page.getByText('✓ Today’s report sent')).toBeVisible();
  expect((await saved(page)).staff.find(p => p.k === 'GM').rep).toBe(true);
});

test('managers see the whole team’s to-do and remind people who have not written one', async ({ page }) => {
  await openAs(page, 'ceo', 'today');
  await page.getByRole('button', { name: 'Team', exact: true }).click();
  const grace = page.locator('[data-person="GM"]');
  await expect(grace).toContainText('Delivered branded tents to Mwanza site');
  await expect(grace).toContainText('Set up 4 gazebos for the roadshow');
  await expect(page.getByText(/of \d+ people have written their to-do/)).toBeVisible();

  const empty = page.locator('.td-person.is-empty').first();
  const name = await empty.locator('header b').innerText();
  await btn(empty, 'Remind').click();
  await toast(page, 'Reminder sent to ' + name);

  await page.getByRole('button', { name: 'Yesterday' }).click();
  await expect(grace).not.toContainText('Delivered branded tents to Mwanza site');
  await expect(grace).toContainText('Send site photos to Sarah');

  // Staff only see their own list.
  await openAs(page, 'staff', 'today');
  await expect(page.getByRole('button', { name: 'Team', exact: true })).toHaveCount(0);
});

test('a small project request goes GM → Finance and skips Management', async ({ page }) => {
  await openAs(page, 'staff', 'staffportal');
  await btn(page, 'Request money').click();
  await chooseRequest(page, 'Project request');
  await expect(modal(page).getByText(/Up to TZS 200,000, Management is not needed/)).toBeVisible();
  await fillModal(page, { 'Amount (TZS)': '120000', Purpose: 'Taxi to Mlimani site' });
  await modal(page).locator('button').last().click();
  await toast(page, 'REQ-0427 submitted · waiting for General Manager');

  await switchTo(page, 'Management · Command Center');
  await side(page, 'Approvals');
  await btn(page, /^All ·/).click();
  await page.getByText('REQ-0427').first().click();
  await btn(page, 'Approve').click();
  await toast(page, 'REQ-0427 approved · sent to Finance');
  await expect(page.getByText('Not needed for this request').first()).toBeVisible();

  await switchTo(page, 'Finance portal');
  const row = page.locator('div').filter({ hasText: /^Grace Mrema/ }).filter({ has: page.getByRole('button', { name: 'Verify & send to Management' }) }).last();
  await btn(row, 'Verify & send to Management').click();
  await toast(page, 'REQ-0427 approved · sent to Finance for payment');
  const r = (await saved(page)).reqs.find(x => x.id === 'REQ-0427');
  expect(r).toMatchObject({ step: 5, st: 'approved' });
  expect(r.log.filter(t => t === 'Not needed')).toHaveLength(2);
});

test('company setup: switch sections off and change the small-request limit', async ({ page }) => {
  await openAs(page, 'ceo', 'dashboard');
  await side(page, 'Company setup');
  await expect(page.getByRole('heading', { name: 'Company setup' })).toBeVisible();

  // Meeting rooms off: gone from the menu, from search, and kept off after a reload.
  await page.getByRole('switch', { name: 'Meeting rooms' }).click();
  await toast(page, 'Meeting rooms switched off');
  await expect(page.getByRole('switch', { name: 'Meeting rooms' })).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('aside').getByText('Meeting rooms', { exact: true })).toHaveCount(0);
  await page.keyboard.press('Control+k');
  await page.getByPlaceholder(/Search/).fill('Meeting rooms');
  await expect(page.getByText('Go to Meeting rooms')).toHaveCount(0);
  await page.keyboard.press('Escape');
  expect((await saved(page)).company.off).toContain('rooms');
  await page.reload();
  await expect(page.getByRole('switch', { name: 'Meeting rooms' })).toHaveAttribute('aria-checked', 'false');

  // Limit 0: every request goes through all steps.
  const amount = page.getByLabel('Amount (TZS)');
  await amount.fill('0');
  await btn(page, 'Save').click();
  await toast(page, 'Every request now takes all approval steps');
  expect((await saved(page)).company.smallLimit).toBe(0);
  await page.keyboard.press('Control+k');
  await page.getByPlaceholder(/Search/).fill('Request money');
  await page.keyboard.press('Enter');
  await chooseRequest(page, 'Internal office request');
  await expect(modal(page).getByText('Goes to GM → Finance → Management → Finance pays.', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');

  // Switching back on brings it back.
  await page.getByRole('switch', { name: 'Meeting rooms' }).click();
  await side(page, 'Meeting rooms');
  await expect(page.getByText('Meeting rooms · today')).toBeVisible();
});

test('projects have five stages; older projects are shown in the new stages', async ({ page }) => {
  await openAs(page, 'ceo', 'project', { projectId: 'PRJ-0226' });
  // Stage 12 of the old 15 (Delivery) is "On site" now.
  await expect(page.getByText(/Stage 4 of 5 · On site/)).toBeVisible();
  for (const s of ['Brief', 'Approved', 'Production', 'On site', 'Closed']) await expect(page.getByText(s, { exact: true }).first()).toBeVisible();
  await btn(page, 'Advance stage').click();
  await toast(page, /closed/);
  expect((await saved(page)).projects.find(p => p.id === 'PRJ-0226')).toMatchObject({ stage: 5, sv: 2, st: 'done' });
});
