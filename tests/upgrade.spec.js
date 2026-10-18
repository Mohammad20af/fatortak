import { test, expect } from "@playwright/test";
import { selectLanguage } from "./helpers/controls";
const api = process.env.E2E_API_URL || "http://localhost:3107/api";
async function account(page, accountType) {
  const initial = await (await page.request.get(`${api}/auth/csrf`)).json();
  const registration = await page.request.post(`${api}/auth/register`, {
    headers: { "X-CSRF-Token": initial.csrfToken },
    data: {
      name: "Currency Test",
      email: `upgrade-${accountType}-${Date.now()}@example.test`,
      password: "Upgrade-test-password-927!",
      accountType,
    },
  });
  expect(registration.status()).toBe(201);
  const data = await registration.json();
  expect(data.token).toBeUndefined();
  return { csrf: data.csrfToken, user: data.user };
}
test("cookies, precise mixed-currency totals, instant preference switching, original preservation and dark mobile UI", async ({
  page,
}) => {
  await page.clock.install();
  const { csrf } = await account(page, "personal");
  const headers = { "X-CSRF-Token": csrf };
  for (const [title, amount, currency] of [
    ["USD lunch", 100, "USD"],
    ["ILS lunch", 36.5, "ILS"],
  ]) {
    expect(
      (
        await page.request.post(`${api}/expenses`, {
          headers,
          data: { title, amount, currency, category: "Food" },
        })
      ).status(),
    ).toBe(201);
  }
  await page.goto("/personal/dashboard");
  await expect(page.locator(".stat-card").first()).toContainText("$110.00");
  const cookie = (await page.context().cookies()).find(
    (item) => item.name === "fatortak.sid",
  );
  expect(cookie.httpOnly).toBe(true);
  expect(cookie.sameSite).toBe("Lax");
  expect(
    await page.evaluate(() => localStorage.getItem("fatortak.token")),
  ).toBeNull();
  await page.evaluate(() => {
    window.currencySwitchMarker = "retained";
  });
  await page.getByLabel("Display currency").selectOption("ILS");
  await expect(page.locator(".stat-card").first()).toContainText("401.50");
  expect(await page.evaluate(() => window.currencySwitchMarker)).toBe(
    "retained",
  );
  await page.reload();
  await expect(page.getByLabel("Display currency")).toHaveValue("ILS");
  const original = (
    await (await page.request.get(`${api}/expenses`)).json()
  ).expenses.find((row) => row.title === "USD lunch");
  expect(original.amount).toBe(100);
  expect(original.currency).toBe("USD");
  await page.getByRole("switch", { name: "Dark mode", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: test.info().outputPath("dark-dashboard.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("dark-mobile.png"),
    fullPage: true,
  });
  await page.goto("/personal/budget");
  await page.getByLabel("Budget amount").fill("987.65");
  const ratePoll = page.waitForResponse((response) =>
    response.url().includes("/api/currency/rates"),
  );
  await page.clock.fastForward(61000);
  await ratePoll;
  await expect(page.getByLabel("Budget amount")).toHaveValue("987.65");
  await page.route("**/api/currency/rates*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "unavailable", rate: null }),
    }),
  );
  await page.getByRole("button", { name: "Refresh rates" }).click();
  await expect(page.locator(".rate-notice")).toContainText(
    "Exchange rates unavailable",
  );
});
test("business reporting, original CSV, Arabic invoice print/PDF and mobile RTL", async ({
  page,
}) => {
  await page.clock.install();
  const { csrf } = await account(page, "business");
  const headers = { "X-CSRF-Token": csrf };
  for (const [title, amount, currency] of [
    ["USD sale", 100, "USD"],
    ["ILS sale", 36.5, "ILS"],
  ]) {
    expect(
      (
        await page.request.post(`${api}/invoices`, {
          headers,
          data: { title, amount, currency, status: "paid" },
        })
      ).status(),
    ).toBe(201);
  }
  await page.goto("/business/reports");
  await expect(page.locator(".stat-card").first()).toContainText("$110.00");
  const reportDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  expect((await reportDownload).suggestedFilename()).toMatch(/\.csv$/);
  await page.goto("/business/sales-invoices");
  await page.getByRole("button", { name: "Add invoice" }).click();
  await page.getByRole("dialog").getByLabel("Title").fill("Keep this draft");
  const refreshed = page.waitForResponse(
    (response) =>
      response.url().includes("/api/invoices?") &&
      response.request().method() === "GET",
  );
  await page.clock.fastForward(61000);
  await refreshed;
  await expect(page.getByRole("dialog").getByLabel("Title")).toHaveValue(
    "Keep this draft",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel" })
    .click();
  const originalDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export original records" }).click();
  expect((await originalDownload).suggestedFilename()).toBe(
    "fatortak-sales-invoices.csv",
  );
  await selectLanguage(page, "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page
    .getByRole("row")
    .filter({ hasText: "USD sale" })
    .getByRole("button", { name: "عرض", exact: true })
    .click();
  await page.evaluate(() => {
    window.print = () => {
      window.printRequested = true;
    };
  });
  await page.getByRole("button", { name: "طباعة / حفظ PDF" }).click();
  expect(await page.evaluate(() => window.printRequested)).toBe(true);
  const pdf = await page.pdf({
    path: test.info().outputPath("arabic-invoice.pdf"),
    format: "A4",
  });
  expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
  expect(pdf.length).toBeGreaterThan(1000);
  expect(
    (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length,
  ).toBe(1);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("arabic-invoice-mobile.png"),
    fullPage: true,
  });
});
