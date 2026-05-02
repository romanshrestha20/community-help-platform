import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
} from "@react-email/components";

import { EmailFooter } from "./EmailFooter.js";

export const EmailLayout = ({
  preview,
  title,
  children,
}: {
  preview: string;
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#f8fafc",
          fontFamily: "Arial, sans-serif",
          padding: "24px 12px",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            maxWidth: "560px",
            padding: "24px",
          }}
        >
          <Section>
            <Heading
              as="h1"
              style={{
                fontSize: "22px",
                lineHeight: "30px",
                color: "#0f172a",
                margin: "0 0 16px",
              }}
            >
              {title}
            </Heading>
          </Section>

          {children}

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
};
