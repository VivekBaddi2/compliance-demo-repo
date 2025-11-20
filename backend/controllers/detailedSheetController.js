// controllers/subSheetController.js
import asyncHandler from "express-async-handler";
import SubSheet from "../schemas/detailedSheetSchema.js";

// create or update sub-sheet
export const createSubSheet = asyncHandler(async (req, res) => {
  const payload = req.body;
  const { companyId, sheetId, headType, serviceName, period } = payload;
  if (!companyId || !sheetId || !headType || !serviceName || !period)
    return res.status(400).json({ success: false, msg: "companyId, sheetId, headType, serviceName, period required" });

  const created = await SubSheet.create(payload);
  res.status(201).json({ success: true, msg: "SubSheet created", data: created });
});

export const updateSubSheet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const patch = req.body;
  const doc = await SubSheet.findById(id);
  if (!doc) return res.status(404).json({ success: false, msg: "SubSheet not found" });

  Object.assign(doc, patch);
  await doc.save();
  res.status(200).json({ success: true, msg: "SubSheet updated", data: doc });
});

export const getSubSheet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doc = await SubSheet.findById(id);
  if (!doc) return res.status(404).json({ success: false, msg: "SubSheet not found" });
  res.status(200).json({ success: true, data: doc });
});

export const getSubSheetsBySheet = asyncHandler(async (req, res) => {
  const { sheetId } = req.params;
  const docs = await SubSheet.find({ sheetId }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: docs });
});
