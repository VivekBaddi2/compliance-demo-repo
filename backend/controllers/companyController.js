import asyncHandler from "express-async-handler";
import Company from "../schemas/companySchema.js";
import bcrypt from "bcryptjs";

// ✅ Create Company (by Admin)
export const createCompany = asyncHandler(async (req, res) => {
  try {
    const { adminId, username, password } = req.body;

    const existingCompany = await Company.findOne({ username });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        msg: "Company already exists",
      });
    }

    const company = await Company.create({ adminId, username, password });

    return res.status(201).json({
      success: true,
      msg: "Company created successfully",
      data: company,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, msg: "Internal Server Error" });
  }
});

// ✅ Get all companies
export const getAllCompanies = asyncHandler(async (req, res) => {
  try {
    const companies = await Company.find().populate("adminId", "username");
    res.status(200).json({
      success: true,
      data: companies,
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Internal Server Error" });
  }
});

// ✅ Get companies by Admin
export const getCompaniesByAdmin = asyncHandler(async (req, res) => {
  try {
    const { adminId } = req.params;
    const companies = await Company.find({ adminId });
    res.status(200).json({
      success: true,
      data: companies,
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Internal Server Error" });
  }
});

// ✅ Update Company
export const updateCompany = asyncHandler(async (req, res) => {
  try {
    const { companyId, username, password } = req.body;
    const company = await Company.findById(companyId);
    if (!company)
      return res.status(404).json({ success: false, msg: "Company not found" });

    company.username = username || company.username;
    if (password) company.password = password;

    await company.save();
    res.status(200).json({ success: true, msg: "Company updated", data: company });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Internal Server Error" });
  }
});

// ✅ Delete Company
export const deleteCompany = asyncHandler(async (req, res) => {
  try {
    const del = await Company.findByIdAndDelete(req.params.id);
    if (!del)
      return res.status(404).json({ success: false, msg: "Company not found" });

    res.status(200).json({ success: true, msg: "Company deleted", data: del });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Internal Server Error" });
  }
});

// ✅ Login Company
export const companyLogin = asyncHandler(async (req, res) => {
  try {
    const { username, password } = req.body;
    const company = await Company.findOne({ username });

    if (!company)
      return res.status(404).json({ success: false, msg: "Company not found" });

    const isValid = await bcrypt.compare(password, company.password);
    if (!isValid)
      return res.status(401).json({ success: false, msg: "Invalid password" });

    res.status(200).json({ success: true, msg: "Login successful", data: company });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Internal Server Error" });
  }
});
