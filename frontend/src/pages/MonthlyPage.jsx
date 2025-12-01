// MonthlyPage.jsx
// import DetailedHeadPage from "./DetailedSheetPage";

// export default function MonthlyPage() {
//   // return <DetailedHeadPage headType="Monthly" />;
// }

import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { FaPlus, FaTrash } from 'react-icons/fa'

const MonthlyPage = () => {
  // API
  const API = "http://localhost:4000/api/dsheet";

  // Code to get user role from local storage
  let permission = "";
  const isSuperAdmin = localStorage.getItem("superAdmin");
  if (isSuperAdmin) {
    permission = "Super Admin";
  }
  else {
    permission = "Admin"
  }

  const [sheetList, setSheetList] = useState([]);
  const [sheetActive, setSheetActive] = useState({
    name: "", id: "", sheetCols: [], sheetRows: [], active: false
  });
  const [hasLoaded, setHasLoaded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  // Code to open a sheet 
  const openSheetBtnClick = (sheetName, sheetId, sheetCols, sheetRows) => {
    setSheetActive(prev => ({
      ...prev,
      name: sheetName,
      id: sheetId,
      sheetCols: sheetCols,
      sheetRows: sheetRows
    }))
  }

  // Code to fetch All sheets on first render
  const fetchAllSheets = async () => {
    // To avoid multiple loads
    if (hasLoaded) {
      return
    }

    try {
      const res = await axios.get(`${API}/getAll`);
      const data = res.data.data;
      console.log("fetched sheet:", data)
      data.map((item, index) => {
        // const heading = item.heading;
        setSheetList(prev => [...prev, item]);
      })
      setHasLoaded(true);
    }
    catch (err) {
      console.error("Error fetching sheet", err);
    }
  }
  useEffect(() => {
    fetchAllSheets()
  }, [hasLoaded])

  // Code to create a new sheet
  const createSheetBtnClick = async () => {
    try {
      const res = await axios.post(`${API}/create`, { heading: "New Sheet" });
      const data = res.data.data
      // const heading = data.heading
      setSheetList(prev => [...prev, data]);
      console.log(data, heading)
      hasLoaded(false)
    } catch (err) {
      console.error("Error creating sheet", err);
    }
  }

  // Code to handle edit mode
  const editingModeBtn = () => {
    // code
    setEditMode(!editMode)
  }

  // Code to delete sheet
  const deleteSheetBtn = async () => {
    const confirmDelete = confirm("Are you sure to delete this sheet?");
    if (confirmDelete) {
      try {
        const res = await axios.delete(`${API}/delete/${sheetActive.id}`);
        const data = res.data;
        console.log(data);
        alert(data.message);
        setSheetList([]);
        setHasLoaded(false);
        sheetActive.name = "";
      } catch (err) {
        console.error(err)
      }
    }
  }

  // Code to update sheet name
  const updateSheetName = async () => {
    if (!editMode)
      return

    const newHeading = prompt("Enter new heading:");

    if (newHeading && newHeading.trim() !== "") {
      try {
        await axios.put(`${API}/update/${sheetActive.id}`, {
          heading: newHeading.trim()
        });

        // Update sheetActive with new name
        setSheetActive(prevSheetActive => ({
          ...prevSheetActive,
          name: newHeading.trim()
        }));

        // Update sheetList array with new heading
        setSheetList(prevSheetList =>
          prevSheetList.map(sheet =>
            sheet._id === sheetActive.id
              ? { ...sheet, heading: newHeading.trim() }
              : sheet
          )
        );

        alert("Sheet name updated successfully");
      } catch (err) {
        console.error("Error updating sheet name:", err);
        alert("Failed to update sheet name");
      }
    }
    else if (newHeading.trim() == "") {
      alert("Sheet Name cannot be empty")
    }
  }

  // Code to update column Names 
  const updateColumnName = (index, value) => {
    const updated = { ...sheetActive };
    updated.sheetCols[index] = value;
    setSheetActive(updated);
  };

  // Update cell value
  const updateCell = (rowIndex, cellIndex, value) => {
    const updated = { ...sheetActive };
    updated.sheetRows[rowIndex][cellIndex].value = value;
    setSheetActive(updated);
  };

  // Arrow-key navigation between cell inputs
  const handleCellKeyDown = (e, rowIndex, cellIndex) => {
    const key = e.key;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;
    e.preventDefault();

    const rows = sheetActive.sheetRows || [];
    const cols = sheetActive.sheetCols || [];
    let r = rowIndex;
    let c = cellIndex;

    if (key === 'ArrowUp') r = Math.max(0, rowIndex - 1);
    if (key === 'ArrowDown') r = Math.min(rows.length - 1, rowIndex + 1);
    if (key === 'ArrowLeft') c = Math.max(0, cellIndex - 1);
    if (key === 'ArrowRight') c = Math.min(cols.length - 1, cellIndex + 1);

    // find the target input by data attributes
    const selector = `input[data-row=\"${r}\"][data-col=\"${c}\"]`;
    const target = document.querySelector(selector);
    if (target) target.focus();
  };

  // Load single sheet by id and refresh active view + update sheetList entry
  const loadSheet = async (sheetId) => {
    if (!sheetId) return;
    try {
      const res = await axios.get(`${API}/get/${sheetId}`);
      const data = res.data.data;
      setSheetActive({
        name: data.heading || "",
        id: data._id,
        sheetCols: data.columns || [],
        sheetRows: data.rows || [],
        active: true,
      });

      // update sheetList entry so left-side list stays in sync
      setSheetList(prev => prev.map(s => (s._id === data._id ? data : s)));
    } catch (err) {
      console.error('Failed to load sheet', err);
    }
  }

  // Add/Delete Row
  const addRow = async () => {
    if (!sheetActive) return;
    // If user is editing (unsaved changes), perform local-only add so unsaved column edits are preserved
    if (editMode) {
      const cols = sheetActive.sheetCols || [];
      const newRow = cols.map(() => ({ value: "" }));
      setSheetActive(prev => ({ ...prev, sheetRows: [...(prev.sheetRows || []), newRow] }));
      return;
    }

    if (!sheetActive?.id) return;
    try {
      await axios.put(`${API}/rows/add/${sheetActive.id}`);
      await loadSheet(sheetActive.id);
    } catch (err) {
      console.error('Error adding row', err);
      alert('Add row failed');
    }
  };

  const deleteRow = async (index) => {
    if (!sheetActive) return;
    const confirmDelete = confirm('Are you sure to delete this row?');
    if (!confirmDelete) return;

    if (editMode) {
      // local-only deletion
      setSheetActive(prev => {
        const rows = [...(prev.sheetRows || [])];
        rows.splice(index, 1);
        return { ...prev, sheetRows: rows };
      });
      return;
    }

    if (!sheetActive?.id) return;
    try {
      await axios.put(`${API}/rows/delete/${sheetActive.id}/${index}`);
      await loadSheet(sheetActive.id);
    } catch (err) {
      console.error('Error deleting row', err);
      alert('Delete row failed');
    }
  };

  // Add/Delete Column
  const addColumn = async () => {
    if (!sheetActive) return;
    if (editMode) {
      // local-only add column
      setSheetActive(prev => {
        const cols = [...(prev.sheetCols || []), ""];
        const rows = (prev.sheetRows || []).map(r => [...r, { value: "" }]);
        return { ...prev, sheetCols: cols, sheetRows: rows };
      });
      return;
    }

    if (!sheetActive?.id) return;
    try {
      await axios.put(`${API}/columns/add/${sheetActive.id}`);
      await loadSheet(sheetActive.id);
    } catch (err) {
      console.error('Error adding column', err);
      alert('Add column failed');
    }
  };

  const deleteColumn = async (index) => {
    if (!sheetActive) return;
    const confirmDelete = confirm('Are you sure to delete this column?');
    if (!confirmDelete) return;

    if (editMode) {
      // local-only delete column
      setSheetActive(prev => {
        const cols = [...(prev.sheetCols || [])];
        cols.splice(index, 1);
        const rows = (prev.sheetRows || []).map(r => {
          const rowCopy = [...r];
          rowCopy.splice(index, 1);
          return rowCopy;
        });
        return { ...prev, sheetCols: cols, sheetRows: rows };
      });
      return;
    }

    if (!sheetActive?.id) return;
    try {
      await axios.put(`${API}/columns/delete/${sheetActive.id}/${index}`);
      await loadSheet(sheetActive.id);
    } catch (err) {
      console.error('Error deleting column', err);
      alert('Delete column failed');
    }
  };

  // Save edits made to sheet
  const saveSheet = async () => {
    await axios.put(`${API}/update/${sheetActive.id}`, {
      // heading: sheetActive.name,
      rows: sheetActive.sheetRows,
      columns: sheetActive.sheetCols,
    });
    // setHasLoaded(false);
    alert("Saved!");
    setEditMode(false)
  };


  console.log(sheetList)
  console.log(sheetActive)
  console.log(editMode)
  return (
    <>
      <div className='bg-gray-50 h-screen m-0 p-0 '>
        <header>
          <section className='flex flex-col items-center my-2'>
            <div>
              <h1 className='text-xl font-extrabold'>Monthly Page</h1>
            </div>
            <div>
              <p className='text-sm font-semibold text-gray-600'>Permission: <span className='font-medium'>{permission}</span></p>
            </div>
          </section>
        </header>
        <main>
          <section className='mainSection flex items-start justify-between'>
            <section className='sideMenuSection  w-1/4 m-4'>
              <aside>
                <div className='sheetMenuContainer bg-white shadow-md p-2 rounded-lg flex flex-col gap-4'>
                  <div className='sheetHeader flex justify-between items-center bg-gray-100 p-3 rounded-t-lg'>
                    <div className='sheetHeading'>
                      <h2 className='font-bold text-gray-600 text-lg'>All Sheets</h2>
                    </div>
                    <div>
                      <button onClick={() => createSheetBtnClick()} className='py-1 px-1 rounded-md text-sm border bg-white border-blue-500 text-blue-500 font-semibold'>Create Sheet</button>
                    </div>
                  </div>
                  <div className='sheetMenuList p-3 pt-0'>
                    <ul className='list-none'>
                      {sheetList.map((sheet, index) => {
                        return (
                          <li key={index} className={`${sheetActive.id == sheet._id && `bg-blue-500/90 p-2 text-white`} flex items-center justify-between my-2`}>
                            <p title={sheet.heading} className='line-clamp-1 whitespace-nowrap text-ellipsis w-[60%]'>{sheet.heading}</p>
                            <button onClick={() => openSheetBtnClick(sheet.heading, sheet._id, sheet.columns, sheet.rows)} className='bg-blue-500 py-1 px-2 rounded-md text-sm border border-blue-500 text-white font-semibold'>Open Sheet</button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              </aside>
            </section>
            <section className={`${sheetActive.name == "" && 'hidden'} bg-white shadow-md p-2 rounded-lg sheetSection transition w-3/4 m-4`}>
              <div className='sheetHeader flex items-center justify-between p-2 border-2 rounded-lg'>
                <div className='sheetHeadingContainer'>
                  <h2 onDoubleClick={updateSheetName} className='font-bold text-gray-600 text-lg'>{sheetActive.name}</h2>
                </div>
                <div className='delteBtnContainer'>
                  <button onClick={deleteSheetBtn} className='bg-red-500 py-2 px-2 rounded-md text-sm border border-red-500 text-white font-semibold'>Delete Sheet</button>
                </div>
                <div className='editBtnContainer'>
                  <button onClick={editMode ? saveSheet : editingModeBtn} className='bg-blue-500 py-2 px-2 rounded-md text-sm border border-blue-500 text-white font-semibold'>
                    {editMode ? "Save" : "Edit Sheet"}
                  </button>
                </div>
              </div>

              <div className='mx-2 mt-2 text-sm font-semibold text-gray-600 '>
                <p>Due Date: Every month (static)</p>
              </div>

              <div className='sheetTable mt-1  mx-2 overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-300 border-collapse table-fixed'>
                  <thead className='bg-blue-500 text-white shadow-lg sticky top-0 z-10'>
                    <tr>
                      {sheetActive.sheetCols.map((col, index) => (
                        <th
                          key={index}
                          className='px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider border-r border-blue-400'
                        >
                          <div className='flex items-center justify-between gap-2'>
                            <div className='flex-1'>
                              {editMode ? (
                                <input
                                  className='text-black w-full p-2'
                                  type="text"
                                  value={col}
                                  onChange={(e) => updateColumnName(index, e.target.value)}
                                />
                              ) : (
                                col
                              )}
                            </div>
                            {editMode && (
                              <button
                                onClick={() => deleteColumn(index)}
                                className='ml-2 text-white hover:text-red-200 p-1'
                                title='Delete column'
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                      {editMode && (
                        <th className='px-4 py-3 border-r border-blue-400'>
                          <button
                            onClick={addColumn}
                            className='bg-white text-blue-600 rounded p-1'
                            title='Add column'
                          >
                            <FaPlus />
                          </button>
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody className='divide-y divide-gray-200'>
                    {/* divide-y adds a line between rows */}
                    {sheetActive.sheetRows.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className='hover:bg-blue-50 transition duration-150 ease-in-out'
                      >
                        {/* Add hover effect for better row readability */}
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className='px-4 py-2 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200'
                          >
                            {
                              editMode ?
                                <input
                                  className='text-black w-full p-2'
                                  type="text"
                                  value={cell.value}
                                  data-row={rowIndex}
                                  data-col={cellIndex}
                                  onKeyDown={(e) => handleCellKeyDown(e, rowIndex, cellIndex)}
                                  onChange={(e) => updateCell(rowIndex, cellIndex, e.target.value)}
                                />
                                : cell.value
                            }
                          </td>
                        ))}

                        {editMode && (
                          <td className='px-2 py-2 border-r border-gray-200'>
                            <button
                              onClick={() => deleteRow(rowIndex)}
                              className='text-red-600 p-1'
                              title='Delete row'
                            >
                              <FaTrash />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {editMode && (
                  <div className='flex justify-end mt-2'>
                    <button
                      onClick={addRow}
                      className='bg-white text-blue-600 rounded p-2'
                      title='Add row'
                    >
                      <FaPlus />
                    </button>
                  </div>
                )}
              </div>
            </section>
          </section>
        </main>
      </div>
    </>
  )
}

export default MonthlyPage