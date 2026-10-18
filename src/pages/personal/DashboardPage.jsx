import useFormat from "../../i18n/useFormat";
import { useI18n } from "../../i18n/context";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { personalApi } from "../../api/personalApi";
import { useAuth } from "../../context/auth";
import useLoad from "../../utils/useLoad";
import { currentPeriod } from "../../utils/format";
import {
  CategoryBars,
  Empty,
  LoadState,
  PageHeader,
  PeriodFields,
  StatCard,
} from "../../components/UI";
export default function DashboardPage() {
  const { periodLabel, money, dateLabel } = useFormat();
  const { t } = useI18n();
  const { user } = useAuth();
  const [period, setPeriod] = useState(currentPeriod);
  const [draft, setDraft] = useState(period);
  const loader = useCallback(
    async (signal) => {
      const [summary, expenses] = await Promise.all([
        personalApi.summary(period, signal),
        personalApi.expenses.list(period, signal),
      ]);
      return {
        summary,
        expenses,
      };
    },
    [period],
  );
  const state = useLoad(loader);
  const data = state.data?.summary;
  return (
    <>
      <PageHeader
        eyebrow={t("PERSONAL OVERVIEW")}
        title={t("Hello, {name}.", {
          name: user.name.split(" ")[0],
        })}
        description={t("A little perspective on your everyday spending.")}
      >
        <Link className="button" to="/personal/expenses">
          {t("+ Track an expense")}
        </Link>
      </PageHeader>
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
        <button className="button secondary">{t("View month")}</button>
        <span className="muted">
          {t("Amounts in USD \xB7")}{' '}
          {periodLabel(period)}
        </span>
      </form>
      <LoadState state={state}>
        {data && (
          <>
            <div className="stats-grid">
              <StatCard
                label={t("Total expenses")}
                value={money(data.totalSpending)}
                hint={periodLabel(period)}
                accent
              />
              <StatCard
                label={t("Monthly budget")}
                value={money(data.budget)}
                hint={t("Your planned spending limit")}
              />
              <StatCard
                label={t("Remaining budget")}
                value={money(data.remaining)}
                hint={
                  data.isOverBudget
                    ? t("You are over your budget")
                    : data.budget == null
                      ? t("Set a budget to start planning")
                      : t("Room left in your plan")
                }
              />
              <StatCard
                label={t("Expenses recorded")}
                value={state.data.expenses.length}
                hint={t("Every detail makes a difference")}
              />
            </div>
            <div className="dashboard-grid">
              <section className="panel">
                <div className="section-heading">
                  <h2>{t("Spending by category")}</h2>
                  <span className="pill">{t("THIS PERIOD")}</span>
                </div>
                <CategoryBars items={data.byCategory} format={money} personal />
              </section>
              <section className="panel budget-panel">
                <span className="eyebrow">
                  {t("A PLAN THAT WORKS FOR YOU")}
                </span>
                <h2>
                  {t("Give your spending")}
                  <br />
                  {t("a little direction.")}
                </h2>
                <p className="muted">
                  {data.budget == null
                    ? t(
                        "Set a monthly budget and see where you stand as you go.",
                      )
                    : data.percentageUsed == null && data.isOverBudget ? t('You are over your budget') : t('{percent}% of your monthly budget used.', { percent: data.percentageUsed ?? 0 })}
                </p>
                {data.budget != null && (
                  <progress
                    aria-label={t("Budget used")}
                    value={
                      data.budget > 0
                        ? Math.min(
                            (data.totalSpending / data.budget) * 100,
                            100,
                          )
                        : data.totalSpending > 0
                          ? 100
                          : 0
                    }
                    max="100"
                  />
                )}
                <Link className="button secondary" to="/personal/budget">
                  {t("Manage budget \u2192")}
                </Link>
              </section>
            </div>
            <section className="panel">
              <div className="section-heading">
                <h2>{t("Recent expenses")}</h2>
                <Link className="text-button" to="/personal/expenses">
                  {t("View all \u2192")}
                </Link>
              </div>
              {state.data.expenses.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{t("Expense")}</th>
                        <th>{t("Category")}</th>
                        <th>{t("Date")}</th>
                        <th>{t("Amount")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.data.expenses.slice(0, 5).map((expense) => (
                        <tr key={expense._id}>
                          <td className="primary-cell">{expense.title}</td>
                          <td>{t(expense.category)}</td>
                          <td>{dateLabel(expense.date)}</td>
                          <td>{money(expense.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty title={t("Your month starts here")}>
                  {t("Record an expense to see your recent activity.")}
                </Empty>
              )}
            </section>
          </>
        )}
      </LoadState>
    </>
  );
}
