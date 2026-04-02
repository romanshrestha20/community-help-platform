import React, { useEffect, useState } from "react";
import { Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { useAuth } from "@/features/auth/hooks/auth.hook";
import { Card, Stack, theme } from "@/design-system";
import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { AppInput } from "@/components/ui/AppInput";
import { FormContainer } from "@/components/ui/FormContainer";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";
import LocationPickerField from "@/features/location/components/LocationPickerField";
import { LocationSuggestion } from "@/features/location/types/location.types";
import { useDebounce } from "@/hooks/useDebounce";

export default function RegisterScreen() {
  const router = useRouter();
  const { handleRegister, loadingRegister, error } = useAuth();
  const { palette } = useThemeContext();

  const locationPicker = useLocationPicker();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const [streetQuery, setStreetQuery] = useState("");
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);

  const debouncedStreetQuery = useDebounce(streetQuery, 350);

  useEffect(() => {
    let cancelled = false;

    const fetchSuggestions = async () => {
      const query = debouncedStreetQuery.trim();

      if (query.length < 2) {
        setSuggestions([]);
        setSuggestionsLoading(false);
        return;
      }

      try {
        setSuggestionsLoading(true);

        const response = await fetch(
          `http://localhost:5001/api/locations/search?q=${encodeURIComponent(query)}`
        );
        const json = await response.json();

        if (!cancelled) {
          setSuggestions(Array.isArray(json.data) ? json.data : []);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setSuggestionsLoading(false);
        }
      }
    };

    fetchSuggestions();

    return () => {
      cancelled = true;
    };
  }, [debouncedStreetQuery]);

  const handleSelectSuggestion = async (suggestion: LocationSuggestion) => {
    const shortAddress = [suggestion.addressLine1, suggestion.postalCode, suggestion.city]
      .filter(Boolean)
      .join(", ");

    setStreetQuery(shortAddress);
    setSuggestions([]);

    locationPicker.setValue({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      addressLine1: suggestion.addressLine1,
      addressLine2: null,
      city: suggestion.city,
      state: suggestion.state,
      postalCode: suggestion.postalCode,
      country: suggestion.country,
      formattedAddress: suggestion.formattedAddress,
    });
  };

  const onRegister = async () => {
    setValidationError(null);

    if (!email || !phone || !password || !fullName || !dateOfBirth) {
      setValidationError("Please fill all required fields.");
      return;
    }

    if (!locationPicker.value) {
      setValidationError("Please select your location.");
      return;
    }

    const result = await handleRegister({
      email,
      phone,
      password,
      fullName,
      gender,
      dateOfBirth,
      location: locationPicker.value,
    });

    if (result?.success) {
      // redirect handled elsewhere
    }
  };

  return (
    <FormContainer>
      <Card>
        <AppHeader title="Register" subtitle="Create your account" />

        <Stack>
          <AppInput
            label="Email"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <AppInput
            label="Phone"
            placeholder="Phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <AppInput
            label="Password"
            placeholder="Choose password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <AppInput
            label="Full Name"
            placeholder="Your full name"
            value={fullName}
            onChangeText={setFullName}
          />

          <AppInput
            label="Date of Birth"
            placeholder="YYYY-MM-DD"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
          />

          <AppInput
            label="Gender"
            placeholder="MALE/FEMALE/OTHER"
            value={gender}
            onChangeText={(value) =>
              setGender(value.toUpperCase() as "MALE" | "FEMALE" | "OTHER")
            }
            autoCapitalize="characters"
          />

          <LocationPickerField
            value={locationPicker.value}
            loading={locationPicker.loading}
            error={locationPicker.error}
            onUseCurrentLocation={locationPicker.useCurrentLocation}
            streetQuery={streetQuery}
            onStreetQueryChange={setStreetQuery}
            suggestions={suggestions}
            suggestionsLoading={suggestionsLoading}
            onSelectSuggestion={handleSelectSuggestion}
          />

          {validationError ? (
            <Text style={[styles.error, { color: palette.danger }]}>
              {validationError}
            </Text>
          ) : null}

          {error ? (
            <Text style={[styles.error, { color: palette.danger }]}>
              {error}
            </Text>
          ) : null}

          <AppButton
            title={loadingRegister ? "Registering..." : "Register"}
            onPress={onRegister}
            loading={loadingRegister}
            disabled={loadingRegister}
          />

          <Text
            style={[styles.link, { color: palette.primary }]}
            onPress={() => router.push("/(auth)/login")}
          >
            Already have an account? Login
          </Text>
        </Stack>
      </Card>
    </FormContainer>
  );
}

const styles = StyleSheet.create({
  error: {
    fontSize: theme.typography.fontSize.sm,
  },
  link: {
    marginTop: theme.spacing.xs,
    textAlign: "center",
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
});