import { test, expect, type ViewportSize } from '@playwright/test';
import { mockCourses } from '../fixtures/course';

test.describe('Homepage Visual Regression @visual', () => {
  const viewports: Record<string, ViewportSize> = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 800 },
  };

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/courses**', async (route) => {
      const url = new URL(route.request().url());
      const searchParams = new URLSearchParams(url.search);
      const limit = parseInt(searchParams.get('limit') || '10', 10);

      const allCourses = Object.values(mockCourses);
      const paginated = allCourses.slice(0, limit);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            courses: paginated,
            total: allCourses.length,
            limit,
            page: 1,
          },
        }),
      });
    });

    await page.route('**/api/v1/categories**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { id: 'cat-1', name: 'Web Development', slug: 'web-development', courseCount: 12 },
            { id: 'cat-2', name: 'Tailoring', slug: 'tailoring', courseCount: 8 },
            { id: 'cat-3', name: 'Makeup Artistry', slug: 'makeup', courseCount: 6 },
            { id: 'cat-4', name: 'Baking', slug: 'baking', courseCount: 5 },
            { id: 'cat-5', name: 'Photography', slug: 'photography', courseCount: 9 },
            { id: 'cat-6', name: 'Graphic Design', slug: 'design', courseCount: 7 },
            { id: 'cat-7', name: 'Hair Styling', slug: 'hair', courseCount: 4 },
            { id: 'cat-8', name: 'Catering', slug: 'catering', courseCount: 3 },
          ],
        }),
      });
    });

    await page.route('**/api/v1/bundles**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
        }),
      });
    });
  });

  for (const [viewportName, viewportSize] of Object.entries(viewports)) {
    test(`homepage renders correctly at ${viewportName} viewport (${viewportSize.width}x${viewportSize.height})`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(viewportSize);

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await page.waitForSelector('h1', { state: 'visible', timeout: 10000 }).catch(() => {});
      await page.waitForSelector('[class*="hero"]', { state: 'visible', timeout: 10000 }).catch(() => {});

      await page.waitForTimeout(1500);

      const suffix = `${viewportName}-${viewportSize.width}x${viewportSize.height}`;
      await expect(page).toHaveScreenshot(`homepage-${suffix}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
});
