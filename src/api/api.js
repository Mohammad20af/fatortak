const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000/api"
).replace(/\/$/, "");
let csrfToken = null,
  csrfPending = null,
  displayCurrency = "USD",
  sessionVersion = 0;
export const setDisplayCurrency = (currency) => {
  displayCurrency = currency;
};
export const clearCsrf = () => {
  csrfToken = null;
  sessionVersion++;
};
export async function initializeCsrf() {
  if (!csrfPending)
    csrfPending = fetch(`${API_URL}/auth/csrf`, {
      credentials: "include",
      signal: AbortSignal.timeout(15000),
    })
      .then(async (res) => {
        if (!res.ok)
          throw new Error(
            "Cannot reach Fatortak. Check your connection and make sure the backend is running on port 3000.",
          );
        const data = await res.json();
        csrfToken = data.csrfToken;
        return data;
      })
      .finally(() => {
        csrfPending = null;
      });
  return csrfPending;
}
export function queryString(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== "" && value != null),
  );
  return query.size ? `?${query}` : "";
}
export async function request(
  path,
  { method = "GET", body, signal, authenticated = true, csrfRetry = true } = {},
) {
  if (method !== "GET" && !csrfToken) await initializeCsrf();
  const requestVersion = sessionVersion;
  const url = new URL(`${API_URL}${path}`, window.location.origin);
  if (method === "GET" && !path.startsWith("/auth"))
    url.searchParams.set("currency", displayCurrency);
  let response;
  try {
    response = await fetch(url, {
      method,
      credentials: "include",
      headers: {
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(method !== "GET" && { "X-CSRF-Token": csrfToken }),
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
    // Only retry a rejected CSRF check: no controller has run at this point.
    if (data.code === "CSRF_INVALID" && csrfRetry) {
      await initializeCsrf();
      return request(path, {
        method,
        body,
        signal,
        authenticated,
        csrfRetry: false,
      });
    }
    const message =
      response.status >= 500
        ? "The server could not complete this request. Please try again."
        : data.message || "The request failed.";
    const error = new Error(message);
    error.uiMessages = [message];
    error.status = response.status;
    if (
      response.status === 401 &&
      authenticated &&
      requestVersion === sessionVersion
    )
      window.dispatchEvent(new Event("fatortak:unauthorized"));
    throw error;
  }
  if (data.csrfToken && data.csrfToken !== csrfToken) {
    csrfToken = data.csrfToken;
    sessionVersion++;
  }
  return data;
}
export function resourceApi(path, plural, singular) {
  return {
    listPage: (params, signal) =>
      request(`${path}${queryString(params)}`, { signal }),
    // Dropdowns retain all options; paginated tables use listPage directly.
    list: async (params = {}, signal) => {
      let page = 1,
        records = [];
      while (true) {
        const data = await request(
          `${path}${queryString({ ...params, page, limit: 100 })}`,
          { signal },
        );
        records = records.concat(data[plural]);
        if (records.length >= data.count || !data[plural].length)
          return records;
        page++;
      }
    },
    get: (id, signal) =>
      request(`${path}/${id}`, { signal }).then((data) => data[singular]),
    create: (body) => request(path, { method: "POST", body }),
    update: (id, body) => request(`${path}/${id}`, { method: "PATCH", body }),
    remove: (id) => request(`${path}/${id}`, { method: "DELETE" }),
  };
}
