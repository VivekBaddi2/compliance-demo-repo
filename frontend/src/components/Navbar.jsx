import { NavLink, useNavigate } from "react-router-dom";

export default function CompanyNavbar() {
  const navigate = useNavigate();
  const company = JSON.parse(localStorage.getItem("activeCompany") || "null");
  const companyId = company?._id || "";

  const tabs = [
    { label: "Monthly", path: companyId ? `/company/subsheet/monthly/${companyId}` : "/company/subsheet/monthly" },
    { label: "Quarterly", path: companyId ? `/company/subsheet/quarterly/${companyId}` : "/company/subsheet/quarterly" },
    { label: "Half Yearly", path: companyId ? `/company/subsheet/half-yearly/${companyId}` : "/company/subsheet/half-yearly" },
    { label: "Yearly", path: companyId ? `/company/subsheet/yearly/${companyId}` : "/company/subsheet/yearly" },
    { label: "Send Reports", path: "/company/send-reports" }
  ];

  return (
    <div className="w-full bg-white shadow-md py-3 px-6 flex gap-4 border-b">
      {tabs.map((t) => (
        <button
          key={t.path}
          onClick={() => navigate(t.path)}
          className="px-4 py-2 text-sm font-medium rounded-md hover:bg-blue-600 hover:text-white transition"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
