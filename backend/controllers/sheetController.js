import asynchandler from "express-async-handler";
import Sheet from "../schemas/sheetSchema.js";

// ✅ Create new sheet
export const createSheet = asynchandler(async (req, res) => {
  try {
    const { title, data } = req.body;

    if (!title || !data) {
      return res.status(400).json({
        success: false,
        msg: "Title and data are required",
      });
    }

    const sheet = await Sheet.create({ title, data });

    return res.status(201).json({
      success: true,
      msg: "Sheet created successfully",
      data: sheet,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
});

// ✅ Get all sheets
export const findAll = asynchandler(async (req, res) => {
  try {
    const sheets = await Sheet.find();
    if (!sheets || sheets.length === 0) {
      return res.status(404).json({
        success: false,
        msg: "No sheets found",
      });
    }

    return res.status(200).json({
      success: true,
      msg: "Sheets fetched successfully",
      data: sheets,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
});

// ✅ Update sheet
export const update = asynchandler(async (req, res) => {
  try {
    const { sheetId, title, data } = req.body;
    const sheet = await Sheet.findById(sheetId);

    if (!sheet) {
      return res.status(404).json({
        success: false,
        msg: "Sheet not found",
      });
    }

    sheet.title = title || sheet.title;
    sheet.data = data || sheet.data;
    await sheet.save();

    return res.status(200).json({
      success: true,
      msg: "Sheet updated successfully",
      data: sheet,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
});

// ✅ Delete sheet
export const deleteSheet = asynchandler(async (req, res) => {
  try {
    const deleted = await Sheet.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        msg: "Sheet not found",
      });
    }

    return res.status(200).json({
      success: true,
      msg: "Sheet deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
});
