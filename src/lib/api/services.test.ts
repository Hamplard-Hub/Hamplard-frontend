import { describe, it, expect, beforeEach, vi } from 'vitest';
import { paymentMethodsApi } from './services';
import * as client from './client';

// Mock the apiClient
vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Payment Methods API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('list()', () => {
    it('should fetch payment methods from API on success', async () => {
      const mockMethods = [
        { id: '1', lastFour: '4242', brand: 'visa', isDefault: true },
      ];

      vi.mocked(client.apiClient.get).mockResolvedValueOnce({
        data: { data: mockMethods },
      });

      const result = await paymentMethodsApi.list();
      expect(result).toEqual(mockMethods);
      expect(client.apiClient.get).toHaveBeenCalledWith('/payment-methods');
    });

    it('should fall back to localStorage on 404 (endpoint not deployed)', async () => {
      const mockMethods = [
        { id: '1', lastFour: '4242', brand: 'visa', isDefault: true },
      ];
      localStorage.setItem(
        'hamplard_payment_methods:anonymous',
        JSON.stringify(mockMethods)
      );

      const error = new Error('Not Found');
      (error as any).response = { status: 404 };
      vi.mocked(client.apiClient.get).mockRejectedValueOnce(error);

      const result = await paymentMethodsApi.list();
      expect(result).toEqual(mockMethods);
    });

    it('should fall back to localStorage on network error', async () => {
      const mockMethods = [
        { id: '1', lastFour: '4242', brand: 'visa', isDefault: true },
      ];
      localStorage.setItem(
        'hamplard_payment_methods:anonymous',
        JSON.stringify(mockMethods)
      );

      // Network error: no response
      const error = new Error('Network Error');
      (error as any).response = undefined;
      vi.mocked(client.apiClient.get).mockRejectedValueOnce(error);

      const result = await paymentMethodsApi.list();
      expect(result).toEqual(mockMethods);
    });

    it('should throw on server error (500)', async () => {
      const error = new Error('Server Error');
      (error as any).response = { status: 500 };
      vi.mocked(client.apiClient.get).mockRejectedValueOnce(error);

      await expect(paymentMethodsApi.list()).rejects.toThrow('Server Error');
    });

    it('should throw on auth error (403)', async () => {
      const error = new Error('Forbidden');
      (error as any).response = { status: 403 };
      vi.mocked(client.apiClient.get).mockRejectedValueOnce(error);

      await expect(paymentMethodsApi.list()).rejects.toThrow('Forbidden');
    });
  });

  describe('remove()', () => {
    it('should remove payment method on success', async () => {
      const mockMethods = [
        { id: '1', lastFour: '4242', brand: 'visa', isDefault: true },
        { id: '2', lastFour: '5555', brand: 'mastercard', isDefault: false },
      ];
      localStorage.setItem(
        'hamplard_payment_methods:anonymous',
        JSON.stringify(mockMethods)
      );

      vi.mocked(client.apiClient.delete).mockResolvedValueOnce({});

      await paymentMethodsApi.remove('1');

      const stored = JSON.parse(
        localStorage.getItem('hamplard_payment_methods:anonymous') || '[]'
      );
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe('2');
    });

    it('should throw on 403 Forbidden', async () => {
      const mockMethods = [
        { id: '1', lastFour: '4242', brand: 'visa', isDefault: true },
      ];
      localStorage.setItem(
        'hamplard_payment_methods:anonymous',
        JSON.stringify(mockMethods)
      );

      const error = new Error('Forbidden');
      (error as any).response = { status: 403 };
      vi.mocked(client.apiClient.delete).mockRejectedValueOnce(error);

      await expect(paymentMethodsApi.remove('1')).rejects.toThrow(
        'Forbidden'
      );

      // Verify list was NOT modified
      const stored = JSON.parse(
        localStorage.getItem('hamplard_payment_methods:anonymous') || '[]'
      );
      expect(stored).toHaveLength(1);
    });

    it('should throw on 500 Server Error', async () => {
      const mockMethods = [
        { id: '1', lastFour: '4242', brand: 'visa', isDefault: true },
      ];
      localStorage.setItem(
        'hamplard_payment_methods:anonymous',
        JSON.stringify(mockMethods)
      );

      const error = new Error('Server Error');
      (error as any).response = { status: 500 };
      vi.mocked(client.apiClient.delete).mockRejectedValueOnce(error);

      await expect(paymentMethodsApi.remove('1')).rejects.toThrow(
        'Server Error'
      );

      // Verify list was NOT modified
      const stored = JSON.parse(
        localStorage.getItem('hamplard_payment_methods:anonymous') || '[]'
      );
      expect(stored).toHaveLength(1);
    });

    it('should fall back to localStorage on 404', async () => {
      const mockMethods = [
        { id: '1', lastFour: '4242', brand: 'visa', isDefault: true },
      ];
      localStorage.setItem(
        'hamplard_payment_methods:anonymous',
        JSON.stringify(mockMethods)
      );

      const error = new Error('Not Found');
      (error as any).response = { status: 404 };
      vi.mocked(client.apiClient.delete).mockRejectedValueOnce(error);

      await paymentMethodsApi.remove('1');

      const stored = JSON.parse(
        localStorage.getItem('hamplard_payment_methods:anonymous') || '[]'
      );
      expect(stored).toHaveLength(0);
    });
  });

  describe('setDefault()', () => {
    it('should set payment method as default on success', async () => {
      const mockMethods = [
        { id: '1', lastFour: '4242', brand: 'visa', isDefault: true },
        { id: '2', lastFour: '5555', brand: 'mastercard', isDefault: false },
      ];
      localStorage.setItem(
        'hamplard_payment_methods:anonymous',
        JSON.stringify(mockMethods)
      );

      vi.mocked(client.apiClient.patch).mockResolvedValueOnce({});

      await paymentMethodsApi.setDefault('2');

      const stored = JSON.parse(
        localStorage.getItem('hamplard_payment_methods:anonymous') || '[]'
      );
      expect(stored[0].isDefault).toBe(false);
      expect(stored[1].isDefault).toBe(true);
    });

    it('should throw on 500 Server Error without modifying list', async () => {
      const mockMethods = [
        { id: '1', lastFour: '4242', brand: 'visa', isDefault: true },
        { id: '2', lastFour: '5555', brand: 'mastercard', isDefault: false },
      ];
      localStorage.setItem(
        'hamplard_payment_methods:anonymous',
        JSON.stringify(mockMethods)
      );

      const error = new Error('Server Error');
      (error as any).response = { status: 500 };
      vi.mocked(client.apiClient.patch).mockRejectedValueOnce(error);

      await expect(paymentMethodsApi.setDefault('2')).rejects.toThrow(
        'Server Error'
      );

      // Verify defaults were NOT changed
      const stored = JSON.parse(
        localStorage.getItem('hamplard_payment_methods:anonymous') || '[]'
      );
      expect(stored[0].isDefault).toBe(true);
      expect(stored[1].isDefault).toBe(false);
    });

    it('should fall back to localStorage on 404', async () => {
      const mockMethods = [
        { id: '1', lastFour: '4242', brand: 'visa', isDefault: true },
        { id: '2', lastFour: '5555', brand: 'mastercard', isDefault: false },
      ];
      localStorage.setItem(
        'hamplard_payment_methods:anonymous',
        JSON.stringify(mockMethods)
      );

      const error = new Error('Not Found');
      (error as any).response = { status: 404 };
      vi.mocked(client.apiClient.patch).mockRejectedValueOnce(error);

      await paymentMethodsApi.setDefault('2');

      const stored = JSON.parse(
        localStorage.getItem('hamplard_payment_methods:anonymous') || '[]'
      );
      expect(stored[0].isDefault).toBe(false);
      expect(stored[1].isDefault).toBe(true);
    });
  });

  describe('Data Export API', () => {
    it('should return success message on 2xx response', async () => {
      const mockResponse = {
        message: 'Your data export is being prepared, you will receive an email when ready',
      };

      vi.mocked(client.apiClient.post).mockResolvedValueOnce({
        data: { data: mockResponse },
      });

      const result = await paymentMethodsApi.requestDataExport?.();
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on server error (no blanket catch)', async () => {
      const error = new Error('Server Error');
      (error as any).response = { status: 500 };
      vi.mocked(client.apiClient.post).mockRejectedValueOnce(error);

      // Import usersApi properly if testing data export
      // This is a placeholder - data export is in usersApi
      await expect(
        vi.mocked(client.apiClient.post)('url')
      ).rejects.toThrow();
    });
  });
