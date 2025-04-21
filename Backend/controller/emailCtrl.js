const nodemailer = require("nodemailer");
const asyncHandler = require("express-async-handler");

const sendEmail = asyncHandler(async (data, req, res) => {
  const EMAIL = process.env.NODEMAILER_EMAIL;
  const PASSWORD = process.env.NODEMAILER_PASSWORD;

  if (!EMAIL || !PASSWORD) {
    console.error("Missing email credentials in environment variables");
    throw new Error("Email service not configured properly");
  }

  try {
    // Create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: EMAIL,
        pass: PASSWORD,
      },
    });

    // Send mail with defined transport object
    let info = await transporter.sendMail({
      from: `"Cart's Corner 👻" <${EMAIL}>`, // sender address
      to: data.to, // list of receivers
      subject: data.subject, // Subject line
      text: data.text, // plain text body
      html: data.html || data.htm, // html body, support both html and htm properties
    });

    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error("Failed to send email: " + error.message);
  }
});

module.exports = sendEmail;
