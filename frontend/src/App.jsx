import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SubSheetPage from "./pages/SubSheetPage";
import SendReportsPage from "./pages/SendReportsPage";
import SubSheetManager from "./pages/DetailedSheetPage";
import LoginPage from "./pages/LoginPage";

// Company pages
import CompanyDashboardSuperAdmin from "./pages/CompanyDashboardSuperAdmin";
import CompanyDashboardAdmin from "./pages/CompanyDashboardAdmin";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Common login page */}
        <Route path="/LoginPage" element={<LoginPage />} />
        
        {/* Super Admin Dashboard */}
        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />

        {/* Admin Dashboard */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* Company Dashboard for super admin */}
        <Route path="/company/super-dashboard" element={<CompanyDashboardSuperAdmin />} />

        {/* Company dashboard for admin */}
        <Route path="/company/admin-dashboard" element={<CompanyDashboardAdmin />} />

        {/* Detailed Sheet Page */}
        <Route path="/company/sheet/:id" element={<SubSheetManager />} />

        {/* Redirect /company/sheet without ID to dashboard */}
        <Route path="/company/sheet" element={<CompanyDashboardSuperAdmin />} />

        {/* SubSheet common page (type-driven) */}
        <Route path="/company/subsheet/:type/:companyId" element={<SubSheetPage />} />
        <Route path="/company/subsheet/:type" element={<SubSheetPage />} />
        <Route path="/company/subsheet/view/:type/:id" element={<SubSheetPage />} />

        {/* Send Reports Page */}
        <Route path="/company/send-reports" element={<SendReportsPage />} />

        <Route path="/subsheet" element={<SubSheetManager />} />
      </Routes>
    </Router>
  );
}
