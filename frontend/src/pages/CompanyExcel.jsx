import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CompanyDashboard from "./CompanyDashboard";
import DetailedSheetPage from "./DetailedSheetPage";

export default function CompanyExcel() {
  const navigate = useNavigate();
  const company = JSON.parse(localStorage.getItem("company"));
  const [activeSheet, setActiveSheet] = useState("dashboard"); // dashboard or monthly/quarterly/half-yearly/yearly
  const [selectedHead, setSelectedHead] = useState(null);

  if (!company?._id) {
    navigate("/company/login");
    return null;
  }

  const sheetTypes = ["dashboard", "monthly", "quarterly", "half-yearly", "yearly"];

  const handleLogout = () => {
    localStorage.removeItem("company");
    localStorage.removeItem("admin"); 
    navigate("/");
  };

  const handleSheetClick = (head) => {
    setSelectedHead(head); // open detailed sheet for clicked head
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Company Dashboard & Sheets</h1>
        <div className="flex gap-3 items-center">
          <span className="text-sm text-gray-600">Active: {activeSheet}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Sheet toggles */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {sheetTypes.map((t) => (
          <button
            key={t}
            onClick={() => {
              setActiveSheet(t);
              setSelectedHead(null);
            }}
            className={`px-4 py-2 rounded-md font-medium ${
              activeSheet === t ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Sheet content */}
      <div>
        {activeSheet === "dashboard" && !selectedHead ? (
          <CompanyDashboard companyId={company._id} onSheetClick={handleSheetClick} />
        ) : (
          <DetailedSheetPage company={company} headType={selectedHead || activeSheet} />
        )}
      </div>
    </div>
  );
}
