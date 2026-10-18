import { useCallback, useEffect, useState } from "react";
import { LanguageContext } from "./context";
import { translate } from "./translations";

const storageKey = "fatortak.language";
export default function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === "ar" ? "ar" : "en";
    } catch {
      return "en";
    }
  });
  const t = useCallback(
    (key, values) => translate(language, key, values),
    [language],
  );

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.title = t("Fatortak · Your finances, in focus");
    try {
      localStorage.setItem(storageKey, language);
    } catch {
      /* Switching still works when storage is unavailable. */
    }
  }, [language, t]);

  useEffect(() => {
    const sync = (event) => {
      if (event.key === storageKey)
        setLanguage(event.newValue === "ar" ? "ar" : "en");
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        locale: language === "ar" ? "ar" : "en",
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}
