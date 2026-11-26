import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page, type Route } from '@playwright/test';
import { mockCourses } from './fixtures/course';

/**
 * Serious and critical axe violations fail the build; lower-impact findings
 * are attached to the test report for triage.
 */
async function expectNoSeriousA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  await test.info().attach('axe-results.json', {
    body: JSON.stringify(results.violations, null, 2),
    contentType: 'application/json',
  });

  const blocking = results.violations.filter(
    (violation) =>
      violation.impact === 'serious' || violation.impact === 'critical',
  );

  expect(
    blocking.map(
      (violation) =>
        `${violation.impact}: ${violation.id} — ${violation.help} (${violation.nodes.length} nodes)`,
    ),
  ).toEqual([]);
}

async function fulfillJson(route: Route, data: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data }),
  });
}

const course = {
  id: 'course-react-fundamentals',
  title: 'React Fundamentals for Beginners',
  slug: 'react-fundamentals',
  description: 'Learn React from scratch.',
  category: 'Web Development',
  level: 'BEGINNER',
  status: 'ACTIVE',
  price: 49.99,
  thumbnailUrl: null,
  totalLessons: 1,
  instructor: { name: 'Sarah Chen', avatarUrl: null },
  modules: [
    {
      id: 'module-1',
      title: 'Getting started',
      position: 1,
      lessons: [
        {
          id: 'lesson-1',
          title: 'Introduction',
          type: 'TEXT',
          content: '<p>Welcome to the course.</p>',
          position: 1,
          isFree: true,
        },
      ],
    },
  ],
};

test.describe('Accessibility @a11y', () => {
  test('homepage has no serious axe violations', async ({ page }) => {
    await page.route('**/api/v1/courses**', async (route) => {
      const courses = Object.values(mockCourses);
      await fulfillJson(route, { courses, total: courses.length, page: 1, limit: 10 });
    });
    await page.route('**/api/v1/categories**', async (route) => fulfillJson(route, []));
    await page.route('**/api/v1/bundles**', async (route) => fulfillJson(route, []));

    await page.goto('/');
    await page.locator('h1').first().waitFor({ timeout: 15000 });
    await expectNoSeriousA11yViolations(page);
  });

  test('course detail page has no serious axe violations', async ({ page }) => {
    await page.route('**/api/v1/courses/**', async (route) => fulfillJson(route, course));

    await page.goto(`/courses/${course.slug}`);
    await page.locator('h1').first().waitFor({ timeout: 15000 });
    await expectNoSeriousA11yViolations(page);
  });

  test('learn page has no serious axe violations', async ({ page }) => {
    await page.route('**/api/v1/courses/**', async (route) => fulfillJson(route, course));
    await page.route('**/api/v1/enrollments/**', async (route) =>
      fulfillJson(route, {
        id: 'enrollment-a11y',
        courseId: course.id,
        status: 'ACTIVE',
        progressPercent: 0,
        lessonProgress: [],
        course,
      }),
    );

    await page.goto(`/dashboard/courses/${course.id}/learn`);
    await page.getByText('Course content').first().waitFor({ timeout: 15000 });
    await expectNoSeriousA11yViolations(page);
  });

  test('checkout page has no serious axe violations', async ({ page }) => {
    await page.route('**/api/v1/cart/**', async (route) =>
      fulfillJson(route, { items: [], subtotal: 0, discount: 0, total: 0 }),
    );

    await page.goto('/checkout');
    await page.getByRole('navigation', { name: 'Checkout progress' }).waitFor({ timeout: 15000 });
    await expectNoSeriousA11yViolations(page);
  });
});
