import { useI18n } from "../i18n/context";
import { Link } from "react-router-dom";
import { dashboardPath, useAuth } from "../context/auth";
import LanguageSwitcher from '../i18n/LanguageSwitcher';
export default function NotFound() {
  const { t } = useI18n();
  const { user } = useAuth();
  return (
    <main className="not-found">
      <LanguageSwitcher />
      <span className="eyebrow">{t("404 \xB7 PAGE NOT FOUND")}</span>
      <h1>{t("This page doesn\u2019t add up.")}</h1>
      <p className="muted">
        {t("The link may have moved, or the address may be incorrect.")}
      </p>
      <Link className="button" to={user ? dashboardPath(user) : "/login"}>
        {t(user ? 'Back to overview' : 'Back to sign in')}
      </Link>
    </main>
  );
}
