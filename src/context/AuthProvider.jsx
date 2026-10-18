import { useEffect, useState } from "react";
import { authApi } from "../api/authApi";
import { initializeCsrf, clearCsrf, setDisplayCurrency } from "../api/api";
import { AuthContext } from "./auth";
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0),
    [notice, setNotice] = useState("");
  useEffect(() => {
    // One-time cleanup of the old authentication mechanism; tokens are never read.
    try {
      localStorage.removeItem("fatortak.token");
      sessionStorage.removeItem("fatortak.token");
    } catch {
      /* Storage may be disabled. */
    }
    const controller = new AbortController();
    async function restore() {
      setLoading(true);
      setError("");
      try {
        await initializeCsrf();
        const restored = await authApi.me(controller.signal);
        if (!controller.signal.aborted) {
          setDisplayCurrency(restored.preferredCurrency || "USD");
          setUser(restored);
        }
      } catch (err) {
        if (!controller.signal.aborted && err.status !== 401) setError(err);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    restore();
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => {
    const expire = () => {
      clearCsrf();
      setUser(null);
      setError("");
      setNotice("Your session expired. Please sign in again.");
    };
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("fatortak.session")
        : null;
    if (channel)
      channel.onmessage = () => {
        setUser(null);
        setAttempt((value) => value + 1);
      };
    window.addEventListener("fatortak:unauthorized", expire);
    return () => {
      window.removeEventListener("fatortak:unauthorized", expire);
      channel?.close();
    };
  }, []);
  function broadcast() {
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel("fatortak.session");
      channel.postMessage("changed");
      channel.close();
    }
  }
  function authenticate(data) {
    setDisplayCurrency(data.user.preferredCurrency || "USD");
    setUser(data.user);
    setNotice("");
    setError("");
    broadcast();
  }
  async function logout() {
    try {
      await authApi.logout();
      clearCsrf();
      setUser(null);
      setError("");
      setNotice("You have signed out.");
      broadcast();
    } catch (err) {
      setError(err);
    }
  }
  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        error,
        notice,
        authenticate,
        logout,
        retry: () => setAttempt((value) => value + 1),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
