import { test, expect } from '@playwright/test';
import { openAs, watchErrors, saved, toast, btn } from './helpers';

const png = name => ({ name, mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64') });

// A project memo to Creative: the Creative Manager assigns a designer, the designer attaches the
// design, and it shows on the project with the trail in the project's activity.
test('memo to Creative: assigned, design attached, reflected on the project', async ({ page }) => {
  const errors = watchErrors(page);
  await openAs(page, 'clientservice', 'project', { projectId: 'PRJ-0231' });
  const sec = page.getByRole('region', { name: 'Memos and files' });
  await btn(sec, 'Send memo').click();
  const c = sec.getByRole('region', { name: 'New memo' });
  await c.getByRole('radiogroup', { name: 'To department' }).getByRole('radio', { name: 'Creative' }).click();
  await c.getByRole('radiogroup', { name: 'Memo category' }).getByRole('radio', { name: 'Emergency request' }).click();
  await c.getByLabel('Memo', { exact: true }).fill('Client wants a second truck-wrap option by tomorrow');
  await btn(c, 'Send memo').click();
  await toast(page, 'Memo sent to Rehema Said');
  let data = await saved(page);
  const memo = data.memos[0];
  expect(memo).toMatchObject({ dept: 'creative', cat: 'emergency', project: 'PRJ-0231', to: 'RS', st: 'sent' });

  // Creative Manager: pop-up → memo page → assign to the designer.
  await openAs(page, 'creative', 'dept', {}, false);
  const pop = page.getByRole('dialog', { name: 'New memo arrived' });
  await expect(pop).toContainText('Emergency request');
  await btn(pop, 'Open memo').click();
  const full = page.getByRole('article', { name: 'Memo' });
  await full.getByRole('radiogroup', { name: 'Assign memo to' }).getByRole('radio', { name: 'David Shayo' }).click();
  await toast(page, 'Assigned to David Shayo');
  await full.getByLabel('Attach work').setInputFiles(png('Truck wrap option B.png'));
  await toast(page, 'Attached · Truck wrap option B.png');
  await btn(full, 'Mark done').click();
  await toast(page, 'Memo done');
  data = await saved(page);
  const P = data.projects.find(p => p.id === 'PRJ-0231');
  expect(P.files.some(f => f.name === 'Truck wrap option B.png' && f.memo === memo.id && f.dept === 'creative')).toBe(true);
  expect(P.notes.some(n => /Creative attached Truck wrap option B.png/.test(n.t))).toBe(true);
  expect(data.notes.some(n => n.to === 'NL' && /Memo done/.test(n.t))).toBe(true);

  // Client Service sees the memo done and the design on the project.
  await openAs(page, 'clientservice', 'project', { projectId: 'PRJ-0231' }, false);
  const sec2 = page.getByRole('region', { name: 'Memos and files' });
  await expect(sec2).toContainText('Done');
  await expect(sec2).toContainText('Truck wrap option B.png');
  expect(errors).toEqual([]);
});

// Operations: build the execution team on the project; import the internal budget from Excel.
test('operations: execution team and internal budget imported from Excel', async ({ page }) => {
  const errors = watchErrors(page);
  await openAs(page, 'operations', 'project', { projectId: 'PRJ-0231' });
  const team = page.getByRole('group', { name: 'Execution team' });
  await team.getByRole('button', { name: 'Juma Ally' }).click();
  await toast(page, 'Added Juma');
  let data = await saved(page);
  expect(data.projects.find(p => p.id === 'PRJ-0231').team).toContain('JA');
  expect(data.notes.some(n => n.to === 'JA' && /You are on the team/.test(n.t))).toBe(true);

  // A project at the budget step: the Excel sheet fills the budget lines.
  await openAs(page, 'clientservice', 'projects', {}, false);
  await page.getByRole('button', { name: 'New project' }).click();
  const m = page.locator('.fm, .m-sheet');
  await m.locator('[data-field="Client"] .ff-pick-btn').click();
  await m.locator('[data-field="Client"]').getByRole('option', { name: 'Mlimani Bank', exact: true }).click();
  await m.locator('[data-field="Project name"] input').fill('Excel Budget Test');
  await m.getByRole('button', { name: 'Create project' }).click();
  data = await saved(page);
  const P = data.projects.find(p => p.name === 'Excel Budget Test');
  await page.evaluate(id => { const d = JSON.parse(localStorage.getItem('tm360data')); d.projects = d.projects.map(p => p.id === id ? Object.assign({}, p, { flow: 'budget' }) : p); localStorage.setItem('tm360data', JSON.stringify(d)); }, P.id);
  await openAs(page, 'operations', 'project', { projectId: P.id }, false);
  const csv = 'Item,Qty,Unit cost,Total\nStage and truss,2,1500000,3000000\nSound system,1,"800,000",800000\nTotal,,,3800000\n';
  await page.getByLabel('Budget file').setInputFiles({ name: 'Internal budget.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await toast(page, '2 lines read from the sheet');
  await expect(page.getByLabel('Budget item 1')).toHaveValue('Stage and truss');
  await expect(page.getByLabel('Unit cost 2')).toHaveValue(/800/);
  expect(errors).toEqual([]);
});
