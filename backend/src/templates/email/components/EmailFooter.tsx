import React from "react";
import { Hr, Text } from "@react-email/components";

export const EmailFooter = () => {
  return (
    <>
      <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />
      <Text
        style={{
          fontSize: "12px",
          lineHeight: "18px",
          color: "#6b7280",
          margin: 0,
        }}
      >
        Community Help
      </Text>
      <Text
        style={{
          fontSize: "12px",
          lineHeight: "18px",
          color: "#6b7280",
          margin: "6px 0 0",
        }}
      >
        This is a transactional email related to your account activity.
      </Text>
    </>
  );
};
