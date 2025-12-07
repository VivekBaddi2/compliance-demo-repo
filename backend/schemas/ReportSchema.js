// backend/schemas/ReportSchema.js
import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    filePath: { type: String, required: true },
    title: { type: String, default: null },
    sheets: { type: Array, default: [] },
    createdBy: { type: String, default: null },
    notes: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
});

// Prevents OverwriteModelError in nodemon
const Report = mongoose.models.Report || mongoose.model("Report", ReportSchema);

export default Report;