import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function CompanyExcel() {
  const navigate = useNavigate();
  const company = JSON.parse(localStorage.getItem("company"));

  const sheetTypes = ["dashboard", "monthly", "quarterly", "half-yearly", "yearly"];
  const [activeSheet, setActiveSheet] = useState("dashboard");
  const [sheetData, setSheetData] = useState([[""]]); // 2D array: first row = headers
  const [sheetId, setSheetId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Convert backend cells -> 2D array for display
  const mapCellsTo2DArray = (cells) => {
    if (!cells || cells.length === 0) return [["Column1"], [""]];
    // columns = unique columns in order of first occurrence
    const columns = [];
    const rowKeys = [];
    const cellMap = {}; // cellMap[row][col] = value

    for (const c of cells) {
      if (!columns.includes(c.column)) columns.push(c.column);
      if (!rowKeys.includes(c.row)) rowKeys.push(c.row);
      if (!cellMap[c.row]) cellMap[c.row] = {};
      cellMap[c.row][c.column] = c.value;
    }

    const result = [];
    result.push(columns.length ? columns : ["Column1"]); // header row
    for (let i = 0; i < rowKeys.length; i++) {
      const rowKey = rowKeys[i];
      const rowArr = columns.map((col) => cellMap[rowKey]?.[col] ?? "");
      result.push(rowArr);
    }
    // if no rows, create one empty data row
    if (result.length === 1) result.push(columns.map(() => ""));
    return result;
  };

  // Convert current sheetData -> cells array for backend
  const buildCellsFromSheetData = (data) => {
    // data[0] = columns (headers)
    const columns = data[0] ?? [];
    const cells = [];
    for (let r = 1; r < data.length; r++) {
      const rowKey = `Row${r}`; // stable row key by index
      for (let c = 0; c < columns.length; c++) {
        const colKey = columns[c] || `Col${c + 1}`;
        const value = data[r][c] ?? "";
        // include all cells (even empty) if you prefer, or filter out empty values
        // here we'll include non-empty only to keep DB smaller
        if (value !== "") {
          cells.push({ row: rowKey, column: colKey, value: String(value) });
        }
      }
    }
    return cells;
  };

  const fetchSheet = async () => {
    if (!company?._id) return;
    try {
      setLoading(true);
      setMessage("");
      const res = await axios.get(
        `http://localhost:4000/api/sheet/company/${company._id}/${activeSheet}`
      );
      if (res.data?.success && res.data.data) {
        const sheet = res.data.data;
        setSheetId(sheet._id);
        setSheetData(mapCellsTo2DArray(sheet.cells));
      } else {
        // no sheet found -> default 1x1 (single header + one empty row)
        setSheetId(null);
        setSheetData([["Column1"], [""]]);
      }
    } catch (err) {
      // Not found or error -> start with empty 1x1-like sheet
      console.error(err);
      setSheetId(null);
      setSheetData([["Column1"], [""]]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!company?._id) {
      navigate("/company/login");
      return;
    }
    fetchSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSheet, company?._id]);

  const handleLogout = () => {
    localStorage.removeItem("company");
    navigate("/");
  };

  const handleCellChange = (r, c, value) => {
    const copy = sheetData.map((row) => [...row]);
    // ensure row exists
    if (!copy[r]) {
      copy[r] = Array(copy[0]?.length || 1).fill("");
    }
    // ensure column slots
    if (!copy[r][c]) copy[r][c] = value;
    copy[r][c] = value;
    setSheetData(copy);
  };

  const addRow = () => {
    const cols = sheetData[0]?.length || 1;
    const newRow = Array(cols).fill("");
    setSheetData([...sheetData, newRow]);
  };

  const deleteRow = (r) => {
    if (r === 0) return; // don't delete header row
    if (sheetData.length <= 2) {
      // keep at least one data row
      const newData = [sheetData[0], Array(sheetData[0].length).fill("")];
      setSheetData(newData);
      return;
    }
    const newData = sheetData.filter((_, i) => i !== r);
    setSheetData(newData);
  };

  const addColumn = () => {
    const newData = sheetData.map((row, rowIdx) => {
      // header: create Column{n}
      if (rowIdx === 0) return [...row, `Column${row.length + 1}`];
      return [...row, ""];
    });
    setSheetData(newData);
  };

  const deleteColumn = (cIdx) => {
    if (cIdx === 0) return; // keep at least one column header (or you can allow)
    // if only one column exists, reset to single empty
    if ((sheetData[0]?.length || 1) <= 1) {
      setSheetData([["Column1"], [Array(1).fill("")]]);
      return;
    }
    const newData = sheetData.map((row) => row.filter((_, i) => i !== cIdx));
    setSheetData(newData);
  };

  // SAVE: replace entire sheet cells on backend (single call)
  const saveSheet = async () => {
    try {
      setLoading(true);
      setMessage("");
      const cells = buildCellsFromSheetData(sheetData);
      if (sheetId) {
        // replace
        await axios.put(`http://localhost:4000/api/sheet/replace/${sheetId}`, {
          cells,
        });
        setMessage("Sheet saved (replaced) successfully.");
      } else {
        // create new
        const payload = {
          sheetType: activeSheet,
          company: company._id,
          createdBy: company?.createdBy || company?.adminId || "unknownAdmin",
          cells,
        };
        const res = await axios.post(`http://localhost:4000/api/sheet/create`, payload);
        // controller returns { message, sheet } — use res.data.sheet or res.data.data depending on controller
        const newSheet = res.data?.sheet ?? res.data?.data ?? null;
        if (newSheet?._id) setSheetId(newSheet._id);
        setMessage("Sheet created successfully.");
      }
      // refresh from server to normalize structure
      await fetchSheet();
    } catch (err) {
      console.error(err);
      setMessage("Error saving sheet.");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Company Excel Sheet</h1>
        <div className="flex gap-3 items-center">
          <span className="text-sm text-gray-600">Active: {activeSheet}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Sheet toggles */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {sheetTypes.map((t) => (
          <button
            key={t}
            onClick={() => setActiveSheet(t)}
            className={`px-4 py-2 rounded-md font-medium ${
              activeSheet === t ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-3">
        <button onClick={addRow} className="px-4 py-2 bg-green-600 text-white rounded">
          + Row
        </button>
        <button onClick={addColumn} className="px-4 py-2 bg-blue-600 text-white rounded">
          + Col
        </button>
        <button onClick={saveSheet} className="px-4 py-2 bg-gray-900 text-white rounded">
          💾 Save Sheet
        </button>
        <div className="ml-4 text-sm text-green-700">{message}</div>
      </div>

      {/* Table container with both scrollbars */}
      <div
        className="overflow-auto bg-white rounded shadow border border-gray-300"
        style={{ maxHeight: "72vh", minWidth: "100%", overflowX: "auto" }}
      >
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : (
          <table className="table-fixed border-collapse min-w-[900px]">
            <tbody>
              {sheetData.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="border p-0 relative"
                      style={{ minWidth: cIdx === 0 ? 140 : 120 }}
                    >
                      <input
                        value={cell}
                        onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                        className={`w-full h-10 px-2 border-none outline-none ${
                          rIdx === 0 ? "bg-gray-100 font-semibold" : ""
                        }`}
                      />
                      {/* del column button on header row (not 1st col header if you want) */}
                      {rIdx === 0 && cIdx !== 0 && (
                        <button
                          onClick={() => deleteColumn(cIdx)}
                          className="absolute -top-2 right-1 text-xs text-red-600"
                          title="Delete column"
                        >
                          ✕
                        </button>
                      )}
                      {/* del row button for data rows */}
                      {rIdx !== 0 && cIdx === 0 && (
                        <button
                          onClick={() => deleteRow(rIdx)}
                          className="absolute -top-2 left-1 text-xs text-red-600"
                          title="Delete row"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
