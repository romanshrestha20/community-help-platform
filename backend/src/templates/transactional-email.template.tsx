import React from "react";

import { EmailLayout } from "./email/components/EmailLayout.js";
import { EmailText } from "./email/components/EmailText.js";
import { renderEmailTemplate } from "./email/render-template.js";

const formatDateTime = (value: Date) =>
  value.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export const buildPasswordChangedEmail = ({
  occurredAt,
  ipAddress,
}: {
  occurredAt: Date;
  ipAddress?: string;
}) => {
  const subject = "Your password was changed";
  const preview = "Security alert: your Community Help password was changed.";

  return renderEmailTemplate({
    subject,
    preview,
    react: (
      <EmailLayout preview={preview} title="Password changed">
        <EmailText>Your Community Help password was changed.</EmailText>
        <EmailText>Time: {formatDateTime(occurredAt)}</EmailText>
        <EmailText>IP: {ipAddress || "unavailable"}</EmailText>
        <EmailText>If this was not you, reset your password immediately.</EmailText>
      </EmailLayout>
    ),
  });
};

export const buildPasswordAddedEmail = ({
  occurredAt,
  ipAddress,
}: {
  occurredAt: Date;
  ipAddress?: string;
}) => {
  const subject = "Password added to your account";
  const preview = "Security alert: a password was added to your Community Help account.";

  return renderEmailTemplate({
    subject,
    preview,
    react: (
      <EmailLayout preview={preview} title="Password added">
        <EmailText>A new password was added to your Community Help account.</EmailText>
        <EmailText>Time: {formatDateTime(occurredAt)}</EmailText>
        <EmailText>IP: {ipAddress || "unavailable"}</EmailText>
        <EmailText>If this was not you, secure your account immediately.</EmailText>
      </EmailLayout>
    ),
  });
};

export const buildSuspiciousLoginEmail = ({
  occurredAt,
  ipAddress,
  previousIp,
}: {
  occurredAt: Date;
  ipAddress: string;
  previousIp?: string | null;
}) => {
  const subject = "New login detected";
  const preview = "Security alert: new login detected on your Community Help account.";

  return renderEmailTemplate({
    subject,
    preview,
    react: (
      <EmailLayout preview={preview} title="New login detected">
        <EmailText>We noticed a new login to your Community Help account.</EmailText>
        <EmailText>Time: {formatDateTime(occurredAt)}</EmailText>
        <EmailText>Current IP: {ipAddress}</EmailText>
        {previousIp ? <EmailText>Previous IP: {previousIp}</EmailText> : null}
        <EmailText>If this was not you, change your password right away.</EmailText>
      </EmailLayout>
    ),
  });
};

export const buildAccountDeletedEmail = ({ occurredAt }: { occurredAt: Date }) => {
  const subject = "Your account was deleted";
  const preview = "Your Community Help account has been deleted.";

  return renderEmailTemplate({
    subject,
    preview,
    react: (
      <EmailLayout preview={preview} title="Account deleted">
        <EmailText>Your Community Help account has been deleted.</EmailText>
        <EmailText>Time: {formatDateTime(occurredAt)}</EmailText>
        <EmailText>If this was not expected, contact support.</EmailText>
      </EmailLayout>
    ),
  });
};

export const buildBidReceivedEmail = ({
  requestTitle,
  helperName,
  amount,
}: {
  requestTitle: string;
  helperName: string;
  amount: number;
}) => {
  const subject = "New bid on your request";
  const preview = `You received a new bid for "${requestTitle}".`;

  return renderEmailTemplate({
    subject,
    preview,
    react: (
      <EmailLayout preview={preview} title="New bid received">
        <EmailText>You received a new bid for "{requestTitle}".</EmailText>
        <EmailText>Helper: {helperName}</EmailText>
        <EmailText>Bid amount: EUR {amount}</EmailText>
      </EmailLayout>
    ),
  });
};

export const buildBidDecisionEmail = ({
  requestTitle,
  amount,
  accepted,
}: {
  requestTitle: string;
  amount: number;
  accepted: boolean;
}) => {
  const subject = accepted ? "Your bid was accepted" : "Your bid was rejected";
  const preview = accepted
    ? `Your bid for "${requestTitle}" was accepted.`
    : `Your bid for "${requestTitle}" was rejected.`;

  return renderEmailTemplate({
    subject,
    preview,
    react: (
      <EmailLayout preview={preview} title={accepted ? "Bid accepted" : "Bid rejected"}>
        <EmailText>
          {accepted
            ? `Good news. Your bid for "${requestTitle}" was accepted.`
            : `Your bid for "${requestTitle}" was not selected.`}
        </EmailText>
        <EmailText>Bid amount: EUR {amount}</EmailText>
      </EmailLayout>
    ),
  });
};

export const buildRequestCompletedEmail = ({ requestTitle }: { requestTitle: string }) => {
  const subject = "Request marked as completed";
  const preview = `The request "${requestTitle}" was marked as completed.`;

  return renderEmailTemplate({
    subject,
    preview,
    react: (
      <EmailLayout preview={preview} title="Request completed">
        <EmailText>"{requestTitle}" was marked as completed by the requester.</EmailText>
      </EmailLayout>
    ),
  });
};

export const buildReviewReminderEmail = ({ requestTitle }: { requestTitle: string }) => {
  const subject = "Leave a review";
  const preview = `Your request "${requestTitle}" is complete. Leave a quick review.`;

  return renderEmailTemplate({
    subject,
    preview,
    react: (
      <EmailLayout preview={preview} title="Review reminder">
        <EmailText>Your request "{requestTitle}" is complete.</EmailText>
        <EmailText>Please leave a quick review to help build trust in the community.</EmailText>
      </EmailLayout>
    ),
  });
};

export const buildCertificationReviewedEmail = ({
  certificationName,
  approved,
  rejectionReason,
  reviewNote,
}: {
  certificationName: string;
  approved: boolean;
  rejectionReason?: string | null;
  reviewNote?: string | null;
}) => {
  const subject = approved ? "Certification approved" : "Certification rejected";
  const preview = approved
    ? `Your certification "${certificationName}" was approved.`
    : `Your certification "${certificationName}" was rejected.`;

  return renderEmailTemplate({
    subject,
    preview,
    react: (
      <EmailLayout preview={preview} title={approved ? "Certification approved" : "Certification rejected"}>
        <EmailText>
          {approved
            ? `Your certification "${certificationName}" was approved.`
            : `Your certification "${certificationName}" was rejected.`}
        </EmailText>
        {!approved && rejectionReason ? <EmailText>Reason: {rejectionReason}</EmailText> : null}
        {reviewNote ? <EmailText>Admin note: {reviewNote}</EmailText> : null}
      </EmailLayout>
    ),
  });
};
