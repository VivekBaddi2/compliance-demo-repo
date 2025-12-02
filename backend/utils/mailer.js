import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent folder (backend/.env)
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

// Debug logs
console.log("📧 GMAIL_USER:", process.env.GMAIL_USER ? "Loaded" : "Missing");
console.log(
  "📧 GMAIL_APP_PASSWORD:",
  process.env.GMAIL_APP_PASSWORD ? "Loaded" : "Missing"
);

// Transporter
export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify
transporter.verify((err) => {
  if (err) {
    console.error("❌ Email server connection failed:", err.message);
  } else {
    console.log("✅ Mailer ready");
  }
});

// Send function
export const sendMail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      html,
      text,
    });

    console.log("📨 Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Mail sending failed:", err.message);
    throw err;
  }
};

export default transporter;
