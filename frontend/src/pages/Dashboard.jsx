import Navbar from "../components/Navbar";
import ComplianceTable from "../components/ComplianceTable";

export default function Dashboard() {
  const companyId = "YOUR_COMPANY_ID"; // replace with selected company id
  const adminId = "YOUR_ADMIN_ID"; // replace with current admin id

  return (
    <div>
      <Navbar />
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <ComplianceTable sheetType="dashboard" companyId={companyId} adminId={adminId} />
      </div>
    </div>
  );
}
