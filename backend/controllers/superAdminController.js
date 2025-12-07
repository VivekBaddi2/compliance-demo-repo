import asyncHandler from "express-async-handler";
import SuperAdmin from "../schemas/superAdminSchema.js";
import Admin from "../schemas/adminSchema.js";
import Company from "../schemas/companySchema.js";

// -------------------------
// Super Admin CRUD
// -------------------------

export const createSuperAdmin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ success: false, msg: "All fields required" });

  const existing = await SuperAdmin.findOne({ username });
  if (existing)
    return res.status(400).json({ success: false, msg: "Super Admin already exists" });

  const newSuperAdmin = await SuperAdmin.create({ username, password });

  res.status(201).json({
    success: true,
    msg: "Super Admin created successfully",
    data: newSuperAdmin,
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  // 1) Try Super Admin
  let user = await SuperAdmin.findOne({ username });

  if (user) {
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.status(200).json({
      role: "super-admin",
      user: {
        _id: user._id,
        username: user.username,
        role: "super-admin",
      },
    });
  }

  // 2) Try Admin
  user = await Admin.findOne({ username });

  if (user) {
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.status(200).json({
      role: "admin",
      user: {
        _id: user._id,
        username: user.username,
        role: "admin",
      },
    });
  }

  return res.status(404).json({ message: "User not found" });
});

export const getAllSuperAdmins = asyncHandler(async (req, res) => {
  const admins = await SuperAdmin.find()
    .populate({
      path: "admins",
      select: "username assignedCompanies",
      populate: { path: "assignedCompanies", select: "username" }
    })
    .populate("companies", "username");

  res.status(200).json({ success: true, data: admins });
});

export const updateSuperAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;

  const superAdmin = await SuperAdmin.findById(id);
  if (!superAdmin)
    return res.status(404).json({ success: false, msg: "Super Admin not found" });

  if (username) superAdmin.username = username;
  if (password) superAdmin.password = password; // pre-save hashes password

  await superAdmin.save();

  res.status(200).json({
    success: true,
    msg: "Super Admin updated successfully",
    data: superAdmin,
  });
});

export const deleteSuperAdmin = asyncHandler(async (req, res) => {
  const deleted = await SuperAdmin.findByIdAndDelete(req.params.id);
  if (!deleted)
    return res.status(404).json({ success: false, msg: "Super Admin not found" });

  res.status(200).json({ success: true, msg: "Super Admin deleted successfully", data: deleted });
});

export const loginSuperAdmin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const superAdmin = await SuperAdmin.findOne({ username });
  if (!superAdmin) return res.status(404).json({ message: "Super Admin not found" });

  const isValid = await superAdmin.comparePassword(password);
  if (!isValid) return res.status(401).json({ message: "Invalid password" });

  res.status(200).json({
    message: "Login successful",
    superAdmin: { _id: superAdmin._id, username: superAdmin.username },
  });
});

// -------------------------
// Admin & Company Management
// -------------------------

export const createAdminBySuperAdmin = asyncHandler(async (req, res) => {
  const { username, password, createdBy } = req.body; // include createdBy
  if (!username || !password || !createdBy)
    return res.status(400).json({ success: false, msg: "All fields required" });

  const existing = await Admin.findOne({ username });
  if (existing) return res.status(400).json({ success: false, msg: "Admin already exists" });

  const admin = await Admin.create({
    username,
    password,
    createdBy,
    assignedCompanies: [],
  });

  res.status(201).json({ success: true, msg: "Admin created", data: admin });
});

// Create Company by Super Admin
export const createCompanyBySuperAdmin = asyncHandler(async (req, res) => {
  const {
    clientName,
    structure,
    cin,
    pan,
    gst,
    dateOfIncorporation,
    address,
    phone,
    email,
    udhyamAdhaar,
    udhyamAdhaarCategory,
    pf,
    esi,
    ptEmployer,
    ptEmployee,
    adminId,
    directors,               // NEW
    authorisedPersons        // NEW
  } = req.body;

  if (!clientName || !structure) {
    return res.status(400).json({ success: false, msg: "Client Name and Structure are required" });
  }

  const existing = await Company.findOne({ clientName });
  if (existing) {
    return res.status(400).json({ success: false, msg: "Company already exists" });
  }

  const company = await Company.create({
    clientName,
    structure,
    cin,
    pan,
    gst,
    dateOfIncorporation,
    address,
    phone,
    email,
    udhyamAdhaar,
    udhyamAdhaarCategory,
    pf,
    esi,
    ptEmployer,
    ptEmployee,
    adminId: adminId || null,

    directors: directors || [],                 // NEW
    authorisedPersons: authorisedPersons || []  // NEW
  });

  res.status(201).json({ success: true, msg: "Company created", data: company });
});


export const assignCompaniesToAdmin = asyncHandler(async (req, res) => {
  const { adminId, companyIds } = req.body;

  const admin = await Admin.findById(adminId);
  if (!admin) return res.status(404).json({ success: false, msg: "Admin not found" });

  if (!Array.isArray(admin.assignedCompanies)) admin.assignedCompanies = [];
  admin.assignedCompanies = Array.from(new Set([...admin.assignedCompanies.map(c => c.toString()), ...companyIds]));

  await Company.updateMany({ _id: { $in: companyIds } }, { adminId: admin._id });
  await admin.save();

  res.status(200).json({ success: true, msg: "Companies assigned to admin", data: admin });
});

