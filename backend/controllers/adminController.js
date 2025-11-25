import asyncHandler from "express-async-handler";
import Admin from "../schemas/adminSchema.js";
import Company from "../schemas/companySchema.js";

// ✅ Admin login
export const loginAdmin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username }).populate("assignedCompanies", "username");
  if (!admin) return res.status(404).json({ message: "Admin not found" });

  const isPasswordValid = await admin.matchPassword(password);
  if (!isPasswordValid) return res.status(401).json({ message: "Invalid password" });

  res.status(200).json({ message: "Login successful", admin });
});

// ✅ Get all companies assigned to this admin
export const getAssignedCompanies = asyncHandler(async (req, res) => {
  const { adminId } = req.params;

  const admin = await Admin.findById(adminId).populate("assignedCompanies", "clientName structure");
  if (!admin) return res.status(404).json({ message: "Admin not found" });

  res.status(200).json({ success: true, assignedCompanies: admin.assignedCompanies });
});


// ✅ Update admin's own password
export const updatePassword = asyncHandler(async (req, res) => {
  const { adminId } = req.params;
  const { oldPassword, newPassword } = req.body;

  const admin = await Admin.findById(adminId);
  if (!admin) return res.status(404).json({ message: "Admin not found" });

  const isMatch = await admin.matchPassword(oldPassword);
  if (!isMatch) return res.status(401).json({ message: "Old password is incorrect" });

  admin.password = newPassword; // hashed in pre-save
  await admin.save();

  res.status(200).json({ message: "Password updated successfully" });
});

// ✅ Get all admins (only id + username)
export const getAllAdmins = asyncHandler(async (req, res) => {
  const admins = await Admin.find({}, "_id username"); // only _id and username
  res.status(200).json({ success: true, data: admins });
});
