import useFormat from "../../i18n/useFormat";
import { useI18n } from "../../i18n/context";
import { useCallback, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { businessApi } from "../../api/businessApi";
import useLoad from "../../utils/useLoad";
import { currentPeriod } from "../../utils/format";
import {
  Badge,
  CategoryBars,
  Empty,
  LoadState,
  PageHeader,
  PeriodFields,
} from "../../components/UI";
import FinancialStats from "../../components/FinancialStats";
export default function ReportsPage() {
  const { periodLabel, money } = useFormat();
  const { t } = useI18n();
  const { currency } = useOutletContext();
  const [period, setPeriod] = useState(currentPeriod);
  const [draft, setDraft] = useState(period);
  const loader = useCallback(
    (signal) => businessApi.report(period, signal),
    [period],
  );
  const state = useLoad(loader);
  const data = state.data;
  return (
    <>
      <PageHeader
        title={t("Monthly reports")}
        description={t("Turn the details into a clearer picture.")}
      />
      <form
        className="period-toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          setPeriod({
            ...draft,
          });
        }}
      >
        <PeriodFields value={draft} onChange={setDraft} />
        <button className="button secondary">{t("View report")}</button>
        <span className="muted">{periodLabel(period)}</span>
      </form>
      <LoadState state={state}>
        {data && (
          <>
            <FinancialStats data={data} currency={currency} />
            <div className="dashboard-grid">
              <section className="panel">
                <h2>{t("Invoices by type & status")}</h2>
                {data.invoices.length ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>{t("Type")}</th>
                          <th>{t("Status")}</th>
                          <th>{t("Count")}</th>
                          <th>{t("Total")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.invoices.map((item) => (
                          <tr key={`${item.type}-${item.status}`}>
                            <td className="capitalize primary-cell">
                          {t(item.type)}
                            </td>
                            <td>
                              <Badge status={item.status} />
                            </td>
                            <td>{item.count}</td>
                            <td>{money(item.total, currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty title={t("No invoices this month")} />
                )}
              </section>
              <section className="panel">
                <h2>{t("Operating expenses by category")}</h2>
                <CategoryBars
                  items={data.expensesByCategory}
                  currency={currency}
                  format={money}
                />
              </section>
            </div>
            <div className="report-note">
              <strong>{t("How to read this report")}</strong>
              <p>
                {t(
                  "Profit = paid sales \u2212 paid purchases \u2212 operating expenses. Receivables and payables include unpaid and overdue invoices in the selected month. The month is based on the invoice date, not the payment date.",
                )}
              </p>
            </div>
          </>
        )}
      </LoadState>
    </>
  );
}
