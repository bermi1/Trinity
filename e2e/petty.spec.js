import { test, expect } from '@playwright/test';
import { openAs, watchErrors, saved, toast, btn, side } from './helpers';

const money = async loc => Number((await loc.innerText()).replace(/[^0-9−-]/g, '').replace('−', '-'));
const balance = page => money(page.locator('.fl-bal b'));

// The float page: a daily expense paid from the float lowers the balance once, shows in the day list,
// the petty cash book and the cash book.
test('float: a daily expense lowers the balance and shows in the day, the petty cash book and the cash book', async ({ page }) => {
  const errors = watchErrors(page);
  await openAs(page, 'finance', 'petty'); // the old Petty cash page opens the Float page
  await expect(page.locator('.fl-bal')).toBeVisible();
  const before = await balance(page);
  await btn(page, 'Daily expense').click();
  const sheet = page.getByRole('dialog', { name: 'Daily expense' });
  await sheet.getByLabel('Expense amount').fill('20000');
  await sheet.getByRole('radio', { name: 'Courier' }).click();
  await btn(sheet, 'Other (supplier, shop…)').click();
  await sheet.getByLabel('Paid to (name)').fill('DHL Kariakoo');
  await sheet.getByLabel('Expense note').fill('Samples to Arusha office');
  await btn(sheet, 'Save expense').click();
  await toast(page, /PCV-\d{6}-\d\d · TZS 20,000 · Courier/);
  expect(await balance(page)).toBe(before - 20000);
  await expect(page.locator('.fl-line', { hasText: 'Courier · Samples to Arusha office' })).toContainText('−TZS 20,000');
  const data = await saved(page);
  expect(data.petty.entries[0]).toMatchObject({ dir: 'out', amt: 20000, cat: 'Courier', who: 'DHL Kariakoo', method: 'Cash', p: '' });

  await page.getByRole('tab', { name: 'Petty cash book' }).click();
  const book = page.getByRole('region', { name: 'Petty cash book' });
  await expect(book.getByText('Balance brought forward')).toBeVisible();
  await expect(book.locator('tr', { hasText: 'DHL Kariakoo' })).toContainText('−20,000');
  await expect(book.locator('tr', { hasText: 'Balance carried down' })).toContainText((before - 20000).toLocaleString('en-US'));

  // The company cash book is under More.
  await side(page, 'Company cash book');
  await expect(page.getByText('Daily expense · Courier').first()).toBeVisible();
  expect(errors).toEqual([]);
});

// A row paid to a staff member settles their approved request: it is that request's payment, counted once.
test('petty cash book: a row paid to a staff member settles their approved request', async ({ page }) => {
  await openAs(page, 'finance', 'float');
  const before = await balance(page);
  await page.getByRole('tab', { name: 'Petty cash book' }).click();
  const row = page.getByRole('form', { name: 'Add a row' });
  await row.getByLabel('Row paid to').fill('Neema Lyimo');
  const settle = page.getByRole('radiogroup', { name: 'Settles a request' });
  await settle.getByRole('radio', { name: /Settles REQ-0416/ }).click();
  await expect(row.getByLabel('Row amount')).toHaveValue('850,000');
  await row.getByLabel('Row method').selectOption('Bank');
  await row.getByLabel('Row amount').press('Enter');
  await toast(page, /^Paid TZS 850,000 to Neema · they must account for it/);
  expect(await balance(page)).toBe(before - 850000);
  const data = await saved(page);
  expect(data.reqs.find(r => r.id === 'REQ-0416')).toMatchObject({ st: 'paid', paidAmt: 850000, paidVia: 'Bank' });
  expect(data.petty.entries.some(e => e.amt === 850000)).toBe(false);
  await expect(page.getByRole('region', { name: 'Petty cash book' }).locator('tr', { hasText: 'REQ-0416' })).toContainText('−850,000');
});

// The daily report: the summary carried down, Download PDF, and Send to the boss.
test('daily float report: summary, PDF and sent to the boss', async ({ page, context }) => {
  await openAs(page, 'finance', 'float');
  await btn(page, 'Daily report').click();
  const R = page.getByRole('region', { name: 'Daily float report' });
  await expect(R.getByText('= Closing balance')).toBeVisible();
  await expect(R.locator('.fl-check')).toContainText('✓');
  const [pdf] = await Promise.all([context.waitForEvent('page'), btn(R, 'Save PDF').click()]);
  await expect(pdf.getByText('DAILY FLOAT REPORT')).toBeVisible();
  await expect(pdf.getByText('Requests paid today')).toBeVisible();
  await pdf.close();
  // WhatsApp opens with the short summary (caught here instead of leaving the site).
  await page.evaluate(() => { const o = window.open.bind(window); window.__wa = []; window.open = (u, ...r) => { if (/wa\.me/.test(u || '')) { window.__wa.push(u); return null; } return o(u, ...r); }; });
  // Without the phone's share sheet, "Send to boss" opens WhatsApp; the hint says to attach the saved PDF.
  await page.evaluate(() => { try { Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); } catch (e) { /* none */ } });
  await expect(R.getByText('Attach the PDF you saved.')).toBeVisible();
  await btn(R, 'Send to boss').click();
  await toast(page, 'Report sent to Daniel and Joseph');
  expect(decodeURIComponent((await page.evaluate(() => window.__wa))[0])).toMatch(/text=Trinity · Float \d+ \w{3}: Open .* \| Close /);
  const data = await saved(page);
  const day = Object.keys(data.float.closes)[0];
  expect(data.float.closes[day]).toMatchObject({ by: 'RT' });
  expect(data.reports[0]).toMatchObject({ kind: 'daily', to: ['DK', 'GN'] });
  expect(data.reports[0].file.name).toBe('Daily float report ' + day + '.html');
  await expect(R.getByText(/Sent to Management/)).toBeVisible();
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
