import { createContext, useContext } from "react";

export const LanguageContext = createContext(null);
export const useI18n = () => useContext(LanguageContext);
