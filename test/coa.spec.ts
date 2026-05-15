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
  await page.screenshot({ path: `screenshots/coa_${name}.png` });
  console.log(`Screenshot taken: screenshots/coa_${name}.png`);
}

test('COA Lab Reports Comprehensive Automation Checklist Flow', async ({ page, context }) => {
  // Give a generous 3-minute timeout to verify and click all 17 lab report links
  test.setTimeout(180000);
  await page.setViewportSize({ width: 1920, height: 1080 });

  console.log("--- Step 11.1: Open Lab Reports (COA) Page & Verify Categories ---");
  await page.goto('https://rawblunts.com/coa', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await takeScreenshot(page, 'loaded_initial');
  await handleAgeGate(page);

  // Verify Title & URL
  await expect(page).toHaveURL(/.*coa.*/);
  console.log("Verified URL contains /coa.");

  // Verify Category Sections
  const categories = [
    "Raw Blunts THCA Blunt Tubes with Glass Tip",
    "Raw Bluntz",
    "Raw Blunts THC-A Blunt Tubes with Spiral Tips 2 PCS",
    "Raw Blunts THCA Blunt Tubes with Glass Tip - 24 PCS Box Edition"
  ];

  for (const cat of categories) {
    const heading = page.locator("h1, h2, h3").filter({ hasText: cat }).first();
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
    console.log(`Verified COA category section: "${cat}"`);
  }

  // Click all lab report links & return to COA page after every link
  const coaLinks = [
    "BLUE DREAM",
    "CEREAL MILK",
    "LEMON CHERRY GELATO",
    "NORTHERN LIGHTS",
    "RUNTZ",
    "SOUR DIESEL",
    "RANDID RAINBOW",
    "DOUBLE BAKE CAKE",
    "MINT OREOS",
    "AMNESIA HAZE",
    "GEORGIA APPLE PIE",
    "WHITE RUNTZ",
    "WEDDING CAKE",
    "SUNSET SHERBET",
    "PURPLE HAZE",
    "GORILLA GLUE",
    "GELATO"
  ];

  console.log("\n--- Clicking all lab report links sequentially ---");
  let idx = 1;
  for (const reportName of coaLinks) {
    console.log(`\n[${idx}/${coaLinks.length}] Verifying lab report link: "${reportName}"...`);
    const linkLocator = page.locator("a").filter({ hasText: reportName }).first();
    await linkLocator.scrollIntoViewIfNeeded();
    await expect(linkLocator).toBeVisible();

    // Handle new tab opening robustly
    const [newPage] = await Promise.all([
      context.waitForEvent('page', { timeout: 6000 }).catch(() => null),
      linkLocator.click({ force: true })
    ]);

    if (newPage) {
      await newPage.waitForLoadState('domcontentloaded');
      await newPage.waitForTimeout(1000);
      console.log(`New tab opened successfully for ${reportName}: ${newPage.url()}`);
      await newPage.close();
      console.log(`Closed new tab and returned back to COA page.`);
    } else {
      // If link navigated in the same tab
      await page.waitForTimeout(1000);
      console.log(`Navigated in same tab for ${reportName}, going back to COA page...`);
      await page.goBack({ waitUntil: 'domcontentloaded' });
    }
    await page.waitForTimeout(500);
    idx++;
  }

  console.log("\nSuccess: All lab report links successfully clicked and verified!");
  await takeScreenshot(page, 'completed_flow');
});
