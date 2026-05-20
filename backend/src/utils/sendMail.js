import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text) => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP configuration (SMTP_HOST, SMTP_USER, SMTP_PASS) is missing in environment variables");
  }

  try {
    console.log(`Sending email via SMTP (${host}:${port})...`);
    
    // Extract 6-digit OTP from text if available
    const otpMatch = text.match(/\d{6}/);
    const otp = otpMatch ? otpMatch[0] : "";

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports like 587 or 2525
      auth: {
        user,
        pass,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
    });

    const info = await transporter.sendMail({
      from: `DevConnect <${user}>`,
      to,
      subject,
      html: otp 
        ? `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #333;">DevConnect OTP Verification</h2>
            <p>Your OTP is:</p>
            <h1 style="font-size: 36px; letter-spacing: 4px; color: #6c63ff; margin: 20px 0; font-weight: bold;">${otp}</h1>
            <p style="color: #666; font-size: 14px;">This code is valid for 5 minutes. If you did not request this code, please ignore this email.</p>
          </div>
        `
        : `<p>${text}</p>`,
    });

    console.log("Email sent via SMTP:", info.response);
  } catch (error) {
    console.error("EMAIL SMTP ERROR:", error.message);
    throw error;
  }
};