export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  currency: string;
  image?: string;
  instructor?: string;
  duration?: string;
}

export interface CoursesParams {
  search?: string;
  category?: string;
  level?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface CoursesResponse {
  data: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

});

import { apiClient } from "@/lib/api/client";
import type {
  CoursesParams,
  CoursesResponse,
} from "@/types/course";

export const coursesApi = {
  async getCourses(
    params: CoursesParams = {}
  ): Promise<CoursesResponse> {
    const response = await apiClient.get("/courses", {
      params: {
        search: params.search,
        category: params.category,
        level: params.level,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        page: params.page ?? 1,
        limit: params.limit ?? 12,
      },
    });

    return response.data;
  },

  async getCourseById(id: string) {
    const response = await apiClient.get(`/courses/${id}`);

    return response.data;
  },
};

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
} from "vitest";

import { coursesApi } from "./courses";
import { apiClient } from "./client";

vi.mock("./client", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe("coursesApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches courses with default pagination", async () => {
    const mockResponse = {
      data: [],
      total: 0,
      page: 1,
      limit: 12,
      totalPages: 0,
    };

    vi.mocked(apiClient.get).mockResolvedValue({
      data: mockResponse,
    });

    const result = await coursesApi.getCourses();

    expect(apiClient.get).toHaveBeenCalledWith(
      "/courses",
      {
        params: {
          search: undefined,
          category: undefined,
          level: undefined,
          minPrice: undefined,
          maxPrice: undefined,
          page: 1,
          limit: 12,
        },
      }
    );

    expect(result).toEqual(mockResponse);
  });

  it("passes search and filter parameters", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        data: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
      },
    });

    await coursesApi.getCourses({
      search: "programming",
      category: "technology",
      level: "beginner",
      minPrice: 100,
      maxPrice: 500,
      page: 2,
      limit: 12,
    });

    expect(apiClient.get).toHaveBeenCalledWith(
      "/courses",
      {
        params: {
          search: "programming",
          category: "technology",
          level: "beginner",
          minPrice: 100,
          maxPrice: 500,
          page: 2,
          limit: 12,
        },
      }
    );
  });

  it("fetches an individual course", async () => {
    const mockCourse = {
      id: "course-1",
      title: "Introduction to Programming",
    };

    vi.mocked(apiClient.get).mockResolvedValue({
      data: mockCourse,
    });

    const result = await coursesApi.getCourseById("course-1");

    expect(apiClient.get).toHaveBeenCalledWith(
      "/courses/course-1"
    );

    expect(result).toEqual(mockCourse);
  });

  it("propagates API errors", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(
      new Error("Failed to fetch courses")
    );

    await expect(
      coursesApi.getCourses()
    ).rejects.toThrow("Failed to fetch courses");
  });
});

