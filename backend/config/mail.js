// backend/config/mail.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Debug helpers
console.log("GMAIL_USER =>", process.env.GMAIL_USER);
console.log("GMAIL_PASS set =>", process.env.GMAIL_APP_PASSWORD ? "YES" : "NO");

// Create transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

// ⭐ THIS is the missing named export ⭐
export async function sendMail({ to, subject, text, html, attachments }) {
    return transporter.sendMail({
        from: process.env.GMAIL_USER,
        to,
        subject,
        text,
        html,
        attachments,
    });
}

// Default export (used by transporter.verify())
export default transporter;