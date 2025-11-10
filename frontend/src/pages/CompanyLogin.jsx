import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function CompanyLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Prefill username if admin clicked "Login" on a company row
  useEffect(() => {
    const company = JSON.parse(localStorage.getItem("company"));
    if (company?.username) {
      setUsername(company.username);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post("http://localhost:4000/api/company/login", {
        username,
        password,
      });

      if (response.data.success) {
        // Save logged-in company info
        localStorage.setItem("companyLoggedIn", JSON.stringify(response.data.data));
        navigate("/company/sheet"); // Redirect to company sheet page
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || "Server Error");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Company Login</h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">{error}</div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            Login
          </button>
        </form>

        <p className="mt-6 text-center text-gray-500 text-sm">
          Back to{" "}
          <span
            className="text-blue-600 hover:underline cursor-pointer"
            onClick={() => navigate("/admin/dashboard")}
          >
            Admin Dashboard
          </span>
        </p>
      </div>
    </div>
  );
}
