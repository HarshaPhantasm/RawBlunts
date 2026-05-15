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
  await page.screenshot({ path: `screenshots/static_${name}.png` });
  console.log(`Screenshot taken: screenshots/static_${name}.png`);
}

test('Static Pages Comprehensive Automation Checklist Flow', async ({ page }) => {
  test.setTimeout(150000);
  await page.setViewportSize({ width: 1920, height: 1080 });

  // =========================================================================
  // 12.1 Open the About Us Page
  // =========================================================================
  console.log("--- Step 12.1: Open About Us Page ---");
  await page.goto('https://rawblunts.com/about-us', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await takeScreenshot(page, 'about_loaded');
  await handleAgeGate(page);

  await expect(page).toHaveURL(/.*about-us.*/);
  const storyHeading = page.locator("h1, h2, h3").filter({ hasText: /Our Story|About/i }).first();
  await expect(storyHeading).toBeVisible();
  console.log("About Us 'Our Story' content verified successfully.");

  // =========================================================================
  // 12.2 Open the FDA Disclaimer Page
  // =========================================================================
  console.log("\n--- Step 12.2: Open FDA Disclaimer Page ---");
  await page.goto('https://rawblunts.com/fda-disclaimer', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await takeScreenshot(page, 'fda_loaded');
  await handleAgeGate(page);

  await expect(page).toHaveURL(/.*fda-disclaimer.*/);
  await expect(page.locator("body")).toContainText(/FDA/i);
  console.log("FDA Disclaimer text verified successfully.");

  // =========================================================================
  // 12.3 Open the Privacy Policy Page
  // =========================================================================
  console.log("\n--- Step 12.3: Open Privacy Policy Page ---");
  await page.goto('https://rawblunts.com/privacy-policy', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await takeScreenshot(page, 'privacy_loaded');
  await handleAgeGate(page);

  await expect(page).toHaveURL(/.*privacy-policy.*/);
  await expect(page.locator("body")).toContainText(/Privacy/i);
  console.log("Privacy Policy text verified successfully.");

  // =========================================================================
  // 12.4 Open the Refund Policy Page
  // =========================================================================
  console.log("\n--- Step 12.4: Open Refund Policy Page ---");
  await page.goto('https://rawblunts.com/refund-policy', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await takeScreenshot(page, 'refund_loaded');
  await handleAgeGate(page);

  await expect(page).toHaveURL(/.*refund-policy.*/);
  await expect(page.locator("body")).toContainText(/Refund/i);
  console.log("Refund Policy text verified successfully.");

  // =========================================================================
  // 12.5 Open the Shipping Policy Page
  // =========================================================================
  console.log("\n--- Step 12.5: Open Shipping Policy Page ---");
  await page.goto('https://rawblunts.com/shipping-policy', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await takeScreenshot(page, 'shipping_loaded');
  await handleAgeGate(page);

  await expect(page).toHaveURL(/.*shipping-policy.*/);
  await expect(page.locator("body")).toContainText(/Shipping/i);
  console.log("Shipping Policy text verified successfully.");

  // =========================================================================
  // 12.6 Open the Terms of Service Page
  // =========================================================================
  console.log("\n--- Step 12.6: Open Terms of Service Page ---");
  await page.goto('https://rawblunts.com/terms-service', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await takeScreenshot(page, 'terms_loaded');
  await handleAgeGate(page);

  await expect(page).toHaveURL(/.*terms-service.*/);
  await expect(page.locator("body")).toContainText(/Terms/i);
  console.log("Terms of Service text verified successfully.");

  // =========================================================================
  // 12.7 Open the Wholesale Page (External)
  // =========================================================================
  console.log("\n--- Step 12.7: Open Wholesale Page (External) ---");
  await page.goto('https://smokevana.com/register', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await takeScreenshot(page, 'wholesale_loaded');

  await expect(page).toHaveURL(/.*smokevana.com\/register.*/);
  console.log("Success: Smokevana registration page shown successfully!");
});
