import { test, expect } from '@playwright/test';
import { openAs, watchErrors, side, toast, btn, saved, fillModal, modal } from './helpers';

let errors;
test.beforeEach(async ({ page }) => { errors = watchErrors(page); page.on('dialog', d => d.accept()); });
test.afterEach(() => expect(errors).toEqual([]));

test('dashboard: figures, chart, shortcuts and every quick action', async ({ page }) => {
  await openAs(page, 'ceo', 'dashboard');
  await expect(page.getByText(/Good (morning|afternoon|evening), Daniel/)).toBeVisible();

  // Chart range switch and hover details.
  for (const r of ['6 months', 'Year', '12 weeks']) await btn(page, r).click();
  const chart = page.locator('div[style*="height: 240px"][style*="position: relative"]');
  await chart.hover({ position: { x: 300, y: 120 } });
  await expect(page.getByText('Net').first()).toBeVisible();

  // KPI card and donut legend go to the right place.
  await page.getByText('Pending approvals', { exact: true }).click();
  await expect(page.getByText('Requests & Floats').first()).toBeVisible();
  await side(page, 'Dashboard');
  await page.locator('div').filter({ hasText: /^At risk2$/ }).click();
  await expect(btn(page, 'At risk · 2')).toHaveCSS('background-color', 'rgb(43, 20, 89)');
  await side(page, 'Dashboard');

  // Every quick action opens its form, validates, and creates the record.
  const quick = [
    ['Create project', { Client: 'Azam Media', 'Project name': 'Studio launch' }, 'Project PRJ-0236 created'],
    ['Create invoice', { 'Amount (TZS M)': '12' }, 'Invoice INV-0199 saved as draft'],
    ['Add task', { Task: 'Book sound system' }, 'Task created and assigned to Sarah Kimaro'],
    ['Request payment', { 'Amount (TZS)': '50000', Purpose: 'Parking fees' }, /REQ-0427 submitted/],
    ['Purchase request', { Item: 'Cable ties × 500' }, /Purchase request PR-0213 submitted/],
    ['New lead', { Client: 'Vodashop', Opportunity: 'Store openings' }, 'Lead added · Vodashop'],
    ['Create proposal', { Client: 'Vodashop', 'Service / scope': 'Store openings' }, 'Proposal PRO-0153 saved as draft'],
    ['Schedule meeting', { Title: 'Ops review' }, /Meeting scheduled · Mon 21/]
  ];
  for (const [label, values, done] of quick) {
    if (!(await page.getByText('Quick actions').isVisible())) await side(page, 'Dashboard');
    await btn(page, label).click();
    await btn(modal(page), await modal(page).locator('button').last().innerText()).click();
    await expect(modal(page).getByText(/is required\./)).toBeVisible();
    await fillModal(page, values);
    await modal(page).locator('button').last().click();
    await toast(page, done);
    await expect(modal(page)).toHaveCount(0);
  }
  // A created project opens on its own page.
  const data = await saved(page);
  expect(data.projects[0]).toMatchObject({ id: 'PRJ-0236', client: 'Azam Media' });
  expect(data.reqs[0]).toMatchObject({ id: 'REQ-0427', who: 'DK', amt: 50000, step: 1 });

  // The activity feed records what happened.
  await side(page, 'Dashboard');
  await expect(page.getByText('Proposal drafted · Vodashop')).toBeVisible();
});

test('forms reject zero or negative amounts', async ({ page }) => {
  await openAs(page, 'ceo', 'requests');
  await btn(page, 'New request').click();
  await fillModal(page, { 'Amount (TZS)': '-5', Purpose: 'Test' });
  await modal(page).locator('button').last().click();
  await expect(modal(page).getByText('Amount (TZS) must be a number above 0.')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(modal(page)).toHaveCount(0);
});

test('Monday Briefing: agenda, decisions become tasks, team updates, minutes', async ({ page }) => {
  await openAs(page, 'ceo', 'briefing');
  await page.getByText('Projects at risk', { exact: true }).click();
  expect((await saved(page)).agenda).toEqual([true, true, true, false, false, false]);

  await btn(page, 'Add task').click();
  await toast(page, 'Add a decision and an action first');
  await page.getByPlaceholder('New decision…').fill('Hire two extra installers');
  await page.getByPlaceholder('Action to take…').fill('Call the installer agency');
  await page.locator('select').first().selectOption({ label: 'Michael Mushi' });
  await page.getByPlaceholder('Deadline').fill('Wed 23');
  await btn(page, 'Add task').click();
  await toast(page, 'TSK-1045 created and assigned to Michael Mushi');
  await side(page, 'Tasks');
  await expect(page.getByText('Call the installer agency')).toBeVisible();

  await side(page, 'Monday Briefing');
  await page.getByPlaceholder('What did you do, or what will you present today?').fill('Stand design ready to present');
  await btn(page, 'Post update').click();
  await expect(page.getByText('Stand design ready to present')).toBeVisible();

  await btn(page, 'End & publish minutes').click();
  await toast(page, /Minutes published to 11 attendees/);
  await side(page, 'Notifications');
  await expect(page.getByText('Monday Briefing minutes published')).toBeVisible();
});

test('projects: filters, workflow, tasks, money and invoices from a project', async ({ page }) => {
  await openAs(page, 'ceo', 'projects');
  await btn(page, 'Delayed · 1').click();
  await expect(page.getByText('Expo Stand 2026')).toBeVisible();
  await expect(page.getByText('Lake Zone Roadshow')).toHaveCount(0);
  await btn(page, 'All · 8').click();
  await page.getByText('Lake Zone Roadshow').first().click();
  await expect(page.getByText(/Stage 9 of 15 · Store/)).toBeVisible();

  await btn(page, 'Advance stage').click();
  await toast(page, 'Moved to Logistics');
  await expect(page.getByText(/Stage 10 of 15 · Logistics/)).toBeVisible();

  // Tick a task done, then add one from the project.
  await page.locator('div').filter({ hasText: /^Confirm venue permits · Musoma & Bukoba/ }).locator('button').first().click();
  expect((await saved(page)).tasks.find(t => t.id === 'T2').st).toBe('done');
  await btn(page, 'Add task').click();
  await fillModal(page, { Task: 'Print crew badges' });
  await modal(page).locator('button').last().click();
  await expect(page.getByText('Print crew badges')).toBeVisible();

  await btn(page, 'Request money').click();
  await fillModal(page, { 'Amount (TZS)': '75000', Purpose: 'Badge printing' });
  await modal(page).locator('button').last().click();
  await expect(page.getByText('REQ-0427')).toBeVisible();

  await btn(page, 'Invoice').click();
  await fillModal(page, { 'Amount (TZS M)': '20' });
  await modal(page).locator('button').last().click();
  await toast(page, 'Invoice INV-0199 saved as draft');

  await page.getByText('All projects').click();
  await expect(btn(page, 'New project')).toBeVisible();
});

test('tasks board: filters and moving cards through every column', async ({ page }) => {
  await openAs(page, 'ceo', 'tasks');
  await btn(page, 'High priority').click();
  await expect(page.getByText('Final artwork approval from client')).toHaveCount(0);
  await btn(page, 'All tasks').click();
  const card = page.locator('div[style*="border-radius: 11px"]').filter({ hasText: 'Print 2,000 Swahili flyers' });
  for (const step of ['Start', 'Submit', 'Approve']) await btn(card, step).click();
  await toast(page, 'Task completed · Print 2,000 Swahili flyers');
  expect((await saved(page)).tasks.find(t => t.id === 'T4').st).toBe('done');
  await card.locator('button').first().click();
  expect((await saved(page)).tasks.find(t => t.id === 'T4').st).toBe('review');
});
