import { useI18n } from "../i18n/context";
import { useCallback, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth";
import { businessApi } from "../api/businessApi";
import useLoad from "../utils/useLoad";
import { Notice } from "../components/UI";
import LanguageSwitcher from '../i18n/LanguageSwitcher';
const personalLinks = [
  ["dashboard", "Overview", "◫"],
  ["expenses", "Expenses", "↗"],
  ["budget", "Monthly budget", "◉"],
];
const businessLinks = [
  ["dashboard", "Overview", "◫"],
  ["customers", "Customers", "♙"],
  ["suppliers", "Suppliers", "⇄"],
  ["sales-invoices", "Sales invoices", "↗"],
  ["purchase-invoices", "Purchase invoices", "↙"],
  ["expenses", "Business expenses", "≡"],
  ["reports", "Reports", "▥"],
  ["profile", "Business profile", "◇"],
];
export default function DashboardLayout() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const business = user.accountType === "business";
  const loadProfile = useCallback(
    async (signal) => {
      if (!business) return null;
      try {
        return await businessApi.profile(signal);
      } catch (err) {
        if (err.status === 404) return null;
        throw err;
      }
    },
    [business],
  );
  const profile = useLoad(loadProfile);
  const links = business ? businessLinks : personalLinks;
  const active =
    links.find(([path]) => location.pathname.includes(`/${path}`))?.[1] ||
    "Account settings";
  return (
    <div className="app-shell">
      {open && (
        <button
          className="sidebar-scrim"
          aria-label={t("Close navigation")}
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <NavLink
          className="brand"
          dir="ltr"
          to={`/${user.accountType}/dashboard`}
          onClick={() => setOpen(false)}
        >
          <span className="brand-mark">f.</span>fatortak
          <span className="brand-dot">.</span>
        </NavLink>
        <div className="workspace-pill">
          <span className="workspace-icon">{business ? t("B") : t("P")}</span>
          <div>
            <strong>
              {business ? t("Business workspace") : t("Personal workspace")}
            </strong>
            <small>{t("Make every number count")}</small>
          </div>
        </div>
        <p className="nav-caption">{t("WORKSPACE")}</p>
        <nav aria-label={t("Main navigation")}>
          {links.map(([path, label, icon]) => (
            <NavLink
              key={path}
              to={`/${user.accountType}/${path}`}
              onClick={() => setOpen(false)}
            >
              <span className="direction-icon" aria-hidden="true">{icon}</span>
              {t(label)}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span>{t("Clarity for your finances.")}</span>
            <p>
              {t("A little organization.")}
              <br />
              {t("A lot more peace of mind.")}
            </p>
          </div>
          <NavLink
            to={`/${user.accountType}/account`}
            onClick={() => setOpen(false)}
          >
            {t("\u2699 Account settings")}
          </NavLink>
          <button onClick={logout}>{t("\u21AA Sign out")}</button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label={t("Open navigation")}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              ☰
            </button>
            <span>{business ? t("Business") : t("Personal")}</span>
            <span>/</span>
            <strong>{t(active)}</strong>
          </div>
          <div className="user-chip">
            <LanguageSwitcher />
            <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
            <div>
              <strong><bdi>{user.name}</bdi></strong>
              <small>{t(business ? 'Business account' : 'Personal account')}</small>
            </div>
          </div>
        </header>
        <main className="main-content">
          {profile.error && (
            <>
              <p>{t('Business currency could not be loaded. Amounts temporarily use USD.')}</p>
              <Notice error={profile.error} />
              <button className="text-button" onClick={profile.reload}>
                {t("Retry profile")}
              </button>
            </>
          )}
          <Outlet
            context={{
              currency: profile.data?.currency || "USD",
              refreshProfile: profile.reload,
            }}
          />
        </main>
        <footer className="footer">
          <span>{t("Fatortak \xB7 Your finances, in focus.")}</span>
          <span>{t("Built for everyday clarity")}</span>
        </footer>
      </div>
    </div>
  );
}
