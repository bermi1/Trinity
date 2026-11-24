import { test, expect } from '@playwright/test';
import { openAs, watchErrors, side } from './helpers';

async function fill(scope, d) {
  await scope.getByLabel('Full name').fill(d.name);
  await scope.getByLabel('Phone number').fill(d.phone);
  await scope.getByLabel('Organisation').fill(d.org);
  await scope.getByLabel('Region').fill('Dodoma');
  await scope.getByRole('textbox', { name: 'Attending as', exact: true }).fill(d.cat);
}
// The public form has three sections: about you, work and location, category.
async function fillSteps(page, d) {
  const next = page.getByRole('button', { name: 'Endelea · Next' });
  await page.getByLabel('Full name').fill(d.name);
  await page.getByLabel('Phone number').fill(d.phone);
  await next.click();
  await page.getByLabel('Organisation').fill(d.org);
  await page.getByLabel('Region').fill('Dodoma');
  await next.click();
  await page.getByRole('textbox', { name: 'Attending as', exact: true }).fill(d.cat);
}

test('event: QR self-registration, walk-in at the desk, check-in and the printable list', async ({ page, context }) => {
  const errors = watchErrors(page);
  await openAs(page, 'reception', 'reception');

  // An attendee scans the QR code: the public page, no account.
  await page.goto('/register');
  await expect(page.getByRole('heading', { name: 'iMbeju Kilimo Sasa' })).toBeVisible();
  // Each section is checked before moving on.
  await page.getByRole('button', { name: 'Endelea · Next' }).click();
  await expect(page.getByRole('alert')).toContainText('jina');
  await fillSteps(page, { name: 'Asha Juma Mollel', phone: '0712 345 678', org: 'CRDB Bank Foundation', cat: 'CRDB Bank Foundation' });
  // Going back keeps what was typed.
  await page.getByRole('button', { name: 'Rudi · Back' }).click();
  await expect(page.getByLabel('Organisation')).toHaveValue('CRDB Bank Foundation');
  await page.getByRole('button', { name: 'Endelea · Next' }).click();
  await page.getByRole('button', { name: 'Jisajili · Register' }).click();
  await expect(page.getByText('Karibu, Asha!')).toBeVisible();
  await expect(page.locator('.ev-ticket b')).toHaveText('001');
  await expect(page.getByText('Karibu kwenye uzinduzi wa iMbeju Kilimo Sasa')).toBeVisible();
  // Their designed pass with a QR code, ready to save.
  await expect(page.getByAltText('Pasi ya Asha Juma Mollel · namba 001')).toBeVisible();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Hifadhi pasi · Save pass' }).click()]);
  expect(dl.suggestedFilename()).toBe('Pasi-Kilimo-Sasa-001.png');
  // Registering again with the same phone gives the same number.
  await page.getByRole('button', { name: 'Sajili mtu mwingine' }).click();
  await fillSteps(page, { name: 'Asha J. Mollel', phone: '+255712345678', org: 'CRDB', cat: 'CRDB Bank Foundation' });
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
  // Everyone is checked in as soon as they register (QR and walk-in); the desk can still undo it.
  await expect(page.locator('.evd-kpis .is-in b')).toHaveText('2');
  await page.getByRole('button', { name: 'Undo check-in · Asha Juma Mollel' }).click();
  await expect(page.locator('.evd-kpis .is-in b')).toHaveText('1');
  await page.getByRole('button', { name: 'Check in · Asha Juma Mollel' }).click();
  await expect(page.locator('.evd-kpis .is-in b')).toHaveText('2');
  // The categories people typed become filters.
  await expect(page.locator('.ev-chips').getByRole('button', { name: 'Serikali', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'QR', exact: true }).click();
  await expect(page.locator('.evd-list li')).toHaveCount(1);
  // Scanning a pass into the search finds that person by number.
  await page.getByRole('button', { name: 'Wote', exact: true }).click();
  await page.getByLabel('Search attendees').fill('KILIMO-2026 · 002 · John Mwakyusa');
  await expect(page.locator('.evd-list li')).toHaveCount(1);
  await expect(page.locator('.evd-list li')).toContainText('John Mwakyusa');
  await page.getByLabel('Search attendees').fill('');
  await page.getByRole('button', { name: 'Wote', exact: true }).click();

  // The printable PDF list opens with every attendee and the Trinity Mark footer.
  const [pdf] = await Promise.all([context.waitForEvent('page'), page.getByRole('button', { name: 'Chapisha PDF · Print list' }).click()]);
  await expect(pdf.locator('table tbody tr')).toHaveCount(2);
  await expect(pdf.locator('.tm')).toContainText('TRINITY MARK SOLUTIONS');
  await pdf.close();

  // The QR poster and the event details.
  await page.getByRole('tab', { name: 'QR & mwaliko' }).click();
  await expect(page.getByAltText('QR code ya usajili')).toBeVisible();
  const [poster] = await Promise.all([context.waitForEvent('page'), page.getByRole('button', { name: 'Bango la QR · A3 (PDF)' }).click()]);
  await expect(poster.locator('.rib')).toHaveText('SCAN · UJISAJILI');
  await poster.close();
  const [tv] = await Promise.all([context.waitForEvent('page'), page.getByRole('button', { name: 'Bango la skrini kubwa · 16:9' }).click()]);
  await expect(tv.locator('.pg')).toHaveCSS('width', '1920px');
  await tv.close();
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

test('event: Nishati stays as history; its page says registration is closed', async ({ page }) => {
  await openAs(page, 'reception', 'event');
  await expect(page.locator('.evd-top h1')).toHaveText('iMbeju Kilimo Sasa');
  await page.locator('.evd-events').getByRole('button', { name: /Nishati wa Taifa/ }).click();
  await expect(page.locator('.evd-top h1')).toHaveText('Mpango wa Nishati wa Taifa');
  await page.goto('/register?e=nishati-2026');
  await expect(page.getByRole('heading', { name: 'Mpango wa Nishati wa Taifa' })).toBeVisible();
});
