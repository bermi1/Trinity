// Renders the PNG app icons in public/ from the Trinity Mark logo.
// Run once after changing the logo:  node scripts/make-icons.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const logo = readFileSync(new URL('../public/trinity-mark-logo.svg', import.meta.url), 'utf8')
  .replace(/<metadata>[\s\S]*?<\/metadata>/, '');
const browser = await chromium.launch();
for (const size of [192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<body style="margin:0;width:${size}px;height:${size}px;background:#2B1459;display:flex;align-items:center;justify-content:center">
    <div style="width:${size * 0.52}px;height:${size * 0.58}px">${logo.replace('<svg ', '<svg width="100%" height="100%" ')}</div></body>`);
  await page.screenshot({ path: new URL(`../public/icon-${size}.png`, import.meta.url).pathname });
  await page.close();
}
await browser.close();
console.log('Wrote public/icon-192.png and public/icon-512.png');
