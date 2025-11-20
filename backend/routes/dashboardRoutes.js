// routes/dashboardRoutes.js
import express from "express";
import {
  createCompanySheet,
  addDashboardRow,
  addServiceToHead,
  removeServiceFromHead,
  updateCells,
  getCompanyDashboard,
  deleteDashboardRow
} from "../controllers/dashboardController.js";

const router = express.Router();

router.post("/create", createCompanySheet);
router.post("/row/add", addDashboardRow);
router.post("/service/add", addServiceToHead);
router.post("/service/remove", removeServiceFromHead);
router.put("/cells/update", updateCells);
router.get("/get/:companyId", getCompanyDashboard);
router.delete("/row/:sheetId/:period", deleteDashboardRow);


export default router;
