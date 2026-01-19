import { test, expect } from '@playwright/test';
import { EbayHomePage } from '../pages/ebayHomePage.js';
import { EbayProductPage } from '../pages/ebayProductPage.js';
import { simulateNetworkError, isSameCategory, isInPriceRange } from '../utils/helpers.js';

test.describe('eBay Related Best Sellers Feature - Automated Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Preconditions: Clear cache, stable internet (simulated)
    await page.goto('https://www.ebay.com');
    await page.context().clearCookies();
  });

  // TC-01: Check up to 6 related best sellers shows (High, Positive)
  test('TC-01 - Up to 6 related best sellers show', async ({ page }) => {
    const home = new EbayHomePage(page);
    const product = new EbayProductPage(page);

    await home.goto();
    await home.searchFor('wallet');  // Test data: Wallet category
    await home.openFirstProduct();

    const count = await product.getRelatedItemsCount();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(6);  // As per assumptions

    const titles = await product.getRelatedTitles();
    const mainPrice = await product.getMainPrice();
    const prices = await product.getRelatedPrices();

    // Same category and price range
    for (let i = 0; i < count; i++) {
      expect(isSameCategory(titles[i], 'wallet')).toBe(true);
      expect(isInPriceRange(prices[i], mainPrice)).toBe(true);
    }
  });

  // TC-02: Fewer than 6 items (Medium, Positive)
  test('TC-02 - Fewer than 6 items shown without errors', async ({ page }) => {
    const home = new EbayHomePage(page);
    const product = new EbayProductPage(page);

    await home.goto();
    await home.searchFor('rare vintage wallet');  // Fewer matches expected
    await home.openFirstProduct();

    const count = await product.getRelatedItemsCount();
    expect(count).toBeLessThan(6);  // Shows available (e.g., 4)
    expect(await product.isSectionVisible()).toBe(true);  // No errors
  });

  // TC-03: No matches (Medium, Edge)
  test('TC-03 - Section hidden when no matches', async ({ page }) => {
    const home = new EbayHomePage(page);
    const product = new EbayProductPage(page);

    await home.goto();
    await home.searchFor('extremely rare unobtainium wallet');  // No matches simulated
    await home.openFirstProduct();

    const visible = await product.isSectionVisible();
    expect(visible).toBe(false);  // Section hidden as per assumptions
  });

  // TC-04: Click item to navigate (High, Positive)
  test('TC-04 - Click related item navigates to new page', async ({ page }) => {
    const home = new EbayHomePage(page);
    const product = new EbayProductPage(page);

    await home.goto();
    await home.searchFor('wallet');
    await home.openFirstProduct();

    const currentUrl = page.url();
    await product.clickRelatedItem(0);  // Click first item
    await expect(page).not.toHaveURL(currentUrl);  // Navigates to new product page
  });

  // TC-05: Mobile display (Medium, Compatibility)
  test('TC-05 - Mobile display adjusts layout', async ({ page }) => {
    const home = new EbayHomePage(page);
    const product = new EbayProductPage(page);

    await home.goto();
    await home.searchFor('wallet');
    await home.openFirstProduct();

    // Check scroll works and items visible (basic mobile check)
    await expect(product.relatedSectionHeading).toBeVisible();
    await page.evaluate(() => window.scrollBy(0, 500));  // Simulate scroll
    await expect(product.relatedItems.first()).toBeVisible();  // Still visible
  });

  // TC-06: Load time check (Medium, Performance)
  test('TC-06 - Section loads under 3 seconds', async ({ page }) => {
    const home = new EbayHomePage(page);
    const product = new EbayProductPage(page);

    await home.goto();
    await home.searchFor('wallet');
    await home.openFirstProduct();

    const loadTime = await product.waitForLoad(3000);  // Custom wait
    expect(loadTime).toBe(true);  // Loaded within 3s as per assumptions
  });

  // TC-07: Accessibility test (Medium, Usability)
  test('TC-07 - Images have alt text and navigable', async ({ page }) => {
    const home = new EbayHomePage(page);
    const product = new EbayProductPage(page);

    await home.goto();
    await home.searchFor('wallet');
    await home.openFirstProduct();

    await product.checkAccessibilityAltText();  // Checks alt text present

    // Basic keyboard navigation
    await page.keyboard.press('Tab');  // Tab to section
    await expect(product.relatedItems.first()).toBeFocused();
  });

  // TC-08: No price on main (auction) (High, Negative)
  test('TC-08 - Handles auction (no price) with fallback', async ({ page }) => {
    const home = new EbayHomePage(page);
    const product = new EbayProductPage(page);

    await home.goto();
    await home.searchFor('wallet auction');  // Search for auction items
    await home.openFirstProduct();

    const isAuction = await product.isAuctionOrOutOfStock();
    if (isAuction) {
      // Fallback: Show based on category only
      const titles = await product.getRelatedTitles();
      for (const title of titles) {
        expect(isSameCategory(title, 'wallet')).toBe(true);
      }
    }
  });

  // TC-09: Out-of-stock main (Medium, Edge)
  test('TC-09 - Shows items based on category for out-of-stock main', async ({ page }) => {
    const home = new EbayHomePage(page);
    const product = new EbayProductPage(page);

    await home.goto();
    await home.searchFor('sold out wallet');  // Simulate out-of-stock
    await home.openFirstProduct();

    const isOutOfStock = await product.isAuctionOrOutOfStock();
    if (isOutOfStock) {
      const titles = await product.getRelatedTitles();
      for (const title of titles) {
        expect(isSameCategory(title, 'wallet')).toBe(true);  // Based on category
      }
    }
  });

  // TC-10: Network failure (High, Negative)
  test('TC-10 - Shows error message on network failure', async ({ page }) => {
    const home = new EbayHomePage(page);
    await home.simulateOffline();  // Simulate offline

    await home.goto();
    await home.searchFor('wallet');
    await home.openFirstProduct();

    // Expect error (Playwright simulates; in real, check for error toast)
    await expect(page.getByText(/error|offline|failed/i)).toBeVisible({ timeout: 5000 });
  });

  // TC-11: No category mismatches (High, Negative)
  test('TC-11 - Only correct category items shown', async ({ page }) => {
    const home = new EbayHomePage(page);
    const product = new EbayProductPage(page);

    await home.goto();
    await home.searchFor('wallet');  // Wallet category
    await home.openFirstProduct();

    const titles = await product.getRelatedTitles();
    for (const title of titles) {
      expect(isSameCategory(title, 'wallet')).toBe(true);  // No mismatches
    }
  });

  // TC-12: High price main (Medium, Edge)
  test('TC-12 - Items in range for high-price main ($500)', async ({ page }) => {
    const home = new EbayHomePage(page);
    const product = new EbayProductPage(page);

    await home.goto();
    await home.searchFor('luxury wallet $500');  // High price
    await home.openFirstProduct();

    const mainPrice = await product.getMainPrice();
    expect(mainPrice).toBeGreaterThan(400);  // Verify high price

    const prices = await product.getRelatedPrices();
    for (const price of prices) {
      expect(isInPriceRange(price, mainPrice)).toBe(true);  // ±25%
    }
  });

  // TC-13: Sponsored items (Medium, Positive)
  test('TC-13 - Sponsored items labeled separately', async ({ page }) => {
    const home = new EbayHomePage(page);
    const product = new EbayProductPage(page);

    await home.goto();
    await home.searchFor('wallet');
    await home.openFirstProduct();

    const count = await product.getRelatedItemsCount();
    if (count > 0) {
      const isSponsored = await product.isSponsored(0);
      expect(isSponsored).toBe(true);  // Labeled as per assumptions
    }
  });

  // TC-14: Different browsers (Medium, Compatibility)
  test('TC-14 - Same display on Firefox (runs via project config)', async ({ page, browserName }) => {
    // This runs automatically on Firefox project; assert basic visibility
    const home = new EbayHomePage(page);
    const product = new EbayProductPage(page);

    await home.goto();
    await home.searchFor('wallet');
    await home.openFirstProduct();

    expect(await product.isSectionVisible()).toBe(true);  // Same as Chrome
    expect(browserName).toBe('firefox');  // Verify browser
  });

  // TC-15: Other countries (Medium, Positive)
  test('TC-15 - Currency in GBP for UK', async ({ page, context }) => {
    // Grant geolocation permission
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 51.5074, longitude: -0.1278 });  // London
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-GB' });

    const home = new EbayHomePage(page);
    const product = new EbayProductPage(page);

    await home.goto();
    await home.searchFor('wallet');
    await home.openFirstProduct();

    const prices = await product.getRelatedPrices();
    // Check for GBP symbol or format (basic check)
    const priceTexts = await product.relatedItems.locator('.s-item__price').allInnerTexts();
    const hasGBP = priceTexts.some(text => text.includes('£') || text.includes('GBP'));
    expect(hasGBP).toBe(true);  // Currency in GBP
  });
});