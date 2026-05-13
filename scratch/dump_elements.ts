import { test } from '@playwright/test';

test('dump elements', async ({ page }) => {
  await page.goto('https://www.rawblunts.com/');
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a, button')).map(el => ({
      tagName: el.tagName,
      text: el.textContent?.trim(),
      href: (el as HTMLAnchorElement).href,
      class: el.className,
      ariaLabel: el.getAttribute('aria-label'),
      id: el.id
    }));
  });
  console.log("--- ALL LINKS AND BUTTONS ---");
  console.log(JSON.stringify(links, null, 2));
});
