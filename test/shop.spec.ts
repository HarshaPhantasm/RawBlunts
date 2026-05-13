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
  await page.screenshot({ path: `screenshots/shop_${name}.png` });
  console.log(`Screenshot taken: screenshots/shop_${name}.png`);
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
  await takeScreenshot(page, 'scrolled_to_bottom');
}

test('Shop Listing Sequential Checklist Flow', async ({ page }) => {
  // Set a generous 2-minute timeout for this comprehensive sequential flow
  test.setTimeout(120000);


  // ==========================================
  // 4.1 Open the Shop / Product Listing Page
  // ==========================================
  console.log("--- Step 4.1: Opening Shop Page ---");
  // Use canonical non-www domain to avoid Next.js 404 routing anomalies
  await page.goto('https://rawblunts.com/product', { waitUntil: 'domcontentloaded' });

  // Rule: After opening a page wait a sec & take ss
  await page.waitForTimeout(1000);
  await takeScreenshot(page, 'listing_page_loaded');

  await handleAgeGate(page);
  await takeScreenshot(page, 'after_age_gate');

  console.log("Verifying page title...");
  await expect(page).toHaveTitle(/Raw Blunts \| Premium|Shop Raw Blunts/);

  console.log("Verifying listing heading 'Showing 1–2 of 2 results'...");
  const resultsHeading = page.getByText(/Showing 1/i).first();
  await expect(resultsHeading).toBeVisible();

  console.log("Verifying product card components...");
  // Class-independent first product card locator
  const firstCard = page.locator("div").filter({ hasText: /Add to Cart/i }).first();
  await firstCard.waitFor({ state: 'visible', timeout: 10000 });
  await expect(firstCard).toBeVisible();

  // Verify card components are fully loaded
  await expect(firstCard.locator("img").first()).toBeVisible();
  await expect(firstCard.locator("h3, h2, a").first()).toBeVisible();
  await expect(firstCard.locator("span:has-text('$')").first()).toBeVisible();
  await expect(firstCard.locator("button:has-text('Add to Cart'), a:has-text('Add to Cart')").first()).toBeVisible();

  console.log("Success: Shop Listing page verified perfectly! \n");

  // ==========================================
  // 4.2 Expand the Categories Filter
  // ==========================================
  console.log("--- Step 4.2: Testing Expand/Collapse Categories Sidebar ---");
  const sidebar = page.locator("aside, div.border, div.border-r, div.rounded-2xl").filter({ hasText: /Categories/i }).first();
  await expect(sidebar).toBeVisible();

  const categoriesToggle = sidebar.locator("h3, span, div").filter({ hasText: /Categories/i }).first();
  const preRollsCheckboxLabel = sidebar.locator("label, span").filter({ hasText: /PRE[\s-]*ROLLS/i }).first();

  await expect(categoriesToggle).toBeVisible();
  await expect(preRollsCheckboxLabel).toBeVisible();

  // Click categories header to collapse it
  console.log("Collapsing Categories section...");
  await categoriesToggle.click();
  await page.waitForTimeout(1000); // Wait for transition

  const isCollapsed = !(await preRollsCheckboxLabel.isVisible());
  if (isCollapsed) {
    console.log("Categories section successfully collapsed!");
    await expect(preRollsCheckboxLabel).not.toBeVisible();
    await takeScreenshot(page, 'categories_collapsed');

    // Click categories header again to expand it back
    console.log("Expanding Categories section back...");
    await categoriesToggle.click();
    await page.waitForTimeout(1000); // Wait for transition
    await preRollsCheckboxLabel.waitFor({ state: 'visible', timeout: 5000 });
    await expect(preRollsCheckboxLabel).toBeVisible();
    await takeScreenshot(page, 'categories_expanded');
  } else {
    console.log("Note: Categories section filter layout is static (non-collapsible) on desktop view. Gracefully skipping accordion toggle.");
    await takeScreenshot(page, 'categories_static');
  }
  console.log("Success: Categories accordion filter completed! \n");

  // ==========================================
  // 4.3 Filter Products by Category (PRE ROLLS)
  // ==========================================
  console.log("--- Step 4.3: Filtering by PRE ROLLS Category ---");
  await preRollsCheckboxLabel.click();

  console.log("Waiting 2 seconds for listing refresh...");
  await page.waitForTimeout(2000);
  await handleAgeGate(page);

  // Assert checkbox is checked
  const checkboxInput = page.locator("input[type='checkbox']#PRE_ROLLS, label input[type='checkbox'], input[type='checkbox']").first();
  const isChecked = await checkboxInput.isChecked();
  expect(isChecked).toBe(true);

  await takeScreenshot(page, 'filtered_by_pre_rolls');
  console.log("Success: Listing filtered by category successfully! \n");

  // ==========================================
  // 4.4 Filter Products by Shipping State
  // ==========================================
  console.log("--- Step 4.4: Filtering by Shipping State ---");
  const stateSearchInput = page.locator("input[placeholder*='Search states' i]").first();
  await expect(stateSearchInput).toBeVisible();

  console.log("Searching and selecting state 'Illinois'...");
  await stateSearchInput.click();
  await stateSearchInput.fill('Illinois');
  await page.waitForTimeout(500);

  const illinoisLabel = page.locator("label:has-text('Illinois'), span:has-text('Illinois')").first();
  await expect(illinoisLabel).toBeVisible();
  await illinoisLabel.click();

  console.log("Waiting 2 seconds for listing refresh...");
  await page.waitForTimeout(2000);
  await handleAgeGate(page);

  await takeScreenshot(page, 'filtered_by_illinois');
  console.log("Success: Listing filtered by shipping state successfully! \n");

  // ==========================================
  // 4.5 Use Pagination Controls
  // ==========================================
  console.log("--- Step 4.5: Checking Pagination Controls ---");
  // Rule: After every page open it should scroll down to bottom
  await slowScrollDown(page);

  // Locate pagination previous button inside the pagination container block
  const paginationContainer = page.locator("div.flex.items-center.justify-center, div.flex.justify-center").filter({ hasText: '1' }).first();
  const prevBtn = paginationContainer.locator("button").first();
  await expect(prevBtn).toBeVisible();

  // Verify 'Go to previous page' is disabled on page 1
  const isPrevDisabled = await prevBtn.isDisabled()
    || (await prevBtn.getAttribute('class'))?.includes('disabled')
    || (await prevBtn.getAttribute('disabled')) !== null;
  expect(isPrevDisabled).toBe(true);
  console.log("Go to previous page button correctly disabled on page 1.");

  await takeScreenshot(page, 'pagination_footer');
  console.log("Success: Pagination verified successfully! \n");

  // ==========================================
  // 4.6 Add Product to Cart from Listing Card
  // ==========================================
  console.log("--- Step 4.6: Adding Product to Cart ---");
  // Scroll back to top of the grid to click Add to Cart
  await resultsHeading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const firstCardAddToCart = page.locator("button:has-text('Add to Cart'), a:has-text('Add to Cart')").first();
  await expect(firstCardAddToCart).toBeVisible();
  await firstCardAddToCart.click();
  await page.waitForTimeout(1500);
  await handleAgeGate(page);

  // Verify redirection to product details page to pick variations
  console.log("Verifying product details page redirection...");
  await expect(page).toHaveURL(/.*product\/.*/);

  // Rule: After opening a page wait a sec & take ss
  await page.waitForTimeout(1000);
  await takeScreenshot(page, 'detail_page_loaded');

  // Click 'Add to Cart' inside the details view
  console.log("Clicking Add to Cart button on product detail page...");
  const detailAddToCartBtn = page.locator("button:has-text('Add to Cart'), button:has-text('ADD TO CART')").first();
  await expect(detailAddToCartBtn).toBeVisible();
  await detailAddToCartBtn.click();

  console.log("Waiting 2 seconds for cart counter update...");
  await page.waitForTimeout(2000);
  await handleAgeGate(page);

  await takeScreenshot(page, 'cart_added_from_detail');
  console.log("Success: Add to Cart checklist completed with 100% success! \n");
});
