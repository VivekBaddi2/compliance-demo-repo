// routes/dashboardRoutes.js
import express from "express";
import {
  createCompanySheet,
  createFYSheet,
  listCompanySheets,
  getCompanySheetById,
  deleteCompanySheet,
  addDashboardRow,
  addServiceToHead,
  removeServiceFromHead,
  updateCells,
  getCompanyDashboard,
  deleteDashboardRow,
  addHead,
  removeHead,
  lockCell,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.post("/create", createCompanySheet);
router.post("/create/fy", createFYSheet);
router.post("/row/add", addDashboardRow);
router.post("/service/add", addServiceToHead);
router.post("/service/remove", removeServiceFromHead);
router.put("/cells/update", updateCells);
router.get("/get/:companyId", getCompanyDashboard);
router.get("/list/:companyId", listCompanySheets);
router.get("/sheet/:sheetId", getCompanySheetById);
router.delete("/row/:sheetId/:period", deleteDashboardRow);
router.delete("/sheet/:sheetId", deleteCompanySheet);
router.post("/head/add", addHead);
router.post("/head/remove", removeHead);
router.put("/cells/lock", lockCell);

export default router;
