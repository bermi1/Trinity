import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { openAs, watchErrors, side, toast, btn, saved, fillModal, modal, rowOf } from './helpers';

let errors;
test.beforeEach(async ({ page }) => { errors = watchErrors(page); page.on('dialog', d => d.accept()); });
test.afterEach(() => expect(errors).toEqual([]));

const switchTo = async (page, portal) => {
  await page.locator('header div[style*="cursor: pointer"]').last().click();
  await page.getByText(portal, { exact: true }).click();
};
const card = (page, id) => page.locator(`[data-req="${id}"]`);
const stock = async (page, sku) => (await saved(page)).stock.find(i => i.sku === sku).q;

// The true scenario: the Serengeti truck wrap needs 3 rolls of cast vinyl, the store has 1.
test('scenario: printing requests materials → store issues → shortfall bought → received → issued → printing starts', async ({ page }) => {
  // 1. Printing asks the store for the job's materials.
  await openAs(page, 'production', 'printshop');
  await expect(page.getByText(/Good (morning|afternoon|evening), Juma/)).toBeVisible();
  await btn(page.locator('[data-job="JOB-0313"]'), 'Request materials').click();
  await toast(page, 'SRQ-0106 sent to the store');
  let d = await saved(page);
  expect(d.requisitions[0]).toMatchObject({ id: 'SRQ-0106', job: 'JOB-0313', by: 'JA', st: 'pending' });
  expect(d.notes.find(n => n.to === 'FH').t).toBe('New store requisition · SRQ-0106');

  // 2. Printing can't start before the materials are issued.
  await page.locator('[data-job="JOB-0313"]').getByRole('button', { name: 'Open' }).click();
  await btn(page, 'Approved · produce').click();
  await toast(page, 'Materials not issued yet · SRQ-0106 is with the store');
  const spentBefore = d.projects.find(p => p.id === 'PRJ-0231').spent;

  // 3. The storekeeper issues what's on the shelf: 1 of 3 vinyl rolls, the laminate in full.
  await switchTo(page, 'Storekeeper portal');
  await side(page, 'Requisitions');
  await btn(card(page, 'SRQ-0106'), 'Issue from store').click();
  await toast(page, 'Issued what is in stock · 1 item short');
  d = await saved(page);
  expect(d.requisitions.find(r => r.id === 'SRQ-0106')).toMatchObject({ st: 'partial', items: [{ sku: 'CST-VNL', qty: 3, issued: 1 }, { sku: 'LAM-GLS', qty: 1, issued: 1 }] });
  expect(d.stock.find(i => i.sku === 'CST-VNL').q).toBe(0);
  // Materials are charged to the client's project and the job.
  expect(d.projects.find(p => p.id === 'PRJ-0231').spent).toBeCloseTo(spentBefore + 0.85, 2);
  expect(d.movements.filter(m => m.ref === 'SRQ-0106').map(m => [m.sku, m.qty])).toEqual([['LAM-GLS', -1], ['CST-VNL', -1]]);

  // 4. The shortfall goes to purchasing, topped up to the minimum stock level.
  await btn(card(page, 'SRQ-0106'), 'Raise purchase request').click();
  await toast(page, 'PR-0213 raised for the shortfall');
  d = await saved(page);
  expect(d.proc[0]).toMatchObject({ id: 'PR-0213', sku: 'CST-VNL', qty: 4, srq: 'SRQ-0106', s: 0 });
  await expect(card(page, 'SRQ-0106').getByText('PR-0213')).toBeVisible();

  // 5. Management takes it through quotation, approval, purchase order and delivery.
  await switchTo(page, 'Management · Command Center');
  await side(page, 'Procurement');
  const pr = page.locator('div[style*="border-radius: 11px"]').filter({ hasText: 'PR-0213' });
  for (const step of ['Get quotes', 'Approve', 'Issue PO', 'Mark delivered']) await btn(pr, step).click();
  await toast(page, 'PR-0213 delivered · waiting at the store to be received');

  // 6. The storekeeper receives it; stock goes up and the waiting requisition is flagged.
  await switchTo(page, 'Storekeeper portal');
  await btn(rowOf(page, 'Cast vinyl 1.52m (vehicle wrap) × 4'), 'Receive into store').click();
  await toast(page, /now 4 rolls · SRQ-0106 can be issued/);
  d = await saved(page);
  expect(d.movements[0]).toMatchObject({ type: 'receipt', sku: 'CST-VNL', qty: 4, ref: 'GRN-0399 · Chapa Supplies' });
  expect(d.notes.find(n => n.to === 'JA').t).toBe('Materials arrived for SRQ-0106');

  // 7. …and issues the remaining 2 rolls.
  await side(page, 'Requisitions');
  await btn(card(page, 'SRQ-0106'), 'Issue from store').click();
  await toast(page, 'SRQ-0106 fully issued');
  expect(await stock(page, 'CST-VNL')).toBe(2);

  // 8. Printing sees it and starts the job.
  await switchTo(page, 'Printing portal');
  await side(page, 'Notifications');
  await expect(page.getByText('SRQ-0106 issued · collect from the store')).toBeVisible();
  await side(page, 'Production jobs');
  await page.getByText('Truck wrap · 1 vehicle').click();
  await expect(page.getByText('All materials issued · ready to print')).toBeVisible();
  await btn(page, 'Approved · produce').click();
  await toast(page, 'JOB-0313 → Production');
  d = await saved(page);
  expect(d.jobs.find(j => j.id === 'JOB-0313').s).toBe(3);
  // Job cost now carries 3 vinyl + 1 laminate = TZS 2.23M on top of the 0.4M already booked.
  expect(d.jobs.find(j => j.id === 'JOB-0313').cost).toBeCloseTo(2.63, 2);
  expect(d.projects.find(p => p.id === 'PRJ-0231').spent).toBeCloseTo(spentBefore + 2.23, 2);

  // 9. The whole company sees it in the activity feed.
  await switchTo(page, 'Management · Command Center');
  await expect(page.getByText('Printing started · Truck wrap · 1 vehicle')).toBeVisible();
});

