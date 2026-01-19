import { expect } from '@playwright/test';
import { parsePrice, simulateNetworkError } from '../utils/helpers.js';

export class EbayHomePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.searchInput = page.getByLabel('Search for anything', { exact: true });
    this.searchButton = page.getByRole('button', { name: 'Search' });
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async searchFor(query) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
    await this.page.waitForLoadState('load');
    // Wait for results with timeout
    await this.page.getByRole('heading', { name: /results/i }).waitFor({ timeout: 10000 }).catch(() => {});
  }

  async openFirstProduct() {
    // Click first non-sponsored product link
    const firstItem = this.page.getByRole('link', { name: /wallet|add to cart/i }).filter({ hasNot: this.page.getByText('Sponsored') }).first();
    await firstItem.click();
    await this.page.waitForLoadState('load').catch(() => {});
  }

  async simulateOffline() {
    await simulateNetworkError(this.page);
  }
}