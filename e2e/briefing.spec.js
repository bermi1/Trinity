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
  await expect(page.getByText('Department updates · 1 of 5 in')).toBeVisible();
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

// Anyone presenting uploads slides and key points; the PA records highlights and what was agreed;
// everyone opens the presentations and sees the agreed to-dos. Heads' updates stay with the heads.
test('presentations uploaded before the meeting, highlights and agreed to-dos for everyone', async ({ page }) => {
  const errors = watchErrors(page);
  await openAs(page, 'staff', 'briefing');
  await expect(page.getByText('Department updates')).toHaveCount(0);
  const pres = page.getByRole('region', { name: 'Presentations' });
  await btn(pres, 'Upload my presentation').click();
  await pres.getByLabel('Presentation title').fill('Field team: roadshow results');
  await pres.getByLabel('Key points').fill('6 regions done\n12,400 people reached\nNeed rain covers');
  await pres.getByLabel('Presentation file').setInputFiles({ name: 'Roadshow results.pptx', mimeType: 'application/vnd.ms-powerpoint', buffer: Buffer.from('slides') });
  await btn(pres, 'Upload').click();
  await toast(page, 'Presentation uploaded for Monday · Field team: roadshow results');

  await openAs(page, 'pa', 'briefing', {}, false);
  await expect(page.locator('.br-pres')).toContainText('12,400 people reached');
  const [doc] = await Promise.all([page.context().waitForEvent('page'), page.getByRole('button', { name: 'Open presentation · Field team: roadshow results' }).click()]);
  await doc.close();
  // Present full screen: slides and key points, next/previous, close.
  await page.getByRole('button', { name: 'Present · Field team: roadshow results' }).click();
  const show = page.getByRole('dialog', { name: 'Presenting · Field team: roadshow results' });
  await expect(show).toContainText('12,400 people reached');
  await show.getByRole('button', { name: 'Close presentation' }).click();
  await expect(show).toHaveCount(0);
  // No money in the briefing, not even for Management.
  await openAs(page, 'ceo', 'briefing', {}, false);
  await expect(page.getByText(/Money in last week|Money out last week/)).toHaveCount(0);
  await expect(page.locator('.br-issue, [aria-label="Issues"]').getByText(/Overdue|Budget waiting/)).toHaveCount(0);
  await openAs(page, 'pa', 'briefing', {}, false);
  const hl = page.getByRole('region', { name: 'Key highlights' });
  await hl.getByLabel('Highlight').fill('Roadshow reached 12,400 people across 6 regions');
  await btn(hl, 'Add').click();
  const dec = page.getByRole('group', { name: 'New decision' });
  await dec.getByLabel('Decision').fill('Buy rain covers before the next roadshow');
  await dec.getByLabel('Action').fill('Get 3 quotes for gazebo rain covers');
  await dec.getByRole('radio', { name: 'John Mwakyusa' }).click();
  await btn(dec, 'Record decision · create task').click();
  await toast(page, 'task given to John Mwakyusa');
  await btn(page, 'Publish minutes').click();
  await toast(page, 'Minutes published to');

  await openAs(page, 'staff', 'briefing', {}, false);
  await expect(page.getByRole('region', { name: 'Key highlights' })).toContainText('Roadshow reached 12,400 people');
  await expect(page.getByText('Get 3 quotes for gazebo rain covers')).toBeVisible();
  const data = await saved(page);
  expect(data.notes.some(n => n.to === 'GM' && /minutes published/.test(n.t))).toBe(true);
  expect(errors).toEqual([]);
});

// On a phone the presenter fills the screen and the key points sit under the slides.
test('presenting on a phone fits the screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openAs(page, 'staff', 'briefing');
  const pres = page.getByRole('region', { name: 'Presentations' });
  await btn(pres, 'Upload my presentation').click();
  await pres.getByLabel('Presentation title').fill('Phone deck');
  await pres.getByLabel('Key points').fill('One\nTwo\nThree');
  await pres.getByLabel('Presentation file').setInputFiles({ name: 'cover.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64') });
  await btn(pres, 'Upload').click();
  await page.getByRole('button', { name: 'Present · Phone deck' }).click();
  const show = page.getByRole('dialog', { name: 'Presenting · Phone deck' });
  await expect(show.locator('img')).toBeVisible();
  const box = await show.boundingBox();
  expect(Math.round(box.width)).toBe(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(show.getByText('Three')).toBeVisible();
});
