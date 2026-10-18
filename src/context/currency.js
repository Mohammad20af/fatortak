import { createContext, useContext } from "react";
export const CurrencyContext = createContext({ currency: "USD", rates: null });
export const useCurrency = () => useContext(CurrencyContext);
