import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function ClientSheets() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all companies for superadmin
  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:4000/api/company/getAll");
      setClients(res.data.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch client sheets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Open company dashboard directly
  const handleOpenDashboard = (company) => {
    localStorage.setItem("activeCompany", JSON.stringify(company));
    navigate("/company/dashboard");
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Client Sheets</h1>
      </div>

      {/* Content */}
      <div className="bg-white p-6 rounded-xl shadow">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, idx) => (
              <div
                key={idx}
                className="p-4 bg-gray-200 rounded-lg animate-pulse h-44"
              />
            ))}
          </div>
        ) : error ? (
          <p className="text-red-600 text-center">{error}</p>
        ) : clients.length === 0 ? (
          <p className="text-gray-500 text-center">No companies found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {clients.map((company) => (
              <div
                key={company._id}
                className="p-6 bg-blue-50 rounded-lg shadow hover:shadow-lg transition relative flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    {company.username}
                  </h3>
                  <p className="text-gray-600">
                    Assigned Admin: {company.adminId?.username || "None"}
                  </p>
                </div>
                <button
                  onClick={() => handleOpenDashboard(company)}
                  className="mt-4 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 active:scale-95 transition self-start"
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
