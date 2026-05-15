import { test, expect, Page } from '@playwright/test';

// Local helper to handle the age gate
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
  await page.screenshot({ path: `screenshots/contact_${name}.png` });
  console.log(`Screenshot taken: screenshots/contact_${name}.png`);
}

test('Contact Us Form Comprehensive Checklist Flow', async ({ page }) => {
  // Safe timeout for comprehensive sequential checks
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1920, height: 1080 });

  // =========================================================================
  // 9.1 Submit a Contact Form Inquiry (Submission Bypassed per Rule)
  // =========================================================================
  console.log("--- Step 9.1: Open Contact Us Page & Fill Form ---");
  await page.goto('https://rawblunts.com/contact-us', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await takeScreenshot(page, 'loaded_initial');

  await handleAgeGate(page);
  await takeScreenshot(page, 'after_age_gate');

  // Verify Title
  await expect(page).toHaveTitle(/Contact Raw Blunts \| Customer Support & Wholesale Inquiries/i);
  console.log("Page title verified successfully.");

  // Verify Headings
  const mainHeading = page.locator("h1, h2, h3").filter({ hasText: "Contact Us – Raw Blunts" }).first();
  const sendMessageHeading = page.locator("h1, h2, h3").filter({ hasText: "Send us a message" }).first();
  const getInTouchHeading = page.locator("h1, h2, h3").filter({ hasText: "Get in touch" }).first();

  await expect(mainHeading).toBeVisible();
  await expect(sendMessageHeading).toBeVisible();
  await expect(getInTouchHeading).toBeVisible();
  console.log("All required headings verified successfully.");

  // Fill form fields
  console.log("Filling contact form details...");
  await page.locator("input#name").fill("Auto Tester");
  await page.locator("input#email").fill("autotester@example.com");
  await page.locator("input#phone").fill("5551234567");
  await page.locator("input#subject").fill("Product Inquiry");
  await page.locator("textarea#message").fill("Hello, I would like to know more about your THCA Blunts.");

  await takeScreenshot(page, 'form_filled');

  // Verify 'Send Message' button exists
  const sendBtn = page.locator("button:has-text('Send Message')").first();
  await sendBtn.scrollIntoViewIfNeeded();
  await expect(sendBtn).toBeVisible();

  // Rule: "in the form just fill the details dont click submit button"
  console.log("Bypassing 'Send Message' submit button click as explicitly requested by user.");
  // await sendBtn.click({ force: true });
  await page.waitForTimeout(1000);

  await takeScreenshot(page, 'completed_flow');
  console.log("Success: Contact form filled successfully! Submit bypassed as requested.");
});
