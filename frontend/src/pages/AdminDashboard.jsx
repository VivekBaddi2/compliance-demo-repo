import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("admin"));
      if (data && data._id) {
        setAdmin(data);
      } else {
        navigate("/admin/login");
      }
    } catch {
      localStorage.removeItem("admin");
      navigate("/admin/login");
    }
  }, [navigate]);

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

  const handleLogout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("company");

    // ✅ small delay ensures localStorage clears before redirect
    setTimeout(() => {
      navigate("/");
      window.location.reload(); // ✅ completely resets React state
    }, 50);
  };

  const handleCompanyLogin = (company) => {
    localStorage.setItem("company", JSON.stringify(company));
    navigate("/company/login");
  };

  useEffect(() => {
    if (admin?._id) fetchCompanies();
  }, [admin]);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-95 transition"
        >
          Logout
        </button>
      </div>

      <div className="p-6 bg-white rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Your Companies
        </h2>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : companies.length === 0 ? (
          <p className="text-gray-500">No companies found</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border-b p-3 text-left">Company Username</th>
                <th className="border-b p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company._id} className="hover:bg-gray-50">
                  <td className="border-b p-3">{company.username}</td>
                  <td className="border-b p-3">
                    <button
                      onClick={() => handleCompanyLogin(company)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 active:scale-95 transition"
                    >
                      Login
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
