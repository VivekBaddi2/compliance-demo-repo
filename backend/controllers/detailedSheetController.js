// controllers/subSheetController.js
import asyncHandler from "express-async-handler";
import SubSheet from "../schemas/detailedSheetSchema.js";

// Create a new subsheet (with initial 4x4 table)
export const createSubSheet = asyncHandler(async (req, res) => {
  const { companyId, sheetId, headType, serviceName, period, heading } = req.body;

  if (!companyId || !sheetId || !headType || !serviceName || !period)
    return res
      .status(400)
      .json({ success: false, msg: "Required fields missing" });

  // Initialize 4x4 table
  const initialTable = Array.from({ length: 4 }).map(() => ({
    cells: Array.from({ length: 4 }).map(() => ({ value: "" }))
  }));

  const newSheet = await SubSheet.create({
    companyId,
    sheetId,       // 🔥 REQUIRED
    headType,
    serviceName,
    period,
    heading,
    table: initialTable
  });

  res.status(201).json({ success: true, data: newSheet });
});

// Get all subsheets for a company + sheet + headType
export const getSubSheetsByHead = asyncHandler(async (req, res) => {
  const { companyId, sheetId, headType } = req.params;

  if (!companyId || !sheetId || !headType)
    return res
      .status(400)
      .json({ success: false, msg: "Required params missing" });

  const sheets = await SubSheet.find({
    companyId,
    sheetId,
    headType
  }).sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: sheets });
});

// Update subsheet by ID
export const updateSubSheet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const patch = req.body;

  const sheet = await SubSheet.findById(id);
  if (!sheet)
    return res.status(404).json({ success: false, msg: "Sheet not found" });

  Object.assign(sheet, patch);
  await sheet.save();

  res.status(200).json({ success: true, data: sheet });
});

// Delete subsheet by ID
export const deleteSubSheet = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sheet = await SubSheet.findById(id);
  if (!sheet)
    return res.status(404).json({ success: false, msg: "Sheet not found" });

  await SubSheet.findByIdAndDelete(id);

  res.status(200).json({ success: true, msg: "SubSheet deleted" });
});
