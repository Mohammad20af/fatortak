import { test, expect } from "@playwright/test";
import { selectLanguage } from "./helpers/controls";

// These controls need only the frontend. API fixtures never read or change a database.
test.beforeEach(async ({ page }) => {
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const path = new URL(route.request().url()).pathname;
      const responses = {
        "/api/auth/csrf": { csrfToken: "header-controls-test" },
        "/api/users/me": {
          user: {
            id: "test-user",
            name: "Sam",
            email: "sam@example.test",
            accountType: "personal",
            preferredCurrency: "USD",
          },
        },
        "/api/currency/rates": { status: "unavailable", rate: null },
        "/api/expenses": { expenses: [], count: 0, page: 1, limit: 100 },
        "/api/expenses/summary": {
          month: 10,
          year: 2026,
          totalSpending: 0,
          budget: null,
          remaining: null,
          expenseCount: 0,
          byCategory: [],
          trend: [],
          valuation: { complete: true, currency: "USD" },
        },
      };
      await route.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": "http://localhost:5177",
          "access-control-allow-credentials": "true",
        },
        contentType: "application/json",
        body: JSON.stringify(responses[path] || {}),
      });
    },
  );
  await page.emulateMedia({ colorScheme: "light" });
});

for (const width of [1440, 390, 320]) {
  test(`language dropdown, direction, persistence and dismissal at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/personal/dashboard");
    const trigger = page.getByRole("button", { name: "Language", exact: true });
    await expect(trigger).toBeVisible();
    await expect(trigger.locator("svg")).toHaveCount(1);
    await expect(trigger).toHaveText("");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    const english = page.getByRole("menuitemradio", {
      name: "English",
      exact: true,
    });
    const arabic = page.getByRole("menuitemradio", {
      name: "العربية",
      exact: true,
    });
    await expect(english).toHaveAttribute("aria-checked", "true");
    await expect(english.locator(".language-check svg")).toHaveCount(1);
    await expect(arabic.locator(".language-check svg")).toHaveCount(0);
    await expect(english).toBeFocused();
    await expect(page.getByRole("menu")).toHaveCSS("opacity", "1");
    await page.screenshot({
      path: test.info().outputPath(`language-menu-${width}.png`),
    });
    await arabic.click();
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(
      page.getByRole("heading", { name: "مرحبًا، Sam." }),
    ).toBeVisible();
    const globe = page.getByRole("button", { name: "اللغة", exact: true });
    await expect(globe).toBeFocused();
    await expect(globe).toHaveAttribute("aria-expanded", "false");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await globe.click();
    await expect(arabic).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("menu")).toHaveCSS("opacity", "1");
    await page.screenshot({
      path: test.info().outputPath(`arabic-menu-${width}.png`),
    });
    const box = await page.getByRole("menu").boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    await page.keyboard.press("Escape");
    await expect(globe).toBeFocused();
    await expect(page.getByRole("menu")).toHaveCount(0);
    await globe.click();
    await page.locator("main h1").click();
    await expect(globe).toHaveAttribute("aria-expanded", "false");
    await selectLanguage(page, "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(
      page.getByRole("heading", { name: "Hello, Sam." }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => localStorage.getItem("fatortak.language")),
    ).toBe("en");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator(".language-menu")).toHaveCSS("opacity", "0");
    if (width < 850)
      await expect
        .poll(async () => {
          const sidebar = await page.locator(".sidebar").boundingBox();
          return sidebar.x + sidebar.width;
        })
        .toBeLessThanOrEqual(0);
    await page.screenshot({
      path: test.info().outputPath(`header-${width}.png`),
      fullPage: true,
    });
  });
}

test("menu keyboard navigation, focus restoration and Tab dismissal", async ({
  page,
}) => {
  await page.goto("/personal/dashboard");
  const globe = page.getByRole("button", { name: "Language", exact: true });
  await globe.focus();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("menuitemradio", { name: "العربية" }),
  ).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(
    page.getByRole("menuitemradio", { name: "English" }),
  ).toBeFocused();
  await page.keyboard.press("Home");
  await expect(
    page.getByRole("menuitemradio", { name: "العربية" }),
  ).toBeFocused();
  await page.keyboard.press("End");
  await expect(
    page.getByRole("menuitemradio", { name: "English" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(globe).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(globe).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(
    page.getByRole("menuitemradio", { name: "English" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(globe).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByRole("button", { name: "Refresh rates" }),
  ).toBeFocused();
  await globe.click();
  await page.keyboard.press("Shift+Tab");
  await expect(globe).toBeFocused();
  await expect(globe).toHaveAttribute("aria-expanded", "false");
});

test("sun/moon switch supports keyboard, both themes, persistence and reduced motion", async ({
  page,
}) => {
  await page.goto("/personal/dashboard");
  const theme = page.getByRole("switch", { name: "Dark mode", exact: true });
  await expect(theme).toHaveAttribute("aria-checked", "false");
  await expect(theme).toHaveText("");
  await theme.focus();
  await page.keyboard.press("Space");
  await expect(theme).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Language", exact: true }).click();
  await expect(page.getByRole("menu")).toHaveCSS(
    "background-color",
    "rgb(25, 39, 32)",
  );
  await expect(page.getByRole("menu")).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: test.info().outputPath("dark-language-menu.png"),
  });
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(theme).toHaveAttribute("aria-checked", "true");
  await theme.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(theme.locator(".theme-toggle__thumb")).toHaveCSS(
    "transition-duration",
    "0s",
  );
});
