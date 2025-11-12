import express from "express";
import {
  loginAdmin,
  getAssignedCompanies,
  updatePassword,
    getAllAdmins
} from "../controllers/adminController.js";

const router = express.Router();

// Admin login
router.post("/login", loginAdmin);

// Get all companies assigned to an admin
router.get("/assignedCompanies/:adminId", getAssignedCompanies);

// Admin updates their own password
router.put("/updatePassword/:adminId", updatePassword);

// Get all admins
router.get("/getAll", getAllAdmins);

export default router;
