import { test, expect } from '@playwright/test';
import { openAs, watchErrors, saved, toast, btn, fillModal, modal } from './helpers';

const file = (name, mime) => ({ name, mimeType: mime, buffer: Buffer.from('demo file for ' + name) });
const now = page => page.getByRole('region', { name: 'Current step' });

// One project through every department: Client Service → Creative → Client Service → Operations →
// GM → Management → execution (task and report) → closed. Each step is done by the person responsible.
test('a project moves through every department, step by step', async ({ page }) => {
  const errors = watchErrors(page);

  // 1. Client Service creates the project (no value yet) and sends the design brief.
  await openAs(page, 'clientservice', 'projects');
  await page.getByRole('button', { name: 'New project' }).click();
  await fillModal(page, { Client: 'Mlimani Bank', 'Project name': 'Flow Test Launch', Deadline: '30 Jan' });
  await modal(page).getByRole('button', { name: 'Create project' }).click();
  await toast(page, 'next: send the design brief to Creative');
  let data = await saved(page);
  const P = data.projects.find(p => p.name === 'Flow Test Launch');
  expect(P).toMatchObject({ flow: 'brief', val: 0, pm: '', cs: 'NL' });
  await expect(now(page)).toContainText('Now · Brief');

  await now(page).getByRole('button', { name: 'Send design brief to Creative' }).click();
  await fillModal(page, { 'What is needed': 'Flow Test backdrop and banners' });
  await modal(page).getByRole('button', { name: 'Send brief' }).click();
  await toast(page, 'Brief sent to Creative');
  await expect(now(page)).toContainText('Now · Design');
  expect((await saved(page)).notes.some(n => n.to === 'RS' && /New design brief/.test(n.t))).toBe(true);

  // 2. Creative: the Creative Manager uploads the design, sends it for approval and approves it.
  await openAs(page, 'creative', 'dept', {}, false);
  const brief = page.locator('[data-brief]').filter({ hasText: 'Flow Test backdrop and banners' });
  await brief.getByLabel(/Upload design for/).setInputFiles(file('backdrop-v1.png', 'image/png'));
  await toast(page, 'Design uploaded · backdrop-v1.png');
  await brief.getByRole('button', { name: 'Send to Creative Manager' }).click();
  await brief.getByRole('button', { name: 'Approve design' }).click();
  await toast(page, 'Approved');
  data = await saved(page);
  expect(data.projects.find(p => p.id === P.id).flow).toBe('proposal');
  expect(data.notes.some(n => n.to === 'NL' && /upload the proposal/.test(n.t))).toBe(true);
  expect(data.notes.some(n => n.to === 'GN' && /Design approved/.test(n.t))).toBe(true);

  // 3. Client Service uploads the proposal; it goes to Operations.
  await openAs(page, 'clientservice', 'project', { projectId: P.id }, false);
  await expect(now(page)).toContainText('Now · Proposal');
  await now(page).getByLabel('Proposal file').setInputFiles(file('Mlimani proposal.pdf', 'application/pdf'));
  await now(page).getByRole('button', { name: 'Upload proposal · send to Operations' }).click();
  await toast(page, 'sent to Operations for the budget');
  data = await saved(page);
  expect(data.projects.find(p => p.id === P.id)).toMatchObject({ flow: 'budget', proposal: { name: 'Mlimani proposal.pdf' } });
  expect(data.notes.some(n => n.to === 'MM' && /Budget needed/.test(n.t))).toBe(true);

  // 4. Operations: Project Manager, internal budget (with the file) and the value; submit.
  await openAs(page, 'operations', 'dept', {}, false);
  await page.getByText('Mlimani Bank · Flow Test Launch').click();
  await expect(now(page)).toContainText('Now · Budget');
  await now(page).getByRole('button', { name: 'Submit for approval' }).click();
  await expect(now(page).getByRole('alert')).toHaveText('Choose the Project Manager');
  await now(page).getByRole('radio', { name: 'Sarah Kimaro' }).click();
  await now(page).getByLabel('Budget item 1').fill('Stage and truss hire');
  await now(page).getByLabel('Quantity 1').fill('2');
  await now(page).getByLabel('Unit cost 1').fill('1500000');
  await now(page).getByLabel('Budget file').setInputFiles(file('Flow budget.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'));
  await expect(now(page)).toContainText('Budget file attached');
  await now(page).getByLabel('Project value').fill('5000000');
  await now(page).getByRole('button', { name: 'Submit for approval' }).click();
  await toast(page, 'Budget sent to the GM for approval');
  data = await saved(page);
  let p = data.projects.find(x => x.id === P.id);
  expect(p).toMatchObject({ flow: 'approval', pm: 'SK', budget: { st: 'gm', value: 5000000, file: { name: 'Flow budget.xlsx' } } });
  expect(p.budget.lines).toEqual([{ item: 'Stage and truss hire', qty: 2, cost: 1500000 }]);

  // 5. The GM approves, then Management; the project moves to execution with its value.
  await openAs(page, 'gm', 'dashboard', {}, false);
  await page.getByRole('button', { name: /Approve budget · Mlimani Bank/ }).click();
  await now(page).getByRole('button', { name: 'Approve budget' }).click();
  await toast(page, 'Approved · sent to Management');
  await openAs(page, 'ceo', 'project', { projectId: P.id }, false);
  await expect(now(page)).toContainText('Approved by the GM');
  await now(page).getByRole('button', { name: 'Approve budget' }).click();
  await toast(page, 'Budget approved · project moves to execution');
  data = await saved(page);
  p = data.projects.find(x => x.id === P.id);
  expect(p).toMatchObject({ flow: 'execution', val: 5, bud: 3, budget: { st: 'approved' } });
  expect(data.notes.some(n => n.to === 'RT' && /ready to invoice/.test(n.s || ''))).toBe(true);

  // 6. The Operations Manager tasks a team member; she finishes it with a report.
  await openAs(page, 'operations', 'project', { projectId: P.id }, false);
  await now(page).getByRole('button', { name: 'Assign a task' }).click();
  await fillModal(page, { Task: 'Set up the stage at Mlimani City', 'Assign to': 'Grace Mrema' });
  await modal(page).getByRole('button', { name: 'Create task' }).click();
  await toast(page, 'Task created and assigned to Grace Mrema');

  await openAs(page, 'staff', 'today', {}, false);
  await page.getByRole('button', { name: 'Done: Set up the stage at Mlimani City' }).click();
  await page.getByLabel('Report: Set up the stage at Mlimani City').fill('Stage up and checked with the venue');
  await btn(page, 'Mark done').click();
  await toast(page, 'Done · Set up the stage at Mlimani City');
  data = await saved(page);
  expect(data.notes.some(n => n.to === 'MM' && /finished: Set up the stage/.test(n.t) && n.s === 'Stage up and checked with the venue')).toBe(true);

  // 7. The PA records the client's purchase order; Finance is told it can invoice.
  await openAs(page, 'pa', 'project', { projectId: P.id }, false);
  const po = page.getByRole('region', { name: 'Purchase order' });
  await expect(po).toContainText('not received');
  await po.getByLabel('PO number').fill('MB/PO/2026/0777');
  await po.getByLabel('Vendor number').fill('TMS-07');
  await po.getByLabel('PO date').fill('2026-11-18');
  await po.getByLabel('PO file').setInputFiles(file('Mlimani PO.pdf', 'application/pdf'));
  await btn(po, 'Save purchase order').click();
  await toast(page, 'Purchase order saved · MB/PO/2026/0777');
  data = await saved(page);
  expect(data.projects.find(x => x.id === P.id).po).toMatchObject({ no: 'MB/PO/2026/0777', vendor: 'TMS-07', date: '2026-11-18', by: 'UK' });
  expect(data.notes.some(n => n.to === 'RT' && /PO received/.test(n.t) && /ready to invoice/.test(n.s))).toBe(true);
  await expect(page.getByText('Margin', { exact: true })).toHaveCount(0);

  // 8. Finance invoices the agreed value; Management uploads a signature and signs; the PDF carries the PO.
  await openAs(page, 'ceo', 'company', {}, false);
  await page.getByLabel('Signature · Executive Director').setInputFiles({ name: 'sig.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64') });
  await toast(page, 'Signature saved');
  await openAs(page, 'finance', 'invoices', {}, false);
  await btn(page, 'New invoice').click();
  const ed = page.getByRole('dialog');
  await ed.getByRole('button', { name: 'Mlimani Bank', exact: true }).click();
  await ed.getByRole('button', { name: 'Mlimani Bank · Flow Test Launch' }).click();
  await expect(ed).toContainText('MB/PO/2026/0777');
  await ed.getByLabel('Item 1').fill('Stage and truss, 2 days');
  await ed.getByLabel('Rate 1').fill('3600000');
  await btn(ed, 'Create invoice').click();
  await toast(page, 'waiting for Executive Director to sign');
  data = await saved(page);
  const inv = data.invoices[0];
  expect(inv).toMatchObject({ c: 'Mlimani Bank', p: P.id, st: 'draft', signer: 'ED' });
  await openAs(page, 'ceo', 'finance', { finTab: 'invoices' }, false);
  await page.getByRole('tab', { name: 'Invoices' }).click();
  await page.locator('[data-invoice="' + inv.id + '"] .fh-inv-row').click();
  await btn(page.locator('[data-invoice="' + inv.id + '"]'), 'Sign & stamp').click();
  await toast(page, inv.id + ' signed and stamped');
  const [pdf] = await Promise.all([page.context().waitForEvent('page'), btn(page.locator('[data-invoice="' + inv.id + '"]'), 'Open PDF').click()]);
  await expect(pdf.locator('.po')).toContainText('MB/PO/2026/0777');
  await expect(pdf.locator('.po')).toContainText('TMS-07');
  await expect(pdf.locator('img.sigimg')).toHaveCount(1);
  await expect(pdf.getByText('Prepared by')).toHaveCount(0);
  await pdf.close();

  // 9. Management sees the report in the project's activity; the PM side closes the project.
  await openAs(page, 'ceo', 'project', { projectId: P.id }, false);
  await expect(page.getByLabel('Activity')).toContainText('Stage up and checked with the venue');
  await now(page).getByRole('button', { name: 'Close project' }).click();
  await toast(page, 'Flow Test Launch closed');
  expect((await saved(page)).projects.find(x => x.id === P.id)).toMatchObject({ flow: 'closed', st: 'done' });

  expect(errors).toEqual([]);
});

