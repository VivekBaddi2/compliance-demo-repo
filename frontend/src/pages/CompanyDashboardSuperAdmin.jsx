import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { API_URL } from "../api";
import { FaTimes, FaEdit, FaSave } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import CompanyNavbar from "../components/Navbar";

export default function CompanyDashboardSuperAdmin() {
  const company = JSON.parse(localStorage.getItem("activeCompany") || "null"); // updated key
  const navigate = useNavigate();

  const [newHead, setNewHead] = useState("");
  const [headToRemove, setHeadToRemove] = useState("");

  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newPeriod, setNewPeriod] = useState("");
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceHead, setNewServiceHead] = useState("Monthly");
  const [dirtyCells, setDirtyCells] = useState(new Map());
  const [popup, setPopup] = useState({
    visible: false,
    x: 0,
    y: 0,
    period: "",
    service: "",
    head: "",
  });
  const originalRef = useRef(null);

  const heads = sheet?.serviceHeads ? Object.keys(sheet.serviceHeads) : [];

  const symbols = [
    { key: "tick", label: "✔️" },
    { key: "cross", label: "❌" },
    { key: "late", label: "⏰" },
  ];

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const generateMonthYearList = () => {
    const start = new Date(2025, 3); // April 2025 (month index 3)
    const end = new Date(2040, 2); // March 2040
    const list = [];
    const cur = new Date(start);
    while (cur <= end) {
      list.push(`${monthNames[cur.getMonth()]} ${cur.getFullYear()}`);
      cur.setMonth(cur.getMonth() + 1);
    }
    return list;
  };

  const monthList = generateMonthYearList();

  const fetch = async () => {
    if (!company?._id) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/dashboard/get/${company._id}`);
      setSheet(res.data.data);
      originalRef.current = JSON.stringify(res.data.data);
      setDirtyCells(new Map());
    } catch (err) {
      console.error("fetch dashboard:", err);
      setSheet(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const parsePeriodToDate = (p) => {
    if (!p) return new Date(0);
    const [month, year] = p.split(" ");
    const m = monthNames.indexOf(month);
    return new Date(Number(year), m, 1);
  };
  const sortedDashboard = sheet?.dashboard
    ? [...sheet.dashboard].sort(
        (a, b) => parsePeriodToDate(b.period) - parsePeriodToDate(a.period)
      )
    : [];

  const handleCreateSheet = async () => {
    if (!company?._id) return alert("Company required");
    try {
      const res = await axios.post(`${API_URL}/dashboard/create`, {
        companyId: company._id,
      });
      setSheet(res.data.data);
      originalRef.current = JSON.stringify(res.data.data);
      alert("Sheet created");
    } catch (err) {
      console.error(err);
      alert("Create failed");
    }
  };

  const handleAddHead = async () => {
    if (!newHead?.trim()) return alert("Enter head name");
    if (!sheet?._id) return alert("Create sheet first");

    try {
      // endpoint: adjust if your backend route is different
      await axios.post(`${API_URL}/dashboard/head/add`, {
        sheetId: sheet._id,
        headName: newHead.trim(),
      });
      setNewHead("");
      await fetch(); // refresh sheet so heads update in UI
      alert("Head added");
    } catch (err) {
      console.error("add head:", err);
      alert(err.response?.data?.msg || "Add head failed");
    }
  };

  const handleRemoveHead = async () => {
    if (!headToRemove) return alert("Select a head to remove");
    if (!sheet?._id) return alert("Create sheet first");

    if (!window.confirm(`Remove head "${headToRemove}"?`)) return;

    try {
      await axios.post(`${API_URL}/dashboard/head/remove`, {
        sheetId: sheet._id,
        headType: headToRemove,
      });
      setHeadToRemove("");
      await fetch();
    } catch (err) {
      console.error(err);
      alert("Remove head failed");
    }
  };

  const handleAddPeriod = async () => {
    if (!newPeriod) return alert("Enter period");
    if (!sheet?._id) return alert("Create sheet first");
    try {
      await axios.post(`${API_URL}/dashboard/row/add`, {
        sheetId: sheet._id,
        period: newPeriod,
      });
      setNewPeriod("");
      await fetch();
    } catch (err) {
      console.error(err);
      alert("Add period failed");
    }
  };

  const handleAddService = async () => {
    if (!newServiceName) return alert("Enter service name");
    if (!sheet?._id) return alert("Create sheet first");
    if (!sheet?.serviceHeads || !sheet.serviceHeads[newServiceHead]) {
      return alert("Selected head doesn't exist. Add the head first.");
    }
    try {
      await axios.post(`${API_URL}/dashboard/service/add`, {
        sheetId: sheet._id,
        headType: newServiceHead,
        serviceName: newServiceName,
      });
      setNewServiceName("");
      await fetch();
    } catch (err) {
      console.error(err);
      alert("Add service failed");
    }
  };

  const handleRemoveService = async (head, serviceName) => {
    if (!window.confirm(`Remove service "${serviceName}"?`)) return;
    try {
      await axios.post(`${API_URL}/dashboard/service/remove`, {
        sheetId: sheet._id,
        headType: head,
        serviceName,
      });
      await fetch();
    } catch (err) {
      console.error(err);
      alert("Remove service failed");
    }
  };

  const handleRemovePeriod = async (period) => {
    if (!window.confirm(`Delete row "${period}"?`)) return;
    try {
      await axios.delete(`${API_URL}/dashboard/row/${sheet._id}/${period}`);
      await fetch();
    } catch (err) {
      console.error(err);
      alert("Delete row failed");
    }
  };

  const markDirty = (period, serviceName, headType, patch) => {
    setSheet((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const row = copy.dashboard.find((r) => r.period === period);
      if (!row.services[serviceName]) row.services[serviceName] = {};
      const dynamicHeads = sheet?.serviceHeads
        ? Object.keys(sheet.serviceHeads)
        : [];
      dynamicHeads.forEach((h) => {
        if (!row.services[serviceName][h])
          row.services[serviceName][h] = { symbol: "", notes: "" };
      });

      row.services[serviceName][headType] = {
        ...row.services[serviceName][headType],
        ...patch,
      };
      return copy;
    });

    const key = `${period}|${serviceName}|${headType}`;
    setDirtyCells((prev) => {
      const m = new Map(prev);
      m.set(key, { period, serviceName, headType, ...patch });
      return m;
    });
  };

  const openPopup = (e, period, service, head) => {
    e.stopPropagation();
    setPopup({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      period,
      service,
      head,
    });
  };

  const selectSymbol = (symbol) => {
    markDirty(popup.period, popup.service, popup.head, { symbol });
    setPopup({ ...popup, visible: false });
  };

  const openSubSheet = async (period, serviceName, headType) => {
    const row = sortedDashboard.find((r) => r.period === period);
    const cell = row.services?.[serviceName]?.[headType];
    if (cell?.subSheetId) {
      navigate(`/company/sheet/${cell.subSheetId}`);
      return;
    }

    try {
      const payload = {
        companyId: sheet.companyId,
        sheetId: sheet._id,
        headType,
        serviceName,
        period,
        heading: `${serviceName} — ${period} — ${headType}`,
        table: [],
      };
      const res = await axios.post(`${API_URL}/dsheet/create`, payload);
      const created = res.data.data;

      await axios.post(`${API_URL}/dashboard/cells/update`, {
        sheetId: sheet._id,
        updates: [
          {
            period,
            serviceName,
            headType,
            symbol: cell?.symbol || "",
            notes: cell?.notes || "",
            subSheetId: created._id,
          },
        ],
      });

      await fetch();
      navigate(`/company/sheet/${created._id}`);
    } catch (err) {
      console.error(err);
      alert("Could not open subsheet");
    }
  };

  const handleSave = async () => {
    if (dirtyCells.size === 0) {
      setEditMode(false);
      return alert("Saved");
    }
    const updates = Array.from(dirtyCells.values());
    try {
      await axios.put(`${API_URL}/dashboard/cells/update`, {
        sheetId: sheet._id,
        updates,
      });
      await fetch();
      setEditMode(false);
      alert("Saved");
    } catch (err) {
      console.error(err);
      alert("Save failed");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <CompanyNavbar />

      <div className="p-4">
        {/* header */}
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">Company Dashboard</h2>
          <div className="flex gap-2">
            {!sheet?._id ? (
              <button
                onClick={handleCreateSheet}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Create Sheet
              </button>
            ) : (
              <>
                <button
                  onClick={() => setEditMode((m) => !m)}
                  className="px-3 py-1 bg-gray-700 text-white rounded flex gap-2"
                >
                  <FaEdit /> {editMode ? "Exit Edit" : "Edit"}
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-green-600 text-white rounded flex gap-2"
                >
                  <FaSave /> Save
                </button>
                <button
                  onClick={() => navigate("/super-admin/dashboard")}
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 active:scale-95 transition"
                >
                  Back
                </button>
              </>
            )}
          </div>
        </div>

        {!sheet?._id ? (
          <div>No sheet. Create one.</div>
        ) : (
          <>
            {/* controls */}
            <div className="flex flex-wrap gap-2 mb-3">
              {/* Add Period */}
              <select
                value={newPeriod}
                onChange={(e) => setNewPeriod(e.target.value)}
                className="border px-2 py-1"
              >
                <option value="">Select Period</option>
                {monthList.map((m, i) => (
                  <option key={i} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <button
                onClick={handleAddPeriod}
                className="px-3 py-1 bg-blue-500 text-white rounded"
              >
                Add Period
              </button>

              {/* Add Head */}
              <input
                value={newHead}
                onChange={(e) => setNewHead(e.target.value)}
                className="border px-2 py-1"
                placeholder="New head (e.g. Audit)"
              />
              <button
                onClick={handleAddHead}
                className="px-3 py-1 bg-indigo-600 text-white rounded"
              >
                Add Head
              </button>

              {/* Remove Head (Step-4 Added) */}
              <select
                value={headToRemove}
                onChange={(e) => setHeadToRemove(e.target.value)}
                className="border px-2 py-1"
              >
                <option value="">Select head to remove</option>
                {heads.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>

              <button
                onClick={handleRemoveHead}
                className="px-3 py-1 bg-red-600 text-white rounded"
              >
                Remove Head
              </button>

              {/* Add Service */}
              <select
                value={newServiceHead}
                onChange={(e) => setNewServiceHead(e.target.value)}
                className="border px-2 py-1"
              >
                {heads.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>

              <input
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                className="border px-2 py-1"
                placeholder="New service"
              />

              <button
                onClick={handleAddService}
                className="px-3 py-1 bg-green-500 text-white rounded"
              >
                Add Service
              </button>
            </div>

            {/* Table */}
            <div className="overflow-auto border rounded relative">
              <table className="min-w-[1100px] border-collapse">
                <thead>
                  <tr>
                    <th className="border px-2 py-1 w-36 text-center font-semibold">
                      Period
                    </th>
                    {heads.map((head) => (
                      <th
                        key={head}
                        className="border px-2 py-1 text-center font-bold"
                        colSpan={sheet.serviceHeads[head]?.length || 1}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>

                  <tr>
                    <th className="border px-2 py-1 text-center font-semibold"></th>
                    {heads.map((head) =>
                      sheet.serviceHeads[head]?.length ? (
                        sheet.serviceHeads[head].map((s) => (
                          <th
                            key={s}
                            className="border px-2 py-1 text-sm font-semibold"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-center flex-1">{s}</span>
                              {editMode && (
                                <button
                                  className="text-red-600"
                                  onClick={() => handleRemoveService(head, s)}
                                >
                                  <FaTimes />
                                </button>
                              )}
                            </div>
                          </th>
                        ))
                      ) : (
                        <th key={head} className="border px-2 py-1 text-center">
                          -
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {sortedDashboard.map((row) => (
                    <tr key={row.period}>
                      <td className="border px-2 py-1 w-36 flex justify-between items-center">
                        <span className="text-center">{row.period}</span>
                        {editMode && (
                          <button
                            className="text-red-600"
                            onClick={() => handleRemovePeriod(row.period)}
                          >
                            <FaTimes />
                          </button>
                        )}
                      </td>

                      {heads.flatMap((head) =>
                        sheet.serviceHeads[head]?.length
                          ? sheet.serviceHeads[head].map((service) => {
                              const cell = row.services?.[service]?.[head] || {
                                symbol: "",
                                notes: "",
                              };
                              const symbolObj = symbols.find(
                                (s) => s.key === cell.symbol
                              );
                              return (
                                <td
                                  key={service}
                                  className="border px-2 py-1 cursor-pointer text-center relative"
                                  onClick={(e) =>
                                    editMode &&
                                    openPopup(e, row.period, service, head)
                                  }
                                  onDoubleClick={() =>
                                    !editMode &&
                                    openSubSheet(row.period, service, head)
                                  }
                                >
                                  <div className="text-xl">
                                    {symbolObj?.label || ""}
                                  </div>
                                </td>
                              );
                            })
                          : [
                              <td
                                key={head}
                                className="border px-2 py-1 text-center"
                              >
                                -
                              </td>,
                            ]
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Popup Menu */}
              {popup.visible && (
                <div
                  className="fixed bg-white border shadow-lg rounded p-2 z-50"
                  style={{ top: popup.y, left: popup.x }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {symbols.map((s) => (
                    <button
                      key={s.key}
                      className="px-2 py-1 hover:bg-gray-200 rounded text-xl"
                      onClick={() => selectSymbol(s.key)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Close popup on click outside */}
      {popup.visible && (
        <div
          className="fixed inset-0"
          onClick={() => setPopup({ ...popup, visible: false })}
        />
      )}
    </>
  );
}

