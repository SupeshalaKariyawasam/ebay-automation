# ebay-automation
# eBay Related Best Sellers Automation Framework

## Overview
Playwright (JS) framework automating the "Related Best Sellers" feature on eBay product pages. Tests verify up to 6 similar products (same category, ±25% price range, best sellers by 30-day sales) after searching for "wallet". Based on QA assessment manual TCs (TC-01 to TC-15).

## Prerequisites & Setup
- Node.js 18+
- Run in Codespaces or local

### Installation
```bash
npm install
npx playwright install --with-deps chromium firefox webkit
