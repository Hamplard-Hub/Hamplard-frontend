import { expect, test, type Page } from "@playwright/test";

const e2eUser = {
  id: "e2e-user",
  name: "E2E Student",
  email: "e2e.student@example.test",
  role: "STUDENT",
  stellarAddress: "GTESTE2EUSER",
};

async function mockDashboardApis(page: Page, includeUser = false) {
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;

    if (includeUser && path.endsWith("/users/me")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: e2eUser }),
      });
      return;
    }

    if (path.endsWith("/enrollments/my") || path.endsWith("/courses")) {
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
      return;
    }

    if (path.endsWith("/notifications")) {
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
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: [] }),
    });
  });
}

test.describe("Authentication", () => {
  test("signing up successfully redirects to the dashboard", async ({
    page,
  }) => {
    await mockDashboardApis(page);
    await page.goto("/signup");

    await page.getByLabel("Full name").fill("E2E Student");
    await page.getByLabel("Email").fill("e2e.student@example.test");
    await page.getByLabel("Password", { exact: true }).fill("secure-password");
    await page.getByLabel("Confirm Password").fill("secure-password");
    await page
      .getByRole("checkbox", { name: /terms and privacy policy/i })
      .check();
    await page.getByRole("button", { name: "Signup" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: /welcome back, student/i }),
    ).toBeVisible();
  });

  test("invalid login credentials show an error without authenticating", async ({
    page,
  }) => {
    await page.route("**/api/v1/auth/email/login", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Invalid credentials",
        }),
      });
    });
    await page.goto("/login");

    await page.getByLabel("Email").fill("wrong@example.test");
    await page.getByLabel("Password", { exact: true }).fill("wrong-password");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page.getByRole("alert")).toHaveText("Invalid credentials");
    await expect(page).not.toHaveURL(/\/dashboard/);
    await expect(
      page.evaluate(() => localStorage.getItem("hamplard_token")),
    ).resolves.toBeNull();
  });

  test("signing out clears the session and shows the logged-out navigation", async ({
    page,
  }) => {
    await mockDashboardApis(page, true);
    await page.addInitScript(() => {
      localStorage.setItem("hamplard_token", "e2e-token");
      localStorage.setItem("hamplard_address", "GTESTE2EUSER");
      document.cookie = "hamplard_token=e2e-token; path=/";
    });
    await page.goto("/dashboard");

    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).click();

    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
    await expect(
      page.evaluate(() => localStorage.getItem("hamplard_token")),
    ).resolves.toBeNull();
    await expect(page.evaluate(() => document.cookie)).resolves.not.toContain(
      "hamplard_token=",
    );
  });
});
