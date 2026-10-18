import { useI18n } from "../i18n/context";
import { useState } from "react";
import { authApi } from "../api/authApi";
import { useAuth } from "../context/auth";
import { Field, Notice, PageHeader } from "../components/UI";
export default function AccountPage() {
  const { t } = useI18n();
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    currentPassword: "",
    newPassword: "",
  });
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState({});
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setFeedback({});
    try {
      setUser(
        await authApi.update({
          name: form.name.trim(),
          email: form.email.trim(),
          ...(form.currentPassword && {
            currentPassword: form.currentPassword,
          }),
          ...(form.newPassword && { newPassword: form.newPassword }),
        }),
      );
      setFeedback({
        success: "Account details updated.",
      });
      setForm({ ...form, currentPassword: "", newPassword: "" });
    } catch (err) {
      setFeedback({
        error: err,
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        title={t("Account settings")}
        description={t("Keep your personal details up to date.")}
      />
      <div className="panel narrow">
        <Notice {...feedback} />
        <form onSubmit={submit}>
          <fieldset disabled={busy}>
            <Field
              label={t("Full name")}
              required
              maxLength={100}
              value={form.name}
              onChange={(name) =>
                setForm({
                  ...form,
                  name,
                })
              }
            />
            <Field
              label={t("Email address")}
              required
              type="email"
              value={form.email}
              onChange={(email) =>
                setForm({
                  ...form,
                  email,
                })
              }
            />
            <p className="muted">
              {t("Account type:")}
              {t(user.accountType)}
            </p>
            <Field
              label={t("Current password")}
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={(value) => setForm({ ...form, currentPassword: value })}
            />
            <p className="field-help">
              {t("Required when changing your email or password.")}
            </p>
            <Field
              label={t("New password")}
              type="password"
              minLength={12}
              autoComplete="new-password"
              value={form.newPassword}
              onChange={(value) => setForm({ ...form, newPassword: value })}
            />
            <p className="field-help">
              {t("Use 12 or more characters, up to 72 UTF-8 bytes.")}
            </p>
            <button className="button">
              {busy ? t("Saving\u2026") : t("Save account")}
            </button>
          </fieldset>
        </form>
      </div>
    </>
  );
}
