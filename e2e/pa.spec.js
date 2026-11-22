import { test, expect } from '@playwright/test';
import { openAs, watchErrors, saved, toast } from './helpers';

// The PA sees everything about Management: the overview, the approvals, every memo, and a copy of
// everything that reaches Management, without being able to approve.
test('PA: Management overview, approvals, memos and a copy of Management’s notifications', async ({ page }) => {
  const errors = watchErrors(page);
  // The GM approves a budget: Management is told, and so is the PA.
  await openAs(page, 'gm', 'project', { projectId: 'PRJ-0224' });
  await page.getByRole('region', { name: 'Current step' }).getByRole('button', { name: 'Approve budget' }).click();
  await toast(page, 'Approved · sent to Management');
  const data = await saved(page);
  const mg = data.notes.find(n => n.to === 'DK' && /budget/i.test(n.t + n.s));
  expect(mg).toBeTruthy();
  expect(data.notes.some(n => n.to === 'UK' && n.t === 'Management · ' + mg.t)).toBe(true);

  // The PA's overview: company target and what needs attention.
  await openAs(page, 'pa', 'dashboard', {}, false);
  await expect(page.getByRole('region', { name: 'Company target' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Company target' }).getByRole('button', { name: 'Record this week' })).toHaveCount(0);
  await expect(page.getByText('Needs attention')).toBeVisible();

  // Approvals: the PA sees them all but cannot approve.
  await page.locator('aside').getByRole('button', { name: /^Approvals/ }).click();
  await page.getByRole('button', { name: /^All ·/ }).click();
  await expect(page.getByText(/REQ-04/).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toHaveCount(0);

  // Memos: the PA has the "All memos" view.
  await page.locator('aside').getByRole('button', { name: /^Memos/ }).click();
  await expect(page.getByRole('tab', { name: /All memos/ })).toBeVisible();
  expect(errors).toEqual([]);
});
