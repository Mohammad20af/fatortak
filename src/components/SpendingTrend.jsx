import { useState } from "react";
import { useI18n } from "../i18n/context";
import useFormat from "../i18n/useFormat";
import { Empty } from "./UI";
export default function SpendingTrend({ items = [] }) {
  const { t } = useI18n();
  const { money, dateLabel } = useFormat();
  const [active, setActive] = useState(null);
  const points = items
    .filter((item) => item.total !== null)
    .sort((a, b) => a.category.localeCompare(b.category));
  const max = Math.max(1, ...points.map((item) => item.total));
  const selected = points.find((point) => point.category === active);
  return (
    <section className="panel spending-trend">
      <div className="section-heading">
        <h2>{t("Daily spending trend")}</h2>
        <span className="muted" aria-live="polite">
          {selected
            ? `${dateLabel(selected.category)} · ${money(selected.total)}`
            : t("Select a day to inspect spending")}
        </span>
      </div>
      {points.length ? (
        <div className="trend-bars">
          {points.map((point) => (
            <button
              key={point.category}
              aria-label={`${dateLabel(point.category)}: ${money(point.total)}`}
              aria-pressed={point.category === active}
              onClick={() => setActive(point.category)}
              onFocus={() => setActive(point.category)}
              style={{
                "--bar-height": `${Math.max(3, (point.total / max) * 100)}%`,
              }}
            >
              <span />
              <small>{new Date(point.category).getUTCDate()}</small>
            </button>
          ))}
        </div>
      ) : (
        <Empty title={t("No expenses this month")} />
      )}
    </section>
  );
}
