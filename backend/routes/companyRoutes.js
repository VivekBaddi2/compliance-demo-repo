import express from "express";
import {
  getAllCompanies,
  getCompaniesByAdmin,
} from "../controllers/companyController.js";

const companyRouter = express.Router();

companyRouter.route("/getAll").get(getAllCompanies);
companyRouter.route("/getByAdmin/:adminId").get(getCompaniesByAdmin);

export default companyRouter;
