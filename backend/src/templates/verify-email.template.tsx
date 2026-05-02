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

export const buildVerifyEmailMessage = ({
  verifyUrl,
  expiresAt,
}: {
  verifyUrl: string;
  expiresAt: Date;
}) => {
  const subject = "Verify your email address";
  const preview = "Confirm your email to secure and activate your Community Help account.";
  const expiryText = formatExpiry(expiresAt);

  return renderEmailTemplate({
    subject,
    preview,
    react: (
      <EmailLayout preview={preview} title="Verify your email">
        <EmailText>Welcome to Community Help.</EmailText>
        <EmailText>Confirm your email address to continue using your account.</EmailText>

        <Section style={{ margin: "0 0 16px" }}>
          <EmailButton href={verifyUrl}>Verify email</EmailButton>
        </Section>

        <EmailText>
          If the button does not work, copy and paste this link into your browser:
          <br />
          {verifyUrl}
        </EmailText>

        <EmailText>This link expires at {expiryText}.</EmailText>
        <EmailText>If you did not create this account, you can ignore this email.</EmailText>
      </EmailLayout>
    ),
  });
};
