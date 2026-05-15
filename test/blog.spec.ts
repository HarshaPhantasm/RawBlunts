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
  await page.screenshot({ path: `screenshots/blog_${name}.png` });
  console.log(`Screenshot taken: screenshots/blog_${name}.png`);
}

async function slowScrollDown(page: Page) {
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  let currentScroll = 0;
  while (currentScroll < scrollHeight) {
    currentScroll += 300;
    await page.evaluate((y) => window.scrollTo(0, y), currentScroll);
    await page.waitForTimeout(300);
  }
  await takeScreenshot(page, 'scrolled_to_bottom');
}

test('Blog Comprehensive Automation Checklist Flow', async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1920, height: 1080 });

  console.log("--- Browse Blog Index & Read Posts (Combined Streamlined Flow) ---");
  await page.goto('https://rawblunts.com/blog', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await takeScreenshot(page, 'loaded_initial');
  await handleAgeGate(page);

  // Verify Title & Headline
  await expect(page).toHaveTitle(/Raw Blunts Blog \| Cannabis Insights, Product Guides & Culture/i);
  await expect(page.locator("h1, h2, p").filter({ hasText: "Straight talk, smooth burns, and real insights from the roll culture." }).first()).toBeVisible();

  await slowScrollDown(page);

  const expectedCards = [
    { title: "The Art of the Burn: What Makes a Blunt Truly Premium" },
    { title: "Inside THC-A: Why Everyone's Talking About the Clean High" },
    { title: "Rolling Culture 101: From Tradition to Innovation" }
  ];

  let cardIdx = 1;
  for (const item of expectedCards) {
    console.log(`\nVerifying & Clicking card ${cardIdx}: "${item.title}"...`);
    const cardTitle = page.locator("h2, h3, a").filter({ hasText: item.title }).first();
    await cardTitle.scrollIntoViewIfNeeded();
    await expect(cardTitle).toBeVisible();

    // Verify card container elements
    const cardContainer = page.locator("article, div.grid > div, div.flex").filter({ has: cardTitle }).first();
    if (await cardContainer.isVisible()) {
      if (await cardContainer.locator("img").first().isVisible()) console.log(` Verified Image`);
      if (await cardContainer.locator("a:has-text('Read More'), button:has-text('Read More')").first().isVisible()) console.log(` Verified 'Read More'`);
    }

    // Click card to read post
    await cardTitle.click({ force: true });
    await page.waitForTimeout(2500);
    await handleAgeGate(page);
    await takeScreenshot(page, `post_detail_card_${cardIdx}_loaded`);

    // Verify detail title
    await expect(page.locator("h1").filter({ hasText: item.title }).first()).toBeVisible();
    await slowScrollDown(page);

    // Return to index
    console.log("Returning back to blog index...");
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await takeScreenshot(page, `returned_to_blog_index_after_card_${cardIdx}`);
    cardIdx++;
  }
  console.log("Success: Blog index and all 3 post detail pages verified cleanly!");
});
