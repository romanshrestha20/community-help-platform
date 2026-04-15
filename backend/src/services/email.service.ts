import nodemailer from "nodemailer";

import { buildResetPasswordEmail } from "../templates/reset-password.template.js";
import { buildVerifyEmailMessage } from "../templates/verify-email.template.js";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

const gmailUser = process.env.GMAIL_USER?.trim() || "";
const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim() || "";

// Create transporter once
const transporter = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS
  ? nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
  : null;

  
const getClientBaseUrl = () => {
  return (
    process.env.MOBILE_DEEP_LINK_BASE_URL?.trim() ||
    process.env.PUBLIC_APP_URL?.trim() ||
    "communityhelp://"
  );
};

const buildPublicUrl = (path: string, params: Record<string, string>) => {
  const baseUrl = getClientBaseUrl().replace(/\/+$/, "");
  const pathname = path.replace(/^\/+/, "");
  const query = new URLSearchParams(params).toString();

  if (baseUrl.endsWith("://")) {
    return `${baseUrl}${pathname}${query ? `?${query}` : ""}`;
  }

  return `${baseUrl}/${pathname}${query ? `?${query}` : ""}`;
};

export const sendEmail = async ({ to, subject, text }: SendEmailInput) => {
  if (!to || !subject || !text) {
    throw new Error("Missing required parameters for sending email");
  }

  const deliveryMode =
    process.env.EMAIL_DELIVERY_MODE?.trim().toLowerCase() || "log";

  if (deliveryMode === "log") {
    console.info("[email] delivering email via log transport", {
      to,
      subject,
      text,
    });
    return;
  }

  if (deliveryMode === "nodemailer") {
    if (!transporter) {
      throw new Error("Nodemailer transporter not configured");
    }

    await transporter.sendMail({
      from: `"Community Help" <${gmailUser}>`,
      to,
      subject,
      text,
      html: `<p>${text}</p>`, // optional but nice
    });

    return;
  }

  throw new Error(`Unsupported EMAIL_DELIVERY_MODE: ${deliveryMode}`);
};

export const sendPasswordResetEmail = async ({
  email,
  token,
  expiresAt,
}: {
  email: string;
  token: string;
  expiresAt: Date;
}) => {
  const resetUrl = buildPublicUrl("reset-password", { token });
  const message = buildResetPasswordEmail({ resetUrl, expiresAt });

  await sendEmail({
    to: email,
    subject: message.subject,
    text: message.text,
  });
};

export const sendEmailVerificationEmail = async ({
  email,
  token,
  expiresAt,
}: {
  email: string;
  token: string;
  expiresAt: Date;
}) => {
  const verifyUrl = buildPublicUrl("verify-email", { token });
  const message = buildVerifyEmailMessage({ verifyUrl, expiresAt });

  await sendEmail({
    to: email,
    subject: message.subject,
    text: message.text,
  });
};