test('unused material goes back to the store and is credited to the project', async ({ page }) => {
  await openAs(page, 'production', 'job', { jobId: 'JOB-0312' });
  const before = await saved(page).then(d => d.projects?.find(p => p.id === 'PRJ-0231')?.spent ?? 71.4);
  await page.locator('label', { hasText: 'Quantity' }).locator('input').fill('30');
  await btn(page, 'Return to store').click();
  await toast(page, 'You can return at most what was issued (24)');
  await page.locator('label', { hasText: 'Quantity' }).locator('input').fill('2');
  await btn(page, 'Return to store').click();
  await toast(page, '2 pcs of Roll-up stand 85×200 returned to the store');
  const d = await saved(page);
  expect(d.stock.find(i => i.sku === 'RLU-850').q).toBe(20);
  expect(d.projects.find(p => p.id === 'PRJ-0231').spent).toBeCloseTo(before - 0.156, 3);
  expect(d.movements[0]).toMatchObject({ type: 'return', qty: 2, ref: 'Unused from JOB-0312' });
  await expect(page.getByText('2 returned')).toBeVisible();
});

test('stock count: needs a reason, posts the difference to the ledger', async ({ page }) => {
  await openAs(page, 'store', 'movements');
  await page.locator('label', { hasText: 'Item' }).locator('select').selectOption('GZB-3X3');
  await page.locator('label', { hasText: 'Counted' }).locator('input').fill('5');
  await btn(page, 'Post count').click();
  await toast(page, 'Give a reason for the adjustment');
  await page.locator('label', { hasText: 'Reason' }).locator('input').fill('1 tent torn, written off');
  await btn(page, 'Post count').click();
  await toast(page, 'Gazebo tent 3×3 adjusted -1 pcs');
  const d = await saved(page);
  expect(d.stock.find(i => i.sku === 'GZB-3X3').q).toBe(5);
  expect(d.movements[0]).toMatchObject({ type: 'adjust', qty: -1, ref: 'Stock count · 1 tent torn, written off' });
  await btn(page, 'Counts').click();
  await expect(page.getByText('Stock count · 1 tent torn, written off')).toBeVisible();
});

test('stock ledger filters, searches and exports', async ({ page }) => {
  await openAs(page, 'store', 'movements');
  await btn(page, 'Received').click();
  await expect(page.getByText('GRN-0398 · Mavazi Wear')).toBeVisible();
  await expect(page.getByText('SRQ-0104')).toHaveCount(0);
  await btn(page, 'All').click();
  await page.getByPlaceholder('Search item, reference or client').fill('kilimo');
  await expect(page.getByText('SRQ-0102')).toHaveCount(2);
  const [dl] = await Promise.all([page.waitForEvent('download'), btn(page, 'Export CSV').click()]);
  const csv = readFileSync(await dl.path(), 'utf8');
  expect(csv.split('\n')[0]).toBe('"Date","Item","SKU","Movement","Quantity","Reference","Project","By","Value (TZS)"');
  expect(csv.split('\n').length).toBe(13);
});

test('one-off requisition from the store, and cancelling one', async ({ page }) => {
  await openAs(page, 'staff', 'requisitions');
  await btn(page, 'New requisition').click();
  await fillModal(page, { Item: 'Roll-up stand 85×200 · 18 pcs in store', Quantity: '2', Purpose: 'Reception display' });
  await modal(page).locator('button').last().click();
  await toast(page, 'SRQ-0106 sent to the store');
  await btn(card(page, 'SRQ-0106'), 'Cancel').click();
  await toast(page, 'SRQ-0106 cancelled');
  expect((await saved(page)).requisitions[0].st).toBe('cancelled');
});

test('production board shows each job’s materials and opens the job page', async ({ page }) => {
  await openAs(page, 'ceo', 'production');
  await expect(page.getByText('1 pcs · materials not requested')).toBeVisible();
  await expect(page.getByText('18 pcs · waiting for the store')).toBeVisible();
  await page.getByText('Expo stand graphics', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Expo stand graphics' })).toBeVisible();
  await expect(page.getByText('SRQ-0105')).toBeVisible();
});

test('reports include stock movements and material cost by project', async ({ page }) => {
  await openAs(page, 'ceo', 'reports');
  const [dl] = await Promise.all([page.waitForEvent('download'), btn(rowOf(page, 'Materials by project'), 'CSV').click()]);
  const csv = readFileSync(await dl.path(), 'utf8');
  expect(csv).toContain('"PRJ-0231 Lake Zone Roadshow","Serengeti Telecom","6837000","156000","6681000"');
});
