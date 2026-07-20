import 'dotenv/config';
import nodemailer from 'nodemailer';

async function testEmail() {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log("Testing with User:", process.env.EMAIL_USER);
    console.log("Password set:", !!process.env.EMAIL_PASS);

    const info = await transporter.sendMail({
      from: `"Bodim Support" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "Test Email from Backend",
      text: "If you get this, Nodemailer is working!"
    });

    console.log("Success! Email sent. Info:", info.messageId);
  } catch (error) {
    console.error("FAILED TO SEND EMAIL:");
    console.error(error);
  }
}

testEmail();
