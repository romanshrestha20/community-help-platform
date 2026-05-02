import { ReactElement } from "react";

export type EmailTemplateResult = {
  subject: string;
  preview: string;
  text: string;
  html: string;
};

export type EmailTemplatePayload = {
  subject: string;
  preview: string;
  react: ReactElement;
};
