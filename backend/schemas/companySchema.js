import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const companySchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    default: null, // can be assigned later
  },
} , { timestamps: true });

// Hash password before save
companySchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const Company = mongoose.model("Company", companySchema);
export default Company;
