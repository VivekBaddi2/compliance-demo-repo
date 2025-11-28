// src/pages/DetailedHeadPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api";

export default function DetailedHeadPage({ headType }) {
  const navigate = useNavigate();
  const company = JSON.parse(localStorage.getItem("activeCompany") || "{}"); // updated key
  const companyId = company?._id;

  const [sheets, setSheets] = useState([]);
  const [editMode, setEditMode] = useState(false);

  // Fetch sheets for the headType
  useEffect(() => {
    if (!companyId) return;

    const fetchSheets = async () => {
      try {
        const res = await axios.get(`${API_URL}/dsheet/list/${companyId}/${headType}`);
        setSheets(res.data.data);
      } catch (err) {
        console.error("Error fetching sheets:", err);
        setSheets([]);
      }
    };

    fetchSheets();
  }, [companyId, headType]);

  // Toggle edit mode
  const toggleEdit = () => setEditMode(!editMode);

  // Create new sheet
  const addSheet = async () => {
    const serviceName = prompt("Enter Service Name for new sheet:");
    if (!serviceName) return;

    try {
      const period = ""; // optional: can be dynamic
      const heading = serviceName;
      const res = await axios.post(`${API_URL}/dsheet/create`, { companyId, headType, serviceName, period, heading });
      setSheets(prev => [res.data.data, ...prev]);
    } catch (err) {
      console.error("Error creating sheet:", err);
      alert("Failed to create sheet");
    }
  };

  // Update cell
  const updateCell = (sheetIdx, r, c, value) => {
    const copy = [...sheets];
    if (!copy[sheetIdx].table[r]) copy[sheetIdx].table[r] = { cells: [] };
    copy[sheetIdx].table[r].cells[c] = { value };
    setSheets(copy);
  };

  // Add row
  const addRow = (sheetIdx) => {
    const copy = [...sheets];
    const cols = copy[sheetIdx].table?.[0]?.cells?.length || 4;
    copy[sheetIdx].table.push({ cells: Array.from({ length: cols }).map(() => ({ value: "" })) });
    setSheets(copy);
  };

  // Add column
  const addColumn = (sheetIdx) => {
    const copy = [...sheets];
    copy[sheetIdx].table.forEach(row => row.cells.push({ value: "" }));
    setSheets(copy);
  };

  // Delete row
  const deleteRow = (sheetIdx, r) => {
    const copy = [...sheets];
    copy[sheetIdx].table = copy[sheetIdx].table.filter((_, i) => i !== r);
    setSheets(copy);
  };

  // Delete column
  const deleteColumn = (sheetIdx, c) => {
    const copy = [...sheets];
    copy[sheetIdx].table.forEach(row => row.cells = row.cells.filter((_, i) => i !== c));
    setSheets(copy);
  };

  // Save sheet
  const saveSheet = async (sheetIdx) => {
    try {
      await axios.put(`${API_URL}/dsheet/update/${sheets[sheetIdx]._id}`, sheets[sheetIdx]);
      alert("Saved!");
    } catch (err) {
      console.error("Error saving sheet:", err);
      alert("Save failed!");
    }
  };

  if (!companyId) return <div>Please login to view sheets</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between mb-4 items-center">
        <h1 className="text-2xl font-bold">{headType} Details</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate(-1)} className="px-3 py-1 bg-gray-700 text-white rounded">
            Back
          </button>
          <button onClick={toggleEdit} className="px-3 py-1 bg-blue-600 text-white rounded">
            {editMode ? "View" : "Edit"}
          </button>
          <button onClick={addSheet} className="px-3 py-1 bg-green-600 text-white rounded">
            + Add Sheet
          </button>
        </div>
      </div>

      {/* No sheets message */}
      {sheets.length === 0 && (
        <div className="text-gray-500 mt-4">No sheets created yet. Click "Add Sheet" to create one.</div>
      )}

      {/* Sheets */}
      {sheets.map((sheet, sheetIdx) => (
        <div key={sheet._id} className="mb-6 border rounded p-3 bg-white">
          <h2 className="text-xl font-semibold mb-2">{sheet.heading || sheet.serviceName}</h2>

          <table className="min-w-[600px] border">
            <tbody>
              {(sheet.table?.length
                ? sheet.table
                : [{ cells: Array.from({ length: 4 }).map(() => ({ value: "" })) }])
                .map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.cells.map((cell, cIdx) => (
                      <td key={cIdx} className="border p-1">
                        {editMode ? (
                          <input
                            value={cell.value}
                            onChange={(e) => updateCell(sheetIdx, rIdx, cIdx, e.target.value)}
                            className="border px-2 py-1 min-w-[100px]"
                          />
                        ) : (
                          <span>{cell.value}</span>
                        )}
                      </td>
                    ))}
                    {editMode && (
                      <td className="p-1">
                        <button onClick={() => deleteRow(sheetIdx, rIdx)} className="text-red-600">✕</button>
                      </td>
                    )}
                  </tr>
                ))}

            </tbody>
          </table>

          {editMode && (
            <div className="mt-2 flex gap-2">
              <button onClick={() => addRow(sheetIdx)} className="px-3 py-1 bg-green-600 text-white rounded">+ Row</button>
              <button onClick={() => addColumn(sheetIdx)} className="px-3 py-1 bg-yellow-600 text-white rounded">+ Col</button>
              <button onClick={() => saveSheet(sheetIdx)} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
