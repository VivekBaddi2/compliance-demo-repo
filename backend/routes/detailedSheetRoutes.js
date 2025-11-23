import express from "express";
import { createSubSheet, updateSubSheet, getSubSheetsByHead, deleteSubSheet } from "../controllers/detailedSheetController.js";
const router = express.Router();

router.post("/create", createSubSheet);
router.get("/list/:companyId/:headType", getSubSheetsByHead);
router.put("/update/:id", updateSubSheet);
router.delete("/delete/:id", deleteSubSheet);

export default router;
