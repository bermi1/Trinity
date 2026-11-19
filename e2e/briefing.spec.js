import { test, expect } from '@playwright/test';
import { openAs, watchErrors, saved, toast, btn } from './helpers';

// Heads send updates before Monday; the GM chairs: decisions become tasks; minutes go to the heads;
// the following week opens with last week's actions and whether they were done.
test('Monday Briefing: updates, decisions as tasks, minutes, and next week’s follow-up', async ({ page }) => {
  const errors = watchErrors(page);
  await openAs(page, 'operations', 'briefing');
  const upd = page.getByRole('region', { name: 'Weekly update' });
  await upd.getByLabel('Done last week').fill('Roadshow in Mwanza and Musoma done; expo stand built');
  await upd.getByLabel('Issues and help needed').fill('Need a second truck for Arusha');
  await btn(upd, 'Send update').click();
  await toast(page, 'Update sent for Monday’s briefing');
  let data = await saved(page);
  expect(data.notes.some(n => n.to === 'GN' && /Briefing update · Operations/.test(n.t))).toBe(true);

  await openAs(page, 'gm', 'briefing', {}, false);
  await expect(page.getByText('Department updates · 1 of 6 in')).toBeVisible();
  await expect(page.locator('[data-dept="operations"]')).toContainText('Need a second truck for Arusha');
  await btn(page.locator('[data-dept="creative"]'), 'Remind').click();
  await toast(page, 'Reminder sent to Rehema Said');
  await btn(page, 'Publish minutes').click();
  await expect(page.getByRole('alert')).toHaveText('Record at least one decision before publishing');
  const dec = page.getByRole('group', { name: 'New decision' });
  await dec.getByLabel('Decision').fill('Hire a second truck for the Arusha leg');
  await dec.getByLabel('Action').fill('Get two truck hire quotes');
  await dec.getByRole('radio', { name: 'Grace Mrema' }).click();
  await btn(dec, 'Record decision · create task').click();
  await toast(page, 'Decision recorded · task given to Grace Mrema');
  await btn(page, 'Publish minutes').click();
  await toast(page, 'Minutes published to');
  data = await saved(page);
  const t = data.tasks.find(x => x.t === 'Get two truck hire quotes');
  expect(t).toMatchObject({ who: 'GM', by: 'GN', src: 'briefing', st: 'todo' });
  expect(data.notes.some(n => n.to === 'MM' && /minutes published/.test(n.t))).toBe(true);

  // Grace finishes the action with a report.
  await openAs(page, 'staff', 'today', {}, false);
  await page.getByRole('button', { name: 'Done: Get two truck hire quotes' }).click();
  await page.getByLabel('Report: Get two truck hire quotes').fill('Quotes: TZS 1.8M and 2.1M');
  await btn(page, 'Mark done').click();

  // A week later: move this briefing to last week, and the new briefing opens with its actions.
  await page.waitForTimeout(500);
  await page.goto('/');
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    localStorage.setItem('tm360', JSON.stringify({ auth: true, role: 'ceo', page: 'briefing' }));
    const d = JSON.parse(localStorage.getItem('tm360data'));
    d.briefings = d.briefings.map(b => { const [y, m, dd] = b.week.split('-').map(Number); const x = new Date(y, m - 1, dd - 7); return Object.assign({}, b, { week: x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0') }); });
    localStorage.setItem('tm360data', JSON.stringify(d));
  });
  await page.reload();
  await expect(page.getByText('Last week’s actions')).toBeVisible();
  await expect(page.locator('.br-list li.is-done').filter({ hasText: 'Get two truck hire quotes' })).toContainText('Quotes: TZS 1.8M and 2.1M');
  expect(errors).toEqual([]);
});

test('staff do not see the Monday Briefing', async ({ page }) => {
  await openAs(page, 'staff', 'briefing');
  await expect(page.locator('aside').getByText('Monday Briefing')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Monday Briefing' })).toHaveCount(0);
});
