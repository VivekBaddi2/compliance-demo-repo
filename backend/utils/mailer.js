import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // your gmail e.g. example@gmail.com
    pass: process.env.GMAIL_APP_PASSWORD, // app password
  },
});

export const sendMail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject,
    text: text || undefined,
    html: html || undefined,
  };

  return transporter.sendMail(mailOptions);
};