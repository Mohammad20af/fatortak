import { useCallback, useEffect, useState } from "react";
import { useCurrency } from "../context/currency";

export default function useLoad(loader, { refreshOnRates = true } = {}) {
  const { currency, rates } = useCurrency();
  const rateVersion = refreshOnRates
    ? rates?.status === "available"
      ? rates.fetchedAt
      : rates?.status
    : null;
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setState((previous) => ({ ...previous, loading: true, error: "" }));
      try {
        const data = await loader(controller.signal);
        // Prevent an old search response from replacing a newer search or unmounted page.
        if (!controller.signal.aborted)
          setState({ data, loading: false, error: "" });
      } catch (err) {
        if (!controller.signal.aborted)
          setState((previous) => ({ ...previous, loading: false, error: err }));
      }
    }
    load();
    return () => controller.abort();
  }, [loader, version, currency, rateVersion]);
  return { ...state, reload };
}
