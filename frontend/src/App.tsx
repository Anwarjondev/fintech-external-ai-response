import { Routes, Route, Navigate } from "react-router-dom";
import { BankLayout } from "@/components/layout/BankLayout";
import { GovernmentLayout } from "@/components/layout/GovernmentLayout";
import {
  BankOnlyRoute,
  GovernmentOnlyRoute,
  PublicRoute,
} from "@/components/ProtectedRoute";

// Pages
import LoginPage from "@/pages/Login";

// Bank pages
import BankDashboardPage from "@/pages/bank/Dashboard";
import BankUploadPage from "@/pages/bank/Upload";
import BankTextPage from "@/pages/bank/Text";
import { ApprovalsPage as BankApprovalsPage, HistoryPage as BankHistoryPage } from "@/pages/bank/Approvals";

// Government pages
import GovernmentSubmitPage from "@/pages/government/Submit";
import { HistoryPage as GovHistoryPage, ResultsPage as GovResultsPage } from "@/pages/government/History";

export default function App() {
  return (
    <Routes>
      {/* Login */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Bank routes */}
      <Route
        path="/bank/dashboard"
        element={
          <BankOnlyRoute>
            <BankLayout>
              <BankDashboardPage />
            </BankLayout>
          </BankOnlyRoute>
        }
      />
      <Route
        path="/bank/upload"
        element={
          <BankOnlyRoute>
            <BankLayout>
              <BankUploadPage />
            </BankLayout>
          </BankOnlyRoute>
        }
      />
      <Route
        path="/bank/text"
        element={
          <BankOnlyRoute>
            <BankLayout>
              <BankTextPage />
            </BankLayout>
          </BankOnlyRoute>
        }
      />
      <Route
        path="/bank/approvals"
        element={
          <BankOnlyRoute>
            <BankLayout>
              <BankApprovalsPage />
            </BankLayout>
          </BankOnlyRoute>
        }
      />
      <Route
        path="/bank/history"
        element={
          <BankOnlyRoute>
            <BankLayout>
              <BankHistoryPage />
            </BankLayout>
          </BankOnlyRoute>
        }
      />

      {/* Government routes */}
      <Route
        path="/government/submit"
        element={
          <GovernmentOnlyRoute>
            <GovernmentLayout>
              <GovernmentSubmitPage />
            </GovernmentLayout>
          </GovernmentOnlyRoute>
        }
      />
      <Route
        path="/government/history"
        element={
          <GovernmentOnlyRoute>
            <GovernmentLayout>
              <GovHistoryPage />
            </GovernmentLayout>
          </GovernmentOnlyRoute>
        }
      />
      <Route
        path="/government/results"
        element={
          <GovernmentOnlyRoute>
            <GovernmentLayout>
              <GovResultsPage />
            </GovernmentLayout>
          </GovernmentOnlyRoute>
        }
      />

      {/* Fallbacks */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
