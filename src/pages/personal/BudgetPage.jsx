import useFormat from "../../i18n/useFormat";
import { useI18n } from "../../i18n/context";
import { useCallback, useState } from "react";
import { personalApi } from "../../api/personalApi";
import useLoad from "../../utils/useLoad";
import { currentPeriod } from "../../utils/format";
import {
  Field,
  LoadState,
  Modal,
  Notice,
  PageHeader,
  PeriodFields,
  StatCard,
} from "../../components/UI";
function BudgetEditor({ period, budget, reload }) {
  const { money, periodLabel } = useFormat();
  const { t } = useI18n();
  const [amount, setAmount] = useState(budget?.amount ?? "");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [confirm, setConfirm] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setFeedback({});
    try {
      await personalApi.saveBudget({
        ...period,
        amount: Number(amount),
      });
      reload("Budget saved successfully.");
    } catch (err) {
      setFeedback({
        error: err,
      });
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    try {
      await personalApi.deleteBudget(period);
      reload("Budget deleted successfully.");
    } catch (err) {
      setFeedback({
        error: err,
      });
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="stats-grid three">
        <StatCard
          label={t("Monthly budget")}
          value={money(budget?.amount)}
          hint={periodLabel(period)}
          accent
        />
        <StatCard
          label={t("Spent")}
          value={budget ? money(budget.spent) : t("Set a budget")}
          hint={t("Expenses recorded this month")}
        />
        <StatCard
          label={t("Remaining")}
          value={budget ? money(budget.remaining) : t("Not set")}
          hint={
            budget?.isOverBudget
              ? t("Your spending is over budget")
              : t("Your available spending room")
          }
        />
      </div>
      <div className="panel narrow">
        <h2>{budget ? t("Update your plan") : t("Set your first budget")}</h2>
        <p className="muted">
          {t('Choose a spending limit for {period}. Amounts are in USD.', { period: periodLabel(period) })}
        </p>
        <Notice {...feedback} />
        <form onSubmit={submit}>
          <fieldset disabled={busy}>
            <Field
              label={t("Budget amount")}
              type="number"
              min="0"
              step="0.01"
              required
              value={amount}
              onChange={setAmount}
            />
            <div className="form-actions">
              <button className="button">
                {busy ? t("Saving\u2026") : t("Save budget")}
              </button>
              {budget && (
                <button
                  type="button"
                  className="text-button danger-text"
                  onClick={() => setConfirm(true)}
                >
                  {t("Delete budget")}
                </button>
              )}
            </div>
          </fieldset>
        </form>
      </div>
      {confirm && (
        <Modal
          title={t("Delete monthly budget?")}
          onClose={() => setConfirm(false)}
          busy={busy}
        >
          <p>
            {t('This removes the budget for {period}. Your expenses will remain.', { period: periodLabel(period) })}
          </p>
          <div className="form-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setConfirm(false)}
            >
              {t("Cancel")}
            </button>
            <button className="button danger" disabled={busy} onClick={remove}>
              {busy ? t("Deleting\u2026") : t("Confirm delete")}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
export default function BudgetPage() {
  const { t } = useI18n();
  const [period, setPeriod] = useState(currentPeriod);
  const [draft, setDraft] = useState(period);
  const [success, setSuccess] = useState("");
  const loader = useCallback(
    async (signal) => {
      try {
        return await personalApi.budget(period, signal);
      } catch (err) {
        if (err.status === 404) return null;
        throw err;
      }
    },
    [period],
  );
  const state = useLoad(loader);
  return (
    <>
      <PageHeader
        title={t("Monthly budget")}
        description={t("A simple plan for what matters to you.")}
      />
      <form
        className="period-toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          setSuccess("");
          setPeriod({
            ...draft,
          });
        }}
      >
        <PeriodFields value={draft} onChange={setDraft} />
        <button className="button secondary">{t("View month")}</button>
      </form>
      <Notice success={success} />
      <LoadState state={state}>
        {!state.loading && !state.error && (
          <BudgetEditor
            key={`${period.month}-${period.year}-${state.data?.updatedAt || "new"}`}
            period={period}
            budget={state.data}
            reload={(message) => {
              setSuccess(message);
              state.reload();
            }}
          />
        )}
      </LoadState>
    </>
  );
}
