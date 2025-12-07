import mongoose from "mongoose";

const directorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  din: { type: String },
  pan: { type: String },
  dob: { type: Date },
  mobile: { type: String },
  email: { type: String },
});

const authorisedPersonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  din: { type: String },
  pan: { type: String },
  dob: { type: Date },
});

const companySchema = new mongoose.Schema({
  clientName: {                     
    type: String,
    required: true,
    unique: true,
  },
  structure: {                    
    type: String,
    enum: ["Company", "LLP", "Partnership Firm", "Trust", "Proprietor", "AOP"],
    required: true,
  },
  cin: { type: String },
  pan: { type: String },
  gst: { type: String },
  dateOfIncorporation: { type: Date },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  udhyamAdhaar: { type: String },
  udhyamAdhaarCategory: { type: String },
  pf: { type: String },
  esi: { type: String },
  ptEmployer: { type: String },
  ptEmployee: { type: String },

  // ✅ New: Multiple Directors
  directors: {
    type: [directorSchema],
    default: [],
  },

  // ✅ New: Multiple Authorised Persons
  authorisedPersons: {
    type: [authorisedPersonSchema],
    default: [],
  },

  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    default: null,
  },

}, { timestamps: true });

const Company = mongoose.model("Company", companySchema);
export default Company;
