import express from "express";
import { createSubSheet, updateSubSheet, getSubSheet, getSubSheetsBySheet } from "../controllers/detailedSheetController.js";
const router = express.Router();

router.post("/create", createSubSheet);
router.put("/update/:id", updateSubSheet);
router.get("/get/:id", getSubSheet);
router.get("/list/:sheetId", getSubSheetsBySheet);

export default router;
