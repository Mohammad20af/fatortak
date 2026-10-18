export const categories = [
  "Food",
  "Transportation",
  "Bills",
  "Shopping",
  "Entertainment",
  "Health",
  "Education",
  "Other",
];
export const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
export const currentPeriod = () => ({
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
});
export const dateInput = (value) => (value ? value.slice(0, 10) : "");
export const dateLabel = (value, locale = "en") =>
  value
    ? new Date(value).toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      })
    : "—";
export function money(value, currency = "USD", locale = "en") {
  if (value == null) return "Not set";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${Number(value).toFixed(2)}`;
  }
}
export const periodLabel = ({ month, year }, locale = "en") =>
  new Date(Date.UTC(Number(year), Number(month) - 1, 1)).toLocaleDateString(
    locale,
    { month: "long", year: "numeric", timeZone: "UTC" },
  );
