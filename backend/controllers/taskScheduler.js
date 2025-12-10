import cron from "node-cron";
import Task from "../schemas/taskSchema.js";
import TaskHistory from "../schemas/taskhistorySchema.js";
import { isTaskDueOnDate } from "../utils/scheduleHelper.js";
import { sendMail } from "../utils/mailer.js";

/**
 * startTaskScheduler(app) – call this once when server starts
 */
export const startTaskScheduler = () => {

    // READ cron expression (supports 6 fields: seconds, minutes, hours, dom, month, dow)
    const cronExpr = process.env.SCHEDULE_CRON_DAILY || "0 0 9 * * *";
    // default: every 10 seconds

    console.log("🚀 Task Scheduler Started with CRON:", cronExpr);

    cron.schedule(
        cronExpr,
        async () => {
            console.log(
                "⏰ [TaskScheduler] Cron Fired (IST):",
                new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
            );

            console.log("[TaskScheduler] Checking tasks...");

            try {
                // FORCE today's date in IST (important)
                const today = new Date(
                    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
                );

                // get all active tasks
                const tasks = await Task.find({ active: true });

                for (const task of tasks) {
                    try {
                        // Check if today is due
                        const due = isTaskDueOnDate(task, today);

                        if (due) {
                            const subject = task.subject || "Assigned task";
                            const html = `<p>${task.message || ""}</p>`;

                            try {
                                // Send email
                                await sendMail({ to: task.email, subject, html });

                                // Update task
                                task.lastSentAt = new Date();
                                await task.save();

                                // Log history
                                await TaskHistory.create({
                                    taskId: task._id,
                                    adminId: task.adminId,
                                    email: task.email,
                                    status: "sent",
                                });

                                console.log(
                                    `[TaskScheduler] ✔ SENT: Task ${task._id} to ${task.email}`
                                );
                            } catch (sendErr) {
                                // failed mail attempt
                                await TaskHistory.create({
                                    taskId: task._id,
                                    adminId: task.adminId,
                                    email: task.email,
                                    status: "failed",
                                    error: sendErr.message,
                                });

                                console.error(
                                    `[TaskScheduler] ❌ FAILED to send task ${task._id}:`,
                                    sendErr.message
                                );
                            }
                        }
                    } catch (innerErr) {
                        console.error("[TaskScheduler] ❌ error checking task:", innerErr);
                    }
                }
            } catch (err) {
                console.error("[TaskScheduler] ❌ job failed:", err);
            }
        },
        {
            scheduled: true,
            timezone: "Asia/Kolkata", // ensures IST timing
        }
    );
};