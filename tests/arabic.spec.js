import { test, expect } from "@playwright/test";
import { selectLanguage } from "./helpers/controls";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const api = process.env.E2E_API_URL || "http://localhost:3107/api";
const run = `fatortak-ar-${Date.now()}`;
const accounts = [];
const password = "Arabic-Test-Only-927!";

test.afterAll(async () => {
  if (!accounts.length) return;
  const backend =
    process.env.FATORTAK_BACKEND_PATH || "C:/Users/ASUS/Desktop/fatortak";
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
    throw new Error("Cleanup requires isolated test MongoDB");
  await mongoose.connect(uri);
  try {
    const User = (
      await import(pathToFileURL(path.join(backend, "models/User.js")).href)
    ).default;
    for (const { id, email } of accounts) {
      if (!email.startsWith(run)) throw new Error("Unexpected cleanup account");
      const user = await User.findOne({ _id: id, email });
      if (!user) continue;
      for (const name of [
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
            pathToFileURL(path.join(backend, `models/${name}.js`)).href
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

async function language(page, value) {
  await selectLanguage(page, value);
  await expect(page.locator("html")).toHaveAttribute("lang", value);
  await expect(page.locator("html")).toHaveAttribute(
    "dir",
    value === "ar" ? "rtl" : "ltr",
  );
}
async function register(page, role) {
  await page.goto("/register");
  await language(page, "ar");
  await page.getByLabel("الاسم الكامل").fill("ليان");
  await page
    .getByRole("button", {
      name:
        role === "personal"
          ? "شخصي المصروفات والميزانيات"
          : "تجاري الفواتير والتقارير",
    })
    .click();
  const email = `${run}-${role}-${accounts.length}@example.test`;
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("كلمة المرور").fill(password);
  const responsePromise = page.waitForResponse(`${api}/auth/register`);
  await page.getByRole("button", { name: "إنشاء حساب" }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  const { user } = await response.json();
  accounts.push({ id: user.id, email });
  await expect(page).toHaveURL(new RegExp(`/${role}/dashboard$`));
  await expect(
    page.getByRole("heading", { name: "مرحبًا، ليان." }),
  ).toBeVisible();
  return email;
}
async function nav(page, name) {
  await page
    .getByRole("navigation", { name: "التنقل الرئيسي" })
    .getByRole("link", { name, exact: true })
    .click();
}
async function saveRecord(page) {
  await page.getByRole("button", { name: "حفظ السجل" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
async function record(page, name) {
  const row = page
    .getByRole("row")
    .filter({ has: page.getByRole("cell").filter({ hasText: name }) });
  await expect(row).toBeVisible();
  return row;
}
async function noEnglishUI(page, allowed = []) {
  await expect(page.locator(".loading")).toHaveCount(0);
  const text = await page.locator("body").innerText();
  const unexpected =
    text
      .match(/[A-Za-z][A-Za-z@. -]*/g)
      ?.map((value) => value.trim())
      .filter(
        (value) =>
          value &&
          ![
            "English",
            "f.",
            "fatortak.",
            "fatortak",
            "USD",
            "US",
            "ILS",
            "Frankfurter",
            "CSV",
            "PDF",
            ...allowed,
          ].includes(value),
      ) || [];
  expect(unexpected, "Unexpected English interface text").toEqual([]);
}

test("Arabic personal pages, native validation, unchanged data and persistent language", async ({
  page,
  request,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/register");
  await language(page, "ar");
  await page.getByRole("button", { name: "إنشاء حساب" }).click();
  expect(
    await page
      .getByLabel("الاسم الكامل")
      .evaluate((input) => input.validationMessage),
  ).toBe("هذا الحقل مطلوب.");
  await language(page, "en");
  expect(
    await page
      .getByLabel("Full name")
      .evaluate((input) => input.validationMessage),
  ).toBe("This field is required.");
  await register(page, "personal");
  await noEnglishUI(page);
  const sidebar = await page.locator(".sidebar").boundingBox();
  expect(Math.round(sidebar.x + sidebar.width)).toBe(1440);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("heading", { name: "مرحبًا، ليان." }),
  ).toBeVisible();
  await nav(page, "المصروفات");
  await noEnglishUI(page);
  await page.getByRole("button", { name: "إضافة المصروف" }).click();
  await noEnglishUI(page);
  await page.getByRole("dialog").getByLabel("العنوان").fill("Expenses");
  await page.getByRole("dialog").getByLabel("المبلغ").fill("25");
  await page.getByRole("dialog").getByLabel("الفئة").selectOption("Food");
  await page.getByRole("dialog").getByLabel("ملاحظة").fill("Save record");
  const created = page.waitForResponse(
    (response) =>
      response.url() === `${api}/expenses` &&
      response.request().method() === "POST",
  );
  await saveRecord(page);
  const payload = (await created).request().postDataJSON();
  expect(payload).toMatchObject({
    title: "Expenses",
    amount: 25,
    category: "Food",
    note: "Save record",
  });
  await expect(page.locator(".notice.success")).toHaveText(
    "تم إنشاء المصروف بنجاح.",
  );
  await expect(await record(page, "Expenses")).toContainText("الطعام");
  await language(page, "en");
  await expect(page.locator(".notice.success")).toHaveText(
    "Expense created successfully.",
  );
  await expect(await record(page, "Expenses")).toContainText("Food");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(
    page.getByRole("heading", { name: "Expenses", exact: true }),
  ).toBeVisible();
  await language(page, "ar");
  await (
    await record(page, "Expenses")
  )
    .getByRole("button", { name: "عرض", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Save record");
  await noEnglishUI(page, ["Expenses", "Save record"]);
  await page.getByRole("button", { name: "إغلاق", exact: true }).click();
  await (
    await record(page, "Expenses")
  )
    .getByRole("button", { name: "تعديل", exact: true })
    .click();
  await page.getByRole("dialog").getByLabel("المبلغ").fill("30");
  await saveRecord(page);
  await nav(page, "الميزانية الشهرية");
  await noEnglishUI(page);
  await page.getByLabel("مبلغ الميزانية").fill("100");
  await page.getByRole("button", { name: "حفظ الميزانية" }).click();
  await expect(page.locator(".notice.success")).toHaveText(
    "تم حفظ الميزانية بنجاح.",
  );
  await nav(page, "نظرة عامة");
  await noEnglishUI(page, ["Expenses"]);
  await page.screenshot({
    path: "test-results/arabic-personal-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.goto("/business/reports");
  await expect(page).toHaveURL(/\/personal\/dashboard$/);
  const headers = {
    Cookie: (await page.context().cookies())
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; "),
  };
  expect(
    (await request.get(`${api}/business/dashboard`, { headers })).status(),
  ).toBe(403);
  await page.getByRole("link", { name: "إعدادات الحساب" }).click();
  await noEnglishUI(page);
  await page.getByRole("button", { name: "تسجيل الخروج" }).click();
  await expect(page.getByRole("status")).toContainText("تم تسجيل الخروج");
  await noEnglishUI(page);
  await page.getByLabel("البريد الإلكتروني").fill("missing@example.test");
  await page.getByLabel("كلمة المرور").fill("wrong-password");
  await page.getByRole("button", { name: "تسجيل الدخول" }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  );
  await language(page, "en");
  await expect(page.getByRole("alert")).toHaveText("Invalid email or password");
  expect(errors).toEqual([]);
});

test("Arabic business pages, invoice payloads, details, errors and mobile RTL drawer", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await register(page, "business");
  await noEnglishUI(page);
  for (const [label, heading] of [
    ["العملاء", "العملاء"],
    ["الموردون", "الموردون"],
    ["فواتير المبيعات", "فواتير المبيعات"],
    ["فواتير المشتريات", "فواتير المشتريات"],
    ["مصروفات العمل", "مصروفات العمل"],
    ["التقارير", "التقارير الشهرية"],
    ["الملف التجاري", "الملف التجاري"],
  ]) {
    await nav(page, label);
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
    await noEnglishUI(page);
  }
  await page.getByLabel("اسم النشاط التجاري").fill("شركة ليان");
  await page.getByRole("button", { name: "حفظ الملف التجاري" }).click();
  await expect(page.locator(".notice.success")).toHaveText(
    "تم حفظ الملف التجاري بنجاح.",
  );
  await nav(page, "العملاء");
  await page.getByRole("button", { name: "إضافة العميل" }).click();
  await noEnglishUI(page);
  await page.getByRole("dialog").getByLabel("الاسم").fill("Customer");
  await saveRecord(page);
  await nav(page, "الموردون");
  await page.getByRole("button", { name: "إضافة المورد" }).click();
  await noEnglishUI(page);
  await page.getByRole("dialog").getByLabel("الاسم").fill("Supplier");
  await saveRecord(page);
  for (const type of ["sales", "purchase"]) {
    await nav(page, type === "sales" ? "فواتير المبيعات" : "فواتير المشتريات");
    await page.getByRole("button", { name: "إضافة فاتورة" }).click();
    await noEnglishUI(page, ["Customer", "Supplier"]);
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("العنوان").fill("Invoice details");
    await dialog.getByLabel("الفئة").fill("Food");
    await dialog.getByLabel("العميل").selectOption({ label: "Customer" });
    await dialog.getByLabel("المورد").selectOption({ label: "Supplier" });
    await dialog.getByLabel("الحالة").selectOption("paid");
    await dialog.getByRole("button", { name: "إضافة بند" }).click();
    await dialog.getByLabel("الوصف 1").fill("Description");
    await dialog.getByLabel("الكمية 1").fill("2");
    await dialog.getByLabel("سعر الوحدة 1").fill("50");
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url() === `${api}/invoices` &&
        response.request().method() === "POST",
    );
    await dialog.getByRole("button", { name: "حفظ الفاتورة" }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(201);
    expect(response.request().postDataJSON()).toMatchObject({
      type,
      status: "paid",
      title: "Invoice details",
      category: "Food",
      amount: 100,
      items: [{ description: "Description", quantity: 2, unitPrice: 50 }],
    });
    await expect(dialog).toHaveCount(0);
    await expect(await record(page, "Invoice details")).toContainText("مدفوعة");
    await (
      await record(page, "Invoice details")
    )
      .getByRole("button", { name: "عرض", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toContainText("Food");
    await noEnglishUI(page, [
      "Invoice details",
      "Customer",
      "Supplier",
      "Description",
      "Food",
    ]);
    await page.getByRole("button", { name: "إغلاق", exact: true }).click();
    await (
      await record(page, "Invoice details")
    )
      .getByRole("button", { name: "تعديل", exact: true })
      .click();
    await noEnglishUI(page, ["Invoice details", "Customer", "Supplier"]);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "إلغاء" })
      .click();
    await (
      await record(page, "Invoice details")
    )
      .getByRole("button", { name: "حذف", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toContainText(
      "سيتم حذف «Invoice details» نهائيًا.",
    );
    await page.getByRole("button", { name: "تأكيد الحذف" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await nav(page, "مصروفات العمل");
  await page.getByRole("button", { name: "إضافة المصروف" }).click();
  await noEnglishUI(page, ["Supplier"]);
  await page.getByRole("dialog").getByLabel("العنوان").fill("Expense");
  await page.getByRole("dialog").getByLabel("المبلغ").fill("5");
  await page.getByRole("dialog").getByLabel("الفئة").fill("Food");
  await saveRecord(page);
  await expect(await record(page, "Expense")).toContainText("Food");
  await nav(page, "التقارير");
  await noEnglishUI(page, ["Food"]);
  await page.screenshot({
    path: "test-results/arabic-report-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "فتح قائمة التنقل" }).click();
  await expect(page.locator(".sidebar")).toHaveClass(/is-open/);
  await page.screenshot({
    path: "test-results/arabic-mobile-drawer.png",
    fullPage: true,
    animations: "disabled",
  });
  const sidebar = await page.locator(".sidebar").boundingBox();
  expect(Math.round(sidebar.x + sidebar.width)).toBe(390);
  await nav(page, "نظرة عامة");
  await expect(page.locator(".sidebar")).not.toHaveClass(/is-open/);
  await page.screenshot({
    path: "test-results/arabic-mobile-dashboard.png",
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await language(page, "en");
  await expect(
    page.getByRole("heading", { name: "Hello, ليان." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.screenshot({
    path: "test-results/english-mobile-drawer.png",
    fullPage: true,
    animations: "disabled",
  });
  expect(Math.round((await page.locator(".sidebar").boundingBox()).x)).toBe(0);
  await page
    .getByRole("button", { name: "Close navigation" })
    .click({ position: { x: 380, y: 100 } });
  await language(page, "ar");
  for (const status of [400, 403, 404, 500]) {
    await page.route("**/api/business/dashboard*", (route) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify({ message: "Unrecognized server message" }),
      }),
    );
    await page.reload();
    await expect(page.getByRole("alert")).toBeVisible();
    await noEnglishUI(page);
    await page.unroute("**/api/business/dashboard*");
  }
  await page.route("**/api/business/dashboard*", (route) => route.abort());
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("تعذر الاتصال بفاتورتك");
  await page.unroute("**/api/business/dashboard*");
  await page.getByRole("button", { name: "حاول مرة أخرى" }).click();
  await expect(page.getByText("الإيرادات", { exact: true })).toBeVisible();
  await page.route("**/api/business/dashboard*", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Please sign in again." }),
    }),
  );
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("status")).toContainText("انتهت صلاحية جلستك");
  await page.goto("/missing-page");
  await expect(
    page.getByRole("heading", { name: "هذه الصفحة غير موجودة." }),
  ).toBeVisible();
  await noEnglishUI(page);
  expect(errors).toEqual([]);
});
