import { useI18n } from "../i18n/context";
import { useState } from "react";
import { Field, Notice } from "./UI";
export default function RecordForm({
  fields,
  initial,
  onSave,
  onCancel,
  onBusy,
}) {
  const { t } = useI18n();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    onBusy(true);
    try {
      const body = Object.fromEntries(
        fields.map(({ name, type, nullable }) => [
          name,
          nullable && !form[name]
            ? null
            : type === "number"
              ? Number(form[name])
              : String(form[name] ?? "").trim(),
        ]),
      );
      if (
        fields.some(
          (field) =>
            field.required &&
            (body[field.name] === "" || body[field.name] == null),
        )
      )
        throw new Error("Please fill in all required fields.");
      await onSave(body);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <Notice error={error} />
      <fieldset disabled={busy}>
        <div className="form-grid">
          {fields.map((field) => {
            const inputProps = {
              ...field,
            };
            delete inputProps.nullable;
            delete inputProps.optionKey;
            return (
              <Field
                key={field.name}
                {...inputProps}
                value={form[field.name]}
                onChange={(value) =>
                  setForm({
                    ...form,
                    [field.name]: value,
                  })
                }
              />
            );
          })}
        </div>
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={onCancel}>
            {t("Cancel")}
          </button>
          <button className="button">
            {busy ? t("Saving\u2026") : t("Save record")}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
