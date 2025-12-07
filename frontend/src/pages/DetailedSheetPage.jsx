import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:4000/api/dsheet";

export default function SubSheetManager() {
  const [sheets, setSheets] = useState([]);
  const [activeSheet, setActiveSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // Fetch All Sheets
  const fetchSheets = async () => {
    try {
      const res = await axios.get(`${API}/getAll`);
      setSheets(res.data.data || []);
    } catch (err) {
      console.error("Error fetching sheets", err);
    } finally {
      setLoading(false);
    }
  };

  // Create Sheet
  const createSheet = async () => {
    try {
      const res = await axios.post(`${API}/create`, { heading: "New Sheet" });
      await fetchSheets();
      openSheet(res.data.data._id);
      setEditMode(true); // auto-edit new sheet
    } catch (err) {
      console.error("Error creating sheet", err);
    }
  };

  // Open sheet
  const openSheet = async (id) => {
    try {
      const res = await axios.get(`${API}/get/${id}`);
      setActiveSheet(res.data.data);
      setEditMode(false); // default view mode
    } catch (err) {
      console.error("Error opening sheet", err);
    }
  };

  // Toggle Edit Mode
  const toggleEditMode = () => setEditMode((prev) => !prev);

  // Update heading
  const updateHeading = (value) => {
    setActiveSheet({ ...activeSheet, heading: value });
  };

  // Update column name
  const updateColumnName = (index, value) => {
    const updated = { ...activeSheet };
    updated.columns[index] = value;
    setActiveSheet(updated);
  };

  // Update cell value
  const updateCell = (r, c, value) => {
    const updated = { ...activeSheet };
    updated.rows[r][c].value = value;
    setActiveSheet(updated);
  };

  // Save sheet
  const saveSheet = async () => {
    await axios.put(`${API}/update/${activeSheet._id}`, {
      heading: activeSheet.heading,
      rows: activeSheet.rows,
      columns: activeSheet.columns,
    });
    fetchSheets();
    alert("Saved!");
  };

  // Add/Delete Row
  const addRow = async () => {
    await axios.put(`${API}/rows/add/${activeSheet._id}`);
    openSheet(activeSheet._id);
  };
  const deleteRow = async (index) => {
    await axios.put(`${API}/rows/delete/${activeSheet._id}/${index}`);
    openSheet(activeSheet._id);
  };

  // Add/Delete Column
  const addColumn = async () => {
    await axios.put(`${API}/columns/add/${activeSheet._id}`);
    openSheet(activeSheet._id);
  };
  const deleteColumn = async (index) => {
    await axios.put(`${API}/columns/delete/${activeSheet._id}/${index}`);
    openSheet(activeSheet._id);
  };

  // Delete Sheet
  const deleteSheet = async () => {
    if (!window.confirm("Delete this sheet?")) return;
    await axios.delete(`${API}/delete/${activeSheet._id}`);
    setActiveSheet(null);
    fetchSheets();
  };

  useEffect(() => {
    fetchSheets();
  }, []);

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.title}>📄 SubSheet Manager</h1>

      <div style={styles.container}>
        {/* LEFT PANEL */}
        <div style={styles.leftPanel}>
          <h2 style={styles.panelTitle}>All Sheets</h2>

          {editMode && (
            <button style={styles.createBtn} onClick={createSheet}>
              + Create SubSheet
            </button>
          )}

          {loading ? (
            <p>Loading...</p>
          ) : sheets.length === 0 ? (
            <p>No sheets found.</p>
          ) : (
            <table style={styles.sheetTable}>
              <thead>
                <tr>
                  <th>Heading</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {sheets.map((sheet) => (
                  <tr key={sheet._id}>
                    <td>{sheet.heading}</td>
                    <td>
                      <button
                        style={styles.openBtn}
                        onClick={() => openSheet(sheet._id)}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div style={styles.rightPanel}>
          {!activeSheet ? (
            <h2>Select a sheet to start editing</h2>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2>{activeSheet.heading}</h2>
                <button style={styles.editBtn} onClick={toggleEditMode}>
                  {editMode ? "Exit Edit Mode" : "Edit Sheet"}
                </button>
              </div>

              {editMode && (
                <input
                  style={styles.headingInput}
                  value={activeSheet.heading}
                  onChange={(e) => updateHeading(e.target.value)}
                />
              )}

              <div style={{ overflowX: "auto", marginTop: 20 }}>
                <table style={styles.editorTable}>
                  <thead>
                    <tr>
                      {activeSheet.columns.map((colName, colIndex) => (
                        <th key={colIndex} style={styles.th}>
                          {editMode ? (
                            <>
                              <input
                                style={styles.columnInput}
                                value={colName}
                                onChange={(e) =>
                                  updateColumnName(colIndex, e.target.value)
                                }
                              />
                              <button
                                style={styles.deleteIcon}
                                onClick={() => deleteColumn(colIndex)}
                              >
                                ✖
                              </button>
                            </>
                          ) : (
                            colName
                          )}
                        </th>
                      ))}
                      {editMode && <th>Actions</th>}
                    </tr>
                  </thead>

                  <tbody>
                    {activeSheet.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, colIndex) => (
                          <td key={colIndex} style={styles.td}>
                            {editMode ? (
                              <input
                                style={styles.cellInput}
                                value={cell.value}
                                onChange={(e) =>
                                  updateCell(rowIndex, colIndex, e.target.value)
                                }
                              />
                            ) : (
                              cell.value
                            )}
                          </td>
                        ))}
                        {editMode && (
                          <td>
                            <button
                              style={styles.deleteRowBtn}
                              onClick={() => deleteRow(rowIndex)}
                            >
                              Delete Row
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {editMode && (
                <div style={{ marginTop: 20 }}>
                  <button style={styles.addBtn} onClick={addRow}>
                    + Add Row
                  </button>
                  <button style={styles.addBtn} onClick={addColumn}>
                    + Add Column
                  </button>
                  <button style={styles.saveBtn} onClick={saveSheet}>
                    Save Changes
                  </button>
                  <button style={styles.deleteSheetBtn} onClick={deleteSheet}>
                    Delete Sheet
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------ STYLES ------------------ */
const styles = {
  wrapper: { padding: "20px", fontFamily: "Arial" },
  title: { marginBottom: "20px", textAlign: "center" },
  container: { display: "flex", gap: "25px" },

  leftPanel: { width: "30%", padding: "20px", borderRight: "2px solid #e0e0e0" },
  panelTitle: { marginBottom: 10 },
  createBtn: {
    padding: "8px 14px",
    backgroundColor: "#4caf50",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    marginBottom: 15,
  },
  sheetTable: { width: "100%", borderCollapse: "collapse" },
  openBtn: {
    padding: "6px 12px",
    backgroundColor: "#1976d2",
    color: "white",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },

  rightPanel: { width: "70%", padding: "20px" },
  headingInput: { fontSize: 18, padding: 10, width: "300px", marginTop: 10 },
  columnInput: { width: "80%", padding: 4, fontSize: 14 },
  editorTable: { borderCollapse: "collapse", width: "100%" },
  th: { border: "1px solid #ccc", padding: 10, backgroundColor: "#f5f5f5", position: "relative" },
  td: { border: "1px solid #ddd", padding: 8 },
  deleteIcon: { marginLeft: 5, color: "red", cursor: "pointer", border: "none", background: "none" },
  cellInput: { width: "100%", padding: 5 },
  addBtn: { padding: "8px 14px", backgroundColor: "#009688", color: "white", border: "none", borderRadius: 6, cursor: "pointer", marginRight: 10 },
  saveBtn: { padding: "10px 16px", backgroundColor: "green", color: "white", border: "none", borderRadius: 6, cursor: "pointer" },
  deleteRowBtn: { backgroundColor: "red", color: "white", padding: "6px 12px", border: "none", borderRadius: 4, cursor: "pointer" },
  deleteSheetBtn: { padding: "10px 16px", backgroundColor: "darkred", color: "white", marginLeft: 15, border: "none", borderRadius: 6, cursor: "pointer" },
  editBtn: { padding: "6px 12px", backgroundColor: "#ff9800", color: "white", border: "none", borderRadius: 6, cursor: "pointer" },
};
