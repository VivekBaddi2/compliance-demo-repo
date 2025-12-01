import cron from "node-cron";
import Task from "../schemas/taskSchema.js";
import TaskHistory from "../schemas/taskhistorySchema.js";
import { isTaskDueOnDate } from "../utils/scheduleHelper.js";
import { sendMail } from "../utils/mailer.js";

/**
 * startTaskScheduler(app) - call this once when server starts
 * schedule expression default daily at 00:00 server time, configurable via env
 */
export const startTaskScheduler = (options = {}) => {
    const cronExpr = process.env.SCHEDULE_CRON_DAILY || "0 0 * * *"; // default: midnight daily
    // schedule the job
    cron.schedule(cronExpr, async () => {
        console.log("[TaskScheduler] Running daily check for tasks to send...");
        try {
            const today = new Date(); // server timezone
            // fetch active tasks only
            const tasks = await Task.find({ active: true });
            for (const task of tasks) {
                try {
                    if (isTaskDueOnDate(task, today)) {
                        const subject = task.subject || "Assigned task";
                        const html = `<p>${task.message || ""}</p>`;

                        try {
                            await sendMail({ to: task.email, subject, html });
                            task.lastSentAt = new Date();
                            await task.save();
                            await TaskHistory.create({ taskId: task._id, adminId: task.adminId, email: task.email, status: "sent" });
                            console.log(`[TaskScheduler] Sent task ${task._id} to ${task.email}`);
                        } catch (sendErr) {
                            await TaskHistory.create({
                                taskId: task._id,
                                adminId: task.adminId,
                                email: task.email,
                                status: "failed",
                                error: sendErr.message,
                            });
                            console.error(`[TaskScheduler] Failed to send task ${task._id} to ${task.email}:`, sendErr.message);
                        }
                    }
                } catch (innerErr) {
                    console.error("[TaskScheduler] error checking task:", innerErr);
                }
            }
        } catch (err) {
            console.error("[TaskScheduler] job failed:", err);
        }
    });
};