import { useI18n } from "../../i18n/context";
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { dashboardPath, useAuth } from "../../context/auth";
import { Field, Loading, Notice } from "../../components/UI";
import LanguageSwitcher from "../../i18n/LanguageSwitcher";
import ThemeToggle from "../../components/ThemeToggle";
export default function AuthPage({ register = false }) {
  const { t } = useI18n();
  const auth = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    accountType: "personal",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const update = (key) => (value) =>
    setForm({
      ...form,
      [key]: value,
    });
  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = register
        ? {
            ...form,
            name: form.name.trim(),
            email: form.email.trim(),
          }
        : {
            email: form.email.trim(),
            password: form.password,
          };
      auth.authenticate(await authApi[register ? "register" : "login"](body));
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  if (auth.loading) return <Loading />;
  if (auth.user) return <Navigate to={dashboardPath(auth.user)} replace />;
  return (
    <div className="auth-page">
      <section className="auth-story">
        <Link className="brand" dir="ltr" to="/">
          <span className="brand-mark">f.</span>fatortak.
        </Link>
        <div>
          <p className="eyebrow">{t("A CLEARER PICTURE")}</p>
          <h1>
            {t("Your finances.")}
            <br />
            {t("Finally, in focus.")}
          </h1>
          <p>
            {t(
              "From everyday spending to your next business milestone. Keep everything that counts in one place.",
            )}
          </p>
          <div className="auth-illustration" aria-hidden="true">
            <div className="mini-receipt">
              <span>{t("THE BIG PICTURE")}</span>
              <strong>{t("A little more clarity.")}</strong>
              <div className="illustration-bars">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="receipt-line" />
              <small>{t("Organized today. Ready for tomorrow.")}</small>
            </div>
            <span className="floating-check">✓</span>
          </div>
        </div>
        <small>{t("Personal finances. Business confidence.")}</small>
      </section>
      <section className="auth-form-wrap">
        <nav className="auth-language" aria-label={t("Language")}>
          <ThemeToggle />
          <LanguageSwitcher />
        </nav>
        <div className="auth-form">
          <span className="pill">{t("WELCOME TO FATORTAK")}</span>
          <h2>
            {register
              ? t("Make room for clarity.")
              : t("Good to see you again.")}
          </h2>
          <p className="muted">
            {register
              ? t("Create your account and start organizing your finances.")
              : t("Sign in to pick up where you left off.")}
          </p>
          <Notice error={error || auth.error} success={auth.notice} />
          <form onSubmit={submit}>
            <fieldset disabled={busy}>
              {register && (
                <>
                  <Field
                    label={t("Full name")}
                    value={form.name}
                    onChange={update("name")}
                    required
                    maxLength={100}
                    autoComplete="name"
                  />
                  <div
                    className="account-selector"
                    role="group"
                    aria-label={t("Account type")}
                  >
                    {["personal", "business"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={form.accountType === type}
                        className={form.accountType === type ? "selected" : ""}
                        onClick={() => update("accountType")(type)}
                      >
                        <strong>
                          {type === "personal" ? t("Personal") : t("Business")}
                        </strong>
                        <small>
                          {type === "personal"
                            ? t("Expenses & budgets")
                            : t("Invoices & insights")}
                        </small>
                      </button>
                    ))}
                  </div>
                </>
              )}
              <Field
                label={t("Email address")}
                type="email"
                value={form.email}
                onChange={update("email")}
                required
                autoComplete="email"
                placeholder={"you@example.com"}
              />
              <Field
                label={t("Password")}
                type="password"
                value={form.password}
                onChange={update("password")}
                required
                minLength={register ? 12 : undefined}
                autoComplete={register ? "new-password" : "current-password"}
              />
              {register && (
                <p className="field-help">
                  {t(
                    "Use at least 8 characters. Your account type determines your workspace.",
                  )}
                </p>
              )}
              <button className="button full" disabled={busy}>
                {busy
                  ? t("Please wait\u2026")
                  : register
                    ? t("Create account \u2192")
                    : t("Sign in \u2192")}
              </button>
            </fieldset>
          </form>
          <p className="auth-switch">
            {register ? t("Already have an account?") : t("New to Fatortak?")}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? t("Sign in") : t("Create an account")}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
