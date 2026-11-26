import { test, expect, type ViewportSize } from '@playwright/test';

test.describe('Learn Page Visual Regression @visual', () => {
  const viewports: Record<string, ViewportSize> = {
    mobile: { width: 375, height: 667 },
    desktop: { width: 1280, height: 800 },
  };

  const COURSE_ID = 'visual-learn-test-course';
  const LESSON_ID = 'lesson-1';

  test.beforeEach(async ({ page }) => {
    // Mock user profile/session
    await page.route('**/api/v1/users/profile**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            stellarAddress: 'GTESTSTUDENT1234567890',
            name: 'Alex Johnson',
            role: 'STUDENT',
          },
        }),
      });
    });

    // Mock course data
    await page.route(`**/api/v1/courses/${COURSE_ID}**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: COURSE_ID,
            title: 'Modern Tailoring Mastery',
            description: 'Learn modern cutting, styling and precision stitch work.',
            category: 'Tailoring',
            instructor: {
              name: 'Master Tailor Jude',
              stellarAddress: 'GTESTINSTRUCTOR123',
            },
            modules: [
              {
                id: 'mod-1',
                title: 'Module 1: Introduction to Measurements',
                position: 1,
                lessons: [
                  {
                    id: LESSON_ID,
                    title: 'Taking Accurate Body Measurements',
                    type: 'VIDEO',
                    videoDuration: 300,
                    position: 1,
                    isFree: true,
                  },
                  {
                    id: 'lesson-2',
                    title: 'Fabric Grainline and Cutting Rules',
                    type: 'TEXT',
                    position: 2,
                    isFree: false,
                  },
                ],
              },
            ],
          },
        }),
      });
    });

    // Mock enrollment data
    await page.route(`**/api/v1/enrollments**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'enrollment-123',
            courseId: COURSE_ID,
            progress: 50,
            completedLessons: [LESSON_ID],
          },
        }),
      });
    });
  });

  for (const [viewportName, viewportSize] of Object.entries(viewports)) {
    test(`renders learn page layout cleanly on ${viewportName}`, async ({ page }) => {
      await page.setViewportSize(viewportSize);

      await page.goto(`/dashboard/courses/${COURSE_ID}/learn`, {
        waitUntil: 'networkidle',
      });

      // Assert basic layout elements
      await expect(page.locator('body')).toBeVisible();

      // Take visual regression screenshot
      await expect(page).toHaveScreenshot(`learn-page-${viewportName}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    });
  }
});
