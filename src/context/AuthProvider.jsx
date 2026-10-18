import { useEffect, useState } from "react";
import { authApi } from "../api/authApi";
import { tokenStorage } from "../api/api";
import { AuthContext } from "./auth";
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    async function restoreSession() {
      setLoading(true);
      setError("");
      try {
        if (tokenStorage.get()) setUser(await authApi.me(controller.signal));
      } catch (err) {
        if (!controller.signal.aborted && err.status !== 401) setError(err);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    restoreSession();
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => {
    const expire = () => {
      tokenStorage.clear();
      setUser(null);
      setError("");
      setNotice("Your session expired. Please sign in again.");
    };
    const sync = (event) => {
      if (event.key === "fatortak.token") {
        setUser(null);
        setAttempt((value) => value + 1);
      }
    };
    window.addEventListener("fatortak:unauthorized", expire);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("fatortak:unauthorized", expire);
      window.removeEventListener("storage", sync);
    };
  }, []);
  function authenticate(data) {
    tokenStorage.set(data.token);
    setUser(data.user);
    setNotice("");
    setError("");
  }
  function logout() {
    tokenStorage.clear();
    setUser(null);
    setError("");
    setNotice("You have signed out.");
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
