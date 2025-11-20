// src/pages/DetailedSheetPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../api";
import { useParams, useNavigate } from "react-router-dom";

export default function DetailedSheetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_URL}/dsheet/get/${id}`);
        setSub(res.data.data);
      } catch (err) {
        console.error("load subsheet", err);
        alert("SubSheet not found");
        navigate("/company/dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const updateCell = (r, c, value) => {
    const copy = JSON.parse(JSON.stringify(sub));
    if (!copy.table) copy.table = [];
    if (!copy.table[r]) copy.table[r] = { cells: [] };
    copy.table[r].cells[c] = { value };
    setSub(copy);
  };

  const addRow = () => {
    const copy = JSON.parse(JSON.stringify(sub));
    const cols = copy.table?.[0]?.cells?.length || 4;
    copy.table.push({
      cells: Array.from({ length: cols }).map(() => ({ value: "" })),
    });
    setSub(copy);
  };

  const deleteRow = (r) => {
    const copy = JSON.parse(JSON.stringify(sub));
    copy.table = copy.table.filter((_, i) => i !== r);
    setSub(copy);
  };

  const saveSub = async () => {
    try {
      await axios.post(`${API_URL}/dsheet/update/${id}`, sub);
      setMessage("Saved");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      console.error("save subsheet", err);
      alert("Save failed");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!sub) return null;

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">{sub.heading}</h1>

        <div className="flex gap-2">
          <button onClick={() => navigate("/company/dashboard")} className="px-3 py-1 bg-gray-700 text-white rounded">
            Back
          </button>
          <button onClick={saveSub} className="px-3 py-1 bg-blue-600 text-white rounded">
            Save
          </button>
        </div>
      </div>

      <div className="mb-2">
        <strong>Head:</strong> {sub.headType} • <strong>Service:</strong> {sub.serviceName}
      </div>

      <div className="overflow-auto border p-2 rounded bg-white">
        <table className="min-w-[600px]">
          <tbody>
            {(sub.table?.length ? sub.table : [{ cells: [{ value: "" }] }]).map((row, rIdx) => (
              <tr key={rIdx}>
                {row.cells.map((cell, cIdx) => (
                  <td key={cIdx} className="border p-1">
                    <input
                      value={cell.value}
                      onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                      className="border px-2 py-1 min-w-[120px]"
                    />
                  </td>
                ))}

                <td className="p-1">
                  <button onClick={() => deleteRow(rIdx)} className="text-red-600">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex gap-2">
        <button onClick={addRow} className="px-3 py-1 bg-green-600 text-white rounded">
          + Row
        </button>
        <span className="text-green-700">{message}</span>
      </div>
    </div>
  );
}
