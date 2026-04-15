import { buildResetPasswordEmail } from "../templates/reset-password.template.js";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

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
  const deliveryMode = process.env.EMAIL_DELIVERY_MODE?.trim().toLowerCase() || "log";

  if (deliveryMode === "log") {
    console.info("[email] delivering email via log transport", {
      to,
      subject,
      text,
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
