import { test, expect } from "@playwright/test";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

test.describe.configure({ mode: "serial" });

const api = process.env.E2E_API_URL || "http://localhost:3107/api";
const baseURL = process.env.E2E_BASE_URL || "http://localhost:5177";
const password = "Fatortak-Test-Only-927!";
const run = `fatortak-e2e-${Date.now()}`;
const emails = {
  personal: `${run}-personal@example.test`,
  business: `${run}-business@example.test`,
};
const createdUsers = [];
const backend =
  process.env.FATORTAK_BACKEND_PATH || "C:/Users/ASUS/Desktop/fatortak";

// Cleanup is limited to the exact accounts created by this test run.
test.afterAll(async () => {
  if (!createdUsers.length) return;
  const requireBackend = createRequire(path.join(backend, "package.json"));
  requireBackend("dotenv").config({
    path: path.join(backend, ".env.test-never-production"),
    quiet: true,
  });
  const mongoose = requireBackend("mongoose");
  const uri = process.env.TEST_MONGODB_URI;
  if (
    !/^mongodb:\/\/(?:127\.0\.0\.1|localhost):27028\/fatortak_test_[a-z0-9_]+$/.test(
      uri || "",
    )
  )
    throw new Error("Cleanup requires the isolated test database");
  await mongoose.connect(uri);
  try {
    const User = (
      await import(pathToFileURL(path.join(backend, "models/User.js")).href)
    ).default;
    for (const { id, email } of createdUsers) {
      if (!email.startsWith(run))
        throw new Error("Refusing to clean an account outside this test run.");
      const user = await User.findOne({ _id: id, email });
      if (!user) continue;
      for (const modelName of [
        "Expense",
        "Budget",
        "Invoice",
        "Customer",
        "Supplier",
        "BusinessExpense",
        "BusinessProfile",
        "Session",
      ]) {
        const Model = (
          await import(
            pathToFileURL(path.join(backend, `models/${modelName}.js`)).href
          )
        ).default;
        await Model.deleteMany({ user: user._id });
      }
      await User.deleteOne({ _id: user._id, email });
    }
  } finally {
    await mongoose.disconnect();
  }
});

async function register(page, role) {
  await page.goto("/register");
  await page.getByLabel("Full name").fill(`Test ${role}`);
  await page
    .getByRole("button", {
      name:
        role === "personal"
          ? "Personal Expenses & budgets"
          : "Business Invoices & insights",
    })
    .click();
  await page.getByLabel("Email address").fill(emails[role]);
  await page.getByLabel("Password").fill(password);
  const responsePromise = page.waitForResponse(`${api}/auth/register`);
  await page.getByRole("button", { name: "Create account" }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  const data = await response.json();
  createdUsers.push({ id: data.user.id, email: data.user.email });
  await expect(page).toHaveURL(`${baseURL}/${role}/dashboard`);
  await expect(
    page.getByRole("heading", { name: "Hello, Test." }),
  ).toBeVisible();
}
async function login(page, role) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(emails[role]);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: false }).click();
  await expect(page).toHaveURL(`${baseURL}/${role}/dashboard`);
}
async function navigate(page, name) {
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name, exact: true })
    .click();
}
async function saveRecord(page) {
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
async function row(page, name) {
  const result = page
    .getByRole("row")
    .filter({ has: page.getByRole("cell").filter({ hasText: name }) });
  await expect(result).toBeVisible();
  return result;
}
async function deleteRow(page, name) {
  await (
    await row(page, name)
  )
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page
      .getByRole("row")
      .filter({ has: page.getByRole("cell").filter({ hasText: name }) }),
  ).toHaveCount(0);
}
async function authHeaders(page) {
  return {
    Cookie: (await page.context().cookies())
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; "),
  };
}

