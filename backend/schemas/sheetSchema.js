import mongoose from "mongoose";

const cellSchema = new mongoose.Schema({
  row: { type: String, required: true },
  column: { type: String, required: true },
  value: { type: String, default: "" }
});

const complianceSheetSchema = new mongoose.Schema(
  {
    sheetType: { type: String, required: true }, // now fully dynamic
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    cells: [cellSchema],
  },
  { timestamps: true }
);

const ComplianceSheet = mongoose.model("ComplianceSheet", complianceSheetSchema);
export default ComplianceSheet;
