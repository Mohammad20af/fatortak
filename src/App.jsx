import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthProvider from "./context/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import AuthPage from "./pages/auth/AuthPage";
import PersonalDashboard from "./pages/personal/DashboardPage";
import ExpensesPage from "./pages/personal/ExpensesPage";
import BudgetPage from "./pages/personal/BudgetPage";
import BusinessDashboard from "./pages/business/DashboardPage";
import PartiesPage from "./pages/business/PartiesPage";
import InvoicesPage from "./pages/business/InvoicesPage";
import BusinessExpensesPage from "./pages/business/BusinessExpensesPage";
import ReportsPage from "./pages/business/ReportsPage";
import ProfilePage from "./pages/business/ProfilePage";
import AccountPage from "./pages/AccountPage";
import NotFound from "./pages/NotFound";
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<AuthPage key="login" />} />
          <Route
            path="/register"
            element={<AuthPage key="register" register />}
          />
          <Route element={<ProtectedRoute role="personal" />}>
            <Route path="/personal" element={<DashboardLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<PersonalDashboard />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="budget" element={<BudgetPage />} />
              <Route path="account" element={<AccountPage />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute role="business" />}>
            <Route path="/business" element={<DashboardLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<BusinessDashboard />} />
              <Route
                path="customers"
                element={<PartiesPage key="customers" />}
              />
              <Route
                path="suppliers"
                element={<PartiesPage key="suppliers" suppliers />}
              />
              <Route
                path="sales-invoices"
                element={<InvoicesPage key="sales" type="sales" />}
              />
              <Route
                path="purchase-invoices"
                element={<InvoicesPage key="purchase" type="purchase" />}
              />
              <Route path="expenses" element={<BusinessExpensesPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="account" element={<AccountPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
