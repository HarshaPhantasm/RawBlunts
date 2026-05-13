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
  await page.screenshot({ path: `screenshots/checkout_${name}.png` });
  console.log(`Screenshot taken: screenshots/checkout_${name}.png`);
}

// Helper to add product to cart and proceed to checkout
async function addProductAndNavigateToCheckout(page: Page) {
  console.log("Adding a product to start the checkout flow...");
  await page.goto('https://rawblunts.com/product', { waitUntil: 'domcontentloaded' });
  await handleAgeGate(page);
  
  const firstCardAddToCart = page.locator("button:has-text('Add to Cart'), a:has-text('Add to Cart')").first();
  await expect(firstCardAddToCart).toBeVisible();
  await firstCardAddToCart.click({ force: true });
  await page.waitForTimeout(1500);
  await handleAgeGate(page);

  const flavorBtn = page.locator("button").filter({ hasText: /BLUE DREAM/i }).first();
  await flavorBtn.waitFor({ state: 'attached', timeout: 5000 });
  await flavorBtn.scrollIntoViewIfNeeded();
  await flavorBtn.click({ force: true });
  await page.waitForTimeout(500);

  const addToCartBtn = page.locator("button:has-text('Add To Cart'), button:has-text('ADD TO CART')").first();
  await expect(addToCartBtn).toBeVisible();
  await addToCartBtn.click({ force: true });
  await page.waitForTimeout(2000);

  console.log("Navigating to Cart page...");
  await page.goto('https://rawblunts.com/cart', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await handleAgeGate(page);

  const proceedBtn = page.locator("button:has-text('Proceed to Checkout'), button:has-text('PROCEED TO CHECKOUT')").first();
  await proceedBtn.scrollIntoViewIfNeeded();
  await proceedBtn.click({ force: true });
  await page.waitForTimeout(2500);
  await handleAgeGate(page);
}

test('Checkout Comprehensive Process Checklist Flow', async ({ page }) => {
  // Give a safe 3-minute timeout for comprehensive checkout sequential flows
  test.setTimeout(180000);

  // Set standard viewport size
  await page.setViewportSize({ width: 1920, height: 1080 });

  // =========================================================================
  // 7.1 Fill Shipping Address (Same as Billing)
  // =========================================================================
  console.log("--- Step 7.1: Shipping Address (Same as Billing) ---");
  await addProductAndNavigateToCheckout(page);
  
  await takeScreenshot(page, 'checkout_loaded_7_1');

  // Verify 'Shipping Address' section heading is visible and expanded
  const shippingHeader = page.locator("h2, div, span").filter({ hasText: /^Shipping Address$/i }).first();
  await expect(shippingHeader).toBeVisible();

  // Define checkout form field locators
  const firstName = page.locator("input[name*='firstName' i], input[name*='first_name' i], input[placeholder='First name' i]").filter({ visible: true }).first();
  const lastName = page.locator("input[name*='lastName' i], input[name*='last_name' i], input[placeholder='Last name' i]").filter({ visible: true }).first();
  const email = page.locator("input[type='email' i], input[name*='email' i], input[placeholder='Email address' i]").filter({ visible: true }).first();
  const phone = page.locator("input[type='tel' i], input[name*='phone' i], input[placeholder='Phone number' i]").filter({ visible: true }).first();
  const address1 = page.locator("input[placeholder='Enter your address' i]").filter({ visible: true }).first();
  const address2 = page.locator("input[placeholder='Apartment, suite, etc. (optional)' i]").filter({ visible: true }).first();
  const city = page.locator("input[placeholder='City' i]").filter({ visible: true }).first();
  const stateSelect = page.locator("select").filter({ visible: true }).first();
  const postalCode = page.locator("input[placeholder='Postal code' i]").filter({ visible: true }).first();
  const countryInput = page.locator("input[placeholder='Country' i], input[name*='country' i]").filter({ visible: true }).first();

  await firstName.scrollIntoViewIfNeeded();
  await expect(firstName).toBeVisible();

  // Fill Shipping details
  console.log("Filling Shipping details for John Doe...");
  await firstName.fill("John");
  await lastName.fill("Doe");
  await email.fill("john.doe@example.com");
  await phone.fill("5551234567");
  await address1.fill("123 Main St");
  await address2.fill("Apt 4B");
  await city.fill("Joliet");
  
  if (await stateSelect.isVisible()) {
    try {
      await stateSelect.selectOption({ label: "Illinois" });
    } catch (e) {
      await stateSelect.selectOption("IL");
    }
  }
  await postalCode.fill("60436");

  // Verify Country pre-set to US
  if (await countryInput.isVisible()) {
    const countryVal = await countryInput.inputValue();
    console.log(`Pre-set Country value: ${countryVal}`);
    expect(countryVal.toUpperCase()).toMatch(/US|UNITED STATES/);
  } else {
    console.log("Country element is static or pre-set on UI.");
  }

  // Check 'Use Shipping Address as Billing Address' checkbox
  const billingCheckboxLabel = page.locator("label").filter({ hasText: /Use Shipping Address as Billing/i }).first();
  const billingCheckboxInput = page.locator("input[type='checkbox']").first();

  // Ensure it is checked
  const isChecked = await billingCheckboxInput.isChecked();
  if (!isChecked) {
    console.log("Checking 'Use Shipping Address as Billing' checkbox...");
    await billingCheckboxLabel.click({ force: true });
    await page.waitForTimeout(500);
  }

  await takeScreenshot(page, 'shipping_same_as_billing_checked');

  // Verify billing details collapse and auto-fill
  console.log("Verifying billing details auto-fill...");
  const billingFirstName = page.locator("input[placeholder='First name' i]").nth(1);
  await expect(billingFirstName).toHaveValue("John");
  console.log("Success: Billing Address form auto-fills successfully!");

  // Click 'Continue to Payment'
  const continueBtn = page.locator("button:has-text('Continue to Payment'), button:has-text('Proceed to Payment'), button:has-text('Continue')").filter({ visible: true }).first();
  await continueBtn.scrollIntoViewIfNeeded();
  await expect(continueBtn).toBeVisible();
  
  console.log("Bypassing 'Continue to Payment' click as requested by user...");
  // await continueBtn.click({ force: true });
  await page.waitForTimeout(1000);
  
  await takeScreenshot(page, 'after_continue_to_payment_7_1');
  console.log("Success: Step 7.1 completed successfully!");


  // =========================================================================
  // 7.2 Fill Shipping and Billing Separately
  // =========================================================================
  console.log("\n--- Step 7.2: Shipping and Billing Separately ---");
  // Reload / Re-navigate to refresh state
  await page.reload({ waitUntil: 'domcontentloaded' });
  await handleAgeGate(page);

  // Fill Shipping again as John Doe
  await firstName.scrollIntoViewIfNeeded();
  console.log("Filling Shipping details for John Doe again...");
  await firstName.fill("John");
  await lastName.fill("Doe");
  await email.fill("john.doe@example.com");
  await phone.fill("5551234567");
  await address1.fill("123 Main St");
  await address2.fill("Apt 4B");
  await city.fill("Joliet");
  
  if (await stateSelect.isVisible()) {
    try {
      await stateSelect.selectOption({ label: "Illinois" });
    } catch (e) {
      await stateSelect.selectOption("IL");
    }
  }
  await postalCode.fill("60436");

  // Keep 'Use Shipping Address as Billing Address' unchecked
  const isCheckboxChecked = await billingCheckboxInput.isChecked();
  if (isCheckboxChecked) {
    console.log("Unchecking 'Use Shipping Address as Billing' checkbox to fill separately...");
    await billingCheckboxLabel.click({ force: true });
    await page.waitForTimeout(500);
  }

  await takeScreenshot(page, 'shipping_same_as_billing_unchecked');

  // Verify Billing section expands and fill Billing details
  console.log("Filling Billing Address for Jane Smith...");
  const sepBillingFirstName = page.locator("input[placeholder='First name' i]").filter({ visible: true }).nth(1);
  const sepBillingLastName = page.locator("input[placeholder='Last name' i]").filter({ visible: true }).nth(1);
  const sepBillingEmail = page.locator("input[placeholder='Email address' i]").filter({ visible: true }).nth(1);
  const sepBillingPhone = page.locator("input[placeholder='Phone number' i]").filter({ visible: true }).nth(1);
  const sepBillingAddress1 = page.locator("input[placeholder='Enter your address' i]").filter({ visible: true }).nth(1);
  const sepBillingAddress2 = page.locator("input[placeholder='Apartment, suite, etc. (optional)' i]").filter({ visible: true }).nth(1);
  const sepBillingCity = page.locator("input[placeholder='City' i]").filter({ visible: true }).nth(1);
  const sepBillingStateSelect = page.locator("select").filter({ visible: true }).nth(1);
  const sepBillingPostalCode = page.locator("input[placeholder='Postal code' i]").filter({ visible: true }).nth(1);

  await sepBillingFirstName.scrollIntoViewIfNeeded();
  await expect(sepBillingFirstName).toBeVisible();

  await sepBillingFirstName.fill("Jane");
  await sepBillingLastName.fill("Smith");
  await sepBillingEmail.fill("jane.smith@example.com");
  await sepBillingPhone.fill("5559876543");
  await sepBillingAddress1.fill("456 Oak Ave");
  await sepBillingAddress2.fill("");
  await sepBillingCity.fill("Chicago");

  if (await sepBillingStateSelect.isVisible()) {
    try {
      await sepBillingStateSelect.selectOption({ label: "Illinois" });
    } catch (e) {
      await sepBillingStateSelect.selectOption("IL");
    }
  }
  await sepBillingPostalCode.fill("60601");

  await takeScreenshot(page, 'billing_separately_filled');

  // Click 'Continue to Payment'
  console.log("Bypassing 'Continue to Payment' click for separate billing as requested by user...");
  await continueBtn.scrollIntoViewIfNeeded();
  // await continueBtn.click({ force: true });
  await page.waitForTimeout(1000);
  
  await takeScreenshot(page, 'after_continue_to_payment_7_2');
  console.log("Success: Step 7.2 completed successfully!");
});
