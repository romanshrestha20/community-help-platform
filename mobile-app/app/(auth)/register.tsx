import React, { useState } from "react";
import { Text, StyleSheet } from "react-native";
import { useAuth } from "@/features/auth/hooks/auth.hook";
import { useRouter } from "expo-router";

import { Card, Stack, theme } from "@/design-system";
import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { AppInput } from "@/components/ui/AppInput";
import { FormContainer } from "@/components/ui/FormContainer";

export default function RegisterScreen() {
  const router = useRouter();
  const { handleRegister, loadingRegister, error } = useAuth();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const onRegister = async () => {
    setValidationError(null);

    if (!email || !phone || !password || !fullName || !dateOfBirth || !latitude || !longitude) {
      setValidationError("Please fill all required fields.");
      return;
    }

    if (!["MALE", "FEMALE", "OTHER"].includes(gender)) {
      setValidationError("Gender must be MALE, FEMALE, or OTHER.");
      return;
    }

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (Number.isNaN(parsedLatitude) || Number.isNaN(parsedLongitude)) {
      setValidationError("Latitude and longitude must be valid numbers.");
      return;
    }

    const result = await handleRegister({
      email,
      phone,
      password,
      fullName,
      address,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      gender,
      dateOfBirth,
    });

    if (result.success) {
      router.replace("/home");
    }
  };

  return (
    <FormContainer>
      <Card>
        <AppHeader title="Register" subtitle="Create your account" />

        <Stack>
          <AppInput label="Email" placeholder="name@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <AppInput label="Phone" placeholder="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <AppInput label="Password" placeholder="Choose password" value={password} onChangeText={setPassword} secureTextEntry />
          <AppInput label="Full Name" placeholder="Your full name" value={fullName} onChangeText={setFullName} />
          <AppInput label="Address" placeholder="Street address" value={address} onChangeText={setAddress} />
          <AppInput label="Date of Birth" placeholder="YYYY-MM-DD" value={dateOfBirth} onChangeText={setDateOfBirth} />
          <AppInput
            label="Gender"
            placeholder="MALE/FEMALE/OTHER"
            value={gender}
            onChangeText={(value) => setGender(value.toUpperCase() as "MALE" | "FEMALE" | "OTHER")}
            autoCapitalize="characters"
          />
          <AppInput label="Latitude" placeholder="27.7172" value={latitude} onChangeText={setLatitude} keyboardType="decimal-pad" />
          <AppInput label="Longitude" placeholder="85.3240" value={longitude} onChangeText={setLongitude} keyboardType="decimal-pad" />

          {validationError && <Text style={styles.error}>{validationError}</Text>}
          {error && <Text style={styles.error}>{error}</Text>}

          <AppButton
            title={loadingRegister ? "Registering..." : "Register"}
            onPress={onRegister}
            loading={loadingRegister}
            disabled={loadingRegister}
          />

          <Text style={styles.link} onPress={() => router.push("/login")}>Already have an account? Login</Text>
        </Stack>
      </Card>
    </FormContainer>
  );
}

const styles = StyleSheet.create({
  error: {
    color: theme.colors.danger,
    fontSize: theme.typography.fontSize.sm,
  },
  link: {
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
    textAlign: "center",
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
});