import { queryString, request, resourceApi } from "./api";

export const businessApi = {
  customers: resourceApi("/customers", "customers", "customer"),
  suppliers: resourceApi("/suppliers", "suppliers", "supplier"),
  invoices: resourceApi("/invoices", "invoices", "invoice"),
  expenses: resourceApi("/business/expenses", "expenses", "expense"),
  dashboard: (signal) => request("/business/dashboard", { signal }),
  report: (params, signal) =>
    request(`/reports/monthly${queryString(params)}`, { signal }),
  profile: (signal) =>
    request("/business/profile", { signal }).then((data) => data.profile),
  saveProfile: (body) => request("/business/profile", { method: "PUT", body }),
};
