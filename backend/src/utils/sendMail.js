import SibApiV3Sdk from "sib-api-v3-sdk";

export const sendEmail = async (to, subject, text) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not defined in environment variables");
  }

  try {
    console.log("Sending email via Brevo Transactional API...");
    
    // Extract 6-digit OTP from text if available
    const otpMatch = text.match(/\d{6}/);
    const otp = otpMatch ? otpMatch[0] : "";

    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKeyInstance = defaultClient.authentications["api-key"];
    apiKeyInstance.apiKey = apiKey;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

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
      subject: "OTP Verification",
      htmlContent: `
        <h2>Your OTP is</h2>
        <h1>${otp}</h1>
      `
    });

    console.log("Email sent via Brevo API successfully.");
  } catch (error) {
    console.error("BREVO API ERROR:", error.message || error);
    throw error;
  }
};