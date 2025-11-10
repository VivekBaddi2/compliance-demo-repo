import express from "express";
import {
  createSheet,
  getSheets,
  deleteSheet,
  updateCell,
  getSheetByType,
  replaceSheet
} from "../controllers/sheetController.js";

const router = express.Router();

router.post("/create", createSheet);
router.get("/company/:companyId", getSheets);
router.put("/update/:id", updateCell);
router.delete("/delete/:id", deleteSheet);
router.get("/company/:companyId/:sheetType", getSheetByType);
router.put("/replace/:id", replaceSheet);



export default router;
