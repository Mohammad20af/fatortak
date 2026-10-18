import { useI18n } from "../i18n/context";
import { Navigate, Outlet } from "react-router-dom";
import { dashboardPath, useAuth } from "../context/auth";
import { Loading, Notice } from "./UI";
export default function ProtectedRoute({ role }) {
  const { t } = useI18n();
  const { user, loading, error, retry, logout } = useAuth();
  if (loading) return <Loading />;
  if (error)
    return (
      <div className="session-error panel">
        <h1>{t("Let\u2019s reconnect")}</h1>
        <Notice error={error} />
        <button className="button" onClick={retry}>
          {t("Try again")}
        </button>{" "}
        <button className="button secondary" onClick={logout}>
          {t("Sign out")}
        </button>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (role && role !== user.accountType)
    return <Navigate to={dashboardPath(user)} replace />;
  return <Outlet />;
}
