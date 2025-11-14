import express from "express";
import {
  getAllCompanies,
  getCompaniesByAdmin,
  deleteCompany,
  companyLogin,
} from "../controllers/companyController.js";

const companyRouter = express.Router();

companyRouter.route("/getAll").get(getAllCompanies);
companyRouter.route("/getByAdmin/:adminId").get(getCompaniesByAdmin);
companyRouter.route("/delete/:id").delete(deleteCompany);
companyRouter.route("/login").post(companyLogin);

export default companyRouter;
