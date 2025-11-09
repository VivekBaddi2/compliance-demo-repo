import express from "express";
import {
  createCompany,
  getAllCompanies,
  getCompaniesByAdmin,
  updateCompany,
  deleteCompany,
  companyLogin,
} from "../controllers/companyController.js";

const companyRouter = express.Router();

companyRouter.route("/create").post(createCompany);
companyRouter.route("/getAll").get(getAllCompanies);
companyRouter.route("/getByAdmin/:adminId").get(getCompaniesByAdmin);
companyRouter.route("/update").post(updateCompany);
companyRouter.route("/delete/:id").delete(deleteCompany);
companyRouter.route("/login").post(companyLogin);

export default companyRouter;
