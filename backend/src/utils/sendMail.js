import nodemailer from "nodemailer";
import { google } from "googleapis";
import config from "../config/config.js";

const oAuth2Client = new google.auth.OAuth2(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oAuth2Client.setCredentials({
  refresh_token: config.GOOGLE_REFRESH_TOKEN,
});

export const sendEmail = async (to, subject, text) => {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: config.GOOGLE_USER,
        clientId: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        refreshToken: config.GOOGLE_REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    await transporter.sendMail({
      from: `DevConnect <${config.GOOGLE_USER}>`,
      to,
      subject,
      text,
    });

    console.log("Email sent ");
  } catch (error) {
    console.log("Email error ", error.message);
  }
};