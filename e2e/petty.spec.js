import { test, expect } from '@playwright/test';
import { openAs, watchErrors, saved, toast, btn } from './helpers';

// The finance officer's cash box: pay out with a voucher, refuse more than is in the box,
// count the cash (a shortage tells Management), and see petty spending in the cash book.
test('petty cash: vouchers, balance, cash count and the cash book', async ({ page }) => {
  const errors = watchErrors(page);
  await openAs(page, 'finance', 'petty');
  await expect(page.locator('.fh-kpi').first()).toContainText('TZS 443,000');
  const form = page.getByRole('region', { name: 'Petty cash entry' });
  await form.getByLabel('Petty amount').fill('20000');
  await form.getByRole('radio', { name: 'Courier' }).click();
  await form.getByLabel('Paid to').fill('DHL Kariakoo');
  await form.getByLabel('What for').fill('Samples to Arusha office');
  await btn(form, 'Record payment · print voucher no.').click();
  await toast(page, 'PCV-0003 · TZS 20,000 paid to DHL Kariakoo');
  await expect(page.locator('.fh-kpi').first()).toContainText('TZS 423,000');

  await form.getByLabel('Petty amount').fill('900000');
  await form.getByRole('radio', { name: 'Repairs' }).click();
  await form.getByLabel('Paid to').fill('Fundi');
  await btn(form, 'Record payment · print voucher no.').click();
  await expect(form.getByRole('alert')).toHaveText('Only TZS 423,000 is in the cash box');

  const count = page.getByRole('region', { name: 'Cash count' });
  await count.getByLabel('Cash counted').fill('420000');
  await btn(count, 'Save count').click();
  await toast(page, 'Cash count short by TZS 3,000 · Management told');
  const data = await saved(page);
  expect(data.petty.counts[0]).toMatchObject({ counted: 420000, expected: 423000, diff: -3000 });
  expect(data.notes.some(n => n.to === 'DK' && /Petty cash short by TZS 3,000/.test(n.t))).toBe(true);

  await page.locator('aside').getByText('Cash book', { exact: true }).click();
  await expect(page.getByText('Petty cash · Courier').first()).toBeVisible();
  expect(errors).toEqual([]);
});

// The month's obligations: recording the VAT payment marks it paid and puts it in the cash book.
test('obligations: recording a payment marks it paid this month', async ({ page }) => {
  await openAs(page, 'finance', 'finance');
  const due = page.getByRole('region', { name: 'Due this month' });
  const vat = due.locator('[data-ob="vat"]');
  await btn(vat, 'Record payment').click();
  await vat.getByLabel(/Amount paid/).fill('4100000');
  await vat.getByLabel(/Reference/).fill('TRA-PRN 99120');
  await btn(vat, 'Save').click();
  await expect(vat).toContainText('Paid');
  const data = await saved(page);
  expect(data.ledger[0]).toMatchObject({ dir: 'out', amt: 4100000, cat: 'Tax (VAT, WHT)', party: 'VAT return & payment (TRA)', ref: 'TRA-PRN 99120' });
});
