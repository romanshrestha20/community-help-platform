import React from "react";
import { StyleSheet } from "react-native";

import { Screen } from "@/design-system";

export const FormContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Screen centered contentContainerStyle={styles.container}>
      {children}
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
});