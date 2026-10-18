import { useI18n } from "./context";

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();
  return (
    <div
      className="language-switcher"
      role="group"
      aria-label={t("Language")}
      dir="ltr"
    >
      <button
        type="button"
        lang="en"
        aria-pressed={language === "en"}
        onClick={() => setLanguage("en")}
      >
        English
      </button>
      <span aria-hidden="true">|</span>
      <button
        type="button"
        lang="ar"
        aria-pressed={language === "ar"}
        onClick={() => setLanguage("ar")}
      >
        العربية
      </button>
    </div>
  );
}
