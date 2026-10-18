import { request } from "./api";

export const authApi = {
  login: (body) =>
    request("/auth/login", { method: "POST", body, authenticated: false }),
  register: (body) =>
    request("/auth/register", { method: "POST", body, authenticated: false }),
  me: (signal) => request("/users/me", { signal }).then((data) => data.user),
  update: (body) =>
    request("/users/me", { method: "PATCH", body }).then((data) => data.user),
};
