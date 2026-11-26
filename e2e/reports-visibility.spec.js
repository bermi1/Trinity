import { test, expect } from '@playwright/test';
import { openAs } from './helpers';

test('reports: staff only send (no Received); the head of department and the GM receive', async ({ page }) => {
  await openAs(page, 'staff', 'reporting');
  const tabs = page.getByRole('tablist');
  await expect(tabs.getByRole('tab', { name: /^Received/ })).toHaveCount(0);
  await expect(tabs.getByRole('tab', { name: 'Sent' })).toBeVisible();
  await expect(tabs.getByRole('tab', { name: 'New report' })).toBeVisible();
  await openAs(page, 'operations', 'reporting', {}, false);
  await expect(page.getByRole('tablist').getByRole('tab', { name: /^Received/ })).toBeVisible();
  await openAs(page, 'gm', 'reporting', {}, false);
  await expect(page.getByRole('tablist').getByRole('tab', { name: /^Received/ })).toBeVisible();
});
