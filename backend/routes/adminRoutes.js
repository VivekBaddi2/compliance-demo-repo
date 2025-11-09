import express from "express";
import { createAdmin, getAllAdmins, deleteAdmin } from "../controllers/adminController.js";

const router = express.Router();

router.post("/create", createAdmin);
router.get("/getAll", getAllAdmins);
router.delete("/delete/:id", deleteAdmin);

export default router;
