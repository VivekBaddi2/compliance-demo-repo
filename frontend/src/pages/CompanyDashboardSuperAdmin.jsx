import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { API_URL } from "../api";
import { FaTimes, FaEdit, FaSave } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import CompanyNavbar from "../components/Navbar";

// ======================
// Timestamp Formatting
// ======================
const pad = (n) => String(n).padStart(2, "0");

const formatTimestamp = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);

  const date = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

  return `${date} , ${time}`;
};


export default function CompanyDashboardSuperAdmin() {
  const company = JSON.parse(localStorage.getItem("activeCompany") || "null"); // updated key
  const navigate = useNavigate();

  const isSuperAdmin = !!localStorage.getItem("superAdmin");
  const _superAdminObj = JSON.parse(localStorage.getItem("superAdmin") || "null");
  const superAdminUsername = _superAdminObj?.username || null;

  const [newHead, setNewHead] = useState("");
  const [headToRemove, setHeadToRemove] = useState("");
  const [financialYear, setFinancialYear] = useState(""); // For auto-generating periods
  const [financialYears, setFinancialYears] = useState([]); // Available FYs from data
  const [companySheets, setCompanySheets] = useState([]); // list of sheets for this company
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newPeriod, setNewPeriod] = useState("");
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceHead, setNewServiceHead] = useState("Monthly");
  const [mergeHead, setMergeHead] = useState("");
  const [mergeFrom, setMergeFrom] = useState("");
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

  // Normalize head keys and enforce desired ordering: Monthly, Quarterly, Half-Yearly, Yearly
  const rawHeads = sheet?.serviceHeads
    ? (typeof sheet.serviceHeads.keys === 'function' ? Array.from(sheet.serviceHeads.keys()) : Object.keys(sheet.serviceHeads))
    : [];
  const desiredOrder = ["Monthly", "Quarterly", "Half-Yearly", "Yearly"];
  const heads = [
    ...desiredOrder.filter((h) => rawHeads.includes(h)),
    ...rawHeads.filter((h) => !desiredOrder.includes(h)),
  ];

  const getServicesForHead = (head) => {
    if (!sheet?.serviceHeads) return [];
    if (typeof sheet.serviceHeads.get === 'function') return sheet.serviceHeads.get(head) || [];
    return sheet.serviceHeads[head] || [];
  };
  const YellowExclamation = () => (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      className="inline-block align-middle"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" fill="#FFD600" />
      <rect x="11" y="6" width="2" height="8" fill="#ffffff" />
      <circle cx="12" cy="17" r="1.4" fill="#ffffff" />
    </svg>
  );


  const symbols = [
    { key: "tick", label: "✅" },
    { key: "cross", label: "❌" },
    { key: "late", label: <YellowExclamation /> },
    { key: "remove", label: "🗑" },
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
  function generateMonthYearList() {
    const start = new Date(2025, 3); // April 2025 (month index 3)
    const end = new Date(2040, 2); // March 2040
    const list = [];
    const cur = new Date(start);
    while (cur <= end) {
      list.push(`${monthNames[cur.getMonth()]} ${cur.getFullYear()}`);
      cur.setMonth(cur.getMonth() + 1);
    }
    return list;
  }
  const monthList = generateMonthYearList();
  const fetch = async (sheetId) => {
    if (!company?._id) return;
    setLoading(true);
    try {
      let res;
      // If a specific sheetId is provided or already selected, fetch that sheet by id
      const idToFetch = sheetId || sheet?._id;
      if (idToFetch) {
        res = await axios.get(`${API_URL}/dashboard/sheet/${idToFetch}`);
        setSheet(res.data.data);
        originalRef.current = JSON.stringify(res.data.data);
        setDirtyCells(new Map());
      } else {
        // No specific id — load company sheets and open the most recent if available
        const sheets = await fetchCompanySheets();
        if (sheets && sheets.length > 0) {
          const first = sheets[0];
          res = await axios.get(`${API_URL}/dashboard/sheet/${first._id}`);
          setSheet(res.data.data);
          originalRef.current = JSON.stringify(res.data.data);
          setDirtyCells(new Map());
        } else {
          setSheet(null);
        }
      }
    } catch (err) {
      console.error("fetch dashboard:", err);
      setSheet(null);
    } finally {
      setLoading(false);
    }
  };

  // Update available financial years whenever sheet changes
  useEffect(() => {
    if (sheet?.dashboard) {
      setFinancialYears(extractFinancialYears());
    } else {
      setFinancialYears([]);
    }
  }, [sheet]);

  useEffect(() => {
    (async () => {
      if (!company?._id) return;
      const sheets = await fetchCompanySheets();
      if (sheets && sheets.length > 0) {
        // open the most recent sheet
        await fetch(sheets[0]._id);
      } else {
        // no sheets — ensure view is empty so user can create FY
        setSheet(null);
      }
    })();
  }, []);

  const fetchCompanySheets = async () => {
    if (!company?._id) return;
    try {
      const res = await axios.get(`${API_URL}/dashboard/list/${company._id}`);
      const list = res.data.data || [];
      setCompanySheets(list);
      return list;
    } catch (err) {
      console.error("fetch company sheets:", err);
      return [];
    }
  };

  const parsePeriodToDate = (p) => {
    if (!p) return new Date(0);
    const [month, year] = p.split(" ");
    const m = monthNames.indexOf(month);
    return new Date(Number(year), m, 1);
  };

  // Extract financial year from a period string (e.g., "April 2025" -> "2025-2026")
  const getPeriodFinancialYear = (period) => {
    if (!period) return null;
    const [month, year] = period.split(" ");
    const monthIndex = monthNames.indexOf(month);
    const yearNum = Number(year);

    if (monthIndex === -1 || isNaN(yearNum)) return null;

    // April-December: FY <year>-<year+1>
    // January-March: FY <year-1>-<year>
    if (monthIndex >= 3) {
      return `${yearNum}-${yearNum + 1}`;
    } else {
      return `${yearNum - 1}-${yearNum}`;
    }
  };

  // Extract all unique financial years from dashboard rows
  const extractFinancialYears = () => {
    if (!sheet?.dashboard || sheet.dashboard.length === 0) return [];

    const fySet = new Set();
    sheet.dashboard.forEach((row) => {
      const fy = getPeriodFinancialYear(row.period);
      if (fy) fySet.add(fy);
    });

    // Sort in descending order (newest first)
    return Array.from(fySet)
      .sort((a, b) => {
        const aStart = Number(a.split("-")[0]);
        const bStart = Number(b.split("-")[0]);
        return bStart - aStart;
      })
      .map((fy) => `FY ${fy}`);
  };

  // (Removed FY filter helper — sheet selection now controls which FY is shown)

  const sortedDashboard = sheet?.dashboard
    ? [...sheet.dashboard].sort(
      (a, b) => parsePeriodToDate(b.period) - parsePeriodToDate(a.period)
    )
    : [];

  // compute merged spans and cells to skip based on persisted mergedRange metadata
  // Use indices in sortedDashboard so rowSpan works regardless of sort order
  const mergeSpanMap = {};
  const skipCells = new Set();
  if (sheet) {
    // map period -> index in sortedDashboard
    const indexMap = {};
    for (let i = 0; i < sortedDashboard.length; i++) {
      indexMap[sortedDashboard[i].period] = i;
    }

    for (let i = 0; i < sortedDashboard.length; i++) {
      const row = sortedDashboard[i];
      for (const head of heads) {
        const servicesList = getServicesForHead(head) || [];
        for (const service of servicesList) {
          const cell = row.services?.[service]?.[head];
          const mr = cell?.mergedRange;
          if (!mr || !mr.from || !mr.to) continue;

          const fromIdx = indexMap[mr.from];
          const toIdx = indexMap[mr.to];
          if (fromIdx === undefined || toIdx === undefined) continue;

          const start = Math.min(fromIdx, toIdx);
          const end = Math.max(fromIdx, toIdx);
          const count = end - start + 1;
          if (count <= 1) continue;

          const startPeriod = sortedDashboard[start].period;
          const key = `${startPeriod}|${head}|${service}`;
          mergeSpanMap[key] = count;
          for (let k = start + 1; k <= end; k++) {
            skipCells.add(`${sortedDashboard[k].period}|${head}|${service}`);
          }
        }
      }
    }
  }

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

  // const handleAddPeriod = async () => {
  //   if (!newPeriod) return alert("Enter period");
  //   if (!sheet?._id) return alert("Create sheet first");
  //   try {
  //     await axios.post(`${API_URL}/dashboard/row/add`, {
  //       sheetId: sheet._id,
  //       period: newPeriod,
  //     });
  //     setNewPeriod("");
  //     await fetch();
  //   } catch (err) {
  //     console.error(err);
  //     alert("Add period failed");
  //   }
  // };

  // Generate 12 months for a financial year (April start, March end)
  const generateFinancialYearPeriods = (startYear) => {
    const months = [];
    const year = parseInt(startYear);
    if (isNaN(year)) return months;

    // Start from April of startYear and go to March of next year
    for (let i = 3; i < 15; i++) { // 3=April, 14=March (next year)
      const m = (i % 12);
      const y = year + Math.floor(i / 12);
      months.push(`${monthNames[m]} ${y}`);
    }
    return months;
  };

  // Create all 12 periods for selected financial year
  const handleAddFinancialYearPeriods = async () => {
    if (!financialYear) return alert("Select a financial year");
    if (!company?._id) return alert("Company required");

    try {
      const res = await axios.post(`${API_URL}/dashboard/create/fy`, {
        companyId: company._id,
        startYear: financialYear,
      });

      if (res.data?.data) {
        // Refresh available sheets
        await fetchCompanySheets();
        // Fetch the sheet by id so UI shows the newly created FY sheet immediately
        await fetch(res.data.data._id);
        setFinancialYear("");
        alert(res.data.msg || "FY sheet created");
      } else {
        alert(res.data.msg || "FY creation returned no data");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "Add financial year (create sheet) failed");
    }
  };

  const handleAddService = async () => {
    if (!newServiceName) return alert("Enter service name");
    if (!sheet?._id) return alert("Create sheet first");
    // serviceHeads may be a MongooseMap/Map or a plain object depending on how
    // the backend serialized it. Handle both shapes.
    const hasHead = sheet?.serviceHeads && (typeof sheet.serviceHeads.has === 'function'
      ? sheet.serviceHeads.has(newServiceHead)
      : Object.prototype.hasOwnProperty.call(sheet.serviceHeads, newServiceHead));
    if (!hasHead) {
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
      const dynamicHeads = prev?.serviceHeads
        ? Object.keys(prev.serviceHeads)
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
    markDirty(
      popup.period,
      popup.service,
      popup.head,
      { symbol: symbol === "remove" ? "" : symbol } // empty string to clear
    );
    setPopup({ ...popup, visible: false });
  };

  const openSubSheet = async (period, serviceName, headType) => {
    const row = sortedDashboard.find((r) => r.period === period);
    const cell = row.services?.[serviceName]?.[headType];
    // if (cell?.subSheetId) {
    //   navigate(`/company/subsheet/view/${headType}/${cell.subSheetId}`);
    //   return;
    // }

    // try {
    //   const payload = {
    //     companyId: sheet.companyId,
    //     sheetId: sheet._id,
    //     headType,
    //     serviceName,
    //     period,
    //     heading: `${serviceName} — ${period} — ${headType}`,
    //     table: [],
    //   };
    //   const res = await axios.post(`${API_URL}/dsheet/create`, payload);
    //   const created = res.data.data;

    //   // Use PUT for the cells update endpoint (router expects PUT)
    //   await axios.put(`${API_URL}/dashboard/cells/update`, {
    //     sheetId: sheet._id,
    //     updates: [
    //       {
    //         period,
    //         serviceName,
    //         headType,
    //         symbol: cell?.symbol || "",
    //         notes: cell?.notes || "",
    //         subSheetId: created._id,
    //       },
    //     ],
    //   });

    //   await fetch();
    //   navigate(`/company/subsheet/view/${headType}/${created._id}`);
    // } catch (err) {
    //   console.error(err);
    //   alert("Could not open subsheet");
    // }

    navigate(`/company/subsheet/${headType.toLowerCase()}/${company._id}`);
  };

  const handleSave = async () => {
    if (dirtyCells.size === 0) {
      setEditMode(false);
      return alert("Saved");
    }
    // include updatedBy (super-admin username) when available so backend can persist editor identity
    const updates = Array.from(dirtyCells.values()).map((u) => {
      if (isSuperAdmin && superAdminUsername) return { ...u, updatedBy: superAdminUsername };
      return u;
    });
    console.log("Saving updates:", updates);
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

  console.log(sheet);

  return (
    <>
      <CompanyNavbar />

      <div className="p-4">
        {/* header */}
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">Company Dashboard</h2>
          <div className="flex gap-2">
            {!sheet?._id ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="2025"
                  max="2100"
                  placeholder="e.g., 2025"
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  className="border px-2 py-1 w-40"
                />
                <button
                  onClick={handleAddFinancialYearPeriods}
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                  Create FY Sheet
                </button>
              </div>
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
                {/* Sheet selector */}
                {companySheets && companySheets.length > 0 && (
                  <select
                    value={sheet?._id || ""}
                    onChange={async (e) => {
                      const sid = e.target.value;
                      if (!sid) return;
                      // Fetch the full sheet by id so dashboard rows and heads are loaded
                      await fetch(sid);
                      // Nothing else required — fetching the sheet by id loads the FY
                    }}
                    className="border px-2 py-1"
                  >
                    <option value="">Select Sheet</option>
                    {companySheets.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.heading || (s.fy ? `FY ${s.fy}` : `Sheet ${s._id.slice(0, 6)}`)}
                      </option>
                    ))}
                  </select>
                )}

                {/* Delete sheet (visible for FY sheets) */}
                {sheet?.fy && (
                  <button
                    onClick={async () => {
                      if (!window.confirm('Delete this FY sheet?')) return;
                      try {
                        await axios.delete(`${API_URL}/dashboard/sheet/${sheet._id}`);
                        alert('Sheet deleted');
                        // Refresh list and auto-select another sheet if available
                        const sheets = await fetchCompanySheets();
                        if (sheets && sheets.length > 0) {
                          // prefer a sheet with fy if possible, otherwise first
                          const prefer = sheets.find(s => s._id !== sheet._id) || sheets[0];
                          if (prefer) {
                            await fetch(prefer._id);
                            return;
                          }
                        }
                        // no sheets available — clear current view
                        setSheet(null);
                      } catch (err) {
                        console.error(err);
                        alert('Delete failed');
                      }
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    Delete Sheet
                  </button>
                )}
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
              {/* Add Period - Single */}
              {/* <select
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
              </button> */}

              {/* OR: Add Financial Year (all 12 months) */}
              <div className="flex gap-2 items-center pl-2 ml-2">
                <label className="text-sm font-semibold text-gray-600">FY:</label>
                <input
                  type="number"
                  min="2025"
                  max="2100"
                  placeholder="e.g., 2025"
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  className="border px-2 py-1 w-40"
                />
                <button
                  onClick={handleAddFinancialYearPeriods}
                  className="px-4 py-2 bg-green-500 text-white rounded text-sm"
                  title="Add all 12 months (Apr-Mar) for selected financial year"
                >
                  Add FY
                </button>
              </div>

              {/* FY selection is handled via the Sheet selector in the header */}

              {/* Add Head (select) */}
              <select
                value={newHead}
                onChange={(e) => setNewHead(e.target.value)}
                className="border px-2 py-1"
              >
                <option value="">Select</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Half-Yearly">Half-Yearly</option>
                <option value="Yearly">Yearly</option>
              </select>
              <button onClick={handleAddHead} className="px-3 py-1 bg-indigo-600 text-white rounded">
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

              {/* Merge controls: head + from/to period + Merge button */}
              {/* <div className="flex items-center gap-2 ml-2"> */}
              {/* <select
                  value={mergeHead}
                  onChange={(e) => setMergeHead(e.target.value)}
                  className="border px-2 py-1"
                >
                  <option value="">Select Head to Merge</option>
                  {heads
                    .filter((h) => h !== "Monthly")
                    .map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                </select>

                <select
                  value={mergeFrom}
                  onChange={(e) => setMergeFrom(e.target.value)}
                  className="border px-2 py-1"
                >
                  <option value="">From (period)</option>
                  {sortedDashboard.map((r) => (
                    <option key={r.period} value={r.period}>
                      {r.period}
                    </option>
                  ))}
                </select> */}

              {/* Note: To-period removed. Merge count derives from selected head. */}

              {/* <button
                  onClick={async () => {
                    // handle merge action
                    if (!sheet?._id) return alert("Create sheet first");
                    if (!mergeHead) return alert("Select a head to merge");
                    if (!mergeFrom) return alert("Select From period");

                    // determine merge count from head
                    const getMergeCount = (headName) => {
                      if (!headName) return 1;
                      const n = headName.toLowerCase().replace(/[^a-z]/g, "");
                      if (n.includes("quarter")) return 3;
                      if (n.includes("half")) return 6;
                      if (n.includes("year")) return 12;
                      return 1;
                    };

                    const count = getMergeCount(mergeHead);
                    if (count <= 1)
                      return alert(
                        "Selected head does not support multi-row merge"
                      );

                    // find index of the from-period in sortedDashboard
                    const startIdx = sortedDashboard.findIndex(
                      (r) => r.period === mergeFrom
                    );
                    if (startIdx === -1)
                      return alert("Selected From period not found in sheet");
                    const endIdx = startIdx + count - 1;
                    if (endIdx >= sortedDashboard.length)
                      return alert(
                        "Not enough subsequent periods to merge for the selected head"
                      );

                    // collect source periods from startIdx..endIdx
                    const sources = sortedDashboard
                      .slice(startIdx, endIdx + 1)
                      .map((r) => r.period);

                    if (sources.length < 2)
                      return alert(
                        "Select a range of at least 2 periods to merge"
                      );

                    // PRE-CHECK: ensure no overlapping/already-merged cells exist inside the intended range
                    const servicesList = sheet.serviceHeads[mergeHead] || [];
                    for (const p of sources) {
                      const r = sheet.dashboard.find((rr) => rr.period === p);
                      for (const svc of servicesList) {
                        const c = r?.services?.[svc]?.[mergeHead];
                        if (c && c.mergedRange) {
                          // if the mergedRange already covers multiple rows, abort to avoid overlap
                          return alert(
                            `Cannot merge: some rows in the selected range are already merged for head ${mergeHead}. Unmerge them first.`
                          );
                        }
                      }
                    }

                    // target will be the "From" period (we will expand it downwards)
                    const targetPeriod = mergeFrom;
                    const targetEndPeriod = sortedDashboard[endIdx].period;

                    try {
                      // 2. build merged updates for each service under the selected head
                      const servicesList = sheet.serviceHeads[mergeHead] || [];
                      const updates = [];

                      // iterate services and combine symbols/notes/subSheetId
                      for (const serviceName of servicesList) {
                        let mergedSymbol = "";
                        let mergedNotes = [];
                        let mergedSubSheetId = null;

                        // prefer-non-empty from newest -> oldest
                        const sortedSources = [...sources].sort(
                          (a, b) => parsePeriodToDate(b) - parsePeriodToDate(a)
                        );

                        for (const p of sortedSources) {
                          const row = sheet.dashboard.find(
                            (rr) => rr.period === p
                          );
                          const cell =
                            row?.services?.[serviceName]?.[mergeHead];
                          if (!mergedSymbol && cell?.symbol)
                            mergedSymbol = cell.symbol;
                          if (cell?.notes) mergedNotes.push(cell.notes);
                          if (!mergedSubSheetId && cell?.subSheetId)
                            mergedSubSheetId = cell.subSheetId;
                        }

                        // include mergedRange metadata on the target cell so frontend can render rowspan
                        // Always persist mergedRange even if symbol/notes/subSheetId are empty so the UI can render the span
                        updates.push({
                          period: targetPeriod,
                          serviceName,
                          headType: mergeHead,
                          symbol: mergedSymbol || "",
                          notes: mergedNotes.join(" | ") || "",
                          subSheetId: mergedSubSheetId || null,
                          mergedRange: {
                            from: mergeFrom,
                            to: targetEndPeriod,
                            count: sources.length,
                          },
                        });
                      }

                      // 3. write merged cells into the target (From) period
                      if (updates.length > 0) {
                        await axios.put(`${API_URL}/dashboard/cells/update`, {
                          sheetId: sheet._id,
                          updates: updates.map((u) => (isSuperAdmin && superAdminUsername ? { ...u, updatedBy: superAdminUsername } : u)),
                        });
                      }

                      // 4. clear only the selected head's cells in source periods (do NOT delete rows)
                      const clears = [];
                      for (const p of sources) {
                        if (p === targetPeriod) continue;
                        for (const serviceName of servicesList) {
                          clears.push({
                            period: p,
                            serviceName,
                            headType: mergeHead,
                            symbol: "",
                            notes: "",
                            subSheetId: null,
                            mergedRange: null, // ensure any previous merged metadata is cleared
                          });
                        }
                      }

                      if (clears.length > 0) {
                        await axios.put(`${API_URL}/dashboard/cells/update`, {
                          sheetId: sheet._id,
                          updates: clears.map((u) => (isSuperAdmin && superAdminUsername ? { ...u, updatedBy: superAdminUsername } : u)),
                        });
                      }

                      // 5. refresh
                      await fetch();
                      setMergeHead("");
                      setMergeFrom("");
                      alert("Merged rows successfully");
                    } catch (err) {
                      console.error("merge failed", err);
                      alert(err.response?.data?.msg || "Merge failed");
                    }
                  }}
                  className="px-3 py-1 bg-purple-600 text-white rounded"
                >
                  Merge
                </button>
              </div> */}
            </div>
            <div className={`overflow-auto h-[80vh] border rounded relative`}>
              <table className="min-w-[1100px] border-collapse">
                <thead>
                  <tr>
                    <th className="border px-2 py-1 w-36 text-center font-semibold">Period</th>
                    {heads.map((head) => (
                      <th
                        key={head}
                        className="border px-2 py-1 text-center font-bold"
                        colSpan={getServicesForHead(head).length || 1}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>

                  <tr>
                    <th className="border px-2 py-1 text-center font-semibold"></th>
                    {heads.map((head) =>
                      getServicesForHead(head).length ? (
                        getServicesForHead(head).map((s) => (
                          <th key={s} className="border px-2 py-1 text-sm font-semibold">
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-center flex-1">{s}</span>
                              {editMode && (
                                <button className="text-red-600" onClick={() => handleRemoveService(head, s)}>
                                  <FaTimes />
                                </button>
                              )}
                            </div>
                          </th>
                        ))
                      ) : (
                        <th key={head} className="border px-2 py-1 text-center">-</th>
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
                          <button className="text-red-600" onClick={() => handleRemovePeriod(row.period)}>
                            <FaTimes />
                          </button>
                        )}
                      </td>

                      {heads.flatMap((head) =>
                        getServicesForHead(head).length
                          ? getServicesForHead(head).map((service) => {
                            const skipKey = `${row.period}|${head}|${service}`;
                            if (skipCells.has(skipKey)) return null;

                            const cell = row.services?.[service]?.[head] || { symbol: "", notes: "" };
                            const symbolObj = symbols.find((s) => s.key === cell.symbol);

                            const spanKey = `${row.period}|${head}|${service}`;
                            const computedSpan = mergeSpanMap[spanKey];
                            const rowSpan = computedSpan && computedSpan > 1 ? computedSpan : undefined;

                            return (
                              <td
                                key={`${head}|${service}|${row.period}`}
                                {...(rowSpan ? { rowSpan } : {})}
                                className="border px-2 py-1 cursor-pointer text-center relative"
                                onClick={(e) => editMode && openPopup(e, row.period, service, head)}
                                onDoubleClick={() => (!editMode && cell.symbol != "") && openSubSheet(row.period, service, head)}
                              >
                                <div
                                  className="text-xl"
                                  title={
                                    cell?.updatedAt
                                      ? `Updated: ${formatTimestamp(cell.updatedAt)}${isSuperAdmin && cell?.updatedBy ? `\nEdited by: ${cell.updatedBy}` : ""}`
                                      : "Not updated"
                                  }
                                >
                                  {symbolObj?.label || ""}
                                </div>
                              </td>
                            );
                          })
                          : [
                            <td key={head} className="border px-2 py-1 text-center">-</td>,
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
                    <button key={s.key} className="px-2 py-1 hover:bg-gray-200 rounded text-xl" onClick={() => selectSymbol(s.key)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {
        sheet != null && (
          <div className="fixed bottom-0 left-0 w-full bg-gray-100 border-t py-3 px-6 flex items-center justify-center gap-10 z-50">
            {/* Paid */}
            <div className="flex items-center gap-2 text-green-600 font-semibold">
              <span className="text-2xl">✅</span>
              <span>Amount Paid</span>
            </div>

            {/* Pending */}
            <div className="flex items-center gap-2 text-red-600 font-semibold">
              <span className="text-2xl">❌</span>
              <span>Pending Payment</span>
            </div>

            {/* Late */}
            <div className="flex items-center gap-2 font-semibold text-yellow-600">
              <YellowExclamation />
              <span>Late Payment</span>
            </div>
          </div>
        )
      }


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
