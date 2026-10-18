import { useEffect, useState } from "react";
import { useI18n } from "../i18n/context";
import NavIcon from "./NavIcon";
export default function ThemeToggle() {
  const { t } = useI18n();
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("fatortak.theme");
      return saved
        ? saved === "dark"
        : matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      localStorage.setItem("fatortak.theme", dark ? "dark" : "light");
    } catch {
      /* Theme still works. */
    }
  }, [dark]);
  return (
    <button
      type="button"
      className="theme-toggle"
      role="switch"
      aria-label={t("Dark mode")}
      title={t(dark ? "Light mode" : "Dark mode")}
      aria-checked={dark}
      onClick={() => setDark(!dark)}
    >
      <span className="theme-toggle__track" aria-hidden="true" dir="ltr">
        <span className="theme-toggle__thumb">
          <span className="theme-toggle__sun">
            <NavIcon name="sun" />
          </span>
          <span className="theme-toggle__moon">
            <NavIcon name="moon" />
          </span>
        </span>
      </span>
    </button>
  );
}
