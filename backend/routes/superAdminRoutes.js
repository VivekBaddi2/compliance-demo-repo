import express from "express";
import {
  createSuperAdmin,
  getAllSuperAdmins,
  updateSuperAdmin,
  deleteSuperAdmin,
  loginSuperAdmin,
  createAdminBySuperAdmin,
  createCompanyBySuperAdmin,
  assignCompaniesToAdmin,
  reallotCompanies,
  getAllAdminsWithCompanies,
  getAllCompaniesWithAdmins,
  changeAdminPassword,
  changeCompanyPassword,
  deleteAdmin,
  deleteCompany,
  removeCompanyFromAdmin,
} from "../controllers/superAdminController.js";

const router = express.Router();

// -------------------------
// Super Admin CRUD
// -------------------------
router.post("/create", createSuperAdmin);
router.get("/findAll", getAllSuperAdmins);
router.put("/update/:id", updateSuperAdmin);
router.delete("/delete/:id", deleteSuperAdmin);
router.post("/login", loginSuperAdmin);

// -------------------------
// Admin & Company Management
// -------------------------
router.post("/createAdmin", createAdminBySuperAdmin);
router.post("/createCompany", createCompanyBySuperAdmin);
router.post("/assignCompanies", assignCompaniesToAdmin);
router.post("/reallotCompanies", reallotCompanies);
router.get("/adminsWithCompanies", getAllAdminsWithCompanies);
router.get("/companiesWithAdmins", getAllCompaniesWithAdmins);
router.put("/changeAdminPassword/:adminId", changeAdminPassword);
router.put("/changeCompanyPassword/:companyId", changeCompanyPassword);
router.delete("/deleteAdmin/:adminId", deleteAdmin);
router.delete("/deleteCompany/:companyId", deleteCompany);
router.delete("/removeCompany/:adminId/:companyId", removeCompanyFromAdmin);


export default router;
