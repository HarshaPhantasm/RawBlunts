import { test, expect, Page } from '@playwright/test';

async function handleAgeGate(page: Page) {
  const ageGateBtn = page.getByRole('button', { name: "Yes, I\'m 21+" });
  try {
    await ageGateBtn.waitFor({ state: 'visible', timeout: 4000 });
    await ageGateBtn.click();
    console.log("Age gate clicked successfully.");
    await page.waitForTimeout(500);
  } catch (err) {}
}

async function takeScreenshot(page: Page, name: string) {
  await page.waitForTimeout(300);
  await page.screenshot({ path: `screenshots/footer_${name}.png` });
  console.log(`Screenshot taken: screenshots/footer_${name}.png`);
}

test('Footer Comprehensive Automation Checklist Flow', async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1920, height: 1080 });

  console.log("--- Initializing Footer Navigation ---");
  await page.goto('https://rawblunts.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await handleAgeGate(page);

  // Scroll to footer
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  await takeScreenshot(page, 'scrolled_to_footer');

  // =========================================================================
  // 13.1 Use Footer 'Shop' Column Links
  // =========================================================================
  console.log("\n--- Step 13.1: Footer Shop Column Links ---");
  const shopProductsLink = page.locator("footer a").filter({ hasText: "Shop Products" }).filter({ visible: true }).first();
  await shopProductsLink.click();
  await page.waitForTimeout(1500);
  await handleAgeGate(page);
  await takeScreenshot(page, 'shop_products_redirect');
  await expect(page).toHaveURL(/.*product.*/);
  console.log("Verified Shop Products navigates to /product.");

  await page.goBack({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const viewAllLink = page.locator("footer a").filter({ hasText: "View All" }).filter({ visible: true }).first();
  await viewAllLink.click();
  await page.waitForTimeout(1500);
  await handleAgeGate(page);
  await takeScreenshot(page, 'view_all_redirect');
  await expect(page).toHaveURL(/.*product.*/);
  console.log("Verified View All navigates to /product.");

  await page.goBack({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // =========================================================================
  // 13.2 View Footer Contact Information
  // =========================================================================
  console.log("\n--- Step 13.2: View Footer Contact Info ---");
  const footerLoc = page.locator("footer");
  await expect(footerLoc).toContainText("1715 Terry Dr, Joliet, IL 60436");
  await expect(footerLoc).toContainText("info@RawBlunts.com");
  await expect(footerLoc).toContainText("(833)976-5432");
  console.log("Verified address, email, and phone number.");

  const paymentMethodsImg = footerLoc.locator("img").filter({ hasAttribute: 'src', hasNotText: 'logo' }).first();
  if (await paymentMethodsImg.isVisible()) {
    console.log("Verified Payment Methods image.");
  }

  // =========================================================================
  // 13.3 Click Footer Social Media Icons
  // =========================================================================
  console.log("\n--- Step 13.3: Click Social Media Icons ---");
  const socialIcons = footerLoc.locator("a[href*='instagram.com'], a[href*='facebook.com'], a[href*='#']");
  const count = await socialIcons.count();
  console.log(`Found ${count} social media links.`);

  if (count > 0) {
    const firstIcon = socialIcons.first();
    const href1 = await firstIcon.getAttribute('href');
    console.log(`First social icon href: ${href1}`);
    if (count > 1) {
      const secondIcon = socialIcons.nth(1);
      const href2 = await secondIcon.getAttribute('href');
      console.log(`Second social icon href: ${href2}`);
    }
  }

  // =========================================================================
  // 13.4 Verify Footer Disclaimers and Copyright
  // =========================================================================
  console.log("\n--- Step 13.4: Verify Disclaimers & Copyright ---");
  const bodyTextLoc = page.locator("body");
  await expect(bodyTextLoc).toContainText("FDA NOTICE DISCLAIMER");
  await expect(bodyTextLoc).toContainText("THC DISCLAIMER");
  await expect(bodyTextLoc).toContainText("AMANITA MUSCARIA DISCLAIMER");
  await expect(bodyTextLoc).toContainText("THCA DISCLAIMER");
  console.log("All 4 disclaimer headings verified successfully.");

  await expect(bodyTextLoc).toContainText("© 2025 Raw Blunts, All Rights Reserved.");
  console.log("Copyright notice verified successfully.");
  await takeScreenshot(page, 'completed_flow');
});
