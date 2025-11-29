import asyncHandler from "express-async-handler";
import SubSheet from "../schemas/detailedSheetSchema.js";

// @desc Create subsheet (default 4x4 empty)
// @route POST /api/subsheets
export const createSubSheet = asyncHandler(async (req, res) => {
  const { heading, colCount = 4, rowCount = 4 } = req.body; // allow optional custom size

  // Create empty grid
  const emptyGrid = Array.from({ length: rowCount }, () =>
    Array.from({ length: colCount }, () => ({ value: "" }))
  );

  // Create default column names: Col 1, Col 2, ...
  const columns = Array.from({ length: colCount }, (_, i) => `Col ${i + 1}`);

  const newSheet = await SubSheet.create({
    heading: heading || "",
    rows: emptyGrid,
    columns,
  });

  res.status(201).json({ success: true, data: newSheet });
});

// @desc Get all subsheets
// @route GET /api/subsheets
export const getAllSubSheets = asyncHandler(async (req, res) => {
  const sheets = await SubSheet.find().sort({ createdAt: -1 });
  res.json({ success: true, data: sheets });
});

// @desc Get single subsheet
// @route GET /api/subsheets/:id
export const getSubSheet = asyncHandler(async (req, res) => {
  const sheet = await SubSheet.findById(req.params.id);

  if (!sheet) {
    res.status(404);
    throw new Error("Subsheet not found");
  }

  res.json({ success: true, data: sheet });
});

// @desc Update subsheet - heading, rows, columns, cells
// @route PUT /api/subsheets/:id
export const updateSubSheet = asyncHandler(async (req, res) => {
  const { heading, rows, columns } = req.body; // include columns

  const sheet = await SubSheet.findById(req.params.id);
  if (!sheet) {
    res.status(404);
    throw new Error("Subsheet not found");
  }

  if (heading !== undefined) sheet.heading = heading;
  if (rows !== undefined) sheet.rows = rows;
  if (columns !== undefined && Array.isArray(columns)) sheet.columns = columns; // update column names

  const updated = await sheet.save();

  res.json({ success: true, data: updated });
});

// @desc Add a new row
// @route PUT /api/subsheets/:id/rows/add
export const addRow = asyncHandler(async (req, res) => {
  const sheet = await SubSheet.findById(req.params.id);
  if (!sheet) {
    res.status(404);
    throw new Error("Subsheet not found");
  }

  const colCount = sheet.rows[0]?.length || 4;

  sheet.rows.push(Array.from({ length: colCount }, () => ({ value: "" })));

  await sheet.save();
  res.json({ success: true, data: sheet });
});

// @desc Add a new column
// @route PUT /api/subsheets/:id/columns/add
export const addColumn = asyncHandler(async (req, res) => {
  const sheet = await SubSheet.findById(req.params.id);
  if (!sheet) {
    res.status(404);
    throw new Error("Subsheet not found");
  }

  // Add a new default column name
  const newColName = `Col ${sheet.columns.length + 1}`;
  sheet.columns.push(newColName);

  // Add an empty cell in each row for the new column
  sheet.rows.forEach((row) => row.push({ value: "" }));

  await sheet.save();
  res.json({ success: true, data: sheet });
});

// @desc Delete a row
// @route PUT /api/subsheets/:id/rows/:rowIndex/delete
export const deleteRow = asyncHandler(async (req, res) => {
  const { rowIndex } = req.params;

  const sheet = await SubSheet.findById(req.params.id);
  if (!sheet) {
    res.status(404);
    throw new Error("Subsheet not found");
  }

  sheet.rows.splice(rowIndex, 1);

  await sheet.save();
  res.json({ success: true, data: sheet });
});

// @desc Delete a column
// @route PUT /api/subsheets/:id/columns/:colIndex/delete
export const deleteColumn = asyncHandler(async (req, res) => {
  const { colIndex } = req.params;

  const sheet = await SubSheet.findById(req.params.id);
  if (!sheet) {
    res.status(404);
    throw new Error("Subsheet not found");
  }

  const index = parseInt(colIndex, 10);
  if (index < 0 || index >= sheet.columns.length) {
    res.status(400);
    throw new Error("Invalid column index");
  }

  // Remove column name
  sheet.columns.splice(index, 1);

  // Remove the cell from each row
  sheet.rows.forEach((row) => row.splice(index, 1));

  await sheet.save();
  res.json({ success: true, data: sheet });
});

// @desc Delete subsheet
// @route DELETE /api/subsheets/:id
export const deleteSubSheet = asyncHandler(async (req, res) => {
  const sheet = await SubSheet.findById(req.params.id);
  if (!sheet) {
    res.status(404);
    throw new Error("Subsheet not found");
  }

  await sheet.deleteOne();

  res.json({ success: true, message: "Subsheet deleted" });
});