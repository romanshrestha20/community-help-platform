import React from "react";
import { Text } from "@react-email/components";

export const EmailText = ({ children }: { children: React.ReactNode }) => {
  return (
    <Text
      style={{
        fontSize: "15px",
        lineHeight: "24px",
        color: "#1f2937",
        margin: "0 0 16px",
      }}
    >
      {children}
    </Text>
  );
};
