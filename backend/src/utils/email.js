import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 587,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

export const sendVerificationEmail = async (to, code) => {
  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to,
    subject: 'ClashCode — Verify your email',
    text:    `Your verification code is: ${code}\n\nExpires in 24 hours.`,
    html:    `<h2>Your verification code</h2><h1 style="letter-spacing:8px">${code}</h1>`,
  });
};

export const sendForgotEmail = async (to, code) => {
  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to,
    subject: 'ClashCode — Password reset code',
    text:    `Your password reset code is: ${code}\n\nExpires in 15 minutes.`,
    html:    `<h2>Password reset code</h2><h1 style="letter-spacing:8px">${code}</h1>`,
  });
};

export const sendResendEmail = sendVerificationEmail;
