import { useState, useEffect } from "react";
import axios from "axios";

export default function ComplianceTable({ sheetType, companyId, adminId }) {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState({});

  // Fetch sheet from backend
  useEffect(() => {
    async function fetchSheet() {
      try {
        const res = await axios.get(`http://localhost:4000/api/compliance?sheetType=${sheetType}&company=${companyId}`);
        if (res.data.success) {
          const sheet = res.data.data;
          setRows(sheet.cells.map(cell => cell.row));
          setColumns(sheet.cells.map(cell => cell.column));
          const cellData = {};
          sheet.cells.forEach(cell => {
            cellData[`${cell.row}-${cell.column}`] = cell.value;
          });
          setData(cellData);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchSheet();
  }, [sheetType, companyId]);

  const handleCellChange = (row, col, value) => {
    setData(prev => ({ ...prev, [`${row}-${col}`]: value }));
  };

  const saveSheet = async () => {
    const cells = [];
    rows.forEach(row => {
      columns.forEach(col => {
        cells.push({ row, column: col, value: data[`${row}-${col}`] || "" });
      });
    });
    try {
      await axios.post("http://localhost:4000/api/compliance/update", {
        sheetType,
        company: companyId,
        createdBy: adminId,
        cells
      });
      alert("Sheet saved successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mt-4 overflow-auto">
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr>
            <th className="border p-2">Date / Service</th>
            {columns.map((col, i) => <th key={i} className="border p-2">{col}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="border p-2">{row}</td>
              {columns.map((col, j) => (
                <td key={j} className="border p-2">
                  <input
                    type="text"
                    value={data[`${row}-${col}`] || ""}
                    onChange={e => handleCellChange(row, col, e.target.value)}
                    className="w-full border p-1 rounded"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={saveSheet} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Save Sheet
      </button>
    </div>
  );
}
