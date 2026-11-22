import { test, expect } from '@playwright/test';
import { openAs, watchErrors, saved, toast, btn } from './helpers';

// GM prepares the month, adds described deductions, approves → Management approves → the GM records
// the payment; salaries reach the cash book, statutory totals Finance's obligations, staff get payslips.
// Statutory items apply only to employees who have them switched on.
test('payroll: deductions with descriptions, only switched-on statutory items, GM → Management → paid', async ({ page }) => {
  const errors = watchErrors(page);
  await openAs(page, 'gm', 'payroll');
  await page.getByRole('button', { name: /^Prepare .* payroll$/ }).click();
  await toast(page, 'payroll prepared · 16 employees');

  // Two deduction lines for Grace, each with a description.
  await page.getByRole('button', { name: 'Deductions · Grace Mrema' }).click();
  const ded = page.getByLabel('Deductions · Grace Mrema');
  await ded.getByLabel('Deduction 1 description · Grace Mrema').fill('Salary advance, 12 Nov');
  await ded.getByLabel('Deduction 1 amount · Grace Mrema').fill('50000');
  await ded.getByRole('button', { name: '+ Add deduction' }).click();
  await ded.getByLabel('Deduction 2 amount · Grace Mrema').fill('20000');
  await btn(ded, 'Save deductions').click();
  await expect(ded.getByRole('alert')).toHaveText('Describe every deduction');
  await ded.getByLabel('Deduction 2 description · Grace Mrema').fill('Uniform');
  await btn(ded, 'Save deductions').click();
  await toast(page, 'Deductions saved · Grace Mrema');

  await btn(page, 'Approve payroll').click();
  await toast(page, 'Approved · sent to Management');
  let data = await saved(page);
  const run = data.payroll.runs[0];
  expect(run.st).toBe('mgmt');
  expect(run.lines.find(l => l.k === 'GM')).toMatchObject({ gross: 930000, nssf: 93000, heslb: 127500, other: 70000, deds: [{ d: 'Salary advance, 12 Nov', amt: 50000 }, { d: 'Uniform', amt: 20000 }] });
  // Juma has no NSSF or PAYE switched on: nothing is deducted for them.
  const ja = run.lines.find(l => l.k === 'JA');
  expect(ja).toMatchObject({ nssf: 0, paye: 0, erNssf: 0 });
  expect(ja.net).toBe(ja.gross - ja.heslb - ja.other);

  await openAs(page, 'ceo', 'payroll', {}, false);
  await btn(page, 'Approve payroll').click();
  await toast(page, 'Payroll approved · ready to pay');

  await openAs(page, 'gm', 'payroll', {}, false);
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

  // Finance sees the statutory totals due, not the payroll.
  await openAs(page, 'finance', 'finance', {}, false);
  await expect(page.locator('[data-ob="wcf"]')).toContainText('payroll');

  // Grace opens her payslip: each deduction line is listed.
  await openAs(page, 'staff', 'payslips', {}, false);
  const [slip] = await Promise.all([page.context().waitForEvent('page'), page.getByRole('button', { name: /^Payslip · / }).first().click()]);
  await expect(slip.getByText('Net pay')).toBeVisible();
  await expect(slip.getByText('Uniform')).toBeVisible();
  await slip.close();
  expect(errors).toEqual([]);
});

test('a pay record has only the statutory deductions switched on for it', async ({ page }) => {
  await openAs(page, 'gm', 'payroll');
  await page.getByRole('tab', { name: /Employees/ }).click();
  const row = page.locator('[data-emp="JA"]');
  await expect(row).toContainText('SDL');
  await expect(row).not.toContainText('NSSF');
});

test('only the GM and Management see payroll; Finance and others see their own payslips', async ({ page }) => {
  for (const role of ['operations', 'finance']) {
    await openAs(page, role, 'payroll');
    await expect(page.getByRole('heading', { name: 'My payslips' })).toBeVisible();
    await expect(page.getByText('Employees ·')).toHaveCount(0);
  }
});
