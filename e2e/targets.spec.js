import { test, expect } from '@playwright/test';
import { openAs, watchErrors, saved, toast, btn } from './helpers';

// The company target on the overview: the GM keys in a week, the shortfall carries forward,
// Management edits the targets, and Client Service sees its own target without editing.
test('company target: record a week, carry-forward, edit targets, Client Service view', async ({ page }) => {
  const errors = watchErrors(page);
  await openAs(page, 'gm', 'dashboard');
  const tg = page.getByRole('region', { name: 'Company target' });
  await expect(tg).toContainText('Company target');
  await expect(tg).toContainText('speed');
  // The General Manager now sets targets too.
  await expect(tg.getByRole('button', { name: 'Edit targets' })).toHaveCount(1);

  const isoKey = () => { const d = new Date(), x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = x.getUTCDay() || 7; x.setUTCDate(x.getUTCDate() + 4 - day); const y = x.getUTCFullYear(); return y + '-W' + String(Math.ceil(((x - new Date(Date.UTC(y, 0, 1))) / 864e5 + 1) / 7)).padStart(2, '0'); };
  const weekTarget = await tg.locator('.tg-card').first().locator('b').innerText();
  await tg.getByRole('button', { name: 'Record this week' }).click();
  const sheet = page.getByRole('region', { name: 'Record the week' });
  await sheet.getByLabel('Earned · Client Service').fill('20000000');
  await sheet.getByLabel('Earned · Operations').fill('10000000');
  await sheet.getByRole('button', { name: 'One more project' }).click();
  await sheet.getByRole('button', { name: 'One more project' }).click();
  await sheet.getByRole('button', { name: /^Save week/ }).click();
  await toast(page, 'saved · TZS 30M');
  let t = (await saved(page)).targets[0];
  expect(t.weeks[isoKey()]).toMatchObject({ amt: 30000000, projects: 2, depts: { clientservice: 20000000, operations: 10000000 } });
  // 30M is below the week's target: the card says what was earned, and the gap moves to the weeks ahead.
  await expect(tg.locator('.tg-card').first()).toContainText('TZS 30M earned so far');
  expect(weekTarget).toMatch(/^TZS/);
  expect((await saved(page)).notes.some(n => /Week \d+ results recorded/.test(n.t))).toBe(true);

  // Management edits the targets; departments cannot exceed the company target.
  await openAs(page, 'ceo', 'dashboard', {}, false);
  await page.getByRole('region', { name: 'Company target' }).getByRole('button', { name: 'Edit targets' }).click();
  const set = page.getByRole('region', { name: 'Set targets' });
  await set.getByLabel('Company target for the year').fill('3000000000');
  await set.getByLabel('Client Service', { exact: true }).fill('4000000000');
  await btn(set, 'Save targets').click();
  await expect(set.getByRole('alert')).toHaveText('Department targets add up to more than the company target');
  await set.getByLabel('Client Service', { exact: true }).fill('1200000000');
  await btn(set, 'Save targets').click();
  await toast(page, 'Targets saved');
  t = (await saved(page)).targets[0];
  expect(t).toMatchObject({ revenue: 3000000000, depts: { clientservice: 1200000000 } });
  await expect(page.getByRole('region', { name: 'Company target' })).toContainText('of TZS 3B');

  // Client Service: company target and its own department only, no recording or editing.
  await openAs(page, 'clientservice', 'dept', {}, false);
  const cs = page.getByRole('region', { name: 'Company target' });
  await expect(cs).toContainText('of TZS 3B');
  await expect(cs.locator('.tg-depts li')).toHaveCount(1);
  await expect(cs.locator('.tg-depts')).toContainText('Client Service');
  await expect(cs.getByRole('button', { name: 'Record this week' })).toHaveCount(0);
  await expect(cs.getByRole('button', { name: 'Edit targets' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

// No target yet (a new year or a live workspace): Management is asked to set one.
test('no target yet: Management sets the year’s targets', async ({ page }) => {
  await openAs(page, 'ceo', 'dashboard');
  await page.getByRole('region', { name: 'Company target' }).getByRole('button', { name: 'Edit targets' }).click();
  await btn(page.getByRole('region', { name: 'Set targets' }), 'Save targets').click();
  await toast(page, 'Targets saved');
  await saved(page);
  await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('tm360data')); d.targets = []; localStorage.setItem('tm360data', JSON.stringify(d)); });
  await page.reload();
  const tg = page.getByRole('region', { name: 'Company target' });
  await expect(tg).toContainText('No target set');
  await tg.getByRole('button', { name: 'Set the year’s targets' }).click();
  await page.getByRole('region', { name: 'Set targets' }).getByLabel('Company target for the year').fill('1500000000');
  await btn(page.getByRole('region', { name: 'Set targets' }), 'Save targets').click();
  await expect(page.getByRole('region', { name: 'Company target' })).toContainText('of TZS 1.5B');
});

// The Client Service Manager sets each team member's targets; results come from their work in the system.
test('Client Service team targets: manager sets them, results counted, GM sees them, member sees their own', async ({ page }) => {
  const errors = watchErrors(page);
  await openAs(page, 'clientservice', 'dept');
  const team = page.getByRole('region', { name: 'Company target' }).locator('.tg-team');
  await expect(team).toContainText('Client Service team');
  await expect(team.locator('[data-member="NL"]')).toContainText('Proposals');
  await team.getByRole('button', { name: 'Set team targets' }).click();
  const set = page.getByRole('region', { name: 'Set team targets' });
  await set.getByLabel('Revenue · Neema Lyimo').fill('5000000000');
  await btn(set, 'Save team targets').click();
  await expect(set.getByRole('alert')).toContainText('more than the Client Service target');
  await set.getByLabel('Revenue · Neema Lyimo').fill('500000000');
  await set.getByLabel('Projects · Neema Lyimo').fill('15');
  await set.getByLabel('Clients · Neema Lyimo').fill('7');
  await set.getByLabel('Proposals · Neema Lyimo').fill('20');
  await btn(set, 'Save team targets').click();
  await toast(page, 'Team targets saved');
  const t = (await saved(page)).targets[0];
  expect(t.people.NL).toEqual({ revenue: 500000000, projects: 15, clients: 7, proposals: 20 });

  // A new client added by Neema counts towards her clients.
  const clientsBefore = await team.locator('[data-member="NL"] .tg-metric').nth(2).locator('b').innerText();
  await openAs(page, 'clientservice', 'clients', {}, false);
  await btn(page, 'Add client').click();
  await page.getByRole('dialog').locator('[data-field="Company name"] input').fill('Zanzibar Spice Co');
  await btn(page.getByRole('dialog'), 'Add client').click();
  await toast(page, 'Client added');
  await openAs(page, 'clientservice', 'dept', {}, false);
  const after = await page.locator('.tg-team [data-member="NL"] .tg-metric').nth(2).locator('b').innerText();
  expect(parseInt(after)).toBe(parseInt(clientsBefore) + 1);

  // The GM sees the team and may set its targets; Neema sees her own targets on My work.
  await openAs(page, 'gm', 'dashboard', {}, false);
  await expect(page.locator('.tg-team')).toContainText('Neema Lyimo');
  await expect(page.locator('.tg-team').getByRole('button', { name: 'Set team targets' })).toHaveCount(1);
  await openAs(page, 'clientservice', 'today', {}, false);
  const mine = page.getByRole('region', { name: 'My targets' });
  await expect(mine).toContainText('TZS 500M');
  await expect(mine).toContainText('/ 20');
  expect(errors).toEqual([]);
});
