import asyncHandler from "express-async-handler";
import Company from "../schemas/companySchema.js";

// ✅ Get all companies
export const getAllCompanies = asyncHandler(async (req, res) => {
  // Populate adminId with username or name field of Admin
  const companies = await Company.find().populate("adminId", "username"); // keep admin username
  res.status(200).json({ success: true, data: companies });
});

// ✅ Get companies by Admin (only assigned to this admin)
export const getCompaniesByAdmin = asyncHandler(async (req, res) => {
  const { adminId } = req.params;
  const companies = await Company.find({ adminId }).populate("adminId", "username"); 
  res.status(200).json({ success: true, data: companies });
});


export const viewCompanyDetails = asyncHandler(async (req, res) => {
  const companyId = req.params.id;

  const company = await Company.findById(companyId).lean(); // plain JS object

  if (!company) {
    res.status(404);
    throw new Error("Company not found");
  }

  // Exclude unwanted fields (IDs, references, metadata)
  const {
    _id,
    admin,
    adminId,
    assignedAdmins,
    __v,
    createdAt,
    updatedAt,
    ...companyData
  } = company;

  res.status(200).json({
    success: true,
    data: companyData,
  });
});

