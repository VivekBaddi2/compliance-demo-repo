import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import AdminLogin from "./pages/AdminLogin";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CompanyLogin from "./pages/CompanyLogin";

// Company pages
import CompanyDashboard from "./pages/CompanyDashboard";
import DetailedSheetPage from "./pages/DetailedSheetPage";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Super Admin Login */}
        <Route path="/login/super-admin" element={<SuperAdminLogin />} />

        {/* Admin Login */}
        <Route path="/login/admin" element={<AdminLogin />} />

        {/* Super Admin Dashboard */}
        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />

        {/* Admin Dashboard */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* Company Login */}
        <Route path="/company/login" element={<CompanyLogin />} />

        {/* Company Dashboard */}
        <Route path="/company/dashboard" element={<CompanyDashboard />} />

        {/* Detailed Sheet Page */}
        <Route path="/company/sheet/:id" element={<DetailedSheetPage />} />

        {/* Fallback route so /company/sheet works without ID */}
        <Route path="/company/sheet" element={<CompanyDashboard />} />
      </Routes>
    </Router>
  );
}