test("personal: authentication, persistent session, expense CRUD, filters, budget and summary", async ({
  page,
  request,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/personal/expenses");
  await expect(page).toHaveURL(/\/login$/);
  await register(page, "personal");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Hello, Test." }),
  ).toBeVisible();
  await page.goto("/business/customers");
  await expect(page).toHaveURL(/\/personal\/dashboard$/);
  const headers = await authHeaders(page);
  expect(
    (await request.get(`${api}/business/dashboard`, { headers })).status(),
  ).toBe(403);
  await navigate(page, "Expenses");
  await page.getByRole("button", { name: "Add expense" }).click();
  await page.getByRole("dialog").getByLabel("Title").fill("Test lunch");
  await page.getByLabel("Amount", { exact: false }).fill("25");
  await page.getByRole("dialog").getByLabel("Category").selectOption("Food");
  await page
    .getByLabel("Note", { exact: false })
    .fill("Integration test expense");
  await saveRecord(page);
  await (
    await row(page, "Test lunch")
  )
    .getByRole("button", { name: "View" })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Integration test expense",
  );
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await (
    await row(page, "Test lunch")
  )
    .getByRole("button", { name: "Edit" })
    .click();
  await page.getByRole("dialog").getByLabel("Title").fill("Updated lunch");
  await page.getByLabel("Amount", { exact: false }).fill("30");
  await saveRecord(page);
  await page.getByLabel("Search").fill("unmatched");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByText("No expenses found")).toBeVisible();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await row(page, "Updated lunch");
  await page.getByLabel("Category").selectOption("Bills");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByText("No expenses found")).toBeVisible();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await navigate(page, "Monthly budget");
  await page.getByLabel("Budget amount").fill("100");
  await page.getByRole("button", { name: "Save budget", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Budget saved" }),
  ).toContainText("Budget saved successfully");
  await expect(page.getByText("$70.00", { exact: true })).toBeVisible();
  await page.getByLabel("Budget amount").fill("20");
  await page.getByRole("button", { name: "Save budget", exact: true }).click();
  await expect(page.getByText("Your spending is over budget")).toBeVisible();
  await navigate(page, "Overview");
  await expect(page.getByText("$30.00", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("You are over your budget")).toBeVisible();
  await page.screenshot({
    path: "test-results/personal-desktop.png",
    fullPage: true,
  });
  await navigate(page, "Expenses");
  await deleteRow(page, "Updated lunch");
  await navigate(page, "Monthly budget");
  await page
    .getByRole("button", { name: "Delete budget", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(
    page.getByRole("heading", { name: "Set your first budget" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Account settings" }).click();
  await page.getByLabel("Full name").fill("Updated Personal");
  await page.getByRole("button", { name: "Save account" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Account details updated",
  );
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email address").fill(emails.personal);
  await page.getByLabel("Password").fill("Wrong-Password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Invalid email or password",
  );
  await login(page, "personal");
  expect(errors).toEqual([]);
});

test("business: profile, parties, both invoice types, expense CRUD and financial reports", async ({
  page,
  request,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await register(page, "business");
  await page.goto("/personal/dashboard");
  await expect(page).toHaveURL(/\/business\/dashboard$/);
  const headers = await authHeaders(page);
  expect((await request.get(`${api}/expenses`, { headers })).status()).toBe(
    403,
  );
  await navigate(page, "Business profile");
  await page.getByLabel("Business name").fill("Test Studio");
  await page.getByLabel("Business email").fill("studio@example.test");
  await page.getByLabel("Currency code").selectOption("USD");
  await page.getByRole("button", { name: "Save business profile" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Business profile saved",
  );
  await page.reload();
  await expect(page.getByLabel("Business name")).toHaveValue("Test Studio");
  for (const type of ["Customer", "Supplier"]) {
    await navigate(page, `${type}s`);
    await page
      .getByRole("button", { name: `Add ${type.toLowerCase()}` })
      .click();
    await page
      .getByRole("dialog")
      .getByLabel("Name", { exact: false })
      .fill(`Test ${type}`);
    await page
      .getByRole("dialog")
      .getByLabel("Email")
      .fill(`${type.toLowerCase()}@example.test`);
    await saveRecord(page);
    await (
      await row(page, `Test ${type}`)
    )
      .getByRole("button", { name: "View" })
      .click();
    await expect(page.getByRole("dialog")).toContainText(
      `${type.toLowerCase()}@example.test`,
    );
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await (
      await row(page, `Test ${type}`)
    )
      .getByRole("button", { name: "Edit" })
      .click();
    await page.getByRole("dialog").getByLabel("Phone").fill("0599000000");
    await saveRecord(page);
    await expect(await row(page, `Test ${type}`)).toContainText("0599000000");
  }
  for (const type of ["Sales", "Purchase"]) {
    await navigate(page, `${type} invoices`);
    await page.getByRole("button", { name: "Add invoice" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Title").fill(`Test ${type}`);
    await dialog.getByLabel("Invoice number").fill(`${type}-001`);
    await dialog
      .getByLabel(type === "Sales" ? "Customer" : "Supplier")
      .selectOption({
        label: `Test ${type === "Sales" ? "Customer" : "Supplier"}`,
      });
    await dialog.getByLabel("Status").selectOption("paid");
    await dialog.getByRole("button", { name: "Add line item" }).click();
    await dialog.getByLabel("Description 1").fill("Services");
    await dialog.getByLabel("Quantity 1").fill("2");
    await dialog
      .getByLabel("Unit price 1")
      .fill(type === "Sales" ? "100" : "20");
    await dialog.getByRole("button", { name: "Save invoice" }).click();
    await expect(dialog).toHaveCount(0);
    const invoiceRow = await row(page, `Test ${type}`);
    await expect(invoiceRow).toContainText(
      type === "Sales" ? "$200.00" : "$40.00",
    );
    await invoiceRow.getByRole("button", { name: "View" }).click();
    await expect(page.getByRole("dialog")).toContainText("Services");
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await (
      await row(page, `Test ${type}`)
    )
      .getByRole("button", { name: "Edit" })
      .click();
    await page
      .getByRole("dialog")
      .getByLabel("Notes")
      .fill("Updated invoice notes");
    await page.getByRole("dialog").getByLabel("Quantity 1").fill("3");
    await page.getByRole("dialog").getByLabel("Status").selectOption("unpaid");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Save invoice" })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(await row(page, `Test ${type}`)).toContainText(
      type === "Sales" ? "$300.00" : "$60.00",
    );
    await expect(await row(page, `Test ${type}`)).toContainText("unpaid");
    await (
      await row(page, `Test ${type}`)
    )
      .getByRole("button", { name: "Edit" })
      .click();
    await page.getByRole("dialog").getByLabel("Quantity 1").fill("2");
    await page.getByRole("dialog").getByLabel("Status").selectOption("paid");
    await page.getByRole("button", { name: "Save invoice" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await navigate(page, "Sales invoices");
  await expect(
    page.getByRole("row").filter({ hasText: "Test Purchase" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Add invoice" }).click();
  await page.getByRole("dialog").getByLabel("Title").fill("Overdue sale");
  await page.getByRole("dialog").getByLabel("Amount").fill("50");
  await page.getByRole("dialog").getByLabel("Due date").fill("2020-01-01");
  await page.getByRole("button", { name: "Save invoice" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(await row(page, "Overdue sale")).toContainText("overdue");
  await page.getByLabel("Status").selectOption("paid");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(
    page.getByRole("row").filter({ hasText: "Overdue sale" }),
  ).toHaveCount(0);
  await navigate(page, "Business expenses");
  await page.getByRole("button", { name: "Add expense" }).click();
  await page.getByRole("dialog").getByLabel("Title").fill("Office rent");
  await page.getByRole("dialog").getByLabel("Amount").fill("10");
  await page.getByRole("dialog").getByLabel("Category").fill("Rent");
  await page
    .getByRole("dialog")
    .getByLabel("Supplier")
    .selectOption({ label: "Test Supplier" });
  await saveRecord(page);
  await (
    await row(page, "Office rent")
  )
    .getByRole("button", { name: "Edit" })
    .click();
  await page.getByRole("dialog").getByLabel("Amount").fill("15");
  await saveRecord(page);
  await (
    await row(page, "Office rent")
  )
    .getByRole("button", { name: "View" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("$15.00");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await navigate(page, "Reports");
  await expect(page.getByText("$145.00", { exact: true })).toBeVisible();
  await expect(page.getByText("$55.00", { exact: true })).toBeVisible();
  await expect(page.getByText("$50.00", { exact: true }).first()).toBeVisible();
  await page.screenshot({
    path: "test-results/business-reports.png",
    fullPage: true,
  });
  await navigate(page, "Overview");
  await expect(page.getByText("$145.00", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "test-results/business-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/business-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await navigate(page, "Customers");
  await expect(
    page.getByRole("heading", { name: "Customers", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const [name, record] of [
    ["Sales invoices", "Test Sales"],
    ["Sales invoices", "Overdue sale"],
    ["Purchase invoices", "Test Purchase"],
    ["Business expenses", "Office rent"],
    ["Customers", "Test Customer"],
    ["Suppliers", "Test Supplier"],
  ]) {
    await navigate(page, name);
    await deleteRow(page, record);
  }
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Suppliers", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await login(page, "business");
  expect(errors).toEqual([]);
});

test("visible network/server errors, expired sessions, 404 and mobile authentication", async ({
  page,
  request,
}) => {
  await login(page, "personal");
  await expect(page.getByText("Total expenses", { exact: true })).toBeVisible();
  await expect(page.locator(".rate-notice strong")).toBeVisible();
  await page.route("**/api/expenses/summary*", (route) => route.abort());
  await page.getByRole("button", { name: "View month", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Cannot reach Fatortak");
  await page.unroute("**/api/expenses/summary*");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("Total expenses", { exact: true })).toBeVisible();
  for (const status of [400, 403, 404, 500]) {
    await page.route("**/api/expenses/summary*", (route) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify({ message: `Test ${status}` }),
      }),
    );
    await page.reload();
    await expect(page.getByRole("alert")).toContainText(
      status === 500
        ? "The server could not complete this request"
        : `Test ${status}`,
    );
    await page.unroute("**/api/expenses/summary*");
  }
  await page.route("**/api/expenses/summary*", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Please sign in again." }),
    }),
  );
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("status")).toContainText("Your session expired");
  await page.unroute("**/api/expenses/summary*");
  await page.context().clearCookies();
  expect((await request.get(`${api}/expenses`)).status()).toBe(401);
  expect(
    (
      await request.post(`${api}/auth/register`, { data: { email: "invalid" } })
    ).status(),
  ).toBe(403);
  await page.goto("/missing-page");
  await expect(page.getByRole("heading", { name: /This page/ })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await page.screenshot({
    path: "test-results/login-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
