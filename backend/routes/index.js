import expressRouter from "express";
import sheetRouter from "./sheetRoutes.js";
import superAdminRouter from "./superAdminRoutes.js";
import adminRouter from "./adminRoutes.js";
import companyRouter from "./companyRoutes.js";

const router = expressRouter();
router.use("/superAdmin", superAdminRouter);
router.use("/sheet", sheetRouter);
router.use("/admin", adminRouter);
router.use("/company", companyRouter);
export default router;
