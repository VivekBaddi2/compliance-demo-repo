import asynchandler from "express-async-handler";
import SuperAdmin from "../schemas/superAdminSchema.js";

// Create Super Admin
export const createSuperAdmin = asynchandler(async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingAdmin = await SuperAdmin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        msg: "Super Admin already exists",
      });
    }

    const newAdmin = await SuperAdmin.create({ username, password });

    return res.status(201).json({
      success: true,
      msg: "Super Admin created successfully",
      data: newAdmin,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
});

// Get all Super Admins
export const getAllSuperAdmins = asynchandler(async (req, res) => {
  try {
    const admins = await SuperAdmin.find();
    return res.status(200).json({
      success: true,
      msg: "Super Admins fetched successfully",
      data: admins,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
});

// Update Super Admin
export const updateSuperAdmin = asynchandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;

    const admin = await SuperAdmin.findById(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        msg: "Super Admin not found",
      });
    }

    if (username) admin.username = username;
    if (password) admin.password = password; // will rehash via pre-save
    await admin.save();

    return res.status(200).json({
      success: true,
      msg: "Super Admin updated successfully",
      data: admin,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
});

// Delete Super Admin
export const deleteSuperAdmin = asynchandler(async (req, res) => {
  try {
    const deletedAdmin = await SuperAdmin.findByIdAndDelete(req.params.id);
    if (!deletedAdmin) {
      return res.status(404).json({
        success: false,
        msg: "Super Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      msg: "Super Admin deleted successfully",
      data: deletedAdmin,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
});


export const loginSuperAdmin = asynchandler(async (req, res) => {
  const { username, password } = req.body;

  const superAdmin = await SuperAdmin.findOne({ username });
  if (!superAdmin) {
    return res.status(404).json({ message: "Super admin not found" });
  }

  const isPasswordValid = await superAdmin.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid password" });
  }

  res.status(200).json({
    message: "Login successful",
    superAdmin: {
      _id: superAdmin._id,
      username: superAdmin.username,
    },
  });
});

