import { NavLink, useNavigate } from "react-router-dom";

export default function CompanyNavbar() {
  const navigate = useNavigate();

  const tabs = [
    { label: "Monthly", path: "/company/monthly" },
    { label: "Quarterly", path: "/company/quarterly" },
    { label: "Half Yearly", path: "/company/half-yearly" },
    { label: "Yearly", path: "/company/yearly" },
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
