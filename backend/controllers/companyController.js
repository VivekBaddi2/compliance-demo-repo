import asyncHandler from "express-async-handler";
import Company from "../schemas/companySchema.js";
import bcrypt from "bcryptjs";

// ✅ Get all companies
export const getAllCompanies = asyncHandler(async (req, res) => {
  const companies = await Company.find().populate("adminId", "username");
  res.status(200).json({ success: true, data: companies });
});

// ✅ Get companies by Admin (only assigned to this admin)
export const getCompaniesByAdmin = asyncHandler(async (req, res) => {
  const { adminId } = req.params;
  const companies = await Company.find({ adminId }).populate("adminId", "username");
  res.status(200).json({ success: true, data: companies });
});

// ✅ Update Company (admin can update own company credentials if needed)
export const updateCompany = asyncHandler(async (req, res) => {
  const { companyId, username, password } = req.body;

  const company = await Company.findById(companyId);
  if (!company) return res.status(404).json({ success: false, msg: "Company not found" });

  if (username) company.username = username;
  if (password) company.password = password; // will be hashed via pre-save hook

  await company.save();
  res.status(200).json({ success: true, msg: "Company updated", data: company });
});

// ✅ Delete Company
export const deleteCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const company = await Company.findById(id);
  if (!company) return res.status(404).json({ success: false, msg: "Company not found" });

  await company.deleteOne();
  res.status(200).json({ success: true, msg: "Company deleted successfully", data: company });
});

// ✅ Company Login (with admin info)
export const companyLogin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const company = await Company.findOne({ username }).populate("adminId", "username");
  if (!company) return res.status(404).json({ success: false, msg: "Company not found" });

  const isValid = await bcrypt.compare(password, company.password);
  if (!isValid) return res.status(401).json({ success: false, msg: "Invalid password" });

  res.status(200).json({ success: true, msg: "Login successful", data: company });
});
