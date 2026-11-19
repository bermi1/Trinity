import { test, expect } from '@playwright/test';
import { openAs, watchErrors, saved, toast, btn } from './helpers';

const file = (name, mime) => ({ name, mimeType: mime, buffer: Buffer.from('demo ' + name) });

// The GM reports to Management; Management reads it and replies; the GM sees both.
test('the GM sends a daily report to Management, who reads and replies', async ({ page }) => {
  const errors = watchErrors(page);
  await openAs(page, 'gm', 'reporting');
  await page.getByRole('tab', { name: 'New report' }).click();
  const form = page.getByRole('region', { name: 'New report' });
  await expect(form.getByRole('radio', { name: 'Daily' })).toHaveAttribute('aria-checked', 'true');
  await form.getByLabel('What was done').fill('Approved 2 budgets, met Mlimani Bank, 3 departments sent their day');
  await form.getByLabel('Issues').fill('Kilimo Bank billboard permits delayed');
  await form.getByLabel('Report file').setInputFiles(file('GM day 19 Nov.pdf', 'application/pdf'));
  await btn(form, 'Send report').click();
  await toast(page, 'Report sent to Daniel');
  let data = await saved(page);
  const r = data.reports[0];
  expect(r).toMatchObject({ by: 'GN', kind: 'daily', to: ['DK'], issues: 'Kilimo Bank billboard permits delayed', file: { name: 'GM day 19 Nov.pdf' } });
  expect(data.notes.some(n => n.to === 'DK' && /Daily report from Joseph Ngowi/.test(n.t))).toBe(true);

  await openAs(page, 'ceo', 'reporting', {}, false);
  const item = page.locator('[data-report="' + r.id + '"]');
  await item.locator('.rp-row').click();
  await expect(item).toContainText('Kilimo Bank billboard permits delayed');
  await item.getByLabel(/Reply to/).fill('Call the council on Monday, copy me');
  await btn(item, 'Reply').click();
  await toast(page, 'Reply sent');
  data = await saved(page);
  expect(Object.keys(data.reports[0].readBy)).toEqual(['DK']);
  expect(data.notes.some(n => n.to === 'GN' && /Daniel K. replied/.test(n.t))).toBe(true);

  await openAs(page, 'gm', 'reporting', {}, false);
  await page.getByRole('tab', { name: 'Sent' }).click();
  const mine = page.locator('[data-report="' + r.id + '"]');
  await mine.locator('.rp-row').click();
  await expect(mine).toContainText('Read by Daniel');
  await expect(mine).toContainText('Call the council on Monday, copy me');
  expect(errors).toEqual([]);
});

// Finance uploads its monthly report to the GM and Management.
test('Finance uploads a monthly report that reaches the GM and Management', async ({ page }) => {
  await openAs(page, 'finance', 'reporting');
  await page.getByRole('tab', { name: 'New report' }).click();
  const form = page.getByRole('region', { name: 'New report' });
  await expect(form.getByRole('radio', { name: 'Monthly' })).toHaveAttribute('aria-checked', 'true');
  await form.getByLabel('What was done').fill('October: received TZS 92.4M, paid TZS 51.1M, VAT filed');
  await form.getByLabel('Report file').setInputFiles(file('October finance report.xlsx', 'application/vnd.ms-excel'));
  await btn(form, 'Send report').click();
  await toast(page, 'Report sent to Joseph and Daniel');
  const data = await saved(page);
  expect(data.reports[0]).toMatchObject({ by: 'RT', kind: 'monthly', to: ['GN', 'DK'] });
});

// "Send my day" in My work lands in the head's report inbox.
test('a staff member’s day reaches their head’s report inbox', async ({ page }) => {
  await openAs(page, 'staff', 'today');
  await btn(page, 'Send my day').click();
  await openAs(page, 'operations', 'reporting', {}, false);
  await expect(page.locator('.rp-item').filter({ hasText: 'Day report · Grace Mrema' })).toBeVisible();
});

// Finance handles the money, but does not see project profit or the internal budget.
test('Finance sees project money but not profit or the internal budget', async ({ page }) => {
  await openAs(page, 'finance', 'project', { projectId: 'PRJ-0224' });
  await expect(page.getByText('Internal budget', { exact: false })).toHaveCount(0);
  await openAs(page, 'finance', 'project', { projectId: 'PRJ-0231' });
  await expect(page.getByText('Contract value')).toBeVisible();
  await expect(page.getByText('Margin', { exact: true })).toHaveCount(0);
  await openAs(page, 'ceo', 'project', { projectId: 'PRJ-0231' });
  await expect(page.getByText('Margin', { exact: true })).toBeVisible();
});
