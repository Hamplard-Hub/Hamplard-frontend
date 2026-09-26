import { test as base, type Page } from '@playwright/test';

// Course fixture types
export interface Course {
  id: string;
  title: string;
  slug: string;
  price: number;
  originalPrice: number;
  instructor: string;
  category: string;
}

export interface PromoCode {
  code: string;
  discountPercent: number;
  discountType: 'percentage' | 'fixed';
}

// Mock course data for tests
export const mockCourses: Record<string, Course> = {
  reactFundamentals: {
    id: 'course-react-fundamentals',
    title: 'React Fundamentals for Beginners',
    slug: 'react-fundamentals',
    price: 49.99,
    originalPrice: 99.99,
    instructor: 'Sarah Chen',
    category: 'Web Development',
  },
  advancedReact: {
    id: 'course-advanced-react',
    title: 'Advanced React Patterns and Best Practices',
    slug: 'advanced-react',
    price: 79.99,
    originalPrice: 129.99,
    instructor: 'John Doe',
    category: 'Web Development',
  },
  typescriptMastery: {
    id: 'course-ts-mastery',
    title: 'TypeScript Mastery: From Basics to Advanced',
    slug: 'typescript-mastery',
    price: 59.99,
    originalPrice: 89.99,
    instructor: 'Jane Smith',
    category: 'Web Development',
  },
};

export const mockPromoCodes: Record<string, PromoCode> = {
  WELCOME20: {
    code: 'WELCOME20',
    discountPercent: 20,
    discountType: 'percentage',
  },
  SAVE10: {
    code: 'SAVE10',
    discountPercent: 10,
    discountType: 'percentage',
  },
  FLAT25: {
    code: 'FLAT25',
    discountPercent: 25,
    discountType: 'fixed',
  },
};

// Create course fixture with shared helpers
export const courseFixture = base.extend<{
  course: Course;
  promoCode: PromoCode;
  navigateToCourse: (slug: string) => Promise<void>;
  applyPromoCode: (code: string) => Promise<void>;
}>({
  course: mockCourses.reactFundamentals,
  promoCode: mockPromoCodes.WELCOME20,
  
  navigateToCourse: async ({ page, baseURL }: { page: Page; baseURL: string | undefined }, use) => {
    const navigate = async (slug: string) => {
      await page.goto(`${baseURL}/courses/${slug}`);
      await page.waitForLoadState('networkidle');
    };
    await use(navigate);
  },
  
  applyPromoCode: async ({ page }: { page: Page }, use) => {
    const apply = async (code: string) => {
      const promoInput = page.getByPlaceholder(/promo code/i);
      if (await promoInput.isVisible()) {
        await promoInput.fill(code);
        const applyButton = page.getByRole('button', { name: /apply/i });
        await applyButton.click();
        await page.waitForTimeout(500);
      }
    };
    await use(apply);
  },
});

export { expect, type Locator } from '@playwright/test';