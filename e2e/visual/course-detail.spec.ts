import { test, expect, type ViewportSize } from '@playwright/test';

interface CourseLesson {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  type: string;
  videoUrl: string | null;
  videoDuration: number | null;
  content: string | null;
  resourceUrl: string | null;
  position: number;
  isFree: boolean;
}

interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  position: number;
  lessons: CourseLesson[];
}

interface CourseDetailMock {
  id: string;
  instructorAddress: string;
  title: string;
  description: string | null;
  category: string;
  level: string;
  language: string;
  thumbnailUrl: string | null;
  previewVideoUrl: string | null;
  price: number;
  platformFeePercent: number;
  status: string;
  totalLessons: number;
  totalDuration: number;
  totalEnrollments: number;
  totalRevenue: number;
  txHash: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  instructor: {
    name: string | null;
    stellarAddress: string;
    avatarUrl: string | null;
    bio?: string | null;
  };
  modules: CourseModule[];
  _count: { enrollments: number };
  rating?: number;
  reviewCount?: number;
  originalPrice?: number;
  badge?: string;
}

test.describe('Course Detail Visual Regression @visual', () => {
  const viewports: Record<string, ViewportSize> = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 800 },
  };

  const mockCourseDetail: CourseDetailMock = {
    id: 'course-react-fundamentals',
    instructorAddress: 'GABC123...',
    title: 'React Fundamentals for Beginners',
    description:
      'Learn React from the ground up. Build real projects with components, hooks, and state management. Perfect for junior developers transitioning from vanilla JavaScript.',
    category: 'Web Development',
    level: 'Beginner',
    language: 'English',
    thumbnailUrl: null,
    previewVideoUrl: null,
    price: 49.99,
    platformFeePercent: 10,
    status: 'ACTIVE',
    totalLessons: 24,
    totalDuration: 10800,
    totalEnrollments: 342,
    totalRevenue: 17116.58,
    txHash: 'abc123',
    approvedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    instructor: {
      name: 'Sarah Chen',
      stellarAddress: 'GABC123...',
      avatarUrl: null,
      bio: 'Senior Frontend Engineer with 8+ years building React applications at scale.',
    },
    modules: [
      {
        id: 'mod-1',
        courseId: 'course-react-fundamentals',
        title: 'Introduction to React',
        position: 1,
        lessons: [
          {
            id: 'lesson-1',
            moduleId: 'mod-1',
            title: 'Welcome & Course Overview',
            description: null,
            type: 'VIDEO',
            videoUrl: null,
            videoDuration: 320,
            content: null,
            resourceUrl: null,
            position: 1,
            isFree: true,
          },
          {
            id: 'lesson-2',
            moduleId: 'mod-1',
            title: 'Setting Up Your Environment',
            description: null,
            type: 'VIDEO',
            videoUrl: null,
            videoDuration: 540,
            content: null,
            resourceUrl: null,
            position: 2,
            isFree: false,
          },
        ],
      },
      {
        id: 'mod-2',
        courseId: 'course-react-fundamentals',
        title: 'Components & Props',
        position: 2,
        lessons: [
          {
            id: 'lesson-3',
            moduleId: 'mod-2',
            title: 'Understanding Components',
            description: null,
            type: 'VIDEO',
            videoUrl: null,
            videoDuration: 720,
            content: null,
            resourceUrl: null,
            position: 1,
            isFree: false,
          },
          {
            id: 'lesson-4',
            moduleId: 'mod-2',
            title: 'Working with Props',
            description: null,
            type: 'TEXT',
            videoUrl: null,
            videoDuration: null,
            content: 'Props are read-only inputs passed to components...',
            resourceUrl: null,
            position: 2,
            isFree: false,
          },
        ],
      },
    ],
    _count: { enrollments: 342 },
    rating: 4.8,
    reviewCount: 127,
    originalPrice: 99.99,
    badge: 'bestseller',
  };

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/courses/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockCourseDetail,
        }),
      });
    });

    await page.route('**/api/v1/courses/categories*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { name: 'Web Development', count: 12 },
            { name: 'Tailoring', count: 8 },
            { name: 'Makeup Artistry', count: 6 },
            { name: 'Baking', count: 5 },
            { name: 'Photography', count: 9 },
            { name: 'Graphic Design', count: 7 },
            { name: 'Hair Styling', count: 4 },
            { name: 'Catering', count: 3 },
          ],
        }),
      });
    });
  });

  for (const [viewportName, viewportSize] of Object.entries(viewports)) {
    test(`course detail page renders correctly at ${viewportName} viewport (${viewportSize.width}x${viewportSize.height})`, async ({
      page,
    }) => {
      await page.setViewportSize(viewportSize);

      await page.goto('/courses/react-fundamentals');
      await page.waitForLoadState('networkidle');

      await page.waitForSelector('h1', { state: 'visible', timeout: 10000 }).catch(() => {});
      await page
        .waitForSelector('[class*="breadcrumb"]', { state: 'visible', timeout: 10000 })
        .catch(() => {});

      await page.waitForTimeout(1500);

      const suffix = `${viewportName}-${viewportSize.width}x${viewportSize.height}`;
      await expect(page).toHaveScreenshot(`course-detail-${suffix}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
});
