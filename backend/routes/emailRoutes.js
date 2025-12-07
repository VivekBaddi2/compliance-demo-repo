//backend/routes/emailRoutes.js
import { Router } from "express";
import { testMail, sendReportMail } from "../controllers/emailController.js";

const router = Router();

router.post("/test", testMail);
router.post("/send-report", sendReportMail)

export default router;