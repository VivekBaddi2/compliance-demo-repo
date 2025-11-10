import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-gray-900 text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">Compliance Manager</h1>
      <div className="space-x-4">
        <Link to="/" className="hover:text-gray-400">Dashboard</Link>
        <Link to="/monthly" className="hover:text-gray-400">Monthly</Link>
        <Link to="/quarterly" className="hover:text-gray-400">Quarterly</Link>
        <Link to="/halfyearly" className="hover:text-gray-400">Half-Yearly</Link>
        <Link to="/yearly" className="hover:text-gray-400">Yearly</Link>
      </div>
    </nav>
  );
}
