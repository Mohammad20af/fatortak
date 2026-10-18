import { queryString, request, resourceApi } from "./api";

export const personalApi = {
  expenses: resourceApi("/expenses", "expenses", "expense"),
  summary: (params, signal) =>
    request(`/expenses/summary${queryString(params)}`, { signal }),
  budget: (params, signal) =>
    request(`/expenses/budget${queryString(params)}`, { signal }).then(
      (data) => data.budget,
    ),
  saveBudget: (body) => request("/expenses/budget", { method: "PUT", body }),
  deleteBudget: (params) =>
    request(`/expenses/budget${queryString(params)}`, { method: "DELETE" }),
};
