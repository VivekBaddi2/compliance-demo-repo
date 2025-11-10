import asyncHandler from "express-async-handler";
import Admin from "../schemas/adminSchema.js";

// create new admin (by super admin)
export const createAdmin = asyncHandler(async (req, res) => {
  const { username, password, createdBy } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const adminExists = await Admin.findOne({ username });
  if (adminExists) {
    return res.status(400).json({ message: "Admin already exists" });
  }

  const admin = await Admin.create({ username, password, createdBy });

  if (admin) {
    res.status(201).json({ message: "Admin created successfully", admin });
  } else {
    res.status(400).json({ message: "Failed to create admin" });
  }
});

// get all admins
export const getAllAdmins = asyncHandler(async (req, res) => {
  const admins = await Admin.find().populate("createdBy", "username");
  res.status(200).json(admins);
});

// delete admin
export const deleteAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const admin = await Admin.findById(id);
  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }
  await admin.deleteOne();
  res.status(200).json({ message: "Admin deleted successfully" });
});

// Admin login
export const loginAdmin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });
  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }

  const isPasswordValid = await admin.matchPassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid password" });
  }

  res.status(200).json({
    message: "Login successful",
    admin,
  });
});
