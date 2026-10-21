import { test, expect } from '@playwright/test';
import { openAs, watchErrors, toast, btn, saved, fillModal, swipe } from './helpers';

let errors;
test.beforeEach(async ({ page }) => { errors = watchErrors(page); page.on('dialog', d => d.accept()); });
test.afterEach(() => expect(errors).toEqual([]));

const tab = (page, label) => page.locator('nav').getByText(label, { exact: true }).click();
const title = page => page.locator('.m-header-title b');
const PAGES = ['dashboard', 'briefing', 'projects', 'project', 'tasks', 'requests', 'finance', 'store', 'procurement', 'crm', 'staff', 'notifications', 'field', 'staffportal', 'financeportal', 'reception', 'storekeeper', 'rooms', 'proposals', 'production', 'logistics', 'documents', 'reports', 'calendar', 'settings'];

test('sign-in screen works like an app: show password, portal picker, remember switch', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  const pw = page.locator('input[autocomplete="current-password"]');
  await expect(pw).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(pw).toHaveAttribute('type', 'text');
  await page.getByRole('switch').click();
  await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  await page.getByRole('switch').click();

  await pw.fill('12');
  await btn(page, 'Sign in').click();
  await expect(page.getByRole('alert')).toHaveText('Enter your email and a password of at least 4 characters.');
  await page.getByRole('radio', { name: 'Finance' }).click();
  await pw.fill('demo1234');
  await pw.press('Enter');
  await expect(page.getByText('Rose Temba’s queue')).toBeVisible();
  await expect(page.locator('nav')).toContainText('Queue');
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test('tabs, back button and the phone’s back gesture move between screens', async ({ page }) => {
  await openAs(page, 'ceo', 'dashboard');
  await expect(page.locator('aside')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Back' })).toHaveCount(0);

  await tab(page, 'Projects');
  await page.getByText('Lake Zone Roadshow').first().click();
  await expect(page.getByText(/Stage 9 of 15/)).toBeVisible();
  await expect(page.locator('main.m-screen')).toHaveClass(/is-push/);
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(title(page)).toHaveText('Projects');
  await expect(page.locator('main.m-screen')).toHaveClass(/is-back/);

  await page.getByText('Pwani Beverages').first().click();
  await expect(title(page)).toHaveText('Pwani Beverages');
  await page.goBack();                       // Android back button / iOS swipe
  await expect(title(page)).toHaveText('Projects');
  await page.goBack();
  await expect(title(page)).toHaveText('Dashboard');
});

test('More, profile and form sheets: open, swipe down, back closes them', async ({ page }) => {
  await openAs(page, 'ceo', 'dashboard');
  await tab(page, 'More');
  await expect(page.getByRole('dialog', { name: 'All modules' })).toBeVisible();
  await swipe(page, '.m-sheet-grip', 40, 300);
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await tab(page, 'More');
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(title(page)).toHaveText('Dashboard');

  await page.getByRole('button', { name: /^Account/ }).click();
  await expect(page.getByRole('dialog', { name: 'Account' })).toContainText('Daniel K.');
  await page.getByRole('dialog').getByRole('button', { name: 'Store', exact: true }).click();
  await expect(page.getByText('Fatma’s store')).toBeVisible();
  await expect(page.locator('nav')).toContainText('Inventory');

  await page.getByRole('button', { name: /^Account/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});

test('forms open as a bottom sheet; a small drag snaps back, a long one closes', async ({ page }) => {
  await openAs(page, 'staff', 'staffportal');
  await btn(page, 'Request money').click();
  const sheet = page.getByRole('dialog', { name: 'Request money' });
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('input').first()).toHaveAttribute('inputmode', 'decimal');
  await swipe(page, '.m-sheet-grip', 40, 80);
  await expect(sheet).toBeVisible();
  await btn(sheet, 'Submit request').click();
  await expect(sheet.getByRole('alert')).toHaveText('Amount (TZS) is required.');
  await fillModal(page, { 'Amount (TZS)': '15000', Purpose: 'Bodaboda to site' });
  await btn(sheet, 'Submit request').click();
  await toast(page, /REQ-0427 submitted/);
  await expect(sheet).toHaveCount(0);
  expect((await saved(page)).reqs[0]).toMatchObject({ who: 'GM', amt: 15000 });

  await btn(page, 'Request money').click();
  await swipe(page, '.m-sheet-grip', 40, 400);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('typing never zooms the page: every field uses 16px text', async ({ page }) => {
  await openAs(page, 'ceo', 'store');
  await btn(page, 'Issue').first().click();
  const sizes = await page.evaluate(() => [...document.querySelectorAll('input, select, textarea')].map(el => parseFloat(getComputedStyle(el).fontSize)));
  expect(sizes.length).toBeGreaterThan(1);
  expect(Math.min(...sizes)).toBeGreaterThanOrEqual(16);
});

test('pull down to refresh', async ({ page }) => {
  await openAs(page, 'ceo', 'dashboard');
  await swipe(page, 'main.m-screen', 120, 420);
  await expect(page.getByText('Refreshing…')).toBeVisible();
  await toast(page, 'Up to date');
});

test('offline notice appears and clears with the connection', async ({ page, context }) => {
  await openAs(page, 'ceo', 'dashboard');
  await context.setOffline(true);
  await expect(page.getByRole('status').filter({ hasText: 'You’re offline' })).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByText('You’re offline')).toHaveCount(0);
});

test('boards show one column at a time with status tabs', async ({ page }) => {
  await openAs(page, 'ceo', 'tasks');
  await btn(page, /^To do ·/).click();
  await expect(page.getByText('Print 2,000 Swahili flyers')).toBeVisible();
  await expect(page.getByText('QC 400 branded T-shirts')).toHaveCount(0);
  await btn(page, /^Done ·/).click();
  await expect(page.getByText('QC 400 branded T-shirts')).toBeVisible();
});

test('field app on the phone is the app itself, with its own sections', async ({ page }) => {
  await openAs(page, 'staff', 'field');
  await expect(page.getByText('Habari, Grace')).toBeVisible();
  await expect(page.getByText('FIELD STAFF VIEW')).toBeHidden();
  await btn(page, 'Money').click();
  await page.getByPlaceholder('300000').fill('20000');
  await page.getByPlaceholder('What is the money for?').fill('Water for crew');
  await btn(page, 'Submit request').click();
  await toast(page, /REQ-0427 sent/);
});

test('search and the assistant are one tap away', async ({ page }) => {
  await openAs(page, 'staff', 'staffportal');
  await page.getByRole('button', { name: 'Search' }).click();
  await page.getByPlaceholder('Search pages, projects, stock, or type an action…').fill('calendar');
  await page.getByPlaceholder('Search pages, projects, stock, or type an action…').press('Enter');
  await expect(title(page)).toHaveText('Calendar');
  await page.getByRole('button', { name: 'Trinity Intelligence' }).click();
  await page.getByRole('button', { name: 'Who has open floats?' }).click();
  await expect(page.getByText(/Open staff floats total/)).toBeVisible();
  await page.goBack();
  await expect(page.getByText(/Open staff floats total/)).toHaveCount(0);
});

test('home-screen shortcuts open straight to the right place', async ({ page }) => {
  await openAs(page, 'ceo', 'dashboard');
  await page.goto('/?go=requests');
  await expect(title(page)).toHaveText('Requests & Floats');
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/?go=newreq');
  await expect(page.getByRole('dialog', { name: 'Request money' })).toBeVisible();
});

test('installable: manifest, icons and offline support are in place', async ({ page, request }) => {
  await page.goto('/');
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest).toMatchObject({ display: 'standalone', start_url: '/', short_name: 'TM 360' });
  expect(manifest.shortcuts.map(s => s.url)).toContain('/?go=newreq');
  for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBe(true);
  await expect.poll(() => page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())), { timeout: 10000 }).toBe(true);
});

for (const role of ['ceo', 'staff', 'finance', 'reception', 'store']) {
  test(`no screen scrolls sideways · ${role}`, async ({ page }) => {
    await openAs(page, role, 'dashboard');
    const wide = [];
    for (const p of PAGES) {
      await page.evaluate(([role, p]) => localStorage.setItem('tm360', JSON.stringify({ auth: true, role, page: p, projectId: 'PRJ-0231' })), [role, p]);
      await page.reload();
      await expect(page.locator('main.m-screen')).toBeVisible();
      const extra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (extra > 0) wide.push(p + ' +' + extra + 'px');
    }
    expect(wide).toEqual([]);
  });
}

test.describe('tablet', () => {
  test.use({ viewport: { width: 820, height: 1180 } });
  test('the sidebar opens as a drawer', async ({ page }) => {
    await openAs(page, 'ceo', 'dashboard');
    await expect(page.locator('aside')).toHaveCount(0);
    await page.locator('header button').first().click();
    await page.locator('aside').getByText('Procurement', { exact: true }).click();
    await expect(page.locator('aside')).toHaveCount(0);
    await expect(btn(page, 'Purchase request')).toBeVisible();
  });
});
