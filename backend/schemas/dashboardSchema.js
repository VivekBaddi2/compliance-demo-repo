// schemas/companySheet.js
import mongoose from "mongoose";

// Each cell under a head for a service
const headCellSchema = new mongoose.Schema({
  symbol: { type: String, default: "" },
  notes: { type: String, default: "" },
  subSheetId: { type: mongoose.Schema.Types.ObjectId, ref: "SubSheet", default: null }, // link to detailed sub-sheet

  // NEW: timestamp for last change to this cell
  updatedAt: { type: Date, default: null }
}, { _id: false });

// Each service's cells for all heads are dynamic now
const serviceCellsSchema = new mongoose.Schema({}, { _id: false, strict: false });
// ✅ strict: false allows dynamic head keys (Monthly, Quarterly, or custom heads)

// Each row (period) in the dashboard
const dashboardRowSchema = new mongoose.Schema({
  period: { type: String, required: true }, // e.g., "April 2025", "Q1 2025", etc.
  services: {
    type: Map,
    of: serviceCellsSchema, // serviceName => dynamic head cells
    default: {}
  }
}, { _id: true });

const companySheetSchema = new mongoose.Schema({
  // allow multiple sheets per company (one per FY); remove unique constraint
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  // Optional financial year identifier for sheets created per-FY
  fy: { type: String, default: null }, // e.g. "2025-2026"
  heading: { type: String, default: null },

  // serviceHeads = headName => array of services under that head
  serviceHeads: {
    type: Map,
    of: [String],
    default: {}
  },

  // dashboard rows
  dashboard: [dashboardRowSchema],

}, { timestamps: true });

export default mongoose.model("CompanySheet", companySheetSchema);
