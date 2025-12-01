import asyncHandler from "express-async-handler";
import Task from "../schemas/taskSchema.js";
import TaskHistory from "../schemas/taskhistorySchema.js"
import { sendMail } from "../utils/mailer.js";

/**
 * Create task
 * POST /api/superadmin/tasks
 */
export const createTask = asyncHandler(async (req, res) => {
    try {
        const { adminId, email, frequency, startDate, message, subject } = req.body;
        if (!adminId || !email || !frequency || !startDate) {
            res.status(400);
            throw new Error("adminId, email, frequency and startDate are required");
        }

        const task = await Task.create({
            adminId,
            email,
            frequency,
            startDate,
            message,
            subject,
        });

        res.status(201).json({ success: true, task });
    } catch (err) {
        res.status(res.statusCode === 200 ? 500 : res.statusCode).json({ success: false, message: err.message });
    }
});

/**
 * Get all tasks (optionally filtered by adminId)
 * GET /api/superadmin/tasks
 */
export const getTasks = asyncHandler(async (req, res) => {
    try {
        const { adminId } = req.query;
        const filter = {};
        if (adminId) filter.adminId = adminId;
        const tasks = await Task.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, tasks });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * Get single task
 * GET /api/superadmin/tasks/:id
 */
export const getTaskById = asyncHandler(async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            res.status(404);
            throw new Error("Task not found");
        }
        res.json({ success: true, task });
    } catch (err) {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
});

/**
 * Update task
 * PUT /api/superadmin/tasks/:id
 */
export const updateTask = asyncHandler(async (req, res) => {
    try {
        const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) {
            res.status(404);
            throw new Error("Task not found");
        }
        res.json({ success: true, task: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * Delete task
 * DELETE /api/superadmin/tasks/:id
 */
export const deleteTask = asyncHandler(async (req, res) => {
    try {
        const removed = await Task.findByIdAndDelete(req.params.id);
        if (!removed) {
            res.status(404);
            throw new Error("Task not found");
        }
        res.json({ success: true, message: "Task removed" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * Manual send for testing: POST /api/superadmin/tasks/:id/send
 * This will send immediately and log history.
 */
export const sendTaskNow = asyncHandler(async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            res.status(404);
            throw new Error("Task not found");
        }

        // prepare mail content
        const html = `<p>${task.message || ""}</p>`;
        const subject = task.subject || "Assigned task";

        try {
            await sendMail({ to: task.email, subject, html });
            task.lastSentAt = new Date();
            await task.save();
            await TaskHistory.create({ taskId: task._id, adminId: task.adminId, email: task.email, status: "sent" });

            res.json({ success: true, message: "Email sent" });
        } catch (mailErr) {
            await TaskHistory.create({
                taskId: task._id,
                adminId: task.adminId,
                email: task.email,
                status: "failed",
                error: mailErr.message,
            });
            res.status(500).json({ success: false, message: "Failed to send email", error: mailErr.message });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});