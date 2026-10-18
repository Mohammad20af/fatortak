import useFormat from "../i18n/useFormat";
import { useI18n } from "../i18n/context";
import { StatCard } from "./UI";
export default function FinancialStats({ data, currency }) {
  const { money } = useFormat();
  const { t } = useI18n();
  return (
    <>
      <div className="stats-grid">
        <StatCard
          label={t("Revenue")}
          value={money(data.revenue, currency)}
          hint={t("Paid sales invoices")}
          accent
        />
        <StatCard
          label={t("Total expenses")}
          value={money(
            data.purchaseCost === null || data.operatingExpenses === null
              ? null
              : Number((data.purchaseCost + data.operatingExpenses).toFixed(2)),
            currency,
          )}
          hint={t("Paid purchases + operating expenses")}
        />
        <StatCard
          label={t("Profit")}
          value={money(data.profit, currency)}
          hint={t("Revenue minus total expenses")}
        />
        <StatCard
          label={t("Operating expenses")}
          value={money(data.operatingExpenses, currency)}
          hint={t("Your business running costs")}
        />
      </div>
      <div className="financial-strip">
        <div>
          <span>{t("Accounts receivable")}</span>
          <strong>{money(data.accountsReceivable, currency)}</strong>
          <small>{t("Unpaid & overdue sales")}</small>
        </div>
        <div>
          <span>{t("Accounts payable")}</span>
          <strong>{money(data.accountsPayable, currency)}</strong>
          <small>{t("Unpaid & overdue purchases")}</small>
        </div>
        <div>
          <span>{t("Purchase cost")}</span>
          <strong>{money(data.purchaseCost, currency)}</strong>
          <small>{t("Paid purchase invoices")}</small>
        </div>
      </div>
    </>
  );
}
