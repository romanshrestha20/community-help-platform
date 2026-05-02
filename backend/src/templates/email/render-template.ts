import React from "react";
import { toPlainText } from "@react-email/render";
import { renderToStaticMarkup } from "react-dom/server";

import { EmailTemplatePayload, EmailTemplateResult } from "./template.types.js";

export const renderEmailTemplate = ({
  subject,
  preview,
  react,
}: EmailTemplatePayload): EmailTemplateResult => {
  const html = `<!doctype html>${renderToStaticMarkup(react)}`;
  const text = toPlainText(html);

  return {
    subject,
    preview,
    text,
    html,
  };
};
