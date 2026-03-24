import React from "react";
import { View, StyleSheet } from "react-native";

import { AppInput } from "@/components/ui/AppInput";

type ProfileTextFieldProps = {
  label: string;
  value?: string;
  onChangeText: (value: string) => void;
};

export const ProfileTextField = ({ label, value, onChangeText }: ProfileTextFieldProps) => {
  return (
    <View style={styles.container}>
      <AppInput
        label={label}
        value={value ?? ""}
        onChangeText={onChangeText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
});
