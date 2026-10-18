import { useI18n } from "./context";
import * as format from "../utils/format";

export default function useFormat() {
  const { locale, t } = useI18n();
  return {
    money: (value, currency) =>
      value == null ? t("Not set") : format.money(value, currency, locale),
    dateLabel: (value) => format.dateLabel(value, locale),
    periodLabel: (period) => format.periodLabel(period, locale),
  };
}
