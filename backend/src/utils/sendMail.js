import SibApiV3Sdk from "sib-api-v3-sdk";

export const sendEmail = async (to, subject, text) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not defined in environment variables");
  }

  // Extract 6-digit OTP from text if available
  const otpMatch = text.match(/\d{6}/);
  const otp = otpMatch ? otpMatch[0] : "";

  const client = SibApiV3Sdk.ApiClient.instance;
  const apiKeyInstance = client.authentications["api-key"];
  apiKeyInstance.apiKey = apiKey;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  try {
    console.log("Sending email via Brevo API...");

    await apiInstance.sendTransacEmail({
      sender: {
        name: "DevConnect",
        email: "rajsahil5504@gmail.com"
      },
      to: [
        {
          email: to
        }
      ],
      subject: "DevConnect OTP Verification",
      htmlContent: `
        <div>
          <h2>OTP Verification</h2>
          <h1>${otp}</h1>
          <p>This OTP expires in 10 minutes.</p>
        </div>
      `
    });

    console.log("EMAIL SENT SUCCESSFULLY");
  } catch (error) {
    console.error("BREVO API ERROR:", error.response?.text || error.message);
    throw error;
  }
};