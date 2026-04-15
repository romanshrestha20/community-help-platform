const formatExpiry = (expiresAt: Date) => {
  return expiresAt.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export const buildVerifyEmailMessage = ({
  verifyUrl,
  expiresAt,
}: {
  verifyUrl: string;
  expiresAt: Date;
}) => {
  const expiryText = formatExpiry(expiresAt);

  return {
    subject: "Verify your email address",
    text: [
      "Welcome to Community Help.",
      `Open this link to verify your email address: ${verifyUrl}`,
      `This link expires at ${expiryText}.`,
      "If you did not create this account, you can ignore this email.",
    ].join("\n\n"),
  };
};
