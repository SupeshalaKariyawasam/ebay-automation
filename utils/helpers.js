/**
 * Parse price from text (e.g., "$19.99" -> 19.99)
 */
export function parsePrice(text) {
  return parseFloat(text.replace(/[^\d.]/g, '')) || 0;
}

/**
 * Simulate network error/offline for TC-10
 */
export async function simulateNetworkError(page) {
  await page.route('**/*', route => route.abort());
  // Or for partial: await page.setOffline(true);  // Playwright v1.40+
}

/**
 * Check if title contains category keyword (e.g., "wallet")
 */
export function isSameCategory(title, category = 'wallet') {
  return title.includes(category.toLowerCase());
}

/**
 * Check price in range (±25% as per assumptions)
 */
export function isInPriceRange(price, mainPrice, tolerance = 0.25) {
  const min = mainPrice * (1 - tolerance);
  const max = mainPrice * (1 + tolerance);
  return price >= min && price <= max;
}