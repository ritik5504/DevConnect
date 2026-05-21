import https from "https";

const sendOtpEmail = async (userEmail, name, otp) => {
  const postData = JSON.stringify({
    service_id: process.env.EMAILJS_SERVICE_ID,
    template_id: process.env.EMAILJS_TEMPLATE_ID,
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY,
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
          console.log("OTP email sent successfully");
          resolve(data);
        } else {
          console.error("EmailJS Error:", data);
          reject(new Error(data));
        }
      });
    });

    req.on("error", (err) => reject(err));

    req.write(postData);
    req.end();
  });
};

export default sendOtpEmail;
