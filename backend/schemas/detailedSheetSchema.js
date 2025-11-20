// schemas/subSheet.js
import mongoose from "mongoose";

const subCellSchema = new mongoose.Schema({
  value: { type: String, default: "" }
}, { _id: false });

const subRowSchema = new mongoose.Schema({
  cells: [subCellSchema]
}, { _id: false });

const subSheetSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  sheetId: { type: mongoose.Schema.Types.ObjectId, ref: "CompanySheet", required: true },
  headType: { type: String, enum: ["Monthly","Quarterly","HalfYearly","Yearly"], required: true },
  serviceName: { type: String, required: true },
  period: { type: String, required: true }, // matches dashboard.period
  heading: { type: String, default: "" },
  table: [subRowSchema],
}, { timestamps: true });

export default mongoose.model("SubSheet", subSheetSchema);
