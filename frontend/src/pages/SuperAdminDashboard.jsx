import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import ClientSheets from "../components/ClientSheets";

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("admins");
       const handleLogout = () => {
    localStorage.removeItem("superAdmin");
    window.location.href = "/";
  };


  // Admin state
  const [admins, setAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ username: "", password: "" });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [viewCompany, setViewCompany] = useState(null);

  const formatKey = (key) => {
    const words = key
      .replace(/([A-Z])/g, " $1") // camelCase → separate words
      .replace(/_/g, " ") // snake_case → spaces
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
    return words.join(" ");
  };
  const openModal = (company) => {
    setViewCompany(company);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setViewCompany(null);
  };

  // Company state
  const [companies, setCompanies] = useState([]);
  const [newCompany, setNewCompany] = useState({
    clientName: "",
    structure: "",
    CIN: "",
    PAN: "",
    GST: "",
    dateOfIncorporation: "",
    address: "",
    phone: "",
    email: "",
    udhyamAdhaar: "",
    udhyamAdhaarCategory: "",
    PF: "",
    ESI: "",
    PTEmployer: "",
    PTEmployee: "",
  });


  // Allotment state
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [fromAdmin, setFromAdmin] = useState("");
  const [toAdmin, setToAdmin] = useState("");
  const [companiesToReallot, setCompaniesToReallot] = useState([]);

  const fetchAdmins = async () => {
    const res = await axios.get(
      "http://localhost:4000/api/superadmin/adminsWithCompanies"
    );
    setAdmins(res.data.data);
  };

  const fetchCompanies = async () => {
    const res = await axios.get(
      "http://localhost:4000/api/superadmin/companiesWithAdmins"
    );
    setCompanies(res.data.data);
  };

  useEffect(() => {
    fetchAdmins();
    fetchCompanies();
  }, []);

  const handleRemoveAllotment = async (adminId, companyId) => {
    const result = await Swal.fire({
      title: "Remove Allotment?",
      text: "Are you sure you want to remove this company from the admin?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove it!",
    });

    if (result.isConfirmed) {
      try {
        // Call dedicated API to remove company from admin
        await axios.delete(
          `http://localhost:4000/api/superadmin/removeCompany/${adminId}/${companyId}`
        );

        Swal.fire(
          "Removed!",
          "The company has been removed from the admin.",
          "success"
        );

        // Refresh admins list to update UI
        fetchAdmins();
      } catch (err) {
        Swal.fire("Error!", err.response?.data?.msg || "Server error", "error");
      }
    }
  };

  // ---------------- Admin Handlers ----------------
  const handleAddAdmin = async () => {
    if (!newAdmin.username || !newAdmin.password) {
      Swal.fire("Error", "All fields required", "error");
      return;
    }
    try {
      await axios.post("http://localhost:4000/api/superadmin/createAdmin", {
        ...newAdmin,
        createdBy: JSON.parse(localStorage.getItem("superAdmin"))._id,
      });
      Swal.fire("Success", "Admin added successfully", "success");
      setNewAdmin({ username: "", password: "" });
      fetchAdmins();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.msg || "Server Error", "error");
    }
  };

  const handleDeleteAdmin = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This admin will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(
          `http://localhost:4000/api/superadmin/deleteAdmin/${id}`
        );
        Swal.fire("Deleted!", "Admin has been deleted.", "success");
        fetchAdmins();
      } catch (err) {
        Swal.fire("Error", err.response?.data?.msg || "Server Error", "error");
      }
    }
  };

  const handleEditAdmin = async (admin) => {
    const { value: formValues } = await Swal.fire({
      title: "Edit Admin",
      html: `
      <input id="swal-username" class="swal2-input" placeholder="Username" value="${
        admin.username || ""
      }">
      <input id="swal-password" type="password" class="swal2-input" placeholder="Password" value="">
      <button id="togglePass" type="button" class="text-sm absolute top-2 right-2">👁️</button>
    `,
      focusConfirm: false,
      didOpen: () => {
        const passwordInput = document.getElementById("swal-password");
        const toggleIcon = document.getElementById("togglePass");

        toggleIcon.addEventListener("click", () => {
          if (passwordInput.type === "password") {
            passwordInput.type = "text";
            toggleIcon.textContent = "🙈";
          } else {
            passwordInput.type = "password";
            toggleIcon.textContent = "👁️";
          }
        });
      },
      preConfirm: () => {
        const username = document.getElementById("swal-username").value;
        const password = document.getElementById("swal-password").value;
        if (!username) {
          Swal.showValidationMessage("Username is required");
        }
        return { username, password };
      },
    });

    if (formValues) {
      try {
        await axios.put(
          `http://localhost:4000/api/superadmin/update-admin/${admin._id}`,
          formValues
        );

        Swal.fire("Success", "Admin updated successfully", "success");
        fetchAdmins();
      } catch (err) {
        Swal.fire("Error", err.response?.data?.msg || "Server Error", "error");
      }
    }
  };

  // ---------------- Company Handlers ----------------
  // ---------------- Add Company ----------------
  const handleAddCompany = async () => {
    const { clientName, structure } = newCompany;
    if (!clientName || !structure) {
      Swal.fire("Error", "Client Name and Structure are required", "error");
      return;
    }
    try {
      await axios.post(
        "http://localhost:4000/api/superadmin/createCompany",
        newCompany
      );
      Swal.fire("Success", "Company added successfully", "success");
      // Reset form
      setNewCompany({
        clientName: "",
        structure: "",
        cin: "",
        pan: "",
        gst: "",
        dateOfIncorporation: "",
        address: "",
        phone: "",
        email: "",
        udhyamAdhaar: "",
        udhyamAdhaarCategory: "",
        pf: "",
        esi: "",
        ptEmployer: "",
        ptEmployee: "",
      });
      fetchCompanies();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.msg || "Server Error", "error");
    }
  };

  // ---------------- Delete Company ----------------
  const handleDeleteCompany = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This company will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(
          `http://localhost:4000/api/superadmin/deleteCompany/${id}`
        );
        Swal.fire("Deleted!", "Company has been deleted.", "success");
        fetchCompanies();
      } catch (err) {
        Swal.fire("Error", err.response?.data?.msg || "Server Error", "error");
      }
    }
  };

  // ---------------- Edit Company ----------------
  const handleEditCompany = async (company) => {
    const { value: formValues } = await Swal.fire({
      title: "Edit Company",
      html: `
      <input id="swal-clientName" class="swal2-input" placeholder="Client Name" value="${
        company.clientName || ""
      }">
      <input id="swal-structure" class="swal2-input" placeholder="Structure" value="${
        company.structure || ""
      }">
      <input id="swal-cin" class="swal2-input" placeholder="CIN" value="${
        company.cin || ""
      }">
      <input id="swal-pan" class="swal2-input" placeholder="PAN" value="${
        company.pan || ""
      }">
      <input id="swal-gst" class="swal2-input" placeholder="GST" value="${
        company.gst || ""
      }">
      <input id="swal-date" type="date" class="swal2-input" placeholder="Date of Incorporation" value="${
        company.dateOfIncorporation || ""
      }">
      <input id="swal-address" class="swal2-input" placeholder="Address" value="${
        company.address || ""
      }">
      <input id="swal-phone" class="swal2-input" placeholder="Phone" value="${
        company.phone || ""
      }">
      <input id="swal-email" type="email" class="swal2-input" placeholder="Email" value="${
        company.email || ""
      }">
      <input id="swal-udhyamAdhaar" class="swal2-input" placeholder="Udhyam Adhaar" value="${
        company.udhyamAdhaar || ""
      }">
      <input id="swal-udhyamAdhaarCategory" class="swal2-input" placeholder="Udhyam Adhaar Category" value="${
        company.udhyamAdhaarCategory || ""
      }">
      <input id="swal-pf" class="swal2-input" placeholder="PF" value="${
        company.pf || ""
      }">
      <input id="swal-esi" class="swal2-input" placeholder="ESI" value="${
        company.esi || ""
      }">
      <input id="swal-ptEmployer" class="swal2-input" placeholder="PT (Employer)" value="${
        company.ptEmployer || ""
      }">
      <input id="swal-ptEmployee" class="swal2-input" placeholder="PT (Employee)" value="${
        company.ptEmployee || ""
      }">
    `,
      focusConfirm: false,
      preConfirm: () => {
        return {
          clientName: document.getElementById("swal-clientName").value,
          structure: document.getElementById("swal-structure").value,
          cin: document.getElementById("swal-cin").value,
          pan: document.getElementById("swal-pan").value,
          gst: document.getElementById("swal-gst").value,
          dateOfIncorporation: document.getElementById("swal-date").value,
          address: document.getElementById("swal-address").value,
          phone: document.getElementById("swal-phone").value,
          email: document.getElementById("swal-email").value,
          udhyamAdhaar: document.getElementById("swal-udhyamAdhaar").value,
          udhyamAdhaarCategory: document.getElementById(
            "swal-udhyamAdhaarCategory"
          ).value,
          pf: document.getElementById("swal-pf").value,
          esi: document.getElementById("swal-esi").value,
          ptEmployer: document.getElementById("swal-ptEmployer").value,
          ptEmployee: document.getElementById("swal-ptEmployee").value,
        };
      },
    });

    if (formValues) {
      try {
        await axios.put(
          `http://localhost:4000/api/superadmin/update-company/${company._id}`,
          formValues
        );
        Swal.fire("Success", "Company updated successfully", "success");
        fetchCompanies();
      } catch (err) {
        Swal.fire("Error", err.response?.data?.msg || "Server Error", "error");
      }
    }
  };

  // ---------------- Allotment Handlers ----------------
  const handleAllotCompanies = async () => {
    if (!selectedAdmin || selectedCompanies.length === 0) {
      Swal.fire("Error", "Select admin and companies", "error");
      return;
    }
    try {
      await axios.post("http://localhost:4000/api/superadmin/assignCompanies", {
        adminId: selectedAdmin,
        companyIds: selectedCompanies,
      });
      Swal.fire("Success", "Companies allotted successfully", "success");
      setSelectedAdmin("");
      setSelectedCompanies([]);
      fetchAdmins();
      fetchCompanies();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.msg || "Server Error", "error");
    }
  };

  const handleReallotCompanies = async () => {
    if (!fromAdmin || !toAdmin || companiesToReallot.length === 0) {
      Swal.fire("Error", "Select admins and companies to reallot", "error");
      return;
    }
    try {
      await axios.post(
        "http://localhost:4000/api/superadmin/reallotCompanies",
        {
          fromAdminId: fromAdmin,
          toAdminId: toAdmin,
          companyIds: companiesToReallot,
        }
      );
      Swal.fire("Success", "Companies re-allotted successfully", "success");
      setFromAdmin("");
      setToAdmin("");
      setCompaniesToReallot([]);
      fetchAdmins();
      fetchCompanies();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.msg || "Server Error", "error");
    }
  };



  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">
        Super Admin Dashboard
      </h1>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {/* Toggle Buttons */}
      <div className="flex justify-center gap-4 mb-6">
        {["admins", "companies", "allotments", "clients"].map((tab) => (
          <button
            key={tab}
            className={`px-6 py-2 rounded-lg font-semibold ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-white shadow hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "clients"
              ? "Client Sheets"
              : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ---------------- Admins Section ---------------- */}
      {activeTab === "admins" && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-2xl font-bold mb-4">Admins</h2>

          {/* Add Admin Form */}
          <div className="flex flex-wrap gap-4 mb-4">
            <input
              type="text"
              placeholder="Username"
              value={newAdmin.username}
              onChange={(e) =>
                setNewAdmin({ ...newAdmin, username: e.target.value })
              }
              className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]"
            />
            <input
              type="password"
              placeholder="Password"
              value={newAdmin.password}
              onChange={(e) =>
                setNewAdmin({ ...newAdmin, password: e.target.value })
              }
              className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]"
            />
            <button
              onClick={handleAddAdmin}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Admin
            </button>
          </div>

          {/* Admins Table */}
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border px-4 py-2">Username</th>
                  <th className="border px-4 py-2">Companies Assigned</th>
                  <th className="border px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{admin.username}</td>
                    <td className="border px-4 py-2">
                      {admin.assignedCompanies?.length > 0
                        ? admin.assignedCompanies
                            .map((c) => c.clientName)
                            .join(", ")
                        : "None"}
                    </td>
                    <td className="border px-4 py-2 space-x-2">
                      <button
                        onClick={() => handleEditAdmin(admin)}
                        className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAdmin(admin._id)}
                        className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- Companies Section ---------------- */}
      {activeTab === "companies" && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-2xl font-bold mb-4">Companies</h2>

          {/* ---------------- Add Company Form ---------------- */}
          <div className="flex flex-wrap gap-4 mb-4">
            <input
              type="text"
              placeholder="Client Name"
              value={newCompany.clientName || ""}
              onChange={(e) =>
                setNewCompany({ ...newCompany, clientName: e.target.value })
              }
              className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]"
            />
            <select
              value={newCompany.structure || ""}
              onChange={(e) =>
                setNewCompany({ ...newCompany, structure: e.target.value })
              }
              className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]"
            >
              <option value="">Select Structure</option>
              {[
                "Company",
                "LLP",
                "Partnership Firm",
                "Trust",
                "Proprietor",
                "AOP",
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="CIN"
              value={newCompany.cin || ""}
              onChange={(e) =>
                setNewCompany({ ...newCompany, cin: e.target.value })
              }
              className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]"
            />
            <input
              type="text"
              placeholder="PAN"
              value={newCompany.pan || ""}
              onChange={(e) =>
                setNewCompany({ ...newCompany, pan: e.target.value })
              }
              className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]"
            />
            <input
              type="text"
              placeholder="GST"
              value={newCompany.gst || ""}
              onChange={(e) =>
                setNewCompany({ ...newCompany, gst: e.target.value })
              }
              className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]"
            />
            <input
              type="date"
              placeholder="Date of Incorporation/DOB"
              value={newCompany.dateOfIncorporation || ""}
              onChange={(e) =>
                setNewCompany({
                  ...newCompany,
                  dateOfIncorporation: e.target.value,
                })
              }
              className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]"
            />
            <input
              type="text"
              placeholder="Address"
              value={newCompany.address || ""}
              onChange={(e) =>
                setNewCompany({ ...newCompany, address: e.target.value })
              }
              className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]"
            />
            <input
              type="text"
              placeholder="Phone"
              value={newCompany.phone || ""}
              onChange={(e) =>
                setNewCompany({ ...newCompany, phone: e.target.value })
              }
              className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]"
            />
            <input
              type="email"
              placeholder="Email"
              value={newCompany.email || ""}
              onChange={(e) =>
                setNewCompany({ ...newCompany, email: e.target.value })
              }
              className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]"
            />
            <input
              type="text"
              placeholder="Udhyam Adhaar"
              value={newCompany.udhyamAdhaar || ""}
              onChange={(e) =>
                setNewCompany({ ...newCompany, udhyamAdhaar: e.target.value })
              }
              className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]"
            />
            <input
              type="text"
              placeholder="Udhyam Adhaar Category"
              value={newCompany.udhyamAdhaarCategory || ""}
              onChange={(e) =>
                setNewCompany({
                  ...newCompany,
                  udhyamAdhaarCategory: e.target.value,
                })
              }
              className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]"
            />
            <input
              type="text"
              placeholder="PF"
              value={newCompany.pf || ""}
              onChange={(e) =>
                setNewCompany({ ...newCompany, pf: e.target.value })
              }
              className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]"
            />
            <input
              type="text"
              placeholder="ESI"
              value={newCompany.esi || ""}
              onChange={(e) =>
                setNewCompany({ ...newCompany, esi: e.target.value })
              }
              className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]"
            />
            <input
              type="text"
              placeholder="PT (Employer)"
              value={newCompany.ptEmployer || ""}
              onChange={(e) =>
                setNewCompany({ ...newCompany, ptEmployer: e.target.value })
              }
              className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]"
            />
            <input
              type="text"
              placeholder="PT (Employee)"
              value={newCompany.ptEmployee || ""}
              onChange={(e) =>
                setNewCompany({ ...newCompany, ptEmployee: e.target.value })
              }
              className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]"
            />

            <button
              onClick={handleAddCompany}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Company
            </button>
          </div>

          {/* ---------------- Companies Table ---------------- */}
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border px-4 py-2">Client Name</th>
                  <th className="border px-4 py-2">Structure</th>
                  <th className="border px-4 py-2">Admin Assigned</th>
                  <th className="border px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company._id} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{company.clientName}</td>
                    <td className="border px-4 py-2">{company.structure}</td>
                    <td className="border px-4 py-2">
                      {company.adminId?.username || "None"}
                    </td>
                    <td className="border px-4 py-2 space-x-2">
                      <button
                        onClick={() => openModal(company)}
                        className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEditCompany(company)}
                        className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCompany(company._id)}
                        className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- Allotments Section ---------------- */}
      {activeTab === "allotments" && (
        <div className="bg-gray-50 p-6 rounded-xl shadow">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
            Allot Companies
          </h2>

          {/* ---------------- Current Assignments ---------------- */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h3 className="text-xl font-semibold mb-4">Current Assignments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
              {admins.map((a) => (
                <div
                  key={a._id}
                  className="bg-blue-50 p-3 rounded-lg shadow-sm border border-blue-100"
                >
                  <h4 className="font-semibold text-blue-800 mb-2">
                    {a.username}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {a.assignedCompanies?.length > 0 ? (
                      a.assignedCompanies.map((c) => (
                        <div key={c._id} className="relative inline-block">
                          <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-sm inline-flex items-center gap-1">
                            {c.clientName}
                            <button
                              onClick={() =>
                                handleRemoveAllotment(a._id, c._id)
                              }
                              className="ml-1 text-blue-900 hover:text-red-600 font-bold text-xs"
                            >
                              ×
                            </button>
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">
                        No companies assigned
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="my-6 border-gray-300" />

          {/* ---------------- Assign Companies ---------------- */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200">
            <h3 className="text-xl font-semibold mb-4">
              Assign Companies to Admin
            </h3>
            <div className="flex flex-wrap gap-6 items-end">
              <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                <label className="font-semibold text-gray-700">
                  Select Admin
                </label>
                <select
                  value={selectedAdmin}
                  onChange={(e) => setSelectedAdmin(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Admin</option>
                  {admins.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.username}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                <label className="font-semibold text-gray-700">
                  Select Companies
                </label>
                <select
                  multiple
                  value={selectedCompanies}
                  onChange={(e) =>
                    setSelectedCompanies(
                      Array.from(e.target.selectedOptions, (o) => o.value)
                    )
                  }
                  className="px-3 py-2 border rounded-lg h-32 overflow-y-auto"
                >
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.clientName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAllotCompanies}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 self-start"
              >
                Allot
              </button>
            </div>
          </div>

          <hr className="my-6 border-gray-300" />

          {/* ---------------- Re-allot Companies ---------------- */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200">
            <h3 className="text-xl font-semibold mb-4">Re-allot Companies</h3>
            <div className="flex flex-wrap gap-6 items-end">
              <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                <label className="font-semibold text-gray-700">
                  From Admin
                </label>
                <select
                  value={fromAdmin}
                  onChange={(e) => setFromAdmin(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Admin</option>
                  {admins.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.username}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                <label className="font-semibold text-gray-700">
                  Companies to Re-allot
                </label>
                <select
                  multiple
                  value={companiesToReallot}
                  onChange={(e) =>
                    setCompaniesToReallot(
                      Array.from(e.target.selectedOptions, (o) => o.value)
                    )
                  }
                  className="px-3 py-2 border rounded-lg h-32 overflow-y-auto"
                >
                  {fromAdmin &&
                    admins
                      .find((a) => a._id === fromAdmin)
                      ?.assignedCompanies?.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.clientName} {/* Updated to clientName */}
                        </option>
                      ))}
                </select>
              </div>

              <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                <label className="font-semibold text-gray-700">To Admin</label>
                <select
                  value={toAdmin}
                  onChange={(e) => setToAdmin(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Admin</option>
                  {admins.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.username}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleReallotCompanies}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 self-start"
              >
                Re-allot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Client Sheets Section ---------------- */}
      {activeTab === "clients" && (
        <div className="bg-white p-6 rounded-xl shadow">
          <ClientSheets />
        </div>
      )}

      {/* Company Details Modal */}
      {showModal && viewCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto relative shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Company Details
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
                        ![
                          "_id",
                          "admin",
                          "adminId",
                          "createdAt",
                          "updatedAt",
                          "__v",
                        ].includes(key)
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
