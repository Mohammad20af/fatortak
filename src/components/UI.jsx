import { useI18n } from "../i18n/context";
import { useEffect, useId, useRef } from "react";
import { currentPeriod } from "../utils/format";
import { errorMessage, validationMessage } from "../i18n/messages";
export function Notice({ error, success }) {
  const { t, language } = useI18n();
  if (!error && !success) return null;
  return (
    <div
      className={`notice ${error ? "error" : "success"}`}
      role={error ? "alert" : "status"}
    >
      {error ? errorMessage(error, language, t) : t(success)}
    </div>
  );
}
export function Loading() {
  const { t } = useI18n();
  return (
    <div className="loading" role="status">
      <span className="spinner" />
      {t("Loading your workspace\u2026")}
    </div>
  );
}
export function LoadState({ state, children }) {
  const { t } = useI18n();
  if (state.loading) return <Loading />;
  if (state.error)
    return (
      <div className="panel">
        <Notice error={state.error} />
        <button className="button secondary" onClick={state.reload}>
          {t("Try again")}
        </button>
      </div>
    );
  return children;
}
export function Empty({ title = "Nothing here yet", children }) {
  const { t } = useI18n();
  return (
    <div className="empty">
      <span className="empty-symbol">≡</span>
      <h3>{t(title)}</h3>
      <p>{children || t("Add your first record to get started.")}</p>
    </div>
  );
}
export function PageHeader({ eyebrow, title, description, children }) {
  const { t } = useI18n();
  return (
    <div className="page-header">
      <div>
        <p className="eyebrow">{eyebrow || t("YOUR WORKSPACE")}</p>
        <h1>{t(title)}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      <div className="header-actions">{children}</div>
    </div>
  );
}
export function Field({
  label,
  name,
  value,
  onChange,
  options,
  multiline,
  ...props
}) {
  const { t } = useI18n();
  const id = useId();
  const inputRef = useRef(null);
  useEffect(() => {
    if (inputRef.current?.validity.customError)
      inputRef.current.setCustomValidity(
        validationMessage(inputRef.current, t),
      );
  }, [t]);
  const common = {
    id,
    name,
    value: value ?? "",
    onChange: (event) => {
      event.target.setCustomValidity("");
      onChange(event.target.value);
    },
    onInvalid: (event) =>
      event.target.setCustomValidity(validationMessage(event.target, t)),
    ref: inputRef,
    dir: ["email", "url", "tel", "number", "date"].includes(props.type)
      ? "ltr"
      : "auto",
    ...props,
    placeholder: props.placeholder ? t(props.placeholder) : undefined,
  };
  return (
    <label className={`field ${multiline ? "wide" : ""}`} htmlFor={id}>
      <span>
        {t(label)}
        {props.required && <span className="required"> *</span>}
      </span>
      {options ? (
        <select {...common}>
          {options.map((option) => (
            <option
              key={typeof option === "string" ? option : option.value}
              value={typeof option === "string" ? option : option.value}
            >
              {typeof option === "string"
                ? t(option)
                : option.value === ""
                  ? t(option.label)
                  : option.label}
            </option>
          ))}
        </select>
      ) : multiline ? (
        <textarea {...common} rows={3} />
      ) : (
        <input {...common} />
      )}
    </label>
  );
}
export function PeriodFields({ value, onChange, optional = false }) {
  const { t, locale } = useI18n();
  const months = Array.from(
    {
      length: 12,
    },
    (_, index) => ({
      value: String(index + 1),
      label: new Date(2024, index, 1).toLocaleDateString(locale, {
        month: "long",
      }),
    }),
  );
  return (
    <>
      <Field
        label={t("Month")}
        value={value.month}
        options={[
          ...(optional
            ? [
                {
                  value: "",
                  label: "All months",
                },
              ]
            : []),
          ...months,
        ]}
        onChange={(month) =>
          onChange({
            ...value,
            month,
            year: month && !value.year ? currentPeriod().year : value.year,
          })
        }
      />
      <Field
        label={t("Year")}
        type="number"
        min="1970"
        max="9999"
        required={!optional || Boolean(value.month)}
        value={value.year}
        onChange={(year) =>
          onChange({
            ...value,
            year,
          })
        }
      />
    </>
  );
}
export function StatCard({ label, value, hint, accent }) {
  return (
    <div className={`stat-card ${accent ? "accent" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}
export function Badge({ status }) {
  const { t } = useI18n();
  return (
    <span className={`badge ${status || "unpaid"}`}>
      {t(status || "unpaid")}
    </span>
  );
}
export function Modal({ title, onClose, children, busy = false }) {
  const { t } = useI18n();
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-button"
          aria-label={t("Close dialog")}
          disabled={busy}
          onClick={onClose}
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function CategoryBars({ items, currency, format, personal = false }) {
  const { t } = useI18n();
  if (!items.length)
    return (
      <Empty title={t("No expenses this month")}>
        {t("Your category breakdown will appear here.")}
      </Empty>
    );
  const max = Math.max(...items.map((item) => item.total), 1);
  return (
    <div className="category-bars">
      {items.map((item) => (
        <div key={item.category}>
          <div className="bar-label">
            <span>{personal ? t(item.category) : item.category}</span>
            <strong>{format(item.total, currency)}</strong>
          </div>
          <div className="bar-track">
            <div
              style={{
                width: `${(item.total / max) * 100}%`,
              }}
            />
          </div>
          <small className="muted">
            {t(item.count === 1 ? "{count} record" : "{count} records", {
              count: item.count,
            })}
          </small>
        </div>
      ))}
    </div>
  );
}
