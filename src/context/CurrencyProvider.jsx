import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth";
import { CurrencyContext } from "./currency";
import { authApi } from "../api/authApi";
import { request, setDisplayCurrency } from "../api/api";
export default function CurrencyProvider({ children }) {
  const { user, setUser } = useAuth();
  const [rates, setRates] = useState(null),
    [error, setError] = useState(null),
    [saving, setSaving] = useState(false);
  const currency = user.preferredCurrency || "USD";
  const refreshRates = useCallback(async () => {
    try {
      setRates(await request("/currency/rates"));
    } catch {
      setRates({ status: "unavailable" });
    }
  }, []);
  useEffect(() => {
    Promise.resolve().then(refreshRates);
    const timer = setInterval(refreshRates, 60000);
    return () => clearInterval(timer);
  }, [refreshRates]);
  useEffect(() => {
    if (rates?.status !== "available") return;
    const timer = setTimeout(
      () =>
        setRates((previous) => ({
          ...previous,
          status: "unavailable",
          rate: null,
        })),
      Math.max(0, Date.parse(rates.expiresAt) - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [rates]);
  async function changeCurrency(value) {
    setSaving(true);
    setError(null);
    try {
      const updated = await authApi.update({ preferredCurrency: value });
      setDisplayCurrency(value);
      setUser(updated);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }
  return (
    <CurrencyContext.Provider
      value={{ currency, rates, error, saving, changeCurrency, refreshRates }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}
