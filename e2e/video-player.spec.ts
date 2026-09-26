import { expect, test, type Page } from "@playwright/test";

const COURSE_ID = "video-player-e2e";
const ENROLLMENT_ID = "enrollment-video-e2e";
const FIRST_LESSON_ID = "lesson-introduction";
const SECOND_LESSON_ID = "lesson-advanced-playback";
const TEST_VIDEO_URL =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm";

const course = {
  id: COURSE_ID,
  instructorAddress: "GTESTINSTRUCTOR",
  title: "Video Production Essentials",
  description: "A deterministic course fixture for video-player E2E tests.",
  category: "Creative Arts",
  level: "BEGINNER",
  language: "English",
  thumbnailUrl: null,
  previewVideoUrl: TEST_VIDEO_URL,
  price: 0,
  platformFeePercent: 0,
  status: "ACTIVE",
  totalLessons: 2,
  totalDuration: 240,
  totalEnrollments: 1,
  totalRevenue: 0,
  txHash: null,
  approvedAt: null,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
  instructor: {
    name: "Test Instructor",
    stellarAddress: "GTESTINSTRUCTOR",
    avatarUrl: null,
  },
  modules: [
    {
      id: "module-video-basics",
      courseId: COURSE_ID,
      title: "Video Basics",
      position: 1,
      lessons: [
        {
          id: FIRST_LESSON_ID,
          moduleId: "module-video-basics",
          title: "Introduction to Playback",
          description: "Learn the video-player controls.",
          type: "VIDEO",
          videoUrl: TEST_VIDEO_URL,
          videoDuration: 120,
          content: null,
          resourceUrl: null,
          position: 1,
          isFree: true,
        },
        {
          id: SECOND_LESSON_ID,
          moduleId: "module-video-basics",
          title: "Advanced Playback",
          description: "Continue with advanced playback controls.",
          type: "VIDEO",
          videoUrl: TEST_VIDEO_URL,
          videoDuration: 120,
          content: null,
          resourceUrl: null,
          position: 2,
          isFree: true,
        },
      ],
    },
  ],
  _count: { enrollments: 1 },
};

const enrollment = {
  id: ENROLLMENT_ID,
  studentId: "student-video-e2e",
  courseId: COURSE_ID,
  amountPaid: 0,
  txHash: null,
  status: "ACTIVE",
  progressPercent: 0,
  completedAt: null,
  enrolledAt: "2026-08-01T00:00:00.000Z",
  course,
  lessonProgress: [],
};

async function installDeterministicMedia(page: Page) {
  await page.addInitScript(() => {
    type MediaState = {
      currentTime: number;
      duration: number;
      interval?: ReturnType<typeof setInterval>;
      paused: boolean;
      playbackRate: number;
    };

    const states = new WeakMap<HTMLMediaElement, MediaState>();
    const stateFor = (media: HTMLMediaElement) => {
      let state = states.get(media);
      if (!state) {
        state = {
          currentTime: 0,
          duration: 120,
          paused: true,
          playbackRate: 1,
        };
        states.set(media, state);
      }
      return state;
    };

    Object.defineProperties(HTMLMediaElement.prototype, {
      currentTime: {
        configurable: true,
        get() {
          return stateFor(this).currentTime;
        },
        set(value: number) {
          const state = stateFor(this);
          state.currentTime = Math.max(
            0,
            Math.min(Number(value), state.duration),
          );
          this.dispatchEvent(new Event("timeupdate"));
        },
      },
      duration: {
        configurable: true,
        get() {
          return stateFor(this).duration;
        },
      },
      paused: {
        configurable: true,
        get() {
          return stateFor(this).paused;
        },
      },
      playbackRate: {
        configurable: true,
        get() {
          return stateFor(this).playbackRate;
        },
        set(value: number) {
          stateFor(this).playbackRate = Number(value);
          this.dispatchEvent(new Event("ratechange"));
        },
      },
    });

    HTMLMediaElement.prototype.play = function play() {
      const state = stateFor(this);
      state.paused = false;
      this.dispatchEvent(new Event("play"));
      this.dispatchEvent(new Event("playing"));

      if (state.interval) clearInterval(state.interval);
      state.interval = setInterval(() => {
        if (state.paused) return;
        state.currentTime = Math.min(
          state.duration,
          state.currentTime + 0.1 * state.playbackRate,
        );
        this.dispatchEvent(new Event("timeupdate"));
      }, 100);

      return Promise.resolve();
    };

    HTMLMediaElement.prototype.pause = function pause() {
      const state = stateFor(this);
      state.paused = true;
      if (state.interval) clearInterval(state.interval);
      this.dispatchEvent(new Event("pause"));
    };
  });
}

