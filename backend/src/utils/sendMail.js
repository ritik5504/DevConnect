import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text) => {
  let lastError = null;

  // If RESEND_API_KEY is available, use Resend HTTP API (bypasses Render SMTP port blocking)
  if (process.env.RESEND_API_KEY) {
    try {
      console.log("Sending email via Resend API...");
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "DevConnect <onboarding@resend.dev>",
          to: to,
          subject: subject,
          text: text,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || JSON.stringify(data));
      }
      console.log("Email sent via Resend API:", data.id);
      return;
    } catch (error) {
      console.error("RESEND API ERROR:", error.message);
      lastError = error;
      // Fallback to SMTP
    }
  }

  // Fallback to standard Nodemailer SMTP (works locally, but blocked on Render Free tier)
  try {
    console.log("Sending email via SMTP fallback...");
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

    console.log("Email sent via SMTP:", info.response);
  } catch (error) {
    console.error("EMAIL SMTP ERROR:", error.message);
    throw lastError || error;
  }
};