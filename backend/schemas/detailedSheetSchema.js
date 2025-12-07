import mongoose from "mongoose";

// Cell schema
const cellSchema = new mongoose.Schema({
  value: { type: String, default: "" },
  isEdited: { type: Boolean, default: false },
});

// SubSheet schema
const subSheetSchema = new mongoose.Schema(
  {
    heading: { type: String, default: "" },
    dueDate: { type: String, default: "" },

    // sheet type: monthly, quarterly, half-yearly, yearly
    type: { type: String, default: "monthly" },
    // company id for filtering sheets by company
    companyId: { type: String, default: "" },

    // New: column names
    columns: [{ type: String, default: "" }],

    // Existing rows
    rows: [
      [
        {
          type: cellSchema,
          default: () => ({}),
        },
      ],
    ],
    // Optional: financial year tag for this subsheet (e.g. "2025-2026")
    fy: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("SubSheet", subSheetSchema);