async function mockLearningApis(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (request.method() === "GET" && path === `/api/v1/courses/${COURSE_ID}`) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: course }),
      });
      return;
    }

    if (
      request.method() === "GET" &&
      path === `/api/v1/enrollments/${COURSE_ID}`
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: enrollment }),
      });
      return;
    }

    if (request.method() === "PATCH" && path.endsWith("/progress")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: null }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          data: [],
          meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
        },
      }),
    });
  });
}

async function openPlayer(page: Page) {
  await page.goto(`/dashboard/courses/${COURSE_ID}/learn`);

  const player = page.getByRole("region", { name: "Video player" });
  await expect(player).toBeVisible();

  await player.locator("video").evaluate((video) => {
    video.dispatchEvent(new Event("loadedmetadata"));
  });

  return player;
}

test.describe("Video player", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: "hamplard_token",
        value: "video-player-e2e-token",
        url: "http://localhost:3001",
      },
    ]);
    await page.addInitScript(() => {
      window.localStorage.setItem("hamplard_token", "video-player-e2e-token");
      window.localStorage.setItem("hamplard_address", "GTESTSTUDENT");
      window.localStorage.setItem("cookie-consent", "accepted");
    });
    await installDeterministicMedia(page);
    await mockLearningApis(page);
  });

  test("plays and pauses from the custom controls", async ({ page }) => {
    const player = await openPlayer(page);
    const video = player.locator("video");

    await player.getByRole("button", { name: "Play", exact: true }).click();
    await expect(
      player.getByRole("button", { name: "Pause", exact: true }),
    ).toBeVisible();
    await expect
      .poll(() => video.evaluate((element) => element.currentTime))
      .toBeGreaterThan(0);
    expect(await video.evaluate((element) => element.paused)).toBe(false);

    await player.getByRole("button", { name: "Pause", exact: true }).click();
    await expect(
      player.getByRole("button", { name: "Play", exact: true }),
    ).toBeVisible();
    expect(await video.evaluate((element) => element.paused)).toBe(true);
  });

  test("seeking updates the video current time", async ({ page }) => {
    const player = await openPlayer(page);
    const seek = player.getByRole("slider", { name: "Seek" });

    await seek.fill("42");

    await expect
      .poll(() =>
        player.locator("video").evaluate((video) => video.currentTime),
      )
      .toBe(42);
    await expect(player.getByText("0:42 / 2:00")).toBeVisible();
  });

  test("changes playback speed to 1.5x and advances at that rate", async ({
    page,
  }) => {
    const player = await openPlayer(page);
    const video = player.locator("video");
    const speed = player.getByRole("combobox", { name: "Playback speed" });

    await speed.selectOption("1.5");
    expect(await video.evaluate((element) => element.playbackRate)).toBe(1.5);

    const before = await video.evaluate((element) => element.currentTime);
    await player.getByRole("button", { name: "Play", exact: true }).click();
    await page.waitForTimeout(500);
    const after = await video.evaluate((element) => element.currentTime);

    expect(after - before).toBeGreaterThan(0.3);
  });

  test("saves progress through the API when paused", async ({ page }) => {
    const player = await openPlayer(page);
    const video = player.locator("video");

    await video.evaluate((element) => {
      element.currentTime = 27;
    });
    await player.getByRole("button", { name: "Play", exact: true }).click();

    const progressRequest = page.waitForRequest(
      (request) =>
        request.method() === "PATCH" &&
        new URL(request.url()).pathname ===
          `/api/v1/lessons/${FIRST_LESSON_ID}/progress`,
    );

    await player.getByRole("button", { name: "Pause", exact: true }).click();
    const request = await progressRequest;

    expect(request.postDataJSON()).toEqual({
      enrollmentId: ENROLLMENT_ID,
      watchedSecs: 27,
    });
  });

  test("selecting the next lecture updates the URL and active lesson", async ({
    page,
  }) => {
    await openPlayer(page);

    await page.getByRole("button", { name: /Advanced Playback/ }).click();

    await expect(page).toHaveURL(
      `/dashboard/courses/${COURSE_ID}/learn?lesson=${SECOND_LESSON_ID}`,
    );
    await expect(
      page.getByRole("heading", { name: "Advanced Playback", exact: true }),
    ).toBeVisible();
  });
});
