import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-gray-100 to-gray-200">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Compliance Management System</h1>
        <p className="text-gray-700 text-lg max-w-xl">
          Manage all your company's compliance records efficiently and securely. Professional, intuitive, and reliable.
        </p>
      </header>

      {/* Login Buttons */}
      <div className="flex flex-col md:flex-row gap-6">
        <button
          onClick={() => navigate("/login/super-admin")}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition"
        >
          Super Admin Login
        </button>

        <button
          onClick={() => navigate("/login/admin")}
          className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition"
        >
          Admin Login
        </button>
      </div>

      {/* Footer */}
      <footer className="mt-20 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Compliance Management System. All rights reserved.
      </footer>
    </div>
  );
}
