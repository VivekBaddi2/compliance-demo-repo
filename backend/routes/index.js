import expressRouter from "express";
import superAdminRouter from "./superAdminRoutes.js";
import adminRouter from "./adminRoutes.js";
import companyRouter from "./companyRoutes.js";
import dashboardRouter from "./dashboardRoutes.js";
import detailedSheetRouter from "./detailedSheetRoutes.js";

const router = expressRouter();

router.use("/superAdmin", superAdminRouter);
router.use("/admin", adminRouter);
router.use("/company", companyRouter);
router.use("/dashboard", dashboardRouter);
router.use("/dsheet", detailedSheetRouter);

export default router;
