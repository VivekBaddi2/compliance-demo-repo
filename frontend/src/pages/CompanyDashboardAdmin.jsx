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


export default function CompanyDashboardAdmin() {
  const company = JSON.parse(localStorage.getItem("activeCompany") || "null"); // updated key
  const navigate = useNavigate();

  const isAdmin = !!localStorage.getItem("admin");
  const _adminObj = JSON.parse(localStorage.getItem("admin") || "null");
  const adminUsername = _adminObj?.username || null;

  const [sheet, setSheet] = useState(null);
  const [companySheets, setCompanySheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newPeriod, setNewPeriod] = useState("");
  // const [newServiceName, setNewServiceName] = useState("");
  // const [newServiceHead, setNewServiceHead] = useState("Monthly");
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

  // Normalize head keys and enforce desired ordering
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

  const fetchCompanySheets = async () => {
    if (!company?._id) return;
    try {
      const res = await axios.get(`${API_URL}/dashboard/list/${company._id}`);
      setCompanySheets(res.data.data || []);
    } catch (err) {
      console.error('fetch company sheets:', err);
    }
  };

  useEffect(() => {
    fetch();
    fetchCompanySheets();
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

  // compute merged spans and cells to skip based on persisted mergedRange metadata
  const mergeSpanMap = {};
  const skipCells = new Set();
  if (sheet) {
    const indexMap = {};
    for (let i = 0; i < sortedDashboard.length; i++)
      indexMap[sortedDashboard[i].period] = i;
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
          for (let k = start + 1; k <= end; k++)
            skipCells.add(`${sortedDashboard[k].period}|${head}|${service}`);
        }
      }
    }
  }

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

  const markDirty = (period, serviceName, headType, patch) => {
    setSheet((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const row = copy.dashboard.find((r) => r.period === period);
      if (!row.services[serviceName]) {
        row.services[serviceName] = {
          Monthly: { symbol: "" },
          Quarterly: { symbol: "" },
          HalfYearly: { symbol: "" },
          Yearly: { symbol: "" },
        };
      }
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

  const selectSymbol = async (symbol) => {
    // Update UI
    markDirty(popup.period, popup.service, popup.head, { symbol });

    // Lock cell permanently
    await axios.put(`${API_URL}/dashboard/cells/lock`, {
      sheetId: sheet._id,
      period: popup.period,
      serviceName: popup.service,
      headType: popup.head,
    });

    setPopup({ ...popup, visible: false });
  };

  const openSubSheet = async (period, serviceName, headType) => {
    const row = sortedDashboard.find((r) => r.period === period);
    const cell = row.services?.[serviceName]?.[headType];
    // if (cell?.subSheetId) {
    //   navigate(`/company/subsheet/view/${cell.subSheetId}`);
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

    //   await axios.post(`${API_URL}/dashboard/cells/update`, {
    //     sheetId: sheet._id,
    //     updates: [
    //       isAdmin && adminUsername
    //         ? {
    //           period,
    //           serviceName,
    //           headType,
    //           symbol: cell?.symbol || "",
    //           notes: cell?.notes || "",
    //           subSheetId: created._id,
    //           updatedBy: adminUsername,
    //         }
    //         : {
    //           period,
    //           serviceName,
    //           headType,
    //           symbol: cell?.symbol || "",
    //           notes: cell?.notes || "",
    //           subSheetId: created._id,
    //         },
    //     ],
    //   });

    //   await fetch();
    //   navigate(`/company/subsheet/view/${created._id}`);
    // } catch (err) {
    //   console.error(err);
    //   alert("Could not open subsheet");
    // }

    navigate(`/company/subsheet/${headType.toLowerCase()}/${company._id}`);

  };

  const handleSave = async () => {
    if (dirtyCells.size === 0) {
      setEditMode(false);
      return alert("No changes");
    }
    // const updates = Array.from(dirtyCells.values());
    // include updatedBy (super-admin username) when available so backend can persist editor identity
    const updates = Array.from(dirtyCells.values()).map((u) => {
      if (isAdmin && adminUsername) return { ...u, updatedBy: adminUsername };
      return u;
    });
    try {
      // Need to update backend - no editing cells
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
  if (!sheet || !sheet._id) {
    return (
      <>
        <CompanyNavbar />
        <div className="p-4 text-center text-xl font-semibold text-gray-600">
          No Sheets Created
        </div>

        <div className="flex justify-center mt-4">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <CompanyNavbar />

      <div className="p-4">
        {/* header */}
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">Company Dashboard</h2>
          <div className="flex gap-2">
            {sheet?._id && (
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
                {/* Sheet selector for admins (choose FY sheet) */}
                {companySheets && companySheets.length > 0 && (
                  <select
                    value={sheet?._id || ""}
                    onChange={async (e) => {
                      const sid = e.target.value;
                      try {
                        if (!sid) {
                          // fetch default
                          await fetch();
                          return;
                        }
                        const res = await axios.get(`${API_URL}/dashboard/sheet/${sid}`);
                        setSheet(res.data.data);
                        originalRef.current = JSON.stringify(res.data.data);
                        setDirtyCells(new Map());
                      } catch (err) {
                        console.error('fetch sheet by id:', err);
                        alert('Could not load selected sheet');
                      }
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
                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 active:scale-95 transition"
                >
                  Back
                </button>
              </>
            )}
          </div>
        </div>

        {sheet?._id && (
          <>
            {/* controls */}
            {/* <div className="flex gap-2 mb-3"> */}
            {/* <select
                value={newPeriod}
                onChange={(e) => setNewPeriod(e.target.value)}
                className="border px-2 py-1"
              >
                <option value="">Select period</option>
                {monthList.map((m, i) => (
                  <option key={i} value={m}>
                    {m}
                  </option>
                ))}
              </select> */}

            {/* <button
                onClick={handleAddPeriod}
                className="px-3 py-1 bg-blue-500 text-white rounded"
              >
                Add Period
              </button> */}
            {/* </div> */}

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
                  {
                    <tr>
                      <th className="border px-2 py-1 text-center font-semibold"></th>

                      {heads.map((head) =>
                        sheet.serviceHeads[head]?.length ? (
                          sheet.serviceHeads[head].map((s) => (
                            <th
                              key={head + "_" + s}
                              className="border px-2 py-1 text-sm font-semibold"
                            >
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-center flex-1">{s}</span>
                              </div>
                            </th>
                          ))
                        ) : (
                          <th
                            key={head}
                            className="border px-2 py-1 text-center"
                          >
                            -
                          </th>
                        )
                      )}
                    </tr>
                  }
                </thead>

                <tbody>
                  {sortedDashboard.map((row) => (
                    <tr key={row.period}>
                      {/* PERIOD COLUMN */}
                      <td className="border px-2 py-1 w-36 text-center">
                        {row.period}
                      </td>

                      {/* SERVICE CELLS */}
                      {heads.flatMap((head) =>
                        sheet.serviceHeads[head]?.length
                          ? sheet.serviceHeads[head].map((service) => {
                            const skipKey = `${row.period}|${head}|${service}`;
                            if (skipCells.has(skipKey)) return null;

                            const cell = row.services?.[service]?.[head] || {
                              symbol: "",
                            };
                            const symbolObj = symbols.find(
                              (s) => s.key === cell.symbol
                            );

                            const spanKey = `${row.period}|${head}|${service}`;
                            const computedSpan = mergeSpanMap[spanKey];
                            const rowSpan =
                              computedSpan && computedSpan > 1
                                ? computedSpan
                                : undefined;

                            return (
                              <td
                                key={`${row.period}_${head}_${service}`}
                                {...(rowSpan ? { rowSpan } : {})}
                                className="border px-2 py-1 cursor-pointer text-center relative"
                                onClick={(e) => {
                                  if (!editMode) return;
                                  if (cell.symbol) return; // ❌ cannot change once set
                                  openPopup(e, row.period, service, head);
                                }}
                                onDoubleClick={() => {
                                  if (editMode) return;
                                  if (!cell.symbol) return; // ❌ empty -> no subsheet
                                  openSubSheet(row.period, service, head);
                                }}
                              >
                                <div
                                  className="text-xl"
                                  title={
                                    cell?.updatedAt
                                      ? `Updated: ${formatTimestamp(cell.updatedAt)}`
                                      : "Not updated"
                                  }

                                >
                                  {symbolObj?.label || ""}
                                </div>
                              </td>
                            );
                          })
                          : [
                            <td
                              key={`${row.period}_${head}_empty`}
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