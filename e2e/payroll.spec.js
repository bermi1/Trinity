import { test, expect } from '@playwright/test';
import { openAs, watchErrors, saved, toast, btn } from './helpers';

// GM prepares and approves → Management approves → Finance pays; salaries reach the cash book,
// statutory amounts the month's obligations, and each employee gets a payslip.
test('payroll: GM prepares, Management approves, Finance pays, staff get payslips', async ({ page }) => {
  const errors = watchErrors(page);
  await openAs(page, 'gm', 'payroll');
  await page.getByRole('button', { name: /^Prepare .* payroll$/ }).click();
  await toast(page, 'payroll prepared · 16 employees');
  await page.getByLabel('Advance · Grace Mrema').fill('50000');
  await page.getByLabel('Advance · Grace Mrema').blur();
  await btn(page, 'Approve payroll').click();
  await toast(page, 'Approved · sent to Management');
  let data = await saved(page);
  const run = data.payroll.runs[0];
  expect(run.st).toBe('mgmt');
  expect(run.lines.find(l => l.k === 'GM')).toMatchObject({ gross: 930000, nssf: 93000, heslb: 127500, other: 50000 });

  await openAs(page, 'ceo', 'payroll', {}, false);
  await btn(page, 'Approve payroll').click();
  await toast(page, 'Payroll approved · Finance told to pay');

  await openAs(page, 'finance', 'payroll', {}, false);
  await btn(page, 'Mark salaries paid').click();
  await expect(page.getByRole('alert')).toHaveText('Enter the bank reference');
  await page.getByLabel('Bank reference').fill('CRDB PAYROLL NOV');
  await btn(page, 'Mark salaries paid').click();
  await toast(page, 'recorded in the cash book');
  data = await saved(page);
  const net = data.payroll.runs[0].lines.reduce((a, l) => a + l.net, 0);
  expect(data.ledger[0]).toMatchObject({ dir: 'out', cat: 'Salaries', amt: net, ref: 'CRDB PAYROLL NOV' });
  expect(data.payroll.runs[0].due.paye).toBeGreaterThan(0);
  expect(data.notes.some(n => n.to === 'GM' && /Salary paid/.test(n.t))).toBe(true);

  // Finance's obligations now expect the PAYE/SDL from this payroll.
  await page.locator('aside').getByRole('button', { name: 'Finance', exact: true }).click();
  await expect(page.locator('[data-ob="wcf"]')).toContainText('payroll');

  // Grace opens her payslip.
  await openAs(page, 'staff', 'payslips', {}, false);
  const [slip] = await Promise.all([page.context().waitForEvent('page'), page.getByRole('button', { name: /^Payslip · / }).first().click()]);
  await expect(slip.getByText('Net pay')).toBeVisible();
  await slip.close();
  expect(errors).toEqual([]);
});

test('only the GM, Management and Finance see payroll; others see their own payslips', async ({ page }) => {
  await openAs(page, 'operations', 'payroll');
  await expect(page.getByRole('heading', { name: 'My payslips' })).toBeVisible();
  await expect(page.getByText('Employees ·')).toHaveCount(0);
});
