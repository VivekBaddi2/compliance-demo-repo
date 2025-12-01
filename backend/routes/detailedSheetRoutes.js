import express from "express";
import {
  createSubSheet,
  getAllSubSheets,
  getSubSheetsByType,
  getSubSheet,
  updateSubSheet,
  deleteSubSheet,
  addRow,
  addColumn,
  deleteRow,
  deleteColumn
} from "../controllers/detailedSheetController.js";

const router = express.Router();

// Basic CRUD
router.post("/create", createSubSheet);
router.get("/getAll", getAllSubSheets);
router.get("/byType/:type/:companyId", getSubSheetsByType); // filter by type and companyId
router.get("/byType/:type", getSubSheetsByType); // filter by type only
router.get("/get/:id", getSubSheet);
router.put("/update/:id", updateSubSheet);
router.delete("/delete/:id", deleteSubSheet);

// Row operations
router.put("/rows/add/:id", addRow);
router.put("/rows/delete/:id/:rowIndex", deleteRow);

// Column operations
router.put("/columns/add/:id", addColumn);
router.put("/columns/delete/:id/:colIndex", deleteColumn);

export default router;
