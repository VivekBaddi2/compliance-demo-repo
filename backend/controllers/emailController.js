// backend/controllers/emailController.js

import transporter, { sendMail } from "../config/mail.js";
import { generateReportPdf } from "../config/reportPdf.js";
import fs from "fs";
import Report from "../schemas/ReportSchema.js"; // adjust casing/path if needed

console.log("Loaded: controllers/emailController.js");

/**
 * testMail - simple SMTP verification + test email
 */
export async function testMail(req, res) {
    try {
        // surfaces auth errors early
        await transporter.verify();
        const to = req.body.to || req.query.to || process.env.GMAIL_USER || process.env.SMTP_USER;
        const info = await sendMail({
            to,
            subject: "SMTP Test - Compliance Mailer",
            text: "This is a test email from your Compliance Mailer backend.",
        });
        console.log("testMail sent:", info && info.messageId);
        return res.json({ success: true, message: "Test email sent", info });
    } catch (err) {
        console.error("testMail error:", err);
        return res.status(500).json({ success: false, message: "Failed to send test mail", error: err.message });
    }
}

/**
 * sendReportMail - generates PDF and sends it (keeps previous behaviour)
 * Expects body: { to, subject, body, sheet }
 */
export async function sendReportMail(req, res) {
    try {
        console.log("Inside sendReportMail - body:", req.body);

        const { to, subject, body, sheet } = req.body;
        if (!to) return res.status(400).json({ success: false, message: "Missing 'to' field" });

        // generate PDF (returns { buffer, filename, filePath })
        const { buffer, filename } = await generateReportPdf(sheet || {});

        // attach PDF as in-memory buffer
        const attachments = [
            {
                filename: filename || "report.pdf",
                content: buffer,
            },
        ];

        const info = await sendMail({
            to,
            subject: subject || "Compliance Report",
            text: body || "Please find the attached report.",
            attachments,
        });

        console.log("sendReportMail sent:", info && (info.messageId || info.accepted));
        return res.json({ success: true, message: "Email sent", info });
    } catch (err) {
        console.error("sendReportMail error:", err);
        // nodemailer auth errors often show 'Invalid login' or '535'
        return res.status(500).json({ success: false, message: "Failed to send report", error: err.message });
    }
}

/**
 * createReportAndSend(req, res)
 * Body: { to, subject, body, sheet, save, createdBy }
 * - save: boolean (if true, save filePath + metadata to DB)
 */
export async function createReportAndSend(req, res) {
    try {
        const { to, subject, body, sheet, save } = req.body;
        if (!to) return res.status(400).json({ success: false, message: "Missing 'to' field" });

        // generate PDF (by default writes to disk and returns buffer)
        // If user doesn't want to persist file on disk, you can pass options.writeToDisk = false to generateReportPdf
        const { buffer, filename, filePath } = await generateReportPdf(sheet || {});

        // attachments: attach buffer in-memory
        const attachments = [{ filename: filename || "report.pdf", content: buffer }];

        const info = await sendMail({
            to,
            subject: subject || "Compliance Report",
            text: body || "Please find the attached report.",
            attachments,
        });

        let savedReport = null;
        if (save) {
            savedReport = await Report.create({
                filename,
                filePath,
                title: sheet?.title || filename,
                sheets: Array.isArray(sheet) ? sheet : (sheet?.subsheets ? sheet.subsheets : [sheet || {}]),
                notes: sheet?.notes || "",
                createdBy: req.body.createdBy || null,
            });
        }

        return res.json({ success: true, message: "Email sent", info, report: savedReport });
    } catch (err) {
        console.error("createReportAndSend error:", err);
        return res.status(500).json({ success: false, message: "Failed to send report", error: err.message });
    }
}

// List saved reports
export async function listReports(req, res) {
    try {
        const reports = await Report.find().sort({ createdAt: -1 }).limit(200);
        res.json({ success: true, reports });
    } catch (err) {
        console.error("listReports error:", err);
        res.status(500).json({ success: false, message: "Failed to list reports", error: err.message });
    }
}

// Download saved report by id
export async function downloadReport(req, res) {
    try {
        const { id } = req.params;
        const report = await Report.findById(id);
        if (!report) return res.status(404).json({ success: false, message: "Report not found" });

        if (!fs.existsSync(report.filePath)) {
            return res.status(404).json({ success: false, message: "File not found on disk" });
        }

        return res.download(report.filePath, report.filename);
    } catch (err) {
        console.error("downloadReport error:", err);
        res.status(500).json({ success: false, message: "Failed to download", error: err.message });
    }
}

// Delete saved report (file + DB entry)
export async function deleteReport(req, res) {
    try {
        const { id } = req.params;
        const report = await Report.findById(id);
        if (!report) return res.status(404).json({ success: false, message: "Report not found" });

        try {
            if (fs.existsSync(report.filePath)) fs.unlinkSync(report.filePath);
        } catch (err) {
            console.warn("delete file error:", err.message);
        }

        await Report.deleteOne({ _id: id });
        res.json({ success: true, message: "Deleted" });
    } catch (err) {
        console.error("deleteReport error:", err);
        res.status(500).json({ success: false, message: "Failed to delete", error: err.message });
    }
}

// Update metadata (title / notes / createdBy / sheets)
export async function updateReportMetadata(req, res) {
    try {
        const { id } = req.params;
        const changes = req.body;
        const report = await Report.findByIdAndUpdate(id, changes, { new: true });
        if (!report) return res.status(404).json({ success: false, message: "Report not found" });
        res.json({ success: true, report });
    } catch (err) {
        console.error("updateReportMetadata error:", err);
        res.status(500).json({ success: false, message: "Failed to update", error: err.message });
    }
}