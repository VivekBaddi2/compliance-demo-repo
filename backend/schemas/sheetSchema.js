import mongoose from "mongoose";

const sheetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  data: {
    type: Object, // will hold JSON grid data
    required: true,
  },

} , { timestamps: true });

export default mongoose.model("Sheet", sheetSchema);
