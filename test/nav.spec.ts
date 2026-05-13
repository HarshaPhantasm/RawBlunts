import { test, expect, Page } from '@playwright/test';

// Standing local helper to handle the age gate
async function handleAgeGate(page: Page) {
  const ageGateBtn = page.getByRole('button', { name: "Yes, I\'m 21+" });
  try {
    await ageGateBtn.waitFor({ state: 'visible', timeout: 4000 });
    await ageGateBtn.click();
    console.log("Age gate clicked successfully.");
    await page.waitForTimeout(500);
  } catch (err) {
    // Gracefully ignore if not visible
  }
}

// Local screenshot helper
async function takeScreenshot(page: Page, name: string) {
  await page.waitForTimeout(300);
  await page.screenshot({ path: `screenshots/nav_${name}.png` });
  console.log(`Screenshot taken: screenshots/nav_${name}.png`);
}

// Local slow scroll down helper
async function slowScrollDown(page: Page) {
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  let currentScroll = 0;
  while (currentScroll < scrollHeight) {
    currentScroll += 300;
    await page.evaluate((y) => window.scrollTo(0, y), currentScroll);
    await page.waitForTimeout(300);
  }
  await takeScreenshot(page, 'scrolled_to_footer');
}

test('Header and Footer Navigation Flow', async ({ page }) => {
  // Set safe 3-minute timeout for comprehensive multi-page redirection loop
  test.setTimeout(180000);

  console.log("Opening Raw Blunts home page...");
  await page.goto('https://rawblunts.com/', { waitUntil: 'domcontentloaded' });
  
  // Rule: After opening a page wait a sec & take ss
  await page.waitForTimeout(1000);
  await takeScreenshot(page, 'homepage_loaded_initial');

  await handleAgeGate(page);
  await takeScreenshot(page, 'after_age_gate');

  // Verify header navigation back home via logo
  console.log("Navigating to /about-us first to test header logo...");
  await page.goto('https://rawblunts.com/about-us', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await takeScreenshot(page, 'about_us_page_loaded');

  // Select desktop-only visible logo under header/nav
  const headerLogo = page.locator("header img, nav img").filter({ visible: true }).first();
  await headerLogo.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  
  console.log("Clicking logo to return home...");
  await headerLogo.click({ force: true });
  await page.waitForTimeout(1500);
  await takeScreenshot(page, 'returned_home_via_logo');
  await expect(page).toHaveURL('https://rawblunts.com/');
  console.log("Header logo return home verified successfully.");

  // Scroll down to the footer
  await slowScrollDown(page);

  // Define footer links checklist to sequential redirects
  const footerRedirections = [
    { label: 'Shop Products', path: '/product' },
    { label: 'View All', path: '/product' },
    { label: 'COA Reports', path: '/coa' },
    { label: 'FDA Disclaimer', path: '/fda-disclaimer' },
    { label: 'Privacy Policy', path: '/privacy-policy' },
    { label: 'Refund Policy', path: '/refund-policy' },
    { label: 'Shipping Policy', path: '/shipping-policy' },
    { label: 'Terms of Service', path: '/terms-service' }
  ];

  for (const item of footerRedirections) {
    console.log(`\n--- Testing Footer Link: ${item.label} ---`);
    
    // Find the link by text inside footer container, ensuring we filter for visible ones to avoid hidden mobile drawer matches
    const footerLink = page.locator("footer a").filter({ hasText: new RegExp(`^${item.label}$`, 'i') }).filter({ visible: true }).first();
    await expect(footerLink).toBeVisible();
    await footerLink.click();
    
    // Rule: After opening a page wait a sec & take ss
    await page.waitForTimeout(1000);
    
    const cleanName = item.label.toLowerCase().replace(/\s+/g, '_');
    await takeScreenshot(page, `page_${cleanName}`);
    await expect(page).toHaveURL(new RegExp(item.path));
    console.log(`Success: Redirect verified for ${item.label}`);

    // Go back instantly using browser history back to preserve footer scroll state
    console.log("Returning back to footer...");
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
  }

  // Verify Wholesale link (new tab redirection)
  console.log("\n--- Testing Footer Link: Wholesale ---");
  const wholesaleLink = page.locator("footer a").filter({ hasText: /Wholesale/i }).filter({ visible: true }).first();
  await expect(wholesaleLink).toBeVisible();

  // Handle new tab promise
  const [newPage] = await Promise.all([
    page.context().waitForEvent('page'),
    wholesaleLink.click()
  ]);

  await newPage.waitForLoadState('domcontentloaded');
  // Rule: After opening a page wait a sec & take ss
  await newPage.waitForTimeout(1000);
  
  // Use screenshot function tailored to the new page context
  await newPage.screenshot({ path: `screenshots/nav_page_wholesale.png` });
  console.log("Screenshot taken: screenshots/nav_page_wholesale.png");

  await expect(newPage).toHaveURL(/.*smokevana.com.*/);
  console.log("Success: Wholesale new tab redirection verified!");
  await newPage.close();
});
