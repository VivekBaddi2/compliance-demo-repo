import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { API_URL } from "../api";
import { FaTimes, FaEdit, FaSave } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function CompanyDashboard() {
  const company = JSON.parse(localStorage.getItem("company") || "null");
  const navigate = useNavigate();

  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newPeriod, setNewPeriod] = useState("");
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceHead, setNewServiceHead] = useState("Monthly");
  const [dirtyCells, setDirtyCells] = useState(new Map());
  const originalRef = useRef(null);

  const heads = ["Monthly", "Quarterly", "HalfYearly", "Yearly"];

  // fetch sheet
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

  useEffect(() => { fetch(); }, []);

  const handleCreateSheet = async () => {
    if (!company?._id) return alert("Company required");
    try {
      const res = await axios.post(`${API_URL}/dashboard/create`, { companyId: company._id });
      setSheet(res.data.data);
      originalRef.current = JSON.stringify(res.data.data);
      alert("Sheet created");
    } catch (err) { console.error(err); alert("Create failed"); }
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
    } catch (err) { console.error(err); alert("Add period failed"); }
  };

  const handleAddService = async () => {
    if (!newServiceName) return alert("Enter service name");
    if (!sheet?._id) return alert("Create sheet first");
    try {
      await axios.post(`${API_URL}/dashboard/service/add`, {
        sheetId: sheet._id,
        headType: newServiceHead,
        serviceName: newServiceName,
      });
      setNewServiceName("");
      await fetch();
    } catch (err) { console.error(err); alert("Add service failed"); }
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
    } catch (err) { console.error(err); alert("Remove service failed"); }
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
      if (!row.services[serviceName]) {
        row.services[serviceName] = {
          Monthly: { symbol: "", notes: "" },
          Quarterly: { symbol: "", notes: "" },
          HalfYearly: { symbol: "", notes: "" },
          Yearly: { symbol: "", notes: "" },
        };
      }
      row.services[serviceName][headType] = { ...row.services[serviceName][headType], ...patch };
      return copy;
    });

    const key = `${period}|${serviceName}|${headType}`;
    setDirtyCells((prev) => {
      const m = new Map(prev);
      m.set(key, { period, serviceName, headType, ...patch });
      return m;
    });
  };

  const cycleSymbol = (period, serviceName, headType) => {
    const cell = sheet.dashboard.find((r) => r.period === period).services?.[serviceName]?.[headType] || { symbol: "" };
    const next = cell.symbol === "tick" ? "cross" : cell.symbol === "cross" ? "late" : cell.symbol === "late" ? "" : "tick";
    markDirty(period, serviceName, headType, { symbol: next });
  };

  const openSubSheet = async (period, serviceName, headType) => {
    const row = sheet.dashboard.find((r) => r.period === period);
    const cell = row.services?.[serviceName]?.[headType];
    if (cell?.subSheetId) { navigate(`/company/sheet/${cell.subSheetId}`); return; }

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
        updates: [{ period, serviceName, headType, symbol: cell?.symbol || "", notes: cell?.notes || "", subSheetId: created._id }],
      });
      await fetch();
      navigate(`/company/sheet/${created._id}`);
    } catch (err) { console.error(err); alert("Could not open subsheet"); }
  };

  const handleSave = async () => {
    if (dirtyCells.size === 0) { setEditMode(false); return alert("No changes"); }
    const updates = Array.from(dirtyCells.values());
    try {
      await axios.put(`${API_URL}/dashboard/cells/update`, { sheetId: sheet._id, updates });
      await fetch();
      setEditMode(false);
      alert("Saved");
    } catch (err) { console.error(err); alert("Save failed"); }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      {/* header */}
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">Company Dashboard</h2>
        <div className="flex gap-2">
          {!sheet?._id ? (
            <button onClick={handleCreateSheet} className="px-3 py-1 bg-blue-600 text-white rounded">Create Sheet</button>
          ) : (
            <>
              <button onClick={() => setEditMode((m) => !m)} className="px-3 py-1 bg-gray-700 text-white rounded flex gap-2">
                <FaEdit /> {editMode ? "Exit Edit" : "Edit"}
              </button>
              <button onClick={handleSave} className="px-3 py-1 bg-green-600 text-white rounded flex gap-2">
                <FaSave /> Save
              </button>
            </>
          )}
        </div>
      </div>

      {!sheet?._id ? <div>No sheet. Create one.</div> : (
        <>
          {/* controls */}
          <div className="flex gap-2 mb-3">
            <input value={newPeriod} onChange={e => setNewPeriod(e.target.value)} className="border px-2 py-1" placeholder="Add period" />
            <button onClick={handleAddPeriod} className="px-3 py-1 bg-blue-500 text-white rounded">Add Period</button>

            <select value={newServiceHead} onChange={e => setNewServiceHead(e.target.value)} className="border px-2 py-1">
              {heads.map(h => <option key={h}>{h}</option>)}
            </select>

            <input value={newServiceName} onChange={e => setNewServiceName(e.target.value)} className="border px-2 py-1" placeholder="New service" />
            <button onClick={handleAddService} className="px-3 py-1 bg-green-500 text-white rounded">Add Service</button>
          </div>

          {/* table */}
          <div className="overflow-auto border rounded">
            <table className="min-w-[900px] table-fixed border-collapse">
              <thead>
                <tr>
                  <th className="border px-2 py-1 w-36">Period</th>
                  {heads.map(h => <th key={h} className="border px-2 py-1">{h}</th>)}
                </tr>
                <tr>
                  <th />
                  {heads.map(head => (
                    <th key={head} className="border px-2 py-1">
                      <div className="flex flex-wrap gap-1">
                        {sheet.serviceHeads[head]?.length ? sheet.serviceHeads[head].map(s => (
                          <div key={s} className="flex items-center gap-2 border rounded px-2 py-1">
                            <span>{s}</span>
                            <button className="text-red-600" onClick={() => handleRemoveService(head, s)}><FaTimes/></button>
                          </div>
                        )) : <span>-</span>}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheet.dashboard.map(row => (
                  <tr key={row.period}>
                    <td className="border px-2 py-1 w-36 flex justify-between items-center">
                      {row.period}
                      <button className="text-red-600" onClick={() => handleRemovePeriod(row.period)}><FaTimes/></button>
                    </td>

                    {heads.map(head => (
                      <td key={head} className="border px-2 py-1">
                        <div className="grid gap-1">
                          {sheet.serviceHeads[head]?.map(service => {
                            const cell = row.services?.[service]?.[head] || { symbol: "", notes: "" };
                            return (
                              <div key={service} className="flex items-center justify-between border rounded px-2 py-1">
                                <button onClick={() => editMode ? cycleSymbol(row.period, service, head) : openSubSheet(row.period, service, head)}>
                                  {cell.symbol === "tick" ? "✔️" : cell.symbol === "cross" ? "❌" : cell.symbol === "late" ? "⏰" : ""}
                                </button>

                                {editMode ? (
                                  <input value={cell.notes} onChange={e => markDirty(row.period, service, head, { notes: e.target.value })} className="border px-1 py-0.5 flex-1" />
                                ) : <span>{cell.notes || "—"}</span>}

                                <button onClick={() => openSubSheet(row.period, service, head)} className="text-blue-600">Open</button>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
