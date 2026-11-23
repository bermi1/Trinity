import { test, expect } from '@playwright/test';
import { openAs, watchErrors, side } from './helpers';

async function fill(scope, d) {
  await scope.getByLabel('Full name').fill(d.name);
  await scope.getByLabel('Phone number').fill(d.phone);
  await scope.getByLabel('Organisation').fill(d.org);
  await scope.getByLabel('Region').fill('Dodoma');
  await scope.getByRole('radio', { name: d.cat, exact: true }).click();
}

test('event: QR self-registration, walk-in at the desk, check-in and the printable list', async ({ page, context }) => {
  const errors = watchErrors(page);
  await openAs(page, 'reception', 'reception');

  // An attendee scans the QR code: the public page, no account.
  await page.goto('/register');
  await expect(page.getByRole('heading', { name: 'Mpango wa Nishati wa Taifa' })).toBeVisible();
  await page.getByRole('button', { name: 'Jisajili · Register' }).click();
  await expect(page.getByRole('alert')).toContainText('jina');
  await fill(page, { name: 'Asha Juma Mollel', phone: '0712 345 678', org: 'TANESCO Dodoma', cat: 'TANESCO' });
  await page.getByRole('button', { name: 'Jisajili · Register' }).click();
  await expect(page.getByText('Karibu, Asha!')).toBeVisible();
  await expect(page.locator('.ev-ticket b')).toHaveText('001');
  await expect(page.getByText('Tunakukaribisha kuhudhuria')).toBeVisible();
  // Registering again with the same phone gives the same number.
  await page.getByRole('button', { name: 'Sajili mtu mwingine' }).click();
  await fill(page, { name: 'Asha J. Mollel', phone: '+255712345678', org: 'TANESCO', cat: 'TANESCO' });
  await page.getByRole('button', { name: 'Jisajili · Register' }).click();
  await expect(page.getByText('Tayari umesajiliwa')).toBeVisible();
  await expect(page.locator('.ev-ticket b')).toHaveText('001');

  // Reception opens the desk from the menu.
  await page.goto('/');
  await side(page, 'Event registration');
  await expect(page.locator('.evd-kpis')).toContainText('1');
  // Walk-in.
  const card = page.locator('.evd-card');
  await fill(card, { name: 'John Mwakyusa', phone: '0754 111 222', org: 'Wilaya ya Chamwino', cat: 'Serikali' });
  await card.getByRole('button', { name: 'Sajili mgeni · Register attendee' }).click();
  await expect(page.locator('.evd-last')).toContainText('002');
  await expect(page.locator('.evd-last')).toContainText('John Mwakyusa');

  // The list: both people, check Asha in.
  await page.getByRole('tab', { name: /Washiriki/ }).click();
  await expect(page.locator('.evd-list li')).toHaveCount(2);
  await page.getByRole('button', { name: 'Check in · Asha Juma Mollel' }).click();
  await expect(page.getByRole('button', { name: 'Undo check-in · Asha Juma Mollel' })).toBeVisible();
  await expect(page.locator('.evd-kpis .is-in b')).toHaveText('2');
  await page.getByRole('button', { name: 'QR', exact: true }).click();
  await expect(page.locator('.evd-list li')).toHaveCount(1);
  await page.getByRole('button', { name: 'Wote', exact: true }).click();

  // The printable PDF list opens with every attendee and the Trinity Mark footer.
  const [pdf] = await Promise.all([context.waitForEvent('page'), page.getByRole('button', { name: 'Chapisha PDF · Print list' }).click()]);
  await expect(pdf.locator('table tbody tr')).toHaveCount(2);
  await expect(pdf.locator('.tm')).toContainText('TRINITY MARK SOLUTIONS');
  await pdf.close();

  // The QR poster and the event details.
  await page.getByRole('tab', { name: 'QR & mwaliko' }).click();
  await expect(page.getByAltText('QR code ya usajili')).toBeVisible();
  const [poster] = await Promise.all([context.waitForEvent('page'), page.getByRole('button', { name: 'Chapisha bango la QR (PDF)' }).click()]);
  await expect(poster.getByText('Scan ujisajili')).toBeVisible();
  await poster.close();
  await page.getByRole('tab', { name: 'Taarifa za tukio' }).click();
  await page.getByLabel('Venue').fill('Ukumbi wa Mikutano, Dodoma');
  await page.getByRole('button', { name: 'Hifadhi · Save' }).click();
  await expect(page.getByText('Imehifadhiwa · Saved')).toBeVisible();
  await page.goto('/register');
  await expect(page.getByText('Ukumbi wa Mikutano, Dodoma')).toBeVisible();

  expect(errors).toEqual([]);
});

test('event: the desk is in Management, the PA and Client Service menus, not Creative', async ({ page }) => {
  for (const role of ['ceo', 'pa', 'clientservice']) {
    await openAs(page, role, 'event');
    await expect(page.locator('.evd-top')).toBeVisible();
  }
  await openAs(page, 'creative', 'dept');
  await expect(page.locator('aside').getByText('Event registration')).toHaveCount(0);
});
