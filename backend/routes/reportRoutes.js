// backend/routes/reportRoutes.js
import { Router } from "express";
import {
    createReportAndSend,
    listReports,
    downloadReport,
    deleteReport,
    updateReportMetadata
} from "../controllers/emailController.js"; // appended functions are exported from this file

const router = Router();

router.post("/create", createReportAndSend); // body: { to, subject, sheet, save }
router.get("/", listReports);
router.get("/:id/download", downloadReport);
router.delete("/:id", deleteReport);
router.patch("/:id", updateReportMetadata);

export default router;