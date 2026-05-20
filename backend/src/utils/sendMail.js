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

    const result = await apiInstance.sendTransacEmail({
      sender: {
        email: "rajsahil5504@gmail.com",
        name: "DevConnect"
      },
      to: [
        {
          email: to
        }
      ],
      subject: subject,
      htmlContent: otp 
        ? `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #333;">Your OTP Verification Code</h2>
            <h1 style="font-size: 36px; letter-spacing: 4px; color: #6c63ff; margin: 20px 0; font-weight: bold;">${otp}</h1>
            <p style="color: #666; font-size: 14px;">Expires in 10 minutes</p>
          </div>
        `
        : `<p>${text}</p>`,
    });

    console.log("Email sent via Brevo API:", result.messageId || JSON.stringify(result));
  } catch (error) {
    console.error("BREVO API ERROR:", error.message || error);
    throw error;
  }
};