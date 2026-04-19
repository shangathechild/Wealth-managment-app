const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS, // App Password
  },
});

async function sendOTP(email, otp) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Your InvestFlow Verification Code',
    text: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
    html: `<div style="font-family: sans-serif; padding: 20px; background: #f8f9fa;">
            <h2 style="color: #111;">Verify your login</h2>
            <p style="color: #666;">Use the code below to complete your authentication:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #10b981; margin: 20px 0;">${otp}</div>
            <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
           </div>`,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendOTP };
