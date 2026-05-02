import React from "react";
import { Section } from "@react-email/components";

import { renderEmailTemplate } from "./email/render-template.js";
import { EmailButton } from "./email/components/EmailButton.js";
import { EmailLayout } from "./email/components/EmailLayout.js";
import { EmailText } from "./email/components/EmailText.js";

const formatExpiry = (expiresAt: Date) =>
  expiresAt.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export const buildResetPasswordEmail = ({
  resetUrl,
  expiresAt,
}: {
  resetUrl: string;
  expiresAt: Date;
}) => {
  const subject = "Reset your password";
  const preview = "Use this secure link to reset your Community Help password.";
  const expiryText = formatExpiry(expiresAt);

  return renderEmailTemplate({
    subject,
    preview,
    react: (
      <EmailLayout preview={preview} title="Reset your password">
        <EmailText>We received a request to reset your password.</EmailText>

        <Section style={{ margin: "0 0 16px" }}>
          <EmailButton href={resetUrl}>Reset password</EmailButton>
        </Section>

        <EmailText>
          If the button does not work, copy and paste this link into your browser:
          <br />
          {resetUrl}
        </EmailText>

        <EmailText>This link expires at {expiryText}.</EmailText>
        <EmailText>If you did not request this, you can ignore this email.</EmailText>
      </EmailLayout>
    ),
  });
};
