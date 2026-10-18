const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000/api"
).replace(/\/$/, "");
const TOKEN_KEY = "fatortak.token";

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export function queryString(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== "" && value != null),
  );
  return query.size ? `?${query}` : "";
}

export async function request(
  path,
  { method = "GET", body, signal, authenticated = true } = {},
) {
  const token = authenticated ? tokenStorage.get() : null;
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(15000)])
        : AbortSignal.timeout(15000),
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(
      error.name === "TimeoutError"
        ? "The server took too long to respond. Please try again."
        : "Cannot reach Fatortak. Check your connection and make sure the backend is running on port 3000.",
      { cause: error },
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const fallback = {
      400: "Please check the entered information.",
      401: "Please sign in again.",
      403: "Your account cannot access this feature.",
      404: "This record could not be found.",
      409: "This record already exists.",
    };
    const details = Array.isArray(data.errors)
      ? data.errors.join(". ")
      : data.errors?.missingFields
        ? `Required: ${data.errors.missingFields.join(", ")}`
        : "";
    const message =
      response.status >= 500
        ? "The server could not complete this request. Please try again."
        : data.message || fallback[response.status] || "The request failed.";
    const error = new Error([message, details].filter(Boolean).join(" "));
    // Keep message parts so a visible error can switch languages without another request.
    error.uiMessages = [
      message,
      ...(Array.isArray(data.errors) ? data.errors : details ? [details] : []),
    ];
    error.status = response.status;
    // A rejected login must not expire a different, already active session.
    if (response.status === 401 && token && token === tokenStorage.get())
      window.dispatchEvent(new Event("fatortak:unauthorized"));
    throw error;
  }
  return data;
}

export function resourceApi(path, plural, singular) {
  return {
    list: (params, signal) =>
      request(`${path}${queryString(params)}`, { signal }).then(
        (data) => data[plural],
      ),
    get: (id, signal) =>
      request(`${path}/${id}`, { signal }).then((data) => data[singular]),
    create: (body) => request(path, { method: "POST", body }),
    update: (id, body) => request(`${path}/${id}`, { method: "PATCH", body }),
    remove: (id) => request(`${path}/${id}`, { method: "DELETE" }),
  };
}
