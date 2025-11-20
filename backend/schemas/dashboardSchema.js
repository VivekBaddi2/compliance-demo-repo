// schemas/companySheet.js
import mongoose from "mongoose";

const headCellSchema = new mongoose.Schema({
  symbol: { type: String, enum: ["tick", "cross", "late", ""], default: "" },
  notes: { type: String, default: "" },
  subSheetId: { type: mongoose.Schema.Types.ObjectId, ref: "SubSheet", default: null } // link to detailed sub-sheet
}, { _id: false });

const serviceCellsSchema = new mongoose.Schema({
  Monthly: { type: headCellSchema, default: () => ({}) },
  Quarterly: { type: headCellSchema, default: () => ({}) },
  HalfYearly: { type: headCellSchema, default: () => ({}) },
  Yearly: { type: headCellSchema, default: () => ({}) },
}, { _id: false });

const dashboardRowSchema = new mongoose.Schema({
  period: { type: String, required: true }, // e.g., "April 2025", "Q1 2025", "H1 2025", "2025"
  services: {
    // plain object: keys = serviceName, value = serviceCellsSchema
    type: Object,
    default: {}
  }
}, { _id: true });

const companySheetSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, unique: true },

  // lists of services grouped by head; used to render columns / add new services
  serviceHeads: {
    Monthly: [{ type: String }],
    Quarterly: [{ type: String }],
    HalfYearly: [{ type: String }],
    Yearly: [{ type: String }],
  },

  // dashboard: list of rows (periods) each with services map
  dashboard: [dashboardRowSchema],

}, { timestamps: true });

export default mongoose.model("CompanySheet", companySheetSchema);
