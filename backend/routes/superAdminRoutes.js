import express from "express";
import {
  createSuperAdmin,
  getAllSuperAdmins,
  updateSuperAdmin,
  deleteSuperAdmin,
  loginSuperAdmin,
} from "../controllers/superAdminController.js";

const superAdminRouter = express.Router();

superAdminRouter.route("/create").post(createSuperAdmin);
superAdminRouter.route("/findAll").get(getAllSuperAdmins);
superAdminRouter.route("/update/:id").put(updateSuperAdmin);
superAdminRouter.route("/delete/:id").delete(deleteSuperAdmin);
superAdminRouter.route("/login").post(loginSuperAdmin);

export default superAdminRouter;
