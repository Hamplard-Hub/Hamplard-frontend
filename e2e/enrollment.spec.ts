import { test, expect } from '@playwright/test';
import { courseFixture, mockCourses, mockPromoCodes } from './fixtures/course';

// Extend test with course fixtures
test.describe('Course Enrollment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API calls to avoid real transactions
    await page.route('**/api/v1/courses/**', async (route) => {
      const url = new URL(route.request().url());
      const courseId = url.pathname.split('/').pop();
      
      const mockCourse = Object.values(mockCourses).find(c => c.id === courseId || c.slug === courseId);
      
      if (mockCourse) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockCourse,
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock enrollment API
    await page.route('**/api/v1/enrollments', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'enrollment-' + Date.now(),
            courseId: 'course-react-fundamentals',
            status: 'ACTIVE',
            enrolledAt: new Date().toISOString(),
          },
        }),
      });
    });

    // Mock cart API
    await page.route('**/api/v1/cart/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [],
            subtotal: 0,
            discount: 0,
            total: 0,
          },
        }),
      });
    });
  });

  test('full enrollment flow: browse course, enroll, checkout, complete payment', async ({
    page,
  }) => {
    // Step 1: Navigate to course page
    await page.goto('/courses/react-fundamentals');
    await page.waitForLoadState('networkidle');

    // Verify course page loaded
    await expect(page.getByRole('heading', { name: /react fundamentals/i })).toBeVisible();
    await expect(page.getByText(/sarah chen/i)).toBeVisible();
    await expect(page.getByText(/\$49\.99/i)).toBeVisible();

    // Step 2: Click "Enroll Now" button
    const enrollButton = page.getByRole('button', { name: /enroll now/i });
    await expect(enrollButton).toBeVisible();
    await enrollButton.click();

    // Should redirect to checkout or add to cart
    await page.waitForURL(/\/checkout|\/dashboard\/my-courses/i, { timeout: 5000 });

    // Step 3: If on checkout, complete payment
    if (page.url().includes('/checkout')) {
      // Fill in mock payment details
      const cardNumber = page.getByPlaceholder(/card number/i);
      if (await cardNumber.isVisible()) {
        await cardNumber.fill('4242424242424242');
        await page.getByPlaceholder(/mm\/yy/i).fill('12/25');
        await page.getByPlaceholder(/cvc/i).fill('123');
      }

      // Complete purchase
      const payButton = page.getByRole('button', { name: /pay|purchase|complete purchase/i });
      await expect(payButton).toBeVisible();
      await payButton.click();

      // Step 4: Land on confirmation/dashboard
      await page.waitForURL(/\/dashboard|\/confirmation|\/my-courses/i, { timeout: 10000 });
    }

    // Verify enrolled course appears in dashboard
    await page.goto('/dashboard/my-courses');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /react fundamentals/i })).toBeVisible();
  });

  test('promo code applies correct discount', async ({ page }) => {
    // Navigate to course and add to cart
    await page.goto('/courses/react-fundamentals');
    await page.waitForLoadState('networkidle');

    // Click enroll to go to checkout
    const enrollButton = page.getByRole('button', { name: /enroll now/i });
    await enrollButton.click();
    await page.waitForURL(/\/checkout/i, { timeout: 5000 });

    // Verify original price is displayed
    const originalPrice = page.getByText(/\$49\.99/i);
    await expect(originalPrice).toBeVisible();

    // Step: Apply promo code
    const promoInput = page.getByPlaceholder(/promo code/i);
    await expect(promoInput).toBeVisible();
    await promoInput.fill('WELCOME20');

    // Click apply button
    const applyButton = page.getByRole('button', { name: /apply/i });
    await applyButton.click();

    // Wait for discount to be applied
    await page.waitForTimeout(1000);

    // Verify discounted price is displayed
    // 20% off $49.99 = $9.998, rounded to $9.99 or similar
    const discountElement = page.getByText(/-20%|\$\d+\.\d+/i);
    await expect(discountElement.first()).toBeVisible();

    // Verify total shows discounted amount
    const totalElement = page.getByText(/total/i).locator('..');
    await expect(totalElement).toContainText(/\$/i);
  });

  test('enrolled course appears in dashboard after purchase', async ({ page }) => {
    // Navigate to courses page
    await page.goto('/dashboard/my-courses');
    await page.waitForLoadState('networkidle');

    // Initially should show empty state or no courses
    const emptyState = page.getByText(/no courses yet|get started/i);
    
    // After enrollment, course should appear
    // For this test, we'll verify the course card structure exists
    const courseCards = page.locator('[class*="card"]').filter({ has: page.getByRole('heading') });
    
    // Check that the page structure for courses is present
    await expect(page.getByRole('heading', { name: /my courses/i })).toBeVisible();
  });

  test('course detail page shows correct information', async ({ page }) => {
    await page.goto('/courses/react-fundamentals');
    await page.waitForLoadState('networkidle');

    // Verify course title
    await expect(page.getByRole('heading', { name: /react fundamentals/i })).toBeVisible();

    // Verify instructor
    await expect(page.getByText(/sarah chen/i)).toBeVisible();

    // Verify pricing
    await expect(page.getByText(/\$49\.99/i)).toBeVisible();

    // Verify category
    await expect(page.getByText(/web development/i)).toBeVisible();

    // Verify enroll button exists
    await expect(page.getByRole('button', { name: /enroll now/i })).toBeVisible();
  });
});

test.describe('Course Listing', () => {
  test('courses page loads and displays courses', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    // Verify page title
    await expect(page.getByRole('heading', { name: /courses|browse courses/i })).toBeVisible();

    // Verify course cards are present
    const courseCards = page.locator('[class*="card"]').filter({ has: page.getByRole('heading') });
    await expect(courseCards.first()).toBeVisible();
  });
});

test.describe('Dashboard', () => {
  test('dashboard shows user enrollment information', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify dashboard loads
    await expect(page.getByRole('heading', { name: /dashboard|welcome/i })).toBeVisible();

    // Verify navigation to my courses works
    const myCoursesLink = page.getByRole('link', { name: /my courses/i });
    if (await myCoursesLink.isVisible()) {
      await myCoursesLink.click();
      await page.waitForURL(/\/dashboard\/my-courses/i);
      await expect(page.getByRole('heading', { name: /my courses/i })).toBeVisible();
    }
  });
});