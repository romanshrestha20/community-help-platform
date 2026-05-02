import { buildResetPasswordEmail } from "../templates/reset-password.template.js";
import { buildVerifyEmailMessage } from "../templates/verify-email.template.js";
import {
  buildAccountDeletedEmail,
  buildBidDecisionEmail,
  buildBidReceivedEmail,
  buildCertificationReviewedEmail,
  buildPasswordAddedEmail,
  buildPasswordChangedEmail,
  buildRequestCompletedEmail,
  buildReviewReminderEmail,
  buildSuspiciousLoginEmail,
} from "../templates/transactional-email.template.js";
import { NotificationType } from "../../generated/prisma/client.js";
import {
  getNotificationPreferencesForUser,
  isNotificationTypeEnabled,
} from "./notification-preference.service.js";

import {
  buildApiUrl,
  buildPublicUrl,
  sendEmail,
  sendEmailSafely,
} from "./email.service.js";

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
        preview: message.preview,
        text: message.text,
        html: message.html,
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
    const verifyUrl =
        buildApiUrl("auth/verify-email", { token }) ??
        buildPublicUrl("verify-email", { token });
    const message = buildVerifyEmailMessage({ verifyUrl, expiresAt });

    await sendEmail({
        to: email,
        subject: message.subject,
        preview: message.preview,
        text: message.text,
        html: message.html,
    });
};

const shouldSendNotificationEmail = async (
  userId: string,
  type: NotificationType
) => {
  try {
    const preferences = await getNotificationPreferencesForUser(userId);
    return isNotificationTypeEnabled(type, preferences);
  } catch (error) {
    console.warn("[email] Failed to read notification preferences, defaulting to send.", {
      userId,
      type,
      error,
    });
    return true;
  }
};

export const sendPasswordChangedSecurityEmail = async ({
  email,
  ipAddress,
}: {
  email: string;
  ipAddress?: string;
}) => {
  const message = buildPasswordChangedEmail({
    occurredAt: new Date(),
    ipAddress,
  });

  await sendEmailSafely({
    to: email,
    subject: message.subject,
    preview: message.preview,
    text: message.text,
    html: message.html,
  }, { type: "security.password_changed" });
};

export const sendPasswordAddedSecurityEmail = async ({
  email,
  ipAddress,
}: {
  email: string;
  ipAddress?: string;
}) => {
  const message = buildPasswordAddedEmail({
    occurredAt: new Date(),
    ipAddress,
  });

  await sendEmailSafely({
    to: email,
    subject: message.subject,
    preview: message.preview,
    text: message.text,
    html: message.html,
  }, { type: "security.password_added" });
};

export const sendSuspiciousLoginSecurityEmail = async ({
  email,
  ipAddress,
  previousIp,
}: {
  email: string;
  ipAddress: string;
  previousIp?: string | null;
}) => {
  const message = buildSuspiciousLoginEmail({
    occurredAt: new Date(),
    ipAddress,
    previousIp,
  });

  await sendEmailSafely({
    to: email,
    subject: message.subject,
    preview: message.preview,
    text: message.text,
    html: message.html,
  }, { type: "security.suspicious_login" });
};

export const sendAccountDeletedSecurityEmail = async ({
  email,
}: {
  email: string;
}) => {
  const message = buildAccountDeletedEmail({
    occurredAt: new Date(),
  });

  await sendEmailSafely({
    to: email,
    subject: message.subject,
    preview: message.preview,
    text: message.text,
    html: message.html,
  }, { type: "security.account_deleted" });
};

export const sendBidPlacedEmailToRequester = async ({
  requesterUserId,
  requesterEmail,
  requestTitle,
  helperName,
  amount,
}: {
  requesterUserId: string;
  requesterEmail: string;
  requestTitle: string;
  helperName: string;
  amount: number;
}) => {
  if (!(await shouldSendNotificationEmail(requesterUserId, "BID_RECEIVED"))) {
    return;
  }

  const message = buildBidReceivedEmail({
    requestTitle,
    helperName,
    amount,
  });

  await sendEmailSafely({
    to: requesterEmail,
    subject: message.subject,
    preview: message.preview,
    text: message.text,
    html: message.html,
  }, { type: "marketplace.bid_received", requesterUserId });
};

export const sendBidDecisionEmailToHelper = async ({
  helperUserId,
  helperEmail,
  requestTitle,
  amount,
  accepted,
}: {
  helperUserId: string;
  helperEmail: string;
  requestTitle: string;
  amount: number;
  accepted: boolean;
}) => {
  if (
    !(await shouldSendNotificationEmail(
      helperUserId,
      accepted ? "BID_ACCEPTED" : "BID_REJECTED"
    ))
  ) {
    return;
  }

  const message = buildBidDecisionEmail({
    requestTitle,
    amount,
    accepted,
  });

  await sendEmailSafely({
    to: helperEmail,
    subject: message.subject,
    preview: message.preview,
    text: message.text,
    html: message.html,
  }, {
    type: accepted ? "marketplace.bid_accepted" : "marketplace.bid_rejected",
    helperUserId,
  });
};

export const sendRequestCompletedAndReviewReminderEmails = async ({
  helperUserId,
  helperEmail,
  requesterUserId,
  requesterEmail,
  requestTitle,
}: {
  helperUserId: string;
  helperEmail: string;
  requesterUserId: string;
  requesterEmail: string;
  requestTitle: string;
}) => {
  const [sendToHelper, sendToRequester] = await Promise.all([
    shouldSendNotificationEmail(helperUserId, "REQUEST_COMPLETED"),
    shouldSendNotificationEmail(requesterUserId, "REVIEW_RECEIVED"),
  ]);

  if (sendToHelper) {
    const completionMessage = buildRequestCompletedEmail({ requestTitle });
    await sendEmailSafely({
      to: helperEmail,
      subject: completionMessage.subject,
      preview: completionMessage.preview,
      text: completionMessage.text,
      html: completionMessage.html,
    }, { type: "trust.request_completed", helperUserId });
  }

  if (sendToRequester) {
    const reviewMessage = buildReviewReminderEmail({ requestTitle });
    await sendEmailSafely({
      to: requesterEmail,
      subject: reviewMessage.subject,
      preview: reviewMessage.preview,
      text: reviewMessage.text,
      html: reviewMessage.html,
    }, { type: "trust.review_reminder", requesterUserId });
  }
};

export const sendCertificationReviewedEmail = async ({
  userId,
  userEmail,
  certificationName,
  approved,
  rejectionReason,
  reviewNote,
}: {
  userId: string;
  userEmail: string;
  certificationName: string;
  approved: boolean;
  rejectionReason?: string | null;
  reviewNote?: string | null;
}) => {
  if (!(await shouldSendNotificationEmail(userId, "REVIEW_RECEIVED"))) {
    return;
  }

  const message = buildCertificationReviewedEmail({
    certificationName,
    approved,
    rejectionReason,
    reviewNote,
  });

  await sendEmailSafely({
    to: userEmail,
    subject: message.subject,
    preview: message.preview,
    text: message.text,
    html: message.html,
  }, {
    type: approved
      ? "trust.certification_approved"
      : "trust.certification_rejected",
    userId,
  });
};
