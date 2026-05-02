import nodemailer from "nodemailer";

export type SendEmailInput = {
  to: string;
  subject: string;
  preview?: string;
  text: string;
  html?: string;
};

type EmailConfigStatus = {
  mode: string;
  configured: boolean;
  missing: string[];
};

const trimEnv = (value?: string) => value?.trim() || "";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const textToHtml = (text: string) => {
  return `<p>${escapeHtml(text).replace(/\n/g, "<br />")}</p>`;
};

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

let cachedTransporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!cachedTransporter) {
    cachedTransporter = createTransporter();
  }

  return cachedTransporter;
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
    trimEnv(process.env.PUBLIC_APP_URL) ||
    trimEnv(process.env.MOBILE_DEEP_LINK_BASE_URL) ||
    "communityhelp://"
  );
};

const getApiBaseUrl = () => {
  return (
    trimEnv(process.env.EMAIL_VERIFICATION_API_BASE_URL) ||
    trimEnv(process.env.PUBLIC_API_URL) ||
    trimEnv(process.env.BACKEND_PUBLIC_URL)
  );
};

export const buildPublicUrl = (path: string, params: Record<string, string>) => {
  const baseUrl = getClientBaseUrl().replace(/\/+$/, "");
  const pathname = path.replace(/^\/+/, "");
  const query = new URLSearchParams(params).toString();

  if (baseUrl.endsWith("://")) {
    return `${baseUrl}${pathname}${query ? `?${query}` : ""}`;
  }

  return `${baseUrl}/${pathname}${query ? `?${query}` : ""}`;
};

export const buildApiUrl = (path: string, params: Record<string, string>) => {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return null;
  }

  const baseUrl = apiBaseUrl.replace(/\/+$/, "");
  const pathname = path.replace(/^\/+/, "");
  const query = new URLSearchParams(params).toString();

  return `${baseUrl}/${pathname}${query ? `?${query}` : ""}`;
};

export const sendEmail = async ({
  to,
  subject,
  preview,
  text,
  html,
}: SendEmailInput) => {
  if (!to || !subject || !text) {
    throw new Error("Missing required parameters for sending email");
  }

  const deliveryMode = getEmailDeliveryMode();

  if (deliveryMode === "log") {
    console.info("[email] delivering email via log transport", {
      to,
      subject,
      preview: preview ?? null,
      text,
      html,
    });
    return;
  }

  if (deliveryMode === "nodemailer") {
    const transporter = getTransporter();
    const { from } = getEmailProviderConfig();

    await transporter.sendMail({
      from: `"Community Help" <${from}>`,
      to,
      subject,
      text,
      html: html ?? textToHtml(text),
    });

    return;
  }

  throw new Error(
    `Unsupported EMAIL_DELIVERY_MODE: ${deliveryMode}. Use "log" or "nodemailer".`
  );
};

export const sendEmailSafely = async (
  input: SendEmailInput,
  context?: Record<string, unknown>
) => {
  try {
    await sendEmail(input);
  } catch (error) {
    console.error("[email] failed to send email", {
      to: input.to,
      subject: input.subject,
      context,
      error,
    });
  }
};
