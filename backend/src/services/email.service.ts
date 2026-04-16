import nodemailer from "nodemailer";

import { buildResetPasswordEmail } from "../templates/reset-password.template.js";
import { buildVerifyEmailMessage } from "../templates/verify-email.template.js";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

type EmailConfigStatus = {
  mode: string;
  configured: boolean;
  missing: string[];
};

const trimEnv = (value?: string) => value?.trim() || "";

const getEmailDeliveryMode = () => {
  return trimEnv(process.env.EMAIL_DELIVERY_MODE).toLowerCase() || "log";
};

const getEmailProviderConfig = () => {
  const host = trimEnv(process.env.EMAIL_HOST);
  const port = trimEnv(process.env.EMAIL_PORT);
  const user = trimEnv(process.env.EMAIL_USER);
  const pass = trimEnv(process.env.EMAIL_PASS);
  const from = trimEnv(process.env.EMAIL_FROM) || user;

  return {
    host,
    port,
    user,
    pass,
    from,
  };
};

const getMissingRequiredEmailEnv = () => {
  const mode = getEmailDeliveryMode();

  if (mode !== "nodemailer") {
    return [];
  }

  const config = getEmailProviderConfig();
  const missing: string[] = [];

  if (!config.host) missing.push("EMAIL_HOST");
  if (!config.port) missing.push("EMAIL_PORT");
  if (!config.user) missing.push("EMAIL_USER");
  if (!config.pass) missing.push("EMAIL_PASS");
  if (!config.from) missing.push("EMAIL_FROM");

  return missing;
};

const createTransporter = () => {
  const config = getEmailProviderConfig();
  const missing = getMissingRequiredEmailEnv();

  if (missing.length > 0) {
    throw new Error(
      `EMAIL_DELIVERY_MODE=nodemailer requires: ${missing.join(", ")}`
    );
  }

  return nodemailer.createTransport({
    host: config.host,
    port: Number(config.port),
    secure: Number(config.port) === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
};

export const getEmailServiceStatus = (): EmailConfigStatus => {
  const mode = getEmailDeliveryMode();

  if (mode === "log") {
    return {
      mode,
      configured: true,
      missing: [],
    };
  }

  if (mode === "nodemailer") {
    const missing = getMissingRequiredEmailEnv();
    return {
      mode,
      configured: missing.length === 0,
      missing,
    };
  }

  return {
    mode,
    configured: false,
    missing: ["EMAIL_DELIVERY_MODE"],
  };
};

const getClientBaseUrl = () => {
  return (
    trimEnv(process.env.MOBILE_DEEP_LINK_BASE_URL) ||
    trimEnv(process.env.PUBLIC_APP_URL) ||
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

  const deliveryMode = getEmailDeliveryMode();

  if (deliveryMode === "log") {
    console.info("[email] delivering email via log transport", {
      to,
      subject,
      text,
    });
    return;
  }

  if (deliveryMode === "nodemailer") {
    const transporter = createTransporter();
    const { from } = getEmailProviderConfig();

    await transporter.sendMail({
      from: `"Community Help" <${from}>`,
      to,
      subject,
      text,
      html: `<p>${text.replace(/\n/g, "<br />")}</p>`,
    });

    return;
  }

  throw new Error(
    `Unsupported EMAIL_DELIVERY_MODE: ${deliveryMode}. Use "log" or "nodemailer".`
  );
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