// A budget sent back by the GM returns to Operations with the reason.
test('the GM can send a budget back to Operations with a reason', async ({ page }) => {
  await openAs(page, 'gm', 'project', { projectId: 'PRJ-0224' });
  await expect(now(page)).toContainText('Waiting for the General Manager');
  await now(page).getByRole('button', { name: 'Send back' }).click();
  await now(page).getByLabel('Reason').fill('Printing cost is too high, get a second quote');
  await now(page).getByRole('button', { name: 'Send back' }).click();
  await toast(page, 'Sent back to Operations');
  const data = await saved(page);
  expect(data.projects.find(p => p.id === 'PRJ-0224')).toMatchObject({ flow: 'budget', budget: { st: 'returned', note: 'Printing cost is too high, get a second quote' } });
  expect(data.notes.some(n => n.to === 'MM' && /Budget sent back/.test(n.t))).toBe(true);
});

// Only the responsible people get the step's controls.
test('people who are not responsible for a step only see where the project is', async ({ page }) => {
  await openAs(page, 'staff', 'project', { projectId: 'PRJ-0231' });
  await expect(now(page)).toContainText('Now · Execution');
  await expect(now(page).getByRole('button', { name: 'Close project' })).toHaveCount(0);
  await openAs(page, 'staff', 'project', { projectId: 'PRJ-0224' });
  await expect(page.getByText('This project is not shared with you.')).toBeVisible();
});
