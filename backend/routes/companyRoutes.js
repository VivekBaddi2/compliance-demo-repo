import express from "express";
import {
  getAllCompanies,
  getCompaniesByAdmin,
  viewCompanyDetails
} from "../controllers/companyController.js";

const companyRouter = express.Router();

companyRouter.route("/getAll").get(getAllCompanies);
companyRouter.route("/getByAdmin/:adminId").get(getCompaniesByAdmin);
companyRouter.route("/view/:id").get(viewCompanyDetails);

export default companyRouter;
