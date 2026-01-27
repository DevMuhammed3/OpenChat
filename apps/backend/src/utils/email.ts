import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOTPEmail(email: string, code: string) {
  await transporter.sendMail({
    from: `"OpenChat" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OpenChat verification code",
    html: `
      <h2>OpenChat 🔐</h2>
      <p>Your verification code:</p>
      <h1>${code}</h1>
      <p>This code expires in 10 minutes.</p>
    `,
  });
}

