import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
    {
        adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true }, // or Admin model
        email: { type: String, required: true },
        frequency: {
            type: String,
            enum: ["Monthly", "Quarterly", "HalfYearly", "Yearly"],
            required: true,
        },
        startDate: { type: Date, required: true }, // first send date
        message: { type: String },
        subject: { type: String, default: "Assigned task" },
        active: { type: Boolean, default: true },
        // optional: store lastSent to avoid duplicates or record history in TaskHistory
        lastSentAt: { type: Date },
    },
    { timestamps: true }
);

export default mongoose.model("Task", taskSchema);