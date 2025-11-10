import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [error, setError] = useState("");

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("superAdmin");
    navigate("/");
  };

  // Fetch all admins
  const fetchAdmins = async () => {
    try {
      setLoadingAdmins(true);
      const res = await axios.get("http://localhost:4000/api/admin/getAll");
      setAdmins(res.data);
      setLoadingAdmins(false);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch admins");
      setLoadingAdmins(false);
    }
  };

  // Fetch all companies
  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const res = await axios.get("http://localhost:4000/api/company/getAll");
      setCompanies(res.data.data);
      setLoadingCompanies(false);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch companies");
      setLoadingCompanies(false);
    }
  };

  // Create new admin
  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const superAdmin = JSON.parse(localStorage.getItem("superAdmin"));
      if (!superAdmin?._id) {
        setError("Super admin not logged in");
        navigate("/super-admin/login");
        return;
      }

      await axios.post("http://localhost:4000/api/admin/create", {
        username,
        password,
        createdBy: superAdmin._id,
      });

      setUsername("");
      setPassword("");
      fetchAdmins();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to create admin");
    }
  };

  // Delete admin
  const handleDeleteAdmin = async (id) => {
    if (!window.confirm("Are you sure you want to delete this admin?")) return;

    try {
      await axios.delete(`http://localhost:4000/api/admin/delete/${id}`);
      fetchAdmins();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to delete admin");
    }
  };

  // Delete company
  const handleDeleteCompany = async (id) => {
    if (!window.confirm("Are you sure you want to delete this company?"))
      return;

    try {
      await axios.delete(`http://localhost:4000/api/company/delete/${id}`);
      fetchCompanies();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to delete company");
    }
  };

  // On mount, fetch admins, companies and check login
  useEffect(() => {
    const superAdmin = JSON.parse(localStorage.getItem("superAdmin"));
    if (!superAdmin?._id) {
      navigate("/super-admin/login");
      return;
    }
    fetchAdmins();
    fetchCompanies();
  }, [navigate]);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      {/* Top bar with logout */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {/* Add Admin Form */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Add New Admin</h2>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <form
          onSubmit={handleCreate}
          className="flex flex-col md:flex-row gap-4"
        >
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="px-4 py-2 border rounded-lg flex-1"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="px-4 py-2 border rounded-lg flex-1"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Admin
          </button>
        </form>
      </div>

      {/* Admins Table */}
      <div className="p-4 bg-white rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">All Admins</h2>
        {loadingAdmins ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="border-b p-2">Username</th>
                <th className="border-b p-2">Created By</th>
                <th className="border-b p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin._id}>
                  <td className="border-b p-2">{admin.username}</td>
                  <td className="border-b p-2">
                    {admin.createdBy?.username || "N/A"}
                  </td>
                  <td className="border-b p-2">
                    <button
                      onClick={() => handleDeleteAdmin(admin._id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Companies Table */}
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">All Companies</h2>
        {loadingCompanies ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="border-b p-2">Company Username</th>
                <th className="border-b p-2">Admin</th>
                <th className="border-b p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company._id}>
                  <td className="border-b p-2">{company.username}</td>
                  <td className="border-b p-2">
                    {company.adminId?.username || "N/A"}
                  </td>
                  <td className="border-b p-2">
                    <button
                      onClick={() => handleDeleteCompany(company._id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
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
