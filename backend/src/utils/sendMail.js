import { Resend } from "resend";

export const sendEmail = async (to, subject, text) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is not defined");
  }

  const resend = new Resend(apiKey);

  try {
    console.log("Sending email via Resend SDK...");
    
    // Extract 6-digit OTP from text if available
    const otpMatch = text.match(/\d{6}/);
    const otp = otpMatch ? otpMatch[0] : "";

    const { data, error } = await resend.emails.send({
      from: "DevConnect <onboarding@resend.dev>",
      to: to,
      subject: subject,
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

    if (error) {
      throw error;
    }

    console.log("Email sent via Resend API:", data.id);
  } catch (error) {
    console.error("RESEND SDK ERROR:", error.message || error);
    throw error;
  }
};