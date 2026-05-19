import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // Use STARTTLS on port 587
      auth: {
        user: process.env.EMAIL || process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      family: 4, // Force IPv4 to prevent ENETUNREACH IPv6 routing errors on Render
    });

    const info = await transporter.sendMail({
      from: `DevConnect <${process.env.EMAIL || process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("EMAIL ERROR:", error.message);
  }
};