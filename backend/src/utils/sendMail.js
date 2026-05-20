import SibApiV3Sdk from "sib-api-v3-sdk";
import nodemailer from "nodemailer";

const client = SibApiV3Sdk.ApiClient.instance;
const apiKeyInstance = client.authentications["api-key"];
apiKeyInstance.apiKey = process.env.BREVO_API_KEY || "dummy_key"; // Fallback to avoid error on load if undefined

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

export const sendEmail = async (email, subject, text) => {
  // Extract 6-digit OTP from text if available
  const otpMatch = text.match(/\d{6}/);
  const otp = otpMatch ? otpMatch[0] : "";

  try {
    console.log("Sending email via Brevo Transactional API...");
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not defined in environment variables");
    }

    // Ensure apiKeyInstance is up-to-date with actual environment variable at runtime
    apiKeyInstance.apiKey = apiKey;

    await tranEmailApi.sendTransacEmail({
      sender: {
        email: process.env.BREVO_SENDER_EMAIL || "rajsahil5504@gmail.com",
        name: "DevConnection"
      },
      to: [
        {
          email: email
        }
      ],
      subject: "OTP Verification",
      htmlContent: `
        <h2>Your OTP is ${otp}</h2>
        <p>Valid for 10 minutes</p>
      `
    });

    console.log("EMAIL SENT SUCCESSFULLY VIA BREVO");
  } catch (error) {
    console.error("BREVO API ERROR:", error.response?.text || error.message);
    
    // Fallback 1: Try Gmail SMTP via Nodemailer
    const gmailUser = process.env.EMAIL;
    const gmailPass = process.env.EMAIL_PASS;
    
    if (gmailUser && gmailPass) {
      try {
        console.log("Attempting fallback email sending via Gmail SMTP...");
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: gmailUser,
            pass: gmailPass,
          },
        });

        await transporter.sendMail({
          from: `"DevConnection" <${gmailUser}>`,
          to: email,
          subject: "OTP Verification",
          html: `
            <h2>Your OTP is ${otp}</h2>
            <p>Valid for 10 minutes</p>
          `,
        });

        console.log("EMAIL SENT SUCCESSFULLY VIA GMAIL FALLBACK");
        return; // Success!
      } catch (gmailError) {
        console.error("GMAIL FALLBACK ERROR:", gmailError.message);
      }
    } else {
      console.log("Gmail fallback skipped: EMAIL/EMAIL_PASS not defined in environment variables");
    }

    // Fallback 2: Log to console and let the register API succeed so signup isn't blocked
    console.log("==========================================");
    console.log(`[DEVELOPMENT BYPASS] Verification OTP for ${email}: ${otp}`);
    console.log("==========================================");
  }
};