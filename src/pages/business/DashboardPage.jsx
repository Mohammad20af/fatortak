import useFormat from "../../i18n/useFormat";
import { useI18n } from "../../i18n/context";
import { Link, useOutletContext } from "react-router-dom";
import { businessApi } from "../../api/businessApi";
import { useAuth } from "../../context/auth";
import useLoad from "../../utils/useLoad";
import { Badge, Empty, LoadState, PageHeader } from "../../components/UI";
import FinancialStats from "../../components/FinancialStats";
import { ValuationNotice } from "../../components/CurrencyControls";
export default function DashboardPage() {
  const { periodLabel, money } = useFormat();
  const { t } = useI18n();
  const { user } = useAuth();
  const { currency } = useOutletContext();
  const state = useLoad(businessApi.dashboard);
  const data = state.data;
  return (
    <>
      <PageHeader
        eyebrow={t("BUSINESS OVERVIEW")}
        title={t("Hello, {name}.", {
          name: user.name.split(" ")[0],
        })}
        description={t("Your business, seen a little more clearly.")}
      >
        <Link className="button" to="/business/sales-invoices">
          {t("+ Manage sales invoices")}
        </Link>
      </PageHeader>
      <LoadState state={state}>
        {data && (
          <>
            <ValuationNotice valuation={data.valuation} />
            <div className="period-caption">
              <span className="live-dot" />
              {periodLabel(data.period)}
              <span className="muted">{t("Monthly financial overview")}</span>
            </div>
            <FinancialStats data={data} currency={currency} />
            <div className="dashboard-grid">
              <section className="panel">
                <div className="section-heading">
                  <h2>{t("Invoice breakdown")}</h2>
                  <Link className="text-button" to="/business/reports">
                    {t("View reports \u2192")}
                  </Link>
                </div>
                {data.invoiceBreakdown.length ? (
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
                        {data.invoiceBreakdown.map((item) => (
                          <tr key={`${item._id.type}-${item._id.status}`}>
                            <td className="capitalize primary-cell">
                              {t(item._id.type)}
                            </td>
                            <td>
                              <Badge status={item._id.status} />
                            </td>
                            <td>{item.count}</td>
                            <td>{money(item.total, currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty title={t("Ready for your first invoice")}>
                    {t("Your current month\u2019s invoices will appear here.")}
                  </Empty>
                )}
              </section>
              <section className="panel">
                <h2>{t("Your business at a glance")}</h2>
                <div className="business-counts">
                  <Link to="/business/sales-invoices">
                    <span>{t("Invoices recorded")}</span>
                    <strong>{data.invoiceCount}</strong>
                  </Link>
                  <Link to="/business/customers">
                    <span>{t("Customers")}</span>
                    <strong>{data.customers} →</strong>
                  </Link>
                  <Link to="/business/suppliers">
                    <span>{t("Suppliers")}</span>
                    <strong>{data.suppliers} →</strong>
                  </Link>
                  <Link to="/business/sales-invoices">
                    <span>{t("Overdue invoices \xB7 all time")}</span>
                    <strong
                      className={data.overdueInvoices ? "danger-text" : ""}
                    >
                      {data.overdueInvoices} →
                    </strong>
                  </Link>
                </div>
                <p className="field-help">
                  {t(
                    "Overdue count includes both sales and purchase invoices.",
                  )}
                </p>
              </section>
            </div>
            <p className="field-help">
              {t(
                "Monthly totals use the invoice date. Revenue and purchase cost include paid invoices only.",
              )}
            </p>
          </>
        )}
      </LoadState>
    </>
  );
}
