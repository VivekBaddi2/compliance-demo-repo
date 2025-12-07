import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import ClientSheets from "../components/ClientSheets";
import AssignTaskModal from "../components/AssignTaskModal";
import { useNavigate } from "react-router-dom";
import TypewriterText from "../components/TypewriterText";

export default function SuperAdminDashboard() {

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("admins"); // for switching between menu items
  const [activeSubTab, setActiveSubTab] = useState(""); // for switching between tabs within the page
  const [menuCollapse, setMenuCollapse] = useState(false);
  const [username, setUsername] = useState("");

  // Navigate to home page if not logged in
  useEffect(() => {
    const userJsonString = localStorage.getItem("superAdmin"); //get suepradmin data to get username
    if (!userJsonString) {
      navigate('/');
      return;
    }
    try {
      const userData = JSON.parse(userJsonString); //store superadmin data from userJsonString in userData
      setUsername(userData.username) //extract username from userData
    }
    catch (err) {
      console.log(err);
      navigate('/');
    }

  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem("superAdmin");
    localStorage.removeItem("userType");
    window.location.href = "/";
  };

  // Admin state
  const [admins, setAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ username: "", password: "" });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [viewCompany, setViewCompany] = useState(null);

  const [showAddCompany, setShowAddCompany] = useState(false);

  // Edit company modal states
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState(null);

  // Assign Task modal state (separate from company modal)
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskModalAdmin, setTaskModalAdmin] = useState(null);

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

  // Open assign task modal for a specific admin
  const openAssignModal = (admin) => {
    setTaskModalAdmin(admin);
    setTaskModalOpen(true);
  };

  // Close assign task modal. If didCreate === true, refresh admins list.
  const closeAssignModal = (didCreate = false) => {
    setTaskModalOpen(false);
    setTaskModalAdmin(null);
    if (didCreate) {
      // refresh admins to show any new task-related UI (if needed)
      fetchAdmins();
    }
  };

  // Company state
  const [companies, setCompanies] = useState([]);
  const [newCompany, setNewCompany] = useState({
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
    directors: [
      {
        name: "",
        din: "",
        pan: "",
        dob: "",
        mobile: "",
        email: "",
      },
    ],

    authorisedPersons: [
      {
        name: "",
        din: "",
        pan: "",
        dob: "",
      },
    ],
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
      console.log(err)
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
      <input id="swal-username" class="swal2-input" placeholder="Username" value="${admin.username || ""
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

  const updateDirector = (index, field, value) => {
    setNewCompany((prevCompany) => {
      const updatedDirectors = prevCompany.directors.map((director, i) =>
        i === index ? { ...director, [field]: value } : director
      );
      return { ...prevCompany, directors: updatedDirectors };
    });
  };

  // Add a new empty director
  const addDirector = () => {
    setNewCompany((prevCompany) => ({
      ...prevCompany,
      directors: [
        ...prevCompany.directors,
        { name: "", din: "", pan: "", dob: "", mobile: "", email: "" },
      ],
    }));
  };

  // Remove a director by index
  const removeDirector = (index) => {
    setNewCompany((prevCompany) => ({
      ...prevCompany,
      directors: prevCompany.directors.filter((_, i) => i !== index),
    }));
  };

  // ================================
  // AUTHORISED PERSONS MANAGEMENT
  // ================================

  // Update a specific field of an authorised person at a given index
  const updateAuthPerson = (index, field, value) => {
    setNewCompany((prevCompany) => {
      const updatedPersons = prevCompany.authorisedPersons.map((person, i) =>
        i === index ? { ...person, [field]: value } : person
      );
      return { ...prevCompany, authorisedPersons: updatedPersons };
    });
  };

  // Add a new empty authorised person
  const addAuthPerson = () => {
    setNewCompany((prevCompany) => ({
      ...prevCompany,
      authorisedPersons: [
        ...prevCompany.authorisedPersons,
        { name: "", din: "", pan: "", dob: "" },
      ],
    }));
  };

  // Remove an authorised person by index
  const removeAuthPerson = (index) => {
    setNewCompany((prevCompany) => ({
      ...prevCompany,
      authorisedPersons: prevCompany.authorisedPersons.filter((_, i) => i !== index),
    }));
  };

  // ---------------- Add Company ----------------
  const handleAddCompany = async () => {
    const { clientName, structure } = newCompany;

    // Validate required fields
    if (!clientName || !structure) {
      Swal.fire("Error", "Client Name and Structure are required", "error");
      return;
    }

    try {
      // Send POST request to backend
      await axios.post(
        "http://localhost:4000/api/superadmin/createCompany",
        newCompany
      );

      Swal.fire("Success", "Company added successfully", "success");

      // Reset form including directors and authorisedPersons
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
        directors: [
          { name: "", din: "", pan: "", dob: "", mobile: "", email: "" },
        ],
        authorisedPersons: [
          { name: "", din: "", pan: "", dob: "" },
        ],
      });

      // Refetch companies to update table
      fetchCompanies();
    } catch (err) {
      console.error(err); // log for debugging
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
  const handleEditCompany = (company) => {
    setCompanyToEdit(company);
    setShowEditCompany(true);
  }

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
    <div className="h-screen p-6 bg-[var(--bg-primary)]">
      {/* <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">
        Super Admin Dashboard
      </h1> */}
      <section className="flex h-full">
        <section className={`sideBarSection mt-4 flex h-[90vh] w-1/5`}>
          {/* Toggle Buttons */}
          <div className={`w-[70%] h-[100%]  flex flex-col items-center gap-4 mt-2 mb-6 `}>
            {/* logo */}
            <div>
              <img src="/fintel-color-logo-cropped.png" alt="fintel logo" className="w-60 mb-12" />
            </div>

            {/* menu */}
            <div className="flex flex-col gap-8">
              {[{ symbolWhite: "/superadmindashmenuicons/admin-white.png", symbolBlue: "/superadmindashmenuicons/admin-blue.png", value: "admins" }, { symbolWhite: "/superadmindashmenuicons/companies-white.png", symbolBlue: "/superadmindashmenuicons/companies-blue.png", value: "companies" }, { symbolWhite: "/superadmindashmenuicons/allotments-white.png", symbolBlue: "/superadmindashmenuicons/allotments-blue.png", value: "allotments" }, { symbolWhite: "/superadmindashmenuicons/sheets-white.png", symbolBlue: "/superadmindashmenuicons/sheets-blue.png", value: "clients" }].map((tab) => (

                <div className={`flex items-center w-full gap-4 px-6 py-3 rounded-lg font-semibold text-[var(--text-color-primary)] transition-all duration-300 ease-in-out ${activeTab === tab.value
                  ? "bg-[var(--main-color)] text-[var(--text-color-secondary)] hover:bg-[var(--button-hover-color)]"
                  : ""
                  }`}>
                  {
                    activeTab == tab.value ?
                      <img src={tab.symbolWhite} alt="symbol" className="w-6 h-6" />
                      :
                      <img src={tab.symbolBlue} alt="symbol" className="w-6 h-6" />
                  }
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                  >
                    {tab.value === "clients"
                      ? "Client Sheets"
                      : tab.value.charAt(0).toUpperCase() + tab.value.slice(1)}
                  </button>
                </div>

              ))}
            </div>

            {/* sign out */}
            <div
              onClick={handleLogout}
              className="my-4 w-full flex justify-center items-center rounded-lg bg-[var(--button-signout-bg)] hover:bg-[var(--button-signout-bg-hover)] text-[var(--button-signout-text)] cursor-pointer transition-all duration-300 ease-in-out">
              <img src={"/superadmindashmenuicons/signout-red.png"} alt="symbol" className="w-6 h-6 rotate-180" />
              <button
                className=" px-6 py-3 font-semibold rounded-lg"
              >
                Sign Out
              </button>
            </div>
          </div>

        </section>

        <section className={`mainContentSection  w-4/5 h-[100%]`}>
          <div className="h-full flex">

            <div className="bg-[var(--bg-secondary)] w-full h-full flex flex-col gap-[64px] p-8 rounded-xl shadow">
              <div className="w-full text-[var(--text-color-primary)] text-3xl font-bold">
                <TypewriterText
                  text={`Welcome, ${username}`}
                  duration={0} // Base duration (adjusts total speed)
                  delay={0}      // Delay before starting the animation
                />
              </div>

              {/* ---------------- Admins Section ---------------- */}
              {activeTab === "admins" && (
                <div className="flex flex-col gap-16">
                  {/* Internal tab navigation buttons */}
                  <div className="btnGroup flex gap-4">
                    <div
                      onClick={() => { setActiveSubTab("addAdmin") }}
                      className={`addAdminBtnDiv text-[--text-color-primary] border border-[var(--border-color-primary)] p-3 rounded-lg w-[150px] cursor-pointer flex items-center gap-2 justify-center transition-all ease-in-out duration-300 ${activeSubTab == "addAdmin" && "bg-[var(--sub-button-color)] border font-semibold shadow-sm"}`}>
                      <img src="/superadmindashmenuicons/admin-blue.png" alt="admin symbol" className="w-6 h-6" />
                      <button>Add Admin</button>
                    </div>

                    <div
                      onClick={() => { setActiveSubTab("adminTable") }}
                      className={`tableBtnDiv text-[--text-color-primary] border border-[var(--border-color-primary)] p-3 rounded-lg w-[150px] cursor-pointer flex items-center gap-2 justify-center transition-all ease-in-out duration-300 ${activeSubTab == "adminTable" && "bg-[var(--sub-button-color)] border font-semibold shadow-sm"}`}>
                      <img src="/superadmindashmenuicons/table-blue.png" alt="table symbol" className="w-5 h-5" />
                      <button>Table</button>
                    </div>
                  </div>

                  {/* Add Admin Form */}
                  {activeSubTab == "addAdmin" &&
                    < div className="mb-4 transition-all ease-in-out duration-300">
                      <div className="flex gap-2 items-center mb-6">
                        <img src="/superadmindashmenuicons/admin-blue.png" alt="admin symbol" className="w-8 h-8" />
                        <h2 className="text-xl text-[var(--text-color-primary)] font-bold ">Add Admin</h2>
                      </div>
                      <div className="flex flex-col gap-4 w-[40%]">
                        <input
                          type="text"
                          placeholder="Username"
                          value={newAdmin.username}
                          onChange={(e) =>
                            setNewAdmin({ ...newAdmin, username: e.target.value })
                          }
                          className="p-5 rounded-lg flex-1 min-w-[200px] bg-[var(--bg-primary)] "
                        />
                        <input
                          type="password"
                          placeholder="Password"
                          value={newAdmin.password}
                          onChange={(e) =>
                            setNewAdmin({ ...newAdmin, password: e.target.value })
                          }
                          className="p-5 rounded-lg flex-1 min-w-[200px] bg-[var(--bg-primary)]"
                        />
                        <button
                          onClick={handleAddAdmin}
                          className="p-5 bg-[var(--main-color)] text-[var(--text-color-secondary)] font-bold rounded-lg hover:bg-[var(--button-hover-color)] transition-all duration-300 ease-in-out"
                        >
                          Add Admin
                        </button>
                      </div>
                    </div>
                  }

                  {/* Admins Table */}
                  {activeSubTab == "adminTable" &&
                    <div className="overflow-x-auto transition-all ease-in-out duration-300">
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
                            <tr key={admin._id} className="hover:bg-gray-50 transition-all ease-in-out duration-100">
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
                                  onClick={() => openAssignModal(admin)}
                                  className="px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 "
                                >
                                  Assign Task
                                </button>
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
                  }
                </div>
              )}

              {/* ---------------- Companies Section ---------------- */}
              {activeTab === "companies" && (
                <div className="bg-white p-6 rounded-xl shadow">
                  <h2 className="text-2xl font-bold mb-4">Companies</h2>

                  {/* Add Company Form */}
                  <button
                    onClick={() => setShowAddCompany(true)}
                    className="px-4 py-2 mb-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Add Company
                  </button>

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
              {showAddCompany && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
                  <div className="bg-white p-6 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto relative shadow-lg">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Add Client</h2>
                    <button
                      onClick={() => setShowAddCompany(false)}
                      className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 font-bold text-2xl"
                    >
                      ×
                    </button>

                    <div className="flex flex-col gap-4 mb-4">
                      {/* ================= COMPANY FIELDS ================= */}
                      {[
                        { key: "clientName", label: "Client Name", type: "text" },
                        { key: "structure", label: "Structure", type: "select", options: ["Company", "LLP", "Partnership Firm", "Trust", "Proprietor", "AOP"] },
                        { key: "cin", label: "CIN", type: "text" },
                        { key: "pan", label: "PAN", type: "text" },
                        { key: "gst", label: "GST Number", type: "text" },
                        { key: "dateOfIncorporation", label: "Date of Incorporation", type: "date" },
                        { key: "address", label: "Address", type: "text" },
                        { key: "phone", label: "Phone", type: "text" },
                        { key: "email", label: "Email", type: "email" },
                        { key: "udhyamAdhaar", label: "Udhyam Adhaar", type: "text" },
                        { key: "udhyamAdhaarCategory", label: "Udhyam Adhaar Category", type: "text" },
                        { key: "pf", label: "PF Number", type: "text" },
                        { key: "esi", label: "ESI Number", type: "text" },
                        { key: "ptEmployer", label: "PT Employer Number", type: "text" },
                        { key: "ptEmployee", label: "PT Employee Number", type: "text" },
                      ].map((field) => (
                        <div className="flex flex-col gap-1" key={field.key}>
                          <label className="font-semibold text-gray-700">{field.label}:</label>
                          {field.type === "select" ? (
                            <select
                              value={newCompany[field.key]}
                              onChange={(e) => setNewCompany({ ...newCompany, [field.key]: e.target.value })}
                              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            >
                              <option value="">Select {field.label}</option>
                              {field.options.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type}
                              value={newCompany[field.key] || ""}
                              onChange={(e) => setNewCompany({ ...newCompany, [field.key]: e.target.value })}
                              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            />
                          )}
                        </div>
                      ))}

                      {/* ================= DIRECTORS ================= */}
                      <div className="flex flex-col gap-2 mt-4">
                        <h3 className="font-semibold text-gray-800">Directors</h3>
                        {newCompany.directors.map((d, idx) => (
                          <div key={idx} className="flex gap-2 flex-wrap items-center">
                            <input type="text" placeholder="Name" value={d.name} onChange={(e) => updateDirector(idx, "name", e.target.value)} className="px-3 py-2 border rounded flex-1" />
                            <input type="text" placeholder="DIN" value={d.din} onChange={(e) => updateDirector(idx, "din", e.target.value)} className="px-3 py-2 border rounded flex-1" />
                            <input type="text" placeholder="PAN" value={d.pan} onChange={(e) => updateDirector(idx, "pan", e.target.value)} className="px-3 py-2 border rounded flex-1" />
                            <input type="date" placeholder="DOB" value={d.dob} onChange={(e) => updateDirector(idx, "dob", e.target.value)} className="px-3 py-2 border rounded flex-1" />
                            <input type="text" placeholder="Mobile" value={d.mobile} onChange={(e) => updateDirector(idx, "mobile", e.target.value)} className="px-3 py-2 border rounded flex-1" />
                            <input type="email" placeholder="Email" value={d.email} onChange={(e) => updateDirector(idx, "email", e.target.value)} className="px-3 py-2 border rounded flex-1" />
                            <button type="button" onClick={() => removeDirector(idx)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">×</button>
                          </div>
                        ))}
                        <button type="button" onClick={addDirector} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mt-2">Add Director</button>
                      </div>

                      {/* ================= AUTHORISED PERSONS ================= */}
                      <div className="flex flex-col gap-2 mt-4">
                        <h3 className="font-semibold text-gray-800">Authorised Persons</h3>
                        {newCompany.authorisedPersons.map((a, idx) => (
                          <div key={idx} className="flex gap-2 flex-wrap items-center">
                            <input type="text" placeholder="Name" value={a.name} onChange={(e) => updateAuthPerson(idx, "name", e.target.value)} className="px-3 py-2 border rounded flex-1" />
                            <input type="text" placeholder="DIN" value={a.din} onChange={(e) => updateAuthPerson(idx, "din", e.target.value)} className="px-3 py-2 border rounded flex-1" />
                            <input type="text" placeholder="PAN" value={a.pan} onChange={(e) => updateAuthPerson(idx, "pan", e.target.value)} className="px-3 py-2 border rounded flex-1" />
                            <input type="date" placeholder="DOB" value={a.dob} onChange={(e) => updateAuthPerson(idx, "dob", e.target.value)} className="px-3 py-2 border rounded flex-1" />
                            <button type="button" onClick={() => removeAuthPerson(idx)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">×</button>
                          </div>
                        ))}
                        <button type="button" onClick={addAuthPerson} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mt-2">Add Authorised Person</button>
                      </div>

                      <button
                        onClick={() => {
                          handleAddCompany();
                          setShowAddCompany(false);
                        }}
                        className="mt-6 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {showEditCompany && companyToEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
                  <div className="bg-white p-6 rounded-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto relative shadow-lg">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Company</h2>
                    <button
                      onClick={() => setShowEditCompany(false)}
                      className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 font-bold text-2xl"
                    >
                      ×
                    </button>

                    {/* ===================== Company Fields ===================== */}
                    {[
                      { key: "clientName", label: "Client Name", type: "text" },
                      { key: "structure", label: "Structure", type: "select", options: ["Company", "LLP", "Partnership Firm", "Trust", "Proprietor", "AOP"] },
                      { key: "cin", label: "CIN", type: "text" },
                      { key: "pan", label: "PAN", type: "text" },
                      { key: "gst", label: "GST Number", type: "text" },
                      { key: "dateOfIncorporation", label: "Date of Incorporation", type: "date" },
                      { key: "address", label: "Address", type: "text" },
                      { key: "phone", label: "Phone", type: "text" },
                      { key: "email", label: "Email", type: "email" },
                      { key: "udhyamAdhaar", label: "Udhyam Adhaar", type: "text" },
                      { key: "udhyamAdhaarCategory", label: "Udhyam Adhaar Category", type: "text" },
                      { key: "pf", label: "PF Number", type: "text" },
                      { key: "esi", label: "ESI Number", type: "text" },
                      { key: "ptEmployer", label: "PT Employer Number", type: "text" },
                      { key: "ptEmployee", label: "PT Employee Number", type: "text" },
                    ].map((field) => (
                      <div className="flex flex-col gap-1 mb-3" key={field.key}>
                        <label className="font-semibold text-gray-700">{field.label}:</label>
                        {field.type === "select" ? (
                          <select
                            value={companyToEdit[field.key] || ""}
                            onChange={(e) => setCompanyToEdit({ ...companyToEdit, [field.key]: e.target.value })}
                            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                          >
                            <option value="">Select {field.label}</option>
                            {field.options.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            value={companyToEdit[field.key] || ""}
                            onChange={(e) => setCompanyToEdit({ ...companyToEdit, [field.key]: e.target.value })}
                            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                          />
                        )}
                      </div>
                    ))}

                    {/* ===================== Directors ===================== */}
                    <div className="flex flex-col gap-2 mt-4">
                      <h3 className="font-semibold text-gray-800 mb-2">Directors</h3>
                      {companyToEdit.directors.map((d, idx) => (
                        <div key={idx} className="flex gap-2 flex-wrap items-center mb-2">
                          <input type="text" placeholder="Name" value={d.name} onChange={(e) => {
                            const updated = [...companyToEdit.directors];
                            updated[idx].name = e.target.value;
                            setCompanyToEdit({ ...companyToEdit, directors: updated });
                          }} className="px-3 py-2 border rounded flex-1" />

                          <input type="text" placeholder="DIN" value={d.din} onChange={(e) => {
                            const updated = [...companyToEdit.directors];
                            updated[idx].din = e.target.value;
                            setCompanyToEdit({ ...companyToEdit, directors: updated });
                          }} className="px-3 py-2 border rounded flex-1" />

                          <input type="text" placeholder="PAN" value={d.pan} onChange={(e) => {
                            const updated = [...companyToEdit.directors];
                            updated[idx].pan = e.target.value;
                            setCompanyToEdit({ ...companyToEdit, directors: updated });
                          }} className="px-3 py-2 border rounded flex-1" />

                          <input type="date" placeholder="DOB" value={d.dob ? d.dob.split("T")[0] : ""} onChange={(e) => {
                            const updated = [...companyToEdit.directors];
                            updated[idx].dob = e.target.value;
                            setCompanyToEdit({ ...companyToEdit, directors: updated });
                          }} className="px-3 py-2 border rounded flex-1" />

                          <input type="text" placeholder="Mobile" value={d.mobile} onChange={(e) => {
                            const updated = [...companyToEdit.directors];
                            updated[idx].mobile = e.target.value;
                            setCompanyToEdit({ ...companyToEdit, directors: updated });
                          }} className="px-3 py-2 border rounded flex-1" />

                          <input type="email" placeholder="Email" value={d.email} onChange={(e) => {
                            const updated = [...companyToEdit.directors];
                            updated[idx].email = e.target.value;
                            setCompanyToEdit({ ...companyToEdit, directors: updated });
                          }} className="px-3 py-2 border rounded flex-1" />

                          <button type="button" onClick={() => {
                            const updated = companyToEdit.directors.filter((_, i) => i !== idx);
                            setCompanyToEdit({ ...companyToEdit, directors: updated });
                          }} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">×</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => {
                        setCompanyToEdit({ ...companyToEdit, directors: [...companyToEdit.directors, { name: "", din: "", pan: "", dob: "", mobile: "", email: "" }] });
                      }} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mt-2">Add Director</button>
                    </div>

                    {/* ===================== Authorised Persons ===================== */}
                    <div className="flex flex-col gap-2 mt-6">
                      <h3 className="font-semibold text-gray-800 mb-2">Authorised Persons</h3>
                      {companyToEdit.authorisedPersons.map((a, idx) => (
                        <div key={idx} className="flex gap-2 flex-wrap items-center mb-2">
                          <input type="text" placeholder="Name" value={a.name} onChange={(e) => {
                            const updated = [...companyToEdit.authorisedPersons];
                            updated[idx].name = e.target.value;
                            setCompanyToEdit({ ...companyToEdit, authorisedPersons: updated });
                          }} className="px-3 py-2 border rounded flex-1" />

                          <input type="text" placeholder="DIN" value={a.din} onChange={(e) => {
                            const updated = [...companyToEdit.authorisedPersons];
                            updated[idx].din = e.target.value;
                            setCompanyToEdit({ ...companyToEdit, authorisedPersons: updated });
                          }} className="px-3 py-2 border rounded flex-1" />

                          <input type="text" placeholder="PAN" value={a.pan} onChange={(e) => {
                            const updated = [...companyToEdit.authorisedPersons];
                            updated[idx].pan = e.target.value;
                            setCompanyToEdit({ ...companyToEdit, authorisedPersons: updated });
                          }} className="px-3 py-2 border rounded flex-1" />

                          <input type="date" placeholder="DOB" value={a.dob ? a.dob.split("T")[0] : ""} onChange={(e) => {
                            const updated = [...companyToEdit.authorisedPersons];
                            updated[idx].dob = e.target.value;
                            setCompanyToEdit({ ...companyToEdit, authorisedPersons: updated });
                          }} className="px-3 py-2 border rounded flex-1" />

                          <button type="button" onClick={() => {
                            const updated = companyToEdit.authorisedPersons.filter((_, i) => i !== idx);
                            setCompanyToEdit({ ...companyToEdit, authorisedPersons: updated });
                          }} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">×</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => {
                        setCompanyToEdit({ ...companyToEdit, authorisedPersons: [...companyToEdit.authorisedPersons, { name: "", din: "", pan: "", dob: "" }] });
                      }} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mt-2">Add Authorised Person</button>
                    </div>

                    {/* ===================== Update Button ===================== */}
                    <button
                      onClick={async () => {
                        try {
                          await axios.put(`http://localhost:4000/api/superadmin/update-company/${companyToEdit._id}`, companyToEdit);
                          Swal.fire("Success", "Company updated successfully", "success");
                          fetchCompanies();
                          setShowEditCompany(false);
                        } catch (err) {
                          Swal.fire("Error", err.response?.data?.msg || "Server Error", "error");
                        }
                      }}
                      className="mt-6 px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition"
                    >
                      Update
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------- Allotments Section ---------------- */}
              {activeTab === "allotments" && (
                <div className="bg-gray-50 p-6 rounded-xl shadow overflow-auto">
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
              {/* Assign Task Modal */}
              {taskModalOpen && (
                <AssignTaskModal
                  open={taskModalOpen}
                  onClose={(didCreate) => closeAssignModal(didCreate)}
                  admin={taskModalAdmin}
                />
              )}

              {/* Company Details Modal */}
              {showModal && viewCompany && (
                <div
                  key={viewCompany._id}
                  className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4"
                >
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto relative shadow-2xl transition-all duration-300">

                    {/* Modal Header */}
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        Company Details
                      </h2>
                      <button
                        onClick={closeModal}
                        className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-bold text-2xl transition-colors"
                      >
                        ×
                      </button>
                    </div>

                    {/* Company Info Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg">
                        <tbody>
                          {Object.entries(viewCompany)
                            .filter(
                              ([key]) =>
                                !["_id", "admin", "adminId", "createdAt", "updatedAt", "__v", "directors", "authorisedPersons"].includes(key)
                            )
                            .map(([key, value]) => (
                              <tr
                                key={key}
                                className="border-b last:border-b-0 border-gray-200 dark:border-gray-700"
                              >
                                <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 w-1/3">
                                  {formatKey(key)}
                                </td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300 break-words">
                                  {typeof value === "boolean" ? (value ? "Yes" : "No") : value?.toString()}
                                </td>
                              </tr>
                            ))}

                          {/* Directors Section */}
                          {viewCompany.directors?.length > 0 && (
                            <tr>
                              <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700">
                                Directors
                              </td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                <ul className="list-disc pl-5">
                                  {viewCompany.directors.map((d, idx) => (
                                    <li key={idx} className="mb-1">
                                      {`Name: ${d.name || "-"}, DIN: ${d.din || "-"}, PAN: ${d.pan || "-"}, DOB: ${d.dob || "-"}, Mobile: ${d.mobile || "-"}, Email: ${d.email || "-"}`}
                                    </li>
                                  ))}
                                </ul>
                              </td>
                            </tr>
                          )}

                          {/* Authorised Persons Section */}
                          {viewCompany.authorisedPersons?.length > 0 && (
                            <tr>
                              <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700">
                                Authorised Persons
                              </td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                <ul className="list-disc pl-5">
                                  {viewCompany.authorisedPersons.map((a, idx) => (
                                    <li key={idx} className="mb-1">
                                      {`Name: ${a.name || "-"}, DIN: ${a.din || "-"}, PAN: ${a.pan || "-"}, DOB: ${a.dob || "-"}`}
                                    </li>
                                  ))}
                                </ul>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={closeModal}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>



        </section>
      </section>

    </div >
  );
}
