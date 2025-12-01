import mongoose from "mongoose";

// Cell schema
const cellSchema = new mongoose.Schema({
  value: { type: String, default: "" },
});

// SubSheet schema
const subSheetSchema = new mongoose.Schema(
  {
    heading: { type: String, default: "" },
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
  },
  { timestamps: true }
);

export default mongoose.model("SubSheet", subSheetSchema);
