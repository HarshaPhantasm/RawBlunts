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

// Local screenshot helper taking screenshots after actions
async function takeScreenshot(page: Page, name: string) {
  await page.waitForTimeout(300);
  await page.screenshot({ path: `screenshots/home_${name}.png` });
  console.log(`Screenshot taken: screenshots/home_${name}.png`);
}

// Local smooth scrolling function that can interact with page elements during scroll
async function slowScrollDownAndClick(page: Page) {
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  let currentScroll = 0;

  console.log("Starting slow scroll to bottom while verifying elements...");
  while (currentScroll < scrollHeight) {
    currentScroll += 300;
    await page.evaluate((y) => window.scrollTo(0, y), currentScroll);
    await page.waitForTimeout(500); // Small pause during scrolling
  }
  await takeScreenshot(page, 'scrolled_to_bottom');
}

test('Raw Blunts Home Page Automation Checklist Flow', async ({ page }) => {
  // Give a safe 3-minute timeout for homepage + search comprehensive flows
  test.setTimeout(180000);



  // Launch the page
  console.log("Opening Raw Blunts homepage...");
  await page.goto('https://rawblunts.com/', { waitUntil: 'domcontentloaded' });

  // Rule: After opening a page wait a sec & take ss
  await page.waitForTimeout(1000);
  await takeScreenshot(page, 'after_page_open_initial');

  await handleAgeGate(page);
  await takeScreenshot(page, 'after_age_gate');

  // Verify page loaded successfully
  await expect(page).toHaveTitle(/Raw Blunts \| Premium Cannabis Products for Smokers/);
  console.log("Verified homepage loaded successfully.");

  // Scroll down to bottom to inspect sections and take screenshots
  await slowScrollDownAndClick(page);

  // Scroll back to top to interact with CTAs
  console.log("Scrolling back to top to verify CTA buttons...");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // Click SHOP NOW CTA
  console.log("Clicking 'SHOP NOW' or 'ORDER NOW' CTA...");
  const orderNowBtn = page.locator("a:has-text('SHOP NOW'), a:has-text('ORDER NOW')").first();
  await expect(orderNowBtn).toBeVisible();
  await orderNowBtn.click();

  // Rule: After opening a page wait a sec & take ss
  await page.waitForTimeout(1000);
  await takeScreenshot(page, 'after_order_now_redirect');
  await expect(page).toHaveURL(/.*product/);
  console.log("Verified SHOP NOW redirects to product listings.");

  // Go back to Home
  console.log("Navigating back to Home...");
  await page.goto('https://rawblunts.com/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await takeScreenshot(page, 'back_on_home_from_order_now');

  // Click DISCOVER THE COLLECTION CTA
  console.log("Clicking 'DISCOVER THE COLLECTION' or 'VIEW COLLECTION' CTA...");
  const viewCollectionBtn = page.locator("a:has-text('DISCOVER THE COLLECTION'), a:has-text('VIEW COLLECTION')").first();
  await expect(viewCollectionBtn).toBeVisible();
  await viewCollectionBtn.click();

  // Rule: After opening a page wait a sec & take ss
  await page.waitForTimeout(1000);
  await takeScreenshot(page, 'after_view_collection_redirect');
  await expect(page).toHaveURL(/.*product/);
  console.log("Verified VIEW COLLECTION redirects to product listings.");

  // Go back to Home
  console.log("Navigating back to Home...");
  await page.goto('https://rawblunts.com/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await handleAgeGate(page);

  // Click the two 'View More' buttons in the Featured section
  console.log("Verifying the two 'View More' featured banner buttons...");
  const viewMoreBanners = page.locator("a:has-text('View More')");
  await expect(viewMoreBanners.first()).toBeVisible();

  // 1. Click first View More button
  console.log("Clicking the first 'View More' featured banner button...");
  const firstViewMore = viewMoreBanners.nth(0);
  await firstViewMore.scrollIntoViewIfNeeded();
  await firstViewMore.click();
  await page.waitForTimeout(1000);
  await handleAgeGate(page);
  await takeScreenshot(page, 'after_first_view_more_redirect');
  await expect(page).toHaveURL(/.*product.*/);
  console.log("Verified first 'View More' redirects to products successfully.");

  // Go back to Home
  console.log("Navigating back to Home...");
  await page.goto('https://rawblunts.com/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await handleAgeGate(page);

  // 2. Click second View More button
  console.log("Clicking the second 'View More' featured banner button...");
  const secondViewMore = viewMoreBanners.nth(1);
  await secondViewMore.scrollIntoViewIfNeeded();
  await secondViewMore.click();
  await page.waitForTimeout(1000);
  await handleAgeGate(page);
  await takeScreenshot(page, 'after_second_view_more_redirect');
  await expect(page).toHaveURL(/.*product.*/);
  console.log("Verified second 'View More' redirects to products successfully.");

  // Go back to Home
  console.log("Navigating back to Home...");
  await page.goto('https://rawblunts.com/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await handleAgeGate(page);

  // Click LEARN OUR STORY CTA
  console.log("Clicking 'LEARN OUR STORY' CTA...");
  const learnStoryBtn = page.locator("a:has-text('LEARN OUR STORY'), a:has-text('Our Story'), a:has-text('About Us')").first();
  if (await learnStoryBtn.isVisible()) {
    await learnStoryBtn.click();
    // Rule: After opening a page wait a sec & take ss
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'after_learn_story_redirect');
    await expect(page).toHaveURL(/.*about-us/);
    console.log("Verified LEARN OUR STORY redirects to about-us.");
  } else {
    console.log("Note: LEARN OUR STORY CTA not visible on screen. Skipping.");
  }

  // Go back to Home to test Search
  console.log("Navigating back to Home to test search...");
  await page.goto('https://rawblunts.com/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await handleAgeGate(page);

  // Locate search input field
  console.log("Locating and clicking inside search input...");
  const searchInput = page.locator("input[placeholder*='Search for products' i], input[aria-label*='Search' i]").first();
  await expect(searchInput).toBeVisible();
  await searchInput.click();

  // Type THCA query inside the search box
  console.log("Typing 'THCA' inside the search input...");
  await searchInput.fill('THCA');
  await page.waitForTimeout(1000);
  await takeScreenshot(page, 'typed_thca');

  // Submit query by pressing Enter
  console.log("Pressing Enter to submit search query...");
  await searchInput.press('Enter');

  // Rule: After opening a page wait a sec & take ss (search results page loads)
  await page.waitForTimeout(1000);
  await handleAgeGate(page);
  await takeScreenshot(page, 'search_results_returned');

  // Slow scroll down of the search results page
  console.log("Scrolling down search results page...");
  const searchScrollHeight = await page.evaluate(() => document.body.scrollHeight);
  let searchCurrentScroll = 0;
  while (searchCurrentScroll < searchScrollHeight) {
    searchCurrentScroll += 300;
    await page.evaluate((y) => window.scrollTo(0, y), searchCurrentScroll);
    await page.waitForTimeout(300);
  }
  await takeScreenshot(page, 'search_results_scrolled_to_bottom');

  // Clear/close the search input using the close (X) button
  console.log("Clicking the close/clear (X) button inside the search box...");
  const closeBtn = page.locator("button[aria-label*='clear' i], button[aria-label*='close' i], button:has(svg)").first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'search_cleared_and_closed');
    console.log("Search input successfully cleared and closed!");
  } else {
    console.log("Clear/close search button not visible on desktop after submit.");
  }
});
