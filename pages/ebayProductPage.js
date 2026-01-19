import { expect } from '@playwright/test';
import { parsePrice } from '../utils/helpers.js';

export class EbayProductPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    // Stable locators based on text/role (eBay 2026 UI)
    this.relatedSectionHeading = page.getByRole('heading', { name: /similar sponsored items|related items|people who viewed/i });
    this.relatedItems = page.locator('ul[role="list"] li:has(> a:has-text("Add to cart")), section:has(> h2:text-matches("Similar|Related", "i")) ul li');
    this.mainPrice = page.locator('[itemprop="price"], #prcIsum');
    this.sponsoredLabel = page.getByText('Sponsored');
    this.loadingSpinner = page.locator('.spinner, [aria-busy="true"]');  // Generic spinner
  }

  async isSectionVisible() {
    try {
      await this.relatedSectionHeading.waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  async getRelatedItemsCount() {
    if (!(await this.isSectionVisible())) return 0;
    return await this.relatedItems.count();
  }

  async getRelatedTitles() {
    const titles = [];
    const count = await this.getRelatedItemsCount();
    for (let i = 0; i < count; i++) {
      const title = await this.relatedItems.nth(i).getByRole('link').innerText();
      titles.push(title.toLowerCase().trim());
    }
    return titles;
  }

  async getRelatedPrices() {
    const prices = [];
    const count = await this.getRelatedItemsCount();
    for (let i = 0; i < count; i++) {
      const priceText = await this.relatedItems.nth(i).locator('[itemprop="price"], .s-item__price').innerText();
      prices.push(parsePrice(priceText));
    }
    return prices;
  }

  async getMainPrice() {
    const priceText = await this.mainPrice.innerText();
    return parsePrice(priceText);
  }

  async clickRelatedItem(index = 0) {
    await this.relatedItems.nth(index).getByRole('link').click();
    await this.page.waitForLoadState('networkidle');
  }

  async isSponsored(itemIndex = 0) {
    return await this.relatedItems.nth(itemIndex).getByText('Sponsored').isVisible();
  }

  async waitForLoad(timeout = 3000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await this.isSectionVisible()) return true;
      await this.page.waitForTimeout(500);
    }
    return false;
  }

  async checkAccessibilityAltText() {
    const images = this.relatedItems.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).not.toBeEmpty();  // Basic check per your TC-07
    }
  }

  // For auction/out-of-stock: Check if main price is missing or "Sold Out" visible
  async isAuctionOrOutOfStock() {
    const priceVisible = await this.mainPrice.isVisible();
    const soldOut = await this.page.getByText('Sold Out', { exact: true }).isVisible();
    return !priceVisible || soldOut;
  }
}