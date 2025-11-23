import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import AdminLogin from "./pages/AdminLogin";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import MonthlyPage from "./pages/MonthlyPage";
import QuarterlyPage from "./pages/QuarterlyPage";
import HalfYearlyPage from "./pages/HalfYearlyPage";
import YearlyPage from "./pages/YearlyPage";

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

        {/* Company Dashboard */}
        <Route path="/company/dashboard" element={<CompanyDashboard />} />

        {/* Detailed Sheet Page */}
        <Route path="/company/sheet/:id" element={<DetailedSheetPage />} />

        {/* Redirect /company/sheet without ID to dashboard */}
        <Route path="/company/sheet" element={<CompanyDashboard />} />

        {/* Monthly Page */}
        <Route path="/company/monthly" element={<MonthlyPage />} />

        {/* Quarterly Page */}
        <Route path="/company/quarterly" element={<QuarterlyPage />} />

        {/* Half Yearly Page */}
        <Route path="/company/half-yearly" element={<HalfYearlyPage />} />
        
        {/* Yearly Page */}
        <Route path="/company/yearly" element={<YearlyPage />} />
      </Routes>
    </Router>
  );
}
