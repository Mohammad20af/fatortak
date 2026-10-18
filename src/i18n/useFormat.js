import { useI18n } from "./context";
import * as format from "../utils/format";
import { useCurrency } from "../context/currency";
import { convert } from "../utils/money";

export default function useFormat() {
  const { locale, t } = useI18n();
  const { currency: displayCurrency, rates } = useCurrency();
  return {
    money: (value, currency = displayCurrency) =>
      value == null
        ? t("Not available")
        : format.money(value, currency, locale),
    recordMoney: (record) => {
      if (!record.currency)
        return `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(record.amount)} · ${t("Currency unverified")}`;
      const original = format.money(record.amount, record.currency, locale);
      if (record.currency === displayCurrency) return original;
      const converted = convert(
        record.amount,
        record.currency,
        displayCurrency,
        rates,
      );
      return `${original} · ${converted === null ? t("Conversion unavailable") : `≈ ${format.money(converted, displayCurrency, locale)}`}`;
    },
    dateLabel: (value) => format.dateLabel(value, locale),
    periodLabel: (period) => format.periodLabel(period, locale),
  };
}
