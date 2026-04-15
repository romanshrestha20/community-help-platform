const formatExpiry = (expiresAt: Date) => {
  return expiresAt.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export const buildResetPasswordEmail = ({
  resetUrl,
  expiresAt,
}: {
  resetUrl: string;
  expiresAt: Date;
}) => {
  const expiryText = formatExpiry(expiresAt);

  return {
    subject: "Reset your password",
    text: [
      "We received a request to reset your password.",
      `Open this link to continue: ${resetUrl}`,
      `This link expires at ${expiryText}.`,
      "If you did not request this, you can ignore this email.",
    ].join("\n\n"),
  };
};
