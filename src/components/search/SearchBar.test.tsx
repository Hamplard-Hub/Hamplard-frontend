import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchBar } from "./SearchBar";
import type { Course } from "@/types";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  store: {
    query: "",
    setQuery: vi.fn(),
    recentSearches: [] as Array<{ query: string; timestamp: number }>,
    savedSearches: [] as Array<{
      id: string;
      query: string;
      name: string;
      timestamp: number;
    }>,
    addRecentSearch: vi.fn(),
    clearHistory: vi.fn(),
    saveSearch: vi.fn(),
    removeSavedSearch: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/lib/hooks/use-search-store", () => ({
  useSearchStore: () => mocks.store,
}));

const course: Course = {
  id: "course-baking",
  instructorAddress: "instructor-address",
  title: "Baking Bread at Home",
  description: null,
  category: "Baking",
  level: "Beginner",
  language: "English",
  thumbnailUrl: null,
  previewVideoUrl: null,
  price: 20,
  platformFeePercent: 10,
  status: "ACTIVE",
  totalLessons: 1,
  totalDuration: 60,
  totalEnrollments: 0,
  totalRevenue: 0,
  txHash: null,
  approvedAt: null,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
  instructor: { name: "Baker Instructor" },
  modules: [],
  _count: { enrollments: 0 },
};

describe("SearchBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.store.query = "";
    mocks.store.recentSearches = [];
    mocks.store.savedSearches = [];
  });

  it("shows matching category and course suggestions", async () => {
    const user = userEvent.setup();
    render(<SearchBar courses={[course]} />);

    await user.type(screen.getByRole("combobox"), "baking");

    expect(
      screen.getByText("Baking", { selector: "span" }),
    ).toBeInTheDocument();
    expect(screen.getByText(course.title)).toBeInTheDocument();
    expect(screen.getByText("Course")).toBeInTheDocument();
  });

  it("moves through suggestions with arrow keys and selects the highlighted result", async () => {
    const user = userEvent.setup();
    render(<SearchBar courses={[course]} />);
    const input = screen.getByRole("combobox");

    await user.type(input, "baking");
    await user.keyboard("{ArrowDown}{ArrowDown}");

    expect(
      screen.getByRole("option", { name: /baking bread at home/i }),
    ).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Enter}");

    expect(mocks.push).toHaveBeenCalledWith("/dashboard/courses/course-baking");
  });

  it("selects a recent search and records it again", async () => {
    const user = userEvent.setup();
    mocks.store.recentSearches = [{ query: "bread making", timestamp: 1 }];
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("button", { name: "bread making" }));

    expect(onSearch).toHaveBeenCalledWith("bread making");
    expect(mocks.store.setQuery).toHaveBeenCalledWith("bread making");
    expect(mocks.store.addRecentSearch).toHaveBeenCalledTimes(1);
    expect(mocks.push).toHaveBeenCalledWith("/search?q=bread%20making");
  });

  it("clears recent search history from the empty-query dropdown", async () => {
    const user = userEvent.setup();
    mocks.store.recentSearches = [{ query: "bread making", timestamp: 1 }];
    render(<SearchBar />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("button", { name: /clear history/i }));

    expect(mocks.store.clearHistory).toHaveBeenCalledTimes(1);
  });

  it("selects a saved search and removes it by its id", async () => {
    const user = userEvent.setup();
    mocks.store.savedSearches = [
      { id: "saved-1", query: "sourdough", name: "Sourdough", timestamp: 1 },
    ];
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("button", { name: "sourdough" }));

    expect(onSearch).toHaveBeenCalledWith("sourdough");
    expect(mocks.store.addRecentSearch).toHaveBeenCalledTimes(1);
    expect(mocks.push).toHaveBeenCalledWith("/search?q=sourdough");

    await user.click(screen.getByRole("button", { name: /clear search/i }));
    await user.click(screen.getByRole("combobox"));
    await user.click(
      screen.getByRole("button", { name: "Remove saved search sourdough" }),
    );

    expect(mocks.store.removeSavedSearch).toHaveBeenCalledWith("saved-1");
  });

  it("saves the current non-empty query", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    const input = screen.getByRole("combobox");

    await user.type(input, "baking");
    await user.click(screen.getByRole("button", { name: /save this search/i }));

    expect(mocks.store.saveSearch).toHaveBeenCalledWith("baking");
  });
});