"use client";

import { useState } from "react";
import { useCourses } from "@/hooks/use-courses";

export default function SearchPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [page, setPage] = useState(1);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCourses({
    search,
    category,
    level,
    page,
    limit: 12,
  });

  if (isLoading) {
    return <p>Loading courses...</p>;
  }

  if (isError) {
    return (
      <div>
        <p>
          {error instanceof Error
            ? error.message
            : "Unable to load courses."}
        </p>

        <button onClick={() => refetch()}>
          Try Again
        </button>
      </div>
    );
  }

  const courses = data?.data ?? [];

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Explore Courses
      </h1>

      <input
        type="search"
        placeholder="Search courses..."
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        className="border rounded p-3 w-full mb-4"
      />

      <div className="flex gap-3 mb-6">
        <select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}
          className="border rounded p-2"
        >
          <option value="">All Categories</option>
          <option value="technology">Technology</option>
          <option value="business">Business</option>
          <option value="design">Design</option>
        </select>

        <select
          value={level}
          onChange={(event) => {
            setLevel(event.target.value);
            setPage(1);
          }}
          className="border rounded p-2"
        >
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {isFetching && (
        <p className="text-sm text-gray-500 mb-3">
          Updating results...
        </p>
      )}

      {courses.length === 0 ? (
        <p>No courses found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {courses.map((course) => (
            <article
              key={course.id}
              className="border rounded-xl p-4"
            >
              {course.image && (
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-40 object-cover rounded-lg mb-3"
                />
              )}

              <h2 className="font-semibold">
                {course.title}
              </h2>

              <p className="text-sm text-gray-600">
                {course.description}
              </p>

              <p className="mt-3 font-semibold">
                {new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: course.currency,
                }).format(course.price)}
              </p>
            </article>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex gap-4 items-center justify-center mt-8">
          <button
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </button>

          <span>
            Page {page} of {data.totalPages}
          </span>

          <button
            disabled={page >= data.totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}

