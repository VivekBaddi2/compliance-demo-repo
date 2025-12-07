import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaPlus, FaTrash, FaArrowLeft } from "react-icons/fa";

const SubSheetPage = () => {
    // API
    const API = "http://localhost:4000/api/dsheet";

    // Permission flags
    const isSuperAdmin = !!localStorage.getItem("superAdmin"); // truthy if present
    const isAdmin = !isSuperAdmin; // fallback: if not superadmin, it's admin
    const permission = isSuperAdmin ? "Super Admin" : "Admin";

    const {
        type: routeType,
        id: routeId,
        companyId: routeCompanyId,
    } = useParams();
    const sheetType = routeType || "monthly";
    const companyId = routeCompanyId || "";

    //dropdowns
    const modeOfPaymentOptions = ["e-banking", "cheque", "DD", "cash"];
    const remarksOptions = [
        "Not applicable",
        "delay from management",
        "delay from consultant",
        "others",
    ];
    const statusOptions = [
        "Paid",
        "Processed",
        "Pending",
        "Issued",
        "Late Payment",
        "NIL Return",
        "Filed",
        "Late Filing",

    ];
    const paySlipOptions = ["Generated", "Not Generated", "Not applicable"];


    const [sheetList, setSheetList] = useState([]);
    const [companySheets, setCompanySheets] = useState([]);
    const [selectedFyFilter, setSelectedFyFilter] = useState("ALL");
    const [sheetActive, setSheetActive] = useState({
        name: "",
        id: "",
        sheetCols: [],
        sheetRows: [],
        active: false,
    });
    const [hasLoaded, setHasLoaded] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const [cellUpdate, setCellUpdate] = useState([]);
    // Tracks which top-right dropdown is selected ("mode" or "remarks" or null)
    const [activeDropdownType, setActiveDropdownType] = useState(null);

    // Tracks the currently selected cell (row & col) to insert dropdown into
    const [activeCell, setActiveCell] = useState({
        rowIndex: null,
        cellIndex: null,
    });

    const navigate = useNavigate();

    // Code to handle back button click
    const backButtonCLick = () => {
        navigate(-1);
    };
    // Code to open a sheet
    const openSheetBtnClick = (sheetId) => {
        // load the sheet from server (ensures consistent shape)
        loadSheet(sheetId);
    };

    // Code to fetch All sheets on first render
    const fetchAllSheets = async () => {
        // To avoid multiple loads
        if (hasLoaded) {
            return;
        }

        try {
            // fetch sheets filtered by type and companyId when provided
            let url = `${API}/byType/${sheetType}`;
            if (companyId) {
                url = `${API}/byType/${sheetType}/${companyId}`;
            }
            const res = await axios.get(url);
            const data = res.data.data || [];
            setSheetList(data);
            setHasLoaded(true);
        } catch (err) {
            console.error("Error fetching sheet", err);
        }
    };

    const fetchCompanySheets = async () => {
        if (!companyId) return;
        try {
            const res = await axios.get(`http://localhost:4000/api/dashboard/list/${companyId}`);
            const data = res.data.data || [];
            setCompanySheets(data);
        } catch (err) {
            console.error('Failed to fetch company sheets', err);
        }
    };
    useEffect(() => {
        // reset loaded flag when sheetType or companyId changes
        // setHasLoaded(false);
        if (routeId) {
            // if routeId provided, load that specific sheet
            loadSheet(routeId);
        } else {
            fetchAllSheets();
        }
        // fetch company-level FY sheets for dropdowns
        if (companyId) fetchCompanySheets();
    }, [sheetType, routeId, hasLoaded, companyId]);

    // Code to create a new sheet
    const createSheetBtnClick = async () => {
        if (!isSuperAdmin) {
            alert("Only Super Admin can create sheets.");
            return;
        }
        try {
            const payload = { heading: "New Sheet", type: sheetType };
            if (companyId) payload.companyId = companyId;
            const res = await axios.post(`${API}/create`, payload);
            const data = res.data.data;
            setSheetList((prev) => [...prev, data]);
            setHasLoaded(false);
        } catch (err) {
            console.error("Error creating sheet", err);
        }
    };

    // Code to handle edit mode
    const editingModeBtn = () => {
        setEditMode(!editMode);
    };

    // Code to delete sheet
    const deleteSheetBtn = async () => {
        if (!isSuperAdmin) {
            alert("Only Super Admin can delete sheets.");
            return;
        }
        const confirmDelete = confirm("Are you sure to delete this sheet?");
        if (confirmDelete) {
            try {
                const res = await axios.delete(`${API}/delete/${sheetActive.id}`);
                const data = res.data;
                alert(data.message);
                setSheetList([]);
                setHasLoaded(false);
                sheetActive.name = "";
            } catch (err) {
                console.error(err);
            }
        }
    };

    // Code to update sheet name
    const updateSheetName = async () => {
        if (!isSuperAdmin) {
            alert("Only Super Admin can rename sheets.");
            return;
        }

        if (!editMode) return;

        const newHeading = prompt("Enter new heading:");

        if (newHeading && newHeading.trim() !== "") {
            try {
                await axios.put(`${API}/update/${sheetActive.id}`, {
                    heading: newHeading.trim(),
                });

                // Update sheetActive with new name
                setSheetActive((prevSheetActive) => ({
                    ...prevSheetActive,
                    name: newHeading.trim(),
                }));

                // Update sheetList array with new heading
                setSheetList((prevSheetList) =>
                    prevSheetList.map((sheet) =>
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
        } else if (newHeading.trim() == "") {
            alert("Sheet Name cannot be empty");
        }
    };

    // Code to update column Names
    const updateColumnName = (index, value) => {
        if (!isSuperAdmin) {
            // prevent admins from renaming columns
            alert("Only Super Admin can rename columns.");
            return;
        }

        const updated = { ...sheetActive };
        updated.sheetCols[index] = value;
        setSheetActive(updated);
    };

    const updateCell = (rowIndex, cellIndex, value) => {
        // Debug/log to ensure onChange is firing
        // (kept lightweight; remove if noisy)
        // console.log("updateCell:", rowIndex, cellIndex, value);
        setcellValue(value);

        const updated = { ...sheetActive };
        // defensive copy so React re-renders reliably
        const rowsCopy = (updated.sheetRows || []).map((r) =>
            r.map((c) => ({ ...c }))
        );
        // ensure row and cell exist
        if (!rowsCopy[rowIndex]) rowsCopy[rowIndex] = [];
        if (!rowsCopy[rowIndex][cellIndex])
            rowsCopy[rowIndex][cellIndex] = { value: "" };
        rowsCopy[rowIndex][cellIndex].value = value;
        updated.sheetRows = rowsCopy;
        setSheetActive(updated);
    };

    // Arrow-key navigation between cell inputs
    const handleCellKeyDown = (e, rowIndex, cellIndex) => {
        const key = e.key;
        if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key))
            return;
        e.preventDefault();

        const rows = sheetActive.sheetRows || [];
        const cols = sheetActive.sheetCols || [];
        let r = rowIndex;
        let c = cellIndex;

        if (key === "ArrowUp") r = Math.max(0, rowIndex - 1);
        if (key === "ArrowDown") r = Math.min(rows.length - 1, rowIndex + 1);
        if (key === "ArrowLeft") c = Math.max(0, cellIndex - 1);
        if (key === "ArrowRight") c = Math.min(cols.length - 1, cellIndex + 1);

        // find the target input by data attributes
        const selector = `input[data-row="${r}"][data-col="${c}"]`;
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
                dueDate: data.dueDate || "",
                fy: data.fy || null,

                active: true,
            });

            // update sheetList entry so left-side list stays in sync
            setSheetList((prev) => prev.map((s) => (s._id === data._id ? data : s)));
        } catch (err) {
            console.error("Failed to load sheet", err);
        }
    };

    // Add/Delete Row
    const addRow = async () => {
        if (isAdmin) {
            alert("Only Super Admin can add rows.");
            return;
        }
        if (!sheetActive) return;
        // If user is editing (unsaved changes), perform local-only add so unsaved column edits are preserved
        if (editMode) {
            const cols = sheetActive.sheetCols || [];
            const newRow = cols.map(() => ({ value: "", dropdownType: null }));
            setSheetActive((prev) => ({
                ...prev,
                sheetRows: [...(prev.sheetRows || []), newRow],
            }));
            return;
        }

        if (!sheetActive?.id) return;
        try {
            await axios.put(`${API}/rows/add/${sheetActive.id}`);
            await loadSheet(sheetActive.id);
        } catch (err) {
            console.error("Error adding row", err);
            alert("Add row failed");
        }
    };

    const deleteRow = async (index) => {
        if (isAdmin) {
            alert("Only Super Admin can add rows.");
            return;
        }
        if (!sheetActive) return;
        const confirmDelete = confirm("Are you sure to delete this row?");
        if (!confirmDelete) return;

        if (editMode) {
            // local-only deletion
            setSheetActive((prev) => {
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
            console.error("Error deleting row", err);
            alert("Delete row failed");
        }
    };

    // Add/Delete Column
    const addColumn = async () => {
        if (isAdmin) {
            alert("Only Super Admin can add rows.");
            return;
        }
        if (!sheetActive) return;
        if (editMode) {
            // local-only add column
            setSheetActive((prev) => {
                const cols = [...(prev.sheetCols || []), ""];
                const rows = (prev.sheetRows || []).map((r) => [
                    ...r,
                    { value: "", dropdownType: null },
                ]);
                return { ...prev, sheetCols: cols, sheetRows: rows };
            });
            return;
        }

        if (!sheetActive?.id) return;
        try {
            await axios.put(`${API}/columns/add/${sheetActive.id}`);
            await loadSheet(sheetActive.id);
        } catch (err) {
            console.error("Error adding column", err);
            alert("Add column failed");
        }
    };

    const deleteColumn = async (index) => {
        if (isAdmin) {
            alert("Only Super Admin can add rows.");
            return;
        }
        if (!sheetActive) return;
        const confirmDelete = confirm("Are you sure to delete this column?");
        if (!confirmDelete) return;

        if (editMode) {
            // local-only delete column
            setSheetActive((prev) => {
                const cols = [...(prev.sheetCols || [])];
                cols.splice(index, 1);
                const rows = (prev.sheetRows || []).map((r) => {
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
            console.error("Error deleting column", err);
            alert("Delete column failed");
        }
    };

    const handleChange = (e, rowIndex, cellIndex) => {
        const newValue = e.target.value;
        console.log(newValue);

        // 1️⃣ Update actual table data so input value changes
        const updated = { ...sheetActive };
        // defensive copy so React re-renders reliably
        const rowsCopy = (updated.sheetRows || []).map((r) =>
            r.map((c) => ({ ...c }))
        );
        if (!rowsCopy[rowIndex]) rowsCopy[rowIndex] = [];
        if (!rowsCopy[rowIndex][cellIndex])
            rowsCopy[rowIndex][cellIndex] = { value: "" };
        rowsCopy[rowIndex][cellIndex].value = newValue;
        updated.sheetRows = rowsCopy;
        setSheetActive(updated);

        // 2️⃣ Track edited cells without duplicates
        // Only mark as edited if the cell has a non-empty value
        setCellUpdate((prev) => {
            const exists = prev.some(
                (item) => item.rowIndex === rowIndex && item.cellIndex === cellIndex
            );

            // If cell is empty, don't mark as edited
            // if (!newValue || newValue.trim() == "") {
            //     // Remove from cellUpdate if it exists
            //     return prev.filter(
            //         (item) => !(item.rowIndex === rowIndex && item.cellIndex === cellIndex)
            //     );
            // }

            if (exists) return prev;

            return [...prev, { rowIndex, cellIndex, isEdited: true }];
        });
    };

    // Save edits made to sheet
    const saveSheet = async () => {
        // Filter out cells with empty values from cellUpdate before saving
        // This ensures that if a super-admin edited a cell and then cleared it,
        // the cell won't remain marked as edited
        // const cleanedCellUpdate = cellUpdate.filter((item) => {
        //     const cell = sheetActive.sheetRows?.[item.rowIndex]?.[item.cellIndex];
        //     return cell && cell.value && cell.value.trim() !== "";
        // });

        await axios.put(`${API}/update/${sheetActive.id}`, {
            rows: sheetActive.sheetRows,
            columns: sheetActive.sheetCols,
            cellUpdate: cellUpdate,
        });
        alert("Saved!");
        setEditMode(false);
        loadSheet(sheetActive.id);
    };

    console.log(cellUpdate);

    return (
        <>
            <div className="bg-gray-50 h-screen m-0 p-0 ">
                <header>
                    <section className="flex flex-col items-center my-2">
                        <div>
                            <h1 className="text-xl font-extrabold">{`${sheetType.charAt(0).toUpperCase() + sheetType.slice(1)
                                } Sheets`}</h1>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-600">
                                Permission: <span className="font-medium">{permission}</span>
                            </p>
                        </div>
                    </section>
                </header>
                <main>
                    <section className="w-full">
                        <div className="ml-4">
                            {/* <button onClick={backButtonCLick} className="border px-4 py-2 rounded-md flex items-center gap-2 bg-white font-semibold">
                                <FaArrowLeft className="text-md text-blue-500" /> <span className="text-blue-500 font-bold">Back</span>
                            </button> */}
                            <button
                                onClick={() => backButtonCLick()}
                                className="flex items-center gap-2 bg-white hover:bg-gray-50 hover:text-blue-600 text-blue-500
                                px-3 py-2 rounded-md font-medium group
                                transition-all duration-300 active:scale-95 hover:shadow-blue-500 shadow-sm border-2 border-blue-500"
                            >
                                <FaArrowLeft className="w-5 h-5" />

                                <span
                                    className="max-w-0 overflow-hidden group-hover:max-w-[100px] 
                                    transition-all duration-300"
                                >
                                    Back
                                </span>
                            </button>
                        </div>
                    </section>
                    <section className="mainSection flex items-start justify-between">
                        <section className="sideMenuSection  w-1/4 m-4">
                            <aside>
                                <div className="sheetMenuContainer h-80 overflow-auto bg-white shadow-md p-2 rounded-lg flex flex-col gap-4">
                                    <div className="sheetHeader flex justify-between items-center bg-gray-100 p-3 rounded-t-lg">
                                        <div className="sheetHeading">
                                            <h2 className="font-bold text-gray-600 text-lg">
                                                All Sheets
                                            </h2>
                                        </div>
                                        <div>
                                            {isSuperAdmin && (
                                                <button
                                                    onClick={() => createSheetBtnClick()}
                                                    className="py-1 px-1 rounded-md text-sm border bg-white border-blue-500 text-blue-500 font-semibold"
                                                >
                                                    Create Sheet
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="sheetMenuList p-3 pt-0">
                                        {/* FY filter dropdown for subsheets */}
                                        <div className="mb-3">
                                            <label className="text-sm font-medium mr-2">Filter by FY:</label>
                                            <select
                                                className="p-1 border rounded"
                                                value={selectedFyFilter}
                                                onChange={(e) => setSelectedFyFilter(e.target.value)}
                                            >
                                                <option value="ALL">All FYs</option>
                                                {Array.from(new Set(companySheets.map(s => s.fy).filter(Boolean))).map((fy) => (
                                                    <option key={fy} value={fy}>{fy}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <ul className="list-none">
                                            {sheetList.filter(s => selectedFyFilter === 'ALL' || !selectedFyFilter || s.fy === selectedFyFilter).map((sheet, index) => {
                                                return (
                                                    <li
                                                        key={index}
                                                        className={`${sheetActive.id == sheet._id &&
                                                            `bg-blue-500/90 p-2 text-white`
                                                            } flex items-center justify-between my-2`}
                                                    >
                                                        <p
                                                            title={sheet.heading}
                                                            className="line-clamp-1 whitespace-nowrap text-ellipsis w-[60%]"
                                                        >
                                                            {sheet.heading}
                                                        </p>
                                                        <button
                                                            onClick={() => openSheetBtnClick(sheet._id)}
                                                            className="bg-blue-500 py-1 px-2 rounded-md text-sm border border-blue-500 text-white font-semibold"
                                                        >
                                                            Open Sheet
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                </div>
                            </aside>
                        </section>
                        <section
                            className={`${sheetActive.name == "" && "hidden"
                                } bg-white shadow-md p-2 rounded-lg sheetSection transition w-3/4 m-4`}
                        >
                            <div className="sheetHeader flex items-center justify-between p-2 border-2 rounded-lg">
                                <div className="sheetHeadingContainer">
                                    <h2
                                        onDoubleClick={updateSheetName}
                                        className="font-bold text-gray-600 text-lg"
                                    >
                                        {sheetActive.name}
                                    </h2>
                                </div>
                                <div className="flex gap-4">
                                    <div className="delteBtnContainer">
                                        {isSuperAdmin && (
                                            <button
                                                onClick={deleteSheetBtn}
                                                className="bg-red-500 text-white py-2 px-2 border rounded-md text-sm  font-semibold"
                                            >
                                                Delete Sheet
                                            </button>
                                        )}
                                    </div>
                                    <div className="editBtnContainer">
                                        <button
                                            onClick={editMode ? saveSheet : editingModeBtn}
                                            className="bg-blue-500 py-2 px-2 rounded-md text-sm border border-blue-500 text-white font-semibold"
                                        >
                                            {editMode ? "Save" : "Edit Sheet"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mx-2 mt-2 text-sm font-semibold text-gray-500 flex items-center gap-3">
                                <p>Due Date:</p>

                                <input
                                    type="date"
                                    className={`p-2 border rounded ${!editMode
                                        ? "bg-white"                                 // View mode → white always
                                        : isAdmin && sheetActive.dueDate
                                            ? "bg-gray-200 text-gray-600"                // Admin blocked from editing → grey
                                            : "bg-white"                                  // Editable → white
                                        }`}
                                    value={sheetActive.dueDate || ""}
                                    onChange={async (e) => {
                                        const newDate = e.target.value;

                                        // ❌ Block IF not in edit mode
                                        if (!editMode) return alert("Enable edit mode to update due date.");

                                        // ❌ Admin cannot edit after date exists
                                        if (isAdmin && sheetActive.dueDate) {
                                            alert("Admin cannot edit due date after it is set once.");
                                            return;
                                        }

                                        try {
                                            const role = isSuperAdmin ? "superadmin" : "admin";

                                            await axios.put(`${API}/update-due-date/${sheetActive.id}`, {
                                                dueDate: newDate,
                                                role,
                                            });

                                            setSheetActive((prev) => ({
                                                ...prev,
                                                dueDate: newDate,
                                            }));

                                            alert("Due Date Updated Successfully!");
                                        } catch (err) {
                                            console.error(err);
                                            alert("Failed to update due date");
                                        }
                                    }}
                                    disabled={
                                        !editMode ||                 // View mode → always disabled
                                        (isAdmin && sheetActive.dueDate) // Admin blocked from editing after set
                                    }
                                />

                                <div className="flex items-center gap-2">
                                    <p>FY:</p>
                                    <select
                                        className={`p-2 border rounded ${!editMode ? 'bg-gray-100' : 'bg-white'}`}
                                        value={sheetActive.fy || ''}
                                        onChange={async (e) => {
                                            const newFy = e.target.value || null;

                                            if (!editMode) return alert('Enable edit mode to update FY.');

                                            try {
                                                await axios.put(`${API}/update/${sheetActive.id}`, { fy: newFy });
                                                setSheetActive((prev) => ({ ...prev, fy: newFy }));
                                                alert('FY updated successfully');
                                                // refresh company sheets so sidebar options update
                                                if (companyId) fetchCompanySheets();
                                            } catch (err) {
                                                console.error('Failed to update FY', err);
                                                alert('Failed to update FY');
                                            }
                                        }}
                                        disabled={!companyId || (Array.isArray(companySheets) && companySheets.length === 0)}
                                    >
                                        <option value="">Select FY...</option>
                                        {Array.from(new Set(companySheets.map(s => s.fy).filter(Boolean))).map((fy) => (
                                            <option key={fy} value={fy}>{fy}</option>
                                        ))}
                                    </select>
                                </div>



                            </div>

                            <div className="flex justify-end gap-4 mb-2">
                                <button
                                    onClick={() => setActiveDropdownType("mode")}
                                    className={`px-3 py-1 rounded border ${activeDropdownType === "mode"
                                        ? "bg-blue-500 text-white"
                                        : "bg-white text-gray-800"
                                        }`}
                                >
                                    Mode of Payment
                                </button>

                                <button
                                    onClick={() => setActiveDropdownType("remarks")}
                                    className={`px-3 py-1 rounded border ${activeDropdownType === "remarks"
                                        ? "bg-blue-500 text-white"
                                        : "bg-white text-gray-800"
                                        }`}
                                >
                                    Remarks
                                </button>
                                <button
                                    onClick={() => setActiveDropdownType("status")}
                                    className={`px-3 py-1 rounded border ${activeDropdownType === "status"
                                        ? "bg-blue-500 text-white"
                                        : "bg-white text-gray-800"
                                        }`}
                                >
                                    Status
                                </button>
                                <button
                                    onClick={() => setActiveDropdownType("payslip")}
                                    className={`px-3 py-1 rounded border ${activeDropdownType === "payslip"
                                        ? "bg-blue-500 text-white"
                                        : "bg-white text-gray-800"
                                        }`}
                                >
                                    Pay Slips
                                </button>
                                <button
                                    onClick={() => setActiveDropdownType("date")}
                                    className={`px-3 py-1 rounded border ${activeDropdownType === "date"
                                        ? "bg-blue-500 text-white"
                                        : "bg-white text-gray-800"
                                        }`}
                                >
                                    Date
                                </button>
                            </div>

                            <div className="sheetTable mt-1  mx-2 overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-300 border-collapse table-fixed">
                                    <thead className="bg-blue-500 text-white shadow-lg sticky top-0 z-10">
                                        <tr>
                                            {sheetActive.sheetCols.map((col, index) => (
                                                <th
                                                    key={index}
                                                    className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider border-r border-blue-400"
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex-1">
                                                            {editMode ? (
                                                                isSuperAdmin ? (
                                                                    <input
                                                                        className="text-black w-full p-2"
                                                                        type="text"
                                                                        value={col}
                                                                        onChange={(e) =>
                                                                            updateColumnName(index, e.target.value)
                                                                        }
                                                                    />
                                                                ) : (
                                                                    col
                                                                )
                                                            ) : (
                                                                col
                                                            )}
                                                        </div>
                                                        {editMode && isSuperAdmin && (
                                                            <button
                                                                onClick={() => deleteColumn(index)}
                                                                className="ml-2 text-white hover:text-red-200 p-1"
                                                                title="Delete column"
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        )}
                                                    </div>
                                                </th>
                                            ))}
                                            {editMode && isSuperAdmin && (
                                                <th className="px-4 py-3 border-r border-blue-400">
                                                    <button
                                                        onClick={addColumn}
                                                        className="bg-white text-blue-600 rounded p-1"
                                                        title="Add column"
                                                    >
                                                        <FaPlus />
                                                    </button>
                                                </th>
                                            )}
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-200">
                                        {/* divide-y adds a line between rows */}
                                        {sheetActive.sheetRows.map((row, rowIndex) => (
                                            <tr
                                                key={rowIndex}
                                                className="hover:bg-blue-50 transition duration-150 ease-in-out"
                                            >
                                                {/* Add hover effect for better row readability */}
                                                {row.map((cell, cellIndex) => (
                                                    <td
                                                        key={cellIndex}
                                                        className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200"
                                                    >
                                                        {editMode ? (
                                                            cell.dropdownType ? (
                                                                // =========================
                                                                // DROPDOWN-TYPE CELLS
                                                                // =========================
                                                                cell.dropdownType === "date" ? (
                                                                    // 📅 DATE PICKER
                                                                    <input
                                                                        type="date"
                                                                        className="text-black w-full p-2"
                                                                        value={cell.value || ""}
                                                                        onChange={(e) => {
                                                                            {
                                                                                handleChange(e, rowIndex, cellIndex);
                                                                            }
                                                                        }}
                                                                        disabled={isAdmin && cell.isEdited}
                                                                    />
                                                                ) : (
                                                                    // 📌 NORMAL SELECT DROPDOWN
                                                                    <select
                                                                        className="text-black w-full p-2"
                                                                        value={cell.value || ""}
                                                                        onChange={(e) => {
                                                                            {
                                                                                handleChange(e, rowIndex, cellIndex);
                                                                            }
                                                                        }}
                                                                        disabled={isAdmin && cell.isEdited}
                                                                    >
                                                                        <option value="">Select...</option>

                                                                        {(cell.dropdownType === "mode"
                                                                            ? modeOfPaymentOptions
                                                                            : cell.dropdownType === "remarks"
                                                                                ? remarksOptions
                                                                                : cell.dropdownType === "status"
                                                                                    ? statusOptions
                                                                                    : cell.dropdownType === "payslip"
                                                                                        ? paySlipOptions
                                                                                        : []
                                                                        ).map((opt, idx) => (
                                                                            <option key={idx} value={opt}>
                                                                                {opt}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                )
                                                            ) : (
                                                                // =========================
                                                                // NORMAL TEXT INPUT CELL
                                                                // =========================
                                                                <input
                                                                    className="text-black w-full p-2"
                                                                    type="text"
                                                                    value={cell.value || ""}
                                                                    data-row={rowIndex}
                                                                    data-col={cellIndex}
                                                                    disabled={isAdmin && cell.isEdited}
                                                                    onClick={() => {
                                                                        if (activeDropdownType) {
                                                                            const updated = { ...sheetActive };
                                                                            const rowsCopy = updated.sheetRows.map(
                                                                                (r) => r.map((c) => ({ ...c }))
                                                                            );

                                                                            rowsCopy[rowIndex][
                                                                                cellIndex
                                                                            ].dropdownType = activeDropdownType;
                                                                            updated.sheetRows = rowsCopy;

                                                                            setSheetActive(updated);
                                                                            setActiveDropdownType(null);
                                                                        }
                                                                    }}
                                                                    onChange={(e) => {
                                                                        {
                                                                            handleChange(e, rowIndex, cellIndex);
                                                                        }
                                                                    }}
                                                                    onKeyDown={(e) =>
                                                                        handleCellKeyDown(e, rowIndex, cellIndex)
                                                                    }

                                                                />
                                                            )
                                                        ) : (
                                                            // =========================
                                                            // VIEW MODE (NOT EDITING)
                                                            // =========================
                                                            cell.value
                                                        )}
                                                    </td>
                                                ))}

                                                {editMode && isSuperAdmin && (
                                                    <td className="px-2 py-2 border-r border-gray-200">
                                                        <button
                                                            onClick={() => deleteRow(rowIndex)}
                                                            className="text-red-600 p-1"
                                                            title="Delete row"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {editMode && isSuperAdmin && (
                                    <div className="flex justify-end mt-2">
                                        <button
                                            onClick={addRow}
                                            className="bg-white text-blue-600 rounded p-2"
                                            title="Add row"
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
    );
};

export default SubSheetPage;
