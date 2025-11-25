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

  // Modal state
  const [viewCompany, setViewCompany] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingView, setLoadingView] = useState(false);

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
        localStorage.removeItem("companyLoggedIn");
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

  // View company details
  const handleViewCompany = async (companyId) => {
    try {
      setLoadingView(true);
      const res = await axios.get(
        `http://localhost:4000/api/company/view/${companyId}`
      );
      setViewCompany(res.data.data);
      setShowModal(true);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to fetch company details", "error");
    } finally {
      setLoadingView(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setViewCompany(null);
  };

  // Helper to format keys nicely
  const formatKey = (key) =>
    key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

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
                className="p-4 bg-blue-50 rounded-lg shadow hover:shadow-lg transition flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    {company.clientName}
                  </h3>
                  <p className="text-gray-600 mb-4">Assigned to you</p>
                </div>
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleOpenDashboard(company)}
                    className="flex-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 active:scale-95 transition"
                  >
                    Open Dashboard
                  </button>
                  <button
                    onClick={() => handleViewCompany(company._id)}
                    className="flex-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 active:scale-95 transition"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
 {/* Modal for company details */}
{showModal && viewCompany && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
    <div className="bg-white p-6 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto relative shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Company Details {loadingView && "..."}
      </h2>
      <button
        onClick={closeModal}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 font-bold text-2xl"
      >
        ×
      </button>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg">
          <tbody>
            {Object.entries(viewCompany)
              .filter(
                ([key]) =>
                  !["_id", "admin", "adminID", "createdAt", "updatedAt"].includes(
                    key
                  )
              )
              .map(([key, value]) => (
                <tr key={key} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-semibold text-gray-700 bg-gray-50 w-1/3">
                    {formatKey(key)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 break-words">
                    {typeof value === "boolean"
                      ? value
                        ? "Yes"
                        : "No"
                      : value?.toString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
