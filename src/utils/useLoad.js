import { useCallback, useEffect, useState } from "react";

export default function useLoad(loader) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setState({ data: null, loading: true, error: "" });
      try {
        const data = await loader(controller.signal);
        // Prevent an old search response from replacing a newer search or unmounted page.
        if (!controller.signal.aborted)
          setState({ data, loading: false, error: "" });
      } catch (err) {
        if (!controller.signal.aborted)
          setState({ data: null, loading: false, error: err });
      }
    }
    load();
    return () => controller.abort();
  }, [loader, version]);
  return { ...state, reload };
}