export const reallotCompanies = asyncHandler(async (req, res) => {
  const { fromAdminId, toAdminId, companyIds } = req.body;

  const fromAdmin = await Admin.findById(fromAdminId);
  const toAdmin = await Admin.findById(toAdminId);
  if (!fromAdmin || !toAdmin) return res.status(404).json({ success: false, msg: "Admin(s) not found" });

  if (!Array.isArray(fromAdmin.assignedCompanies)) fromAdmin.assignedCompanies = [];
  if (!Array.isArray(toAdmin.assignedCompanies)) toAdmin.assignedCompanies = [];

  fromAdmin.assignedCompanies = fromAdmin.assignedCompanies.filter(c => !companyIds.includes(c.toString()));
  toAdmin.assignedCompanies = Array.from(new Set([...toAdmin.assignedCompanies.map(c => c.toString()), ...companyIds]));

  await Company.updateMany({ _id: { $in: companyIds } }, { adminId: toAdmin._id });
  await fromAdmin.save();
  await toAdmin.save();

  res.status(200).json({ success: true, msg: "Companies re-allotted", data: { fromAdmin, toAdmin } });
});

export const getAllAdminsWithCompanies = asyncHandler(async (req, res) => {
  // Populate assignedCompanies with clientName instead of username
  const admins = await Admin.find().populate("assignedCompanies", "clientName");
  res.status(200).json({ success: true, data: admins });
});

export const getAllCompaniesWithAdmins = asyncHandler(async (req, res) => {
  // Populate adminId with username or other admin fields as needed
  const companies = await Company.find().populate("adminId", "username");
  res.status(200).json({ success: true, data: companies });
});



export const deleteAdmin = asyncHandler(async (req, res) => {
  const { adminId } = req.params;

  const admin = await Admin.findById(adminId);
  if (!admin) {
    return res.status(404).json({ success: false, msg: "Admin not found" });
  }

  // Remove admin using findByIdAndDelete for safety
  await Admin.findByIdAndDelete(adminId);

  // Optional: unset adminId in companies assigned to this admin
  await Company.updateMany(
    { adminId: adminId },
    { $set: { adminId: null } }
  );

  res.status(200).json({ success: true, msg: "Admin deleted successfully" });
});


export const deleteCompany = asyncHandler(async (req, res) => {
  const { companyId } = req.params;

  const company = await Company.findById(companyId);
  if (!company) {
    return res.status(404).json({ success: false, msg: "Company not found" });
  }

  // Remove company using findByIdAndDelete
  await Company.findByIdAndDelete(companyId);

  // Optional: remove this company from any admin's assignedCompanies array
  await Admin.updateMany(
    { assignedCompanies: companyId },
    { $pull: { assignedCompanies: companyId } }
  );

  res.status(200).json({ success: true, msg: "Company deleted successfully" });
});

// Remove company from admin
export const removeCompanyFromAdmin = asyncHandler(async (req, res) => {
  const { adminId, companyId } = req.params;

  const admin = await Admin.findById(adminId);
  if (!admin) return res.status(404).json({ success: false, msg: "Admin not found" });

  const company = await Company.findById(companyId);
  if (!company) return res.status(404).json({ success: false, msg: "Company not found" });

  // Remove company from admin's assignedCompanies
  admin.assignedCompanies = admin.assignedCompanies.filter(c => c.toString() !== companyId);
  await admin.save();

  // Set company adminId to null
  company.adminId = null;
  await company.save();

  res.status(200).json({ success: true, msg: "Company removed from admin", data: { admin, company } });
});

export const updateAdminBySuperAdmin = asyncHandler(async (req, res) => {
  const { adminId } = req.params;
  const { username, password } = req.body;

  const admin = await Admin.findById(adminId);
  if (!admin) {
    return res.status(404).json({ success: false, msg: "Admin not found" });
  }

  if (username) admin.username = username;
  if (password) admin.password = password; // will be hashed by pre-save

  await admin.save();

  res.status(200).json({
    success: true,
    msg: "Admin updated successfully",
    data: admin,
  });
});

// Update company (SuperAdmin)
export const updateCompanyBySuperAdmin = asyncHandler(async (req, res) => {
  const { companyId } = req.params;

  const {
    clientName,
    structure,
    cin,
    pan,
    gst,
    dateOfIncorporation,
    address,
    phone,
    email,
    udhyamAdhaar,
    udhyamAdhaarCategory,
    pf,
    esi,
    ptEmployer,
    ptEmployee,
    adminId,
    directors,                // NEW
    authorisedPersons         // NEW
  } = req.body;

  const company = await Company.findById(companyId);
  if (!company) {
    return res.status(404).json({ success: false, msg: "Company not found" });
  }

  // Update fields
  if (clientName) company.clientName = clientName;
  if (structure) company.structure = structure;
  if (cin) company.cin = cin;
  if (pan) company.pan = pan;
  if (gst) company.gst = gst;
  if (dateOfIncorporation) company.dateOfIncorporation = dateOfIncorporation;
  if (address) company.address = address;
  if (phone) company.phone = phone;
  if (email) company.email = email;
  if (udhyamAdhaar) company.udhyamAdhaar = udhyamAdhaar;
  if (udhyamAdhaarCategory) company.udhyamAdhaarCategory = udhyamAdhaarCategory;
  if (pf) company.pf = pf;
  if (esi) company.esi = esi;
  if (ptEmployer) company.ptEmployer = ptEmployer;
  if (ptEmployee) company.ptEmployee = ptEmployee;
  if (adminId) company.adminId = adminId;

  // NEW — replace entire directors array
  if (directors) company.directors = directors;

  // NEW — replace entire authorised persons array
  if (authorisedPersons) company.authorisedPersons = authorisedPersons;

  await company.save();

  res.status(200).json({ success: true, msg: "Company updated successfully", data: company });
});
