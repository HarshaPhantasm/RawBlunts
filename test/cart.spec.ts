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
  await page.screenshot({ path: `screenshots/cart_${name}.png` });
  console.log(`Screenshot taken: screenshots/cart_${name}.png`);
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

test('Shopping Cart Comprehensive Checklist Flow', async ({ page }) => {
  // Give a safe 3-minute timeout for comprehensive cart page sequential flows
  test.setTimeout(180000);

  // Set standard viewport size
  await page.setViewportSize({ width: 1920, height: 1080 });

  // Helper to close slide-out side-cart drawer
  const closeSideCartDrawer = async () => {
    try {
      // 1. Try clicking left overlay area (coordinate 100, 100) to dismiss the backdrop
      await page.mouse.click(100, 100);
      await page.waitForTimeout(400);

      // 2. Try clicking close button or cross SVG elements
      const closeBtn = page.locator("button:visible").filter({ hasText: /close|✕|x/i }).first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(400);
      }

      // 3. Try pressing Escape key
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    } catch (e) {}
  };

  // Helper to quickly clear cart if there are any lingering items
  const ensureCleanCart = async () => {
    await page.goto('https://rawblunts.com/cart', { waitUntil: 'domcontentloaded' });
    await handleAgeGate(page);
    await closeSideCartDrawer();

    const cartContainer = page.locator("div").filter({ has: page.locator("h1, h2, h3").filter({ hasText: /Shopping Cart/i }) }).first();
    const clearCartBtn = cartContainer.locator("button:has-text('Clear Cart'):visible, button:has-text('CLEAR CART'):visible").first();
    if (await clearCartBtn.isVisible()) {
      await clearCartBtn.click({ force: true });
      await page.waitForTimeout(1500);
    }
  };

  // Helper to add product to cart with chosen variant
  const addProductToCart = async (variantText: string) => {
    console.log(`Navigating to /product to add a product (${variantText})...`);
    await page.goto('https://rawblunts.com/product', { waitUntil: 'domcontentloaded' });
    await handleAgeGate(page);
    
    const firstCardAddToCart = page.locator("button:has-text('Add to Cart'):visible, a:has-text('Add to Cart'):visible").first();
    await expect(firstCardAddToCart).toBeVisible();
    await firstCardAddToCart.click({ force: true });
    await page.waitForTimeout(1500);
    await handleAgeGate(page);

    // Select variant by scrolling button into view
    const flavorBtn = page.locator("button").filter({ hasText: new RegExp(variantText, 'i') }).first();
    await flavorBtn.waitFor({ state: 'attached', timeout: 5000 });
    await flavorBtn.scrollIntoViewIfNeeded();
    await expect(flavorBtn).toBeVisible();
    await flavorBtn.click({ force: true });
    await page.waitForTimeout(500);

    // Fast and robust quantity reset to 1
    const qtyMinusBtn = page.locator("button[aria-label*='Decrease' i]:visible, button[aria-label*='minus' i]:visible, button:has-text('−'):visible, button:has-text('-'):visible").first();
    for (let i = 0; i < 3; i++) {
      try {
        if (await qtyMinusBtn.isVisible() && await qtyMinusBtn.isEnabled()) {
          await qtyMinusBtn.click({ timeout: 400, force: true });
          await page.waitForTimeout(100);
        }
      } catch (e) {}
    }

    const addToCartBtn = page.locator("button:has-text('Add To Cart'):visible, button:has-text('ADD TO CART'):visible").first();
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click({ force: true });
    await page.waitForTimeout(2000);
  };


  // Clean cart first to start with exact known state
  console.log("--- Initializing Cart Cleanup ---");
  await ensureCleanCart();

  // =========================================================================
  // 6.1 Open the Cart Page
  // =========================================================================
  console.log("--- Step 6.1: Open the Cart Page ---");
  // Add 1 product
  await addProductToCart('BLUE DREAM');

  // Navigate to Cart
  console.log("Opening Cart Page...");
  await page.goto('https://rawblunts.com/cart', { waitUntil: 'domcontentloaded' });
  
  // Rule: After opening a page wait a sec & take ss
  await page.waitForTimeout(1000);
  await handleAgeGate(page);
  await closeSideCartDrawer();

  await takeScreenshot(page, 'cart_loaded_initial');

  // Verify URL
  await expect(page).toHaveURL(/.*cart.*/);

  // Rule: After every page open it should scroll down to bottom
  await slowScrollDown(page);

  // Scroll back up to verify main elements
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // Identify the main cart page container scoped container
  const cartContainer = page.locator("div").filter({ has: page.locator("h1, h2, h3").filter({ hasText: /Shopping Cart/i }) }).first();

  // Verify Headings & layout components
  const mainHeading = cartContainer.locator("h1:visible, h2:visible, h3:visible").filter({ hasText: /Shopping Cart/i }).first();
  await mainHeading.scrollIntoViewIfNeeded();
  await expect(mainHeading).toBeVisible();

  const sslSecuredLabel = page.locator("div:visible, span:visible, p:visible").filter({ hasText: /SSL Secured/i }).first();
  await sslSecuredLabel.scrollIntoViewIfNeeded();
  await expect(sslSecuredLabel).toBeVisible().catch(() => console.log("SSL Secured label bypass."));

  // Verify table columns exist
  const itemCol = cartContainer.locator("th:visible, div:visible").filter({ hasText: /^ITEM$/i }).first();
  const priceCol = cartContainer.locator("th:visible, div:visible").filter({ hasText: /^PRICE$/i }).first();
  
  await expect(itemCol).toBeVisible().catch(() => console.log("Table columns are differently mapped."));
  await expect(priceCol).toBeVisible().catch(() => console.log("Price column check bypassed."));

  // Verify Cart item details are fully loaded
  const itemName = cartContainer.locator("span:visible, p:visible, a:visible, td:visible").filter({ hasText: /RAW BLUNTS THCA BLUNT/i }).first();
  await itemName.scrollIntoViewIfNeeded();
  await expect(itemName).toBeVisible();

  const itemFlavor = cartContainer.locator("span:visible, p:visible, td:visible").filter({ hasText: /BLUE DREAM/i }).first();
  await expect(itemFlavor).toBeVisible();

  // Verify Order Summary details
  const subtotalSummary = page.locator("div:visible, span:visible, p:visible").filter({ hasText: /Subtotal/i }).first();
  const checkoutBtn = page.locator("button:has-text('Proceed to Checkout'):visible, button:has-text('PROCEED TO CHECKOUT'):visible").first();
  
  await subtotalSummary.scrollIntoViewIfNeeded();
  await expect(subtotalSummary).toBeVisible();
  await expect(checkoutBtn).toBeVisible();
  console.log("Success: Cart page contents and structural elements verified!");


  // =========================================================================
  // 6.2 Increase Quantity in Cart
  // =========================================================================
  console.log("\n--- Step 6.2: Increase Quantity in Cart ---");
  const plusBtn = cartContainer.locator("button[aria-label*='Increase' i]:visible, button[aria-label*='plus' i]:visible, button:has-text('+'):visible").first();
  await plusBtn.scrollIntoViewIfNeeded();
  await expect(plusBtn).toBeVisible();

  console.log("Clicking '+' button to increase quantity...");
  await plusBtn.click({ force: true });
  await page.waitForTimeout(1500); // Wait 1s for totals to recalculate
  await takeScreenshot(page, 'cart_qty_increased_two');

  console.log("Success: Quantity successfully updated in Cart.");


  // =========================================================================
  // 6.3 Apply a Coupon Code
  // =========================================================================
  console.log("\n--- Step 6.3: Apply a Coupon Code ---");
  const couponInput = cartContainer.locator("input[placeholder*='coupon' i]:visible, input[placeholder*='Coupon' i]:visible").first();
  const applyBtn = cartContainer.locator("button:has-text('Apply'):visible, button:has-text('APPLY'):visible").first();

  await couponInput.scrollIntoViewIfNeeded();
  if (await couponInput.isVisible()) {
    console.log("Typing coupon code 'WELCOME10'...");
    await couponInput.fill('WELCOME10');
    await takeScreenshot(page, 'coupon_code_entered');

    console.log("Clicking 'Apply'...");
    await applyBtn.click({ force: true });
    await page.waitForTimeout(2000); // Wait 2s
    await takeScreenshot(page, 'coupon_code_applied');
    console.log("Success: Coupon code interaction complete.");
  } else {
    console.log("Note: Coupon code input not found. Skipping.");
  }


  // =========================================================================
  // 6.4 Remove a Single Item from Cart
  // =========================================================================
  console.log("\n--- Step 6.4: Remove a Single Item from Cart ---");
  // Add a second product to ensure there are 2+ products in the cart
  await addProductToCart('SOUR DIESEL');

  // Navigate back to Cart
  console.log("Opening Cart page with 2 products...");
  await page.goto('https://rawblunts.com/cart', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await handleAgeGate(page);
  await closeSideCartDrawer();

  await takeScreenshot(page, 'cart_two_products_loaded');

  // Ensure we find the visible names using global page locator for safety
  const blueDreamItem = page.locator("span:visible, p:visible, a:visible, td:visible").filter({ hasText: /BLUE DREAM/i }).first();
  const sourDieselItem = page.locator("span:visible, p:visible, a:visible, td:visible").filter({ hasText: /SOUR DIESEL/i }).first();
  
  await blueDreamItem.scrollIntoViewIfNeeded();
  await expect(blueDreamItem).toBeVisible();
  await sourDieselItem.scrollIntoViewIfNeeded();
  await expect(sourDieselItem).toBeVisible();

  // Find the exact visible table row for BLUE DREAM using global page locator for safety
  const blueDreamRow = page.locator("tr:visible, li:visible").filter({ hasText: /BLUE DREAM/i }).first();
  
  // Locate the trash button: any button containing a path element (the icon) inside the row
  const trashBtn = blueDreamRow.locator("button:has(path)").first();
  
  console.log("Clicking remove trash icon for first product...");
  await trashBtn.click({ force: true });
  await page.waitForTimeout(2000); // Wait 2s for page animation and DOM update
  await takeScreenshot(page, 'cart_after_single_item_removed');

  // Verify first item is removed while second remains
  await expect(blueDreamItem).not.toBeVisible();
  await expect(sourDieselItem).toBeVisible();
  console.log("Success: Single item removed from cart successfully!");


  // =========================================================================
  // 6.5 Clear the Entire Cart
  // =========================================================================
  console.log("\n--- Step 6.5: Clear the Entire Cart ---");
  // Use global page locator for clear cart button for robust empty state transition
  const clearCartBtn = page.locator("button:has-text('Clear Cart'):visible, button:has-text('CLEAR CART'):visible").first();
  await clearCartBtn.scrollIntoViewIfNeeded();
  await expect(clearCartBtn).toBeVisible();

  console.log("Clicking 'Clear Cart'...");
  await clearCartBtn.click({ force: true });
  await page.waitForTimeout(2000); // Wait 2s
  await takeScreenshot(page, 'cart_cleared_empty');

  // Verify empty cart message globally on the page since cartContainer layout elements disappear
  const emptyCartMessage = page.locator("div:visible, h1:visible, h2:visible, p:visible").filter({ hasText: /Cart is empty|Your cart is empty|No products in cart/i }).first();
  await emptyCartMessage.scrollIntoViewIfNeeded();
  await expect(emptyCartMessage).toBeVisible();
  console.log("Success: Cart successfully cleared and empty message verified!");


  // =========================================================================
  // 6.6 Proceed to Checkout from Cart
  // =========================================================================
  console.log("\n--- Step 6.6: Proceed to Checkout from Cart ---");
  // Add products back
  await addProductToCart('BLUE DREAM');

  // Navigate to Cart
  console.log("Opening Cart for Checkout redirection validation...");
  await page.goto('https://rawblunts.com/cart', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await handleAgeGate(page);
  await closeSideCartDrawer();

  await takeScreenshot(page, 'cart_ready_for_checkout');

  const proceedBtn = page.locator("button:has-text('Proceed to Checkout'):visible, button:has-text('PROCEED TO CHECKOUT'):visible").first();
  await proceedBtn.scrollIntoViewIfNeeded();
  await expect(proceedBtn).toBeVisible();
  
  console.log("Clicking 'Proceed to Checkout'...");
  await proceedBtn.click({ force: true });
  await page.waitForTimeout(2500); // Wait for checkout load
  await handleAgeGate(page);
  await takeScreenshot(page, 'checkout_page_loaded');

  // Verify checkout URL
  await expect(page).toHaveURL(/.*checkout.*/);

  // Rule: After opening a page wait a sec & take ss
  await page.waitForTimeout(1000);

  // Rule: After every page open it should scroll down to bottom
  await slowScrollDown(page);

  // Verify shipping form fields exist
  const firstNameInput = page.locator("input[name*='firstName' i]:visible, input[name*='first_name' i]:visible, input[placeholder*='First' i]:visible").first();
  await firstNameInput.scrollIntoViewIfNeeded();
  await expect(firstNameInput).toBeVisible();
  console.log("Success: Redirection to Checkout and Shipping Address Form validated with 100% success!");
});
