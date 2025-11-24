import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [admin, setAdmin] = useState(null);

  // Fetch admin from localStorage
  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("admin"));
      if (data && data._id) setAdmin(data);
      else navigate("/admin/login");
    } catch {
      localStorage.removeItem("admin");
      navigate("/admin/login");
    }
  }, [navigate]);

  // Fetch assigned companies
  const fetchCompanies = async () => {
    if (!admin?._id) return;
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:4000/api/company/getByAdmin/${admin._id}`
      );
      setCompanies(res.data?.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin?._id) fetchCompanies();
  }, [admin]);

  // Logout with SweetAlert confirmation
  const handleLogout = () => {
    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, logout!",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("admin");
        localStorage.removeItem("companyLoggedIn"); // optional, can remove if unused
        navigate("/");
        window.location.reload();
      }
    });
  };

  // Open company dashboard directly
  const handleOpenDashboard = (company) => {
    localStorage.setItem("activeCompany", JSON.stringify(company));
    navigate("/company/admin-dashboard");
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-95 transition"
        >
          Logout
        </button>
      </div>

      {/* Assigned Companies */}
      <div className="p-6 bg-white rounded-xl shadow-md">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700 border-b pb-2">
          Your Assigned Companies
        </h2>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : companies.length === 0 ? (
          <p className="text-gray-500">No companies assigned yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {companies.map((company) => (
              <div
                key={company._id}
                className="p-4 bg-blue-50 rounded-lg shadow hover:shadow-lg transition relative"
              >
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  {company.username}
                </h3>
                <p className="text-gray-600 mb-4">
                  {/* Optionally, add more info here */}
                  Assigned to you
                </p>
                <button
                  onClick={() => handleOpenDashboard(company)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 active:scale-95 transition absolute bottom-4 right-4"
                >
                  Open Dashboard
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
