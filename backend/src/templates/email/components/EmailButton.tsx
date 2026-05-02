import React from "react";
import { Button } from "@react-email/components";

export const EmailButton = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: "#0f766e",
        color: "#ffffff",
        borderRadius: "8px",
        padding: "12px 20px",
        fontSize: "15px",
        fontWeight: "700",
        textDecoration: "none",
      }}
    >
      {children}
    </Button>
  );
};
