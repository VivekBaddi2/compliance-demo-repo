import asyncHandler from "express-async-handler";
import ComplianceSheet from "../schemas/sheetSchema.js";

// create a new compliance sheet
export const createSheet = asyncHandler(async (req, res) => {
  const { sheetType, company, createdBy, cells } = req.body;

  if (!sheetType || !company || !createdBy) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const sheet = await ComplianceSheet.create({
    sheetType,
    company,
    createdBy,
    cells: cells || []
  });

  res.status(201).json({ message: "Compliance sheet created", sheet });
});

// get all sheets for an admin/company
export const getSheets = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const sheets = await ComplianceSheet.find({ company: companyId })
    .populate("company", "username")
    .populate("createdBy", "username");

  res.status(200).json(sheets);
});

// update or add a single cell
export const updateCell = asyncHandler(async (req, res) => {
  const { id } = req.params; // sheet ID
  const { row, column, value } = req.body;

  const sheet = await ComplianceSheet.findById(id);
  if (!sheet) {
    return res.status(404).json({ message: "Sheet not found" });
  }

  // check if cell already exists
  const existingCell = sheet.cells.find(
    (c) => c.row === row && c.column === column
  );

  if (existingCell) {
    existingCell.value = value; // update
  } else {
    sheet.cells.push({ row, column, value }); // add new cell
  }

  await sheet.save();
  res.status(200).json({ message: "Cell updated", sheet });
});


// delete sheet
export const deleteSheet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sheet = await ComplianceSheet.findById(id);
  if (!sheet) {
    return res.status(404).json({ message: "Sheet not found" });
  }

  await sheet.deleteOne();
  res.status(200).json({ message: "Sheet deleted successfully" });
});
