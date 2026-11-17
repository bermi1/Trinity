import { test, expect } from '@playwright/test';
import { openAs, watchErrors, side, toast, btn, saved, fillModal, modal } from './helpers';

let errors;
test.beforeEach(async ({ page }) => { errors = watchErrors(page); page.on('dialog', d => d.accept()); });
test.afterEach(() => expect(errors).toEqual([]));

test('department portals open on their own dashboard, never the company one', async ({ page }) => {
  for (const [role, label] of [['clientservice', 'Client Service'], ['creative', 'Creative'], ['operations', 'Operations']]) {
    await openAs(page, role, 'dashboard');
    await expect(page.getByText(label + ' department')).toBeVisible();
    await expect(page.getByText('COMPANY COMMAND CENTER')).toHaveCount(0);
    await expect(page.getByText('Revenue vs expenses')).toHaveCount(0);
  }
  // Creative sees projects without money figures.
  await openAs(page, 'creative', 'project', { projectId: 'PRJ-0231' });
  await expect(page.getByText('TZS 168.0M')).toHaveCount(0);
});

// Screen redesigned (My work, CRM, Finance hub, project by department): rewrite this test.
test.fixme('Client Service sends a brief; the Creative lead assigns a designer and moves it to the client', async ({ page }) => {
  await openAs(page, 'clientservice', 'dept');
  await expect(page.getByText('Target this month')).toBeVisible();
  await btn(page, 'Send brief to Creative').click();
  await fillModal(page, { 'What is needed': 'Expo stand graphics', For: 'Indoor event', 'Brief memo': '3 x 2 m back wall, client logo large', 'Needed by': 'Thu 20' });
  await modal(page).locator('button').last().click();
  await toast(page, 'Brief sent to Creative · Rehema Said');
  const brief = (await saved(page)).tasks.find(t => t.t === 'Expo stand graphics');
  expect(brief).toMatchObject({ kind: 'brief', who: 'RS', from: 'NL', place: 'Indoor event', st: 'todo' });
  expect((await saved(page)).notes.find(n => n.to === 'RS').t).toBe('New design brief: Expo stand graphics');

  // The Creative lead passes it to a designer and works it through.
  await openAs(page, 'creative', 'dept', {}, false);
  const row = page.locator(`[data-brief="${brief.id}"]`);
  await expect(row).toContainText('3 x 2 m back wall');
  await row.getByRole('combobox').selectOption({ label: 'David Shayo' });
  await toast(page, 'Expo stand graphics → David Shayo');
  await btn(row, 'Start design').click();
  await btn(row, 'Send to client').click();
  await toast(page, 'Expo stand graphics · With client');
  const d = await saved(page);
  expect(d.tasks.find(t => t.id === brief.id)).toMatchObject({ who: 'DS', st: 'review' });
  expect(d.notes.find(n => n.to === 'NL').t).toBe('Artwork ready for the client: Expo stand graphics');
});

// Screen redesigned (My work, CRM, Finance hub, project by department): rewrite this test.
test.fixme('managers assign tasks to their own team; staff send their day to their manager', async ({ page }) => {
  await openAs(page, 'operations', 'dept');
  const team = page.locator('[data-member]');
  await expect(team.first()).toBeVisible();
  await btn(page.locator('[data-member="GM"]'), 'Assign task').click();
  // A manager can only assign to people in their department.
  const owners = await modal(page).locator('label').filter({ hasText: 'Assign to' }).locator('option').allInnerTexts();
  expect(owners).toContain('Grace Mrema');
  expect(owners).not.toContain('Rose Temba');
  expect(owners).not.toContain('Rehema Said');
  await fillModal(page, { Task: 'Collect banners from printing' });
  await modal(page).locator('button').last().click();
  await toast(page, 'Task created and assigned to Grace Mrema');
  expect((await saved(page)).notes.find(n => n.to === 'GM').t).toBe('New task: Collect banners from printing');

  // Staff assign only to themselves.
  await openAs(page, 'staff', 'tasks', {}, false);
  await btn(page, 'New task').click();
  expect(await modal(page).locator('label').filter({ hasText: 'Assign to' }).locator('option').allInnerTexts()).toEqual(['Grace Mrema']);
  await page.keyboard.press('Escape');

  // Grace sends her day: it reaches Michael, the Operations manager.
  await side(page, 'Daily to-do');
  await btn(page, 'Send my day').click();
  const note = (await saved(page)).notes.find(n => n.to === 'MM');
  expect(note.t).toMatch(/^Grace Mrema’s day: \d+ done, \d+ planned$/);

  // Michael sees only his team in the to-do team view.
  await openAs(page, 'operations', 'today', {}, false);
  await page.getByRole('button', { name: 'Team', exact: true }).click();
  await expect(page.locator('[data-person="GM"]')).toBeVisible();
  await expect(page.locator('[data-person="RT"]')).toHaveCount(0);
});
