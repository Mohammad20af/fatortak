export async function selectLanguage(page, language) {
  await page.getByRole("button", { name: /^(Language|اللغة)$/ }).click();
  await page
    .getByRole("menuitemradio", {
      name: language === "ar" ? "العربية" : "English",
      exact: true,
    })
    .click();
}
