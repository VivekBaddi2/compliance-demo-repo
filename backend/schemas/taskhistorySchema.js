import mongoose from "mongoose";

const taskHistorySchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: { type: String },
    sentAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["sent", "failed"], required: true },
    error: { type: String }, // optional error message
  },
  { timestamps: true }
);

export default mongoose.model("TaskHistory", taskHistorySchema);