import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Only redirect if a valid admin is stored AND not recently logged out
  useEffect(() => {
    const logoutFlag = sessionStorage.getItem("adminJustLoggedOut");
    const adminData = localStorage.getItem("admin");

    if (adminData && !logoutFlag) {
      try {
        const admin = JSON.parse(adminData);
        if (admin && admin._id) {
          navigate("/admin/dashboard");
        }
      } catch {
        localStorage.removeItem("admin");
      }
    } else {
      // reset logout flag so future logins work fine
      sessionStorage.removeItem("adminJustLoggedOut");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await axios.post("http://localhost:4000/api/admin/login", {
        username,
        password,
      });

      if (data?.admin) {
        localStorage.setItem("admin", JSON.stringify(data.admin));
        sessionStorage.removeItem("adminJustLoggedOut");
        navigate("/admin/dashboard");
      } else {
        setError("Invalid login response");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Admin Login
        </h2>

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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-white font-semibold rounded-lg transition ${
              loading
                ? "bg-green-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-500 text-sm">
          Back to{" "}
          <span
            className="text-green-600 hover:underline cursor-pointer"
            onClick={() => navigate("/")}
          >
            Home
          </span>
        </p>
      </div>
    </div>
  );
}
