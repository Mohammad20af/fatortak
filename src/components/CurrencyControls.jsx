import { useCurrency } from "../context/currency";
import { useI18n } from "../i18n/context";
export default function CurrencyControls() {
  const { currency, saving, changeCurrency } = useCurrency();
  const { t } = useI18n();
  return (
    <label className="currency-switch">
      <span>{t("Display currency")}</span>
      <select
        aria-label={t("Display currency")}
        value={currency}
        disabled={saving}
        onChange={(event) => changeCurrency(event.target.value)}
      >
        <option value="USD">USD $</option>
        <option value="ILS">ILS ₪</option>
      </select>
    </label>
  );
}
export function RateNotice() {
  const { rates, refreshRates } = useCurrency();
  const { t, locale } = useI18n();
  const valid = rates?.status === "available";
  return (
    <div
      className={`rate-notice ${valid ? "" : "rate-warning"}`}
      aria-live="polite"
    >
      <span className="live-dot" />
      {valid ? (
        <>
          <strong dir="ltr">1 USD = {rates.rate} ILS</strong>
          <span>
            {t("Reference rate")}: {rates.rateDate} · {t("Checked")}:{" "}
            {new Date(rates.fetchedAt).toLocaleTimeString(locale, {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            · Frankfurter
          </span>
        </>
      ) : (
        <span>
          {t(
            rates
              ? "Exchange rates unavailable. Original amounts are preserved; conversions are withheld."
              : "Loading exchange rates…",
          )}
        </span>
      )}
      <button className="text-button" onClick={refreshRates}>
        {t("Refresh rates")}
      </button>
    </div>
  );
}
export function ValuationNotice({ valuation }) {
  const { t } = useI18n();
  if (!valuation) return null;
  if (valuation.complete)
    return valuation.exchangeRate?.rateDate ? (
      <p className="field-help">
        {t("Reference rate")}:{" "}
        <bdi>1 USD = {valuation.exchangeRate.rate} ILS</bdi> ·{" "}
        {valuation.exchangeRate.rateDate} · {valuation.currency}
      </p>
    ) : null;
  return (
    <div className="notice warning" role="alert">
      {t("Totals are incomplete and unavailable amounts are withheld.")}{" "}
      {valuation.unknownCurrency > 0 &&
        t("{count} records need verified currencies.", {
          count: valuation.unknownCurrency,
        })}{" "}
      {valuation.unavailableConversions > 0 &&
        t("{count} conversions are unavailable.", {
          count: valuation.unavailableConversions,
        })}
    </div>
  );
}
