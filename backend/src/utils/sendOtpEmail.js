import https from "https";

const sendOtpEmail = async (userEmail, name, otp) => {
  const postData = JSON.stringify({
    service_id: process.env.EMAILJS_SERVICE_ID,
    template_id: process.env.EMAILJS_TEMPLATE_ID,
    user_id: process.env.EMAILJS_PUBLIC_KEY,   // IMPORTANT exact name
    accessToken: process.env.EMAILJS_PRIVATE_KEY, // IMPORTANT exact name
    template_params: {
      to_email: userEmail,
      to_name: name || "User",
      otp: otp
    }
  });

  const options = {
    hostname: "api.emailjs.com",
    path: "/api/v1.0/email/send",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", chunk => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log("OTP sent successfully");
          resolve(data);
        } else {
          console.error("EmailJS Error:", data);
          reject(new Error(data));
        }
      });
    });

    req.on("error", reject);

    req.write(postData);
    req.end();
  });
};

export default sendOtpEmail;
