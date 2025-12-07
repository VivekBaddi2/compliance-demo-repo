import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[url('/homepage-banner.jpg')] flex flex-col justify-center items-center ">
      {/* Header */}
      <header className="text-center mb-12 flex flex-col items-center gap-4">
        <img src="/fintel-color-logo-cropped.png" alt="fintel-logo" className="w-60 md:w-80" />
        <h1 className="text-5xl font-bold text-[var(--text-color-primary)] mb-4">Compliance Management System</h1>
        <p className="text-[var(--text-color-gray)] mx-auto text-center text-lg max-w-md">
          All Your Compliance needs at one place, manage all admins, clients and their taxes
        </p>
      </header>

      {/* Login Buttons */}
      <div className="flex flex-col md:flex-row gap-6">
        <button
          onClick={() => navigate("/LoginPage")}
          className="px-10 py-2 bg-[var(--main-color)] text-[var(--text-color-secondary)] hover:bg-[var(--button-hover-color)] active:scale-95 text-2xl font-bold rounded-xl shadow-md transition"
        >
          Login
        </button>

      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 mb-5 text-[var(--text-color-gray)] text-md">
        &copy; {new Date().getFullYear()} Compliance Management System. All rights reserved.
      </footer>
    </div>
  );
}
