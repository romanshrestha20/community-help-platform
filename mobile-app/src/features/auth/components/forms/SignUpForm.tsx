import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react-native";

import {
  SignUpFormValues,
  signUpFormSchema,
} from "@/features/auth/schemas/sign-up-form.schema";

type SignUpFormProps = {
  onSubmit: (values: SignUpFormValues) => Promise<void> | void;
  loading?: boolean;
};

export const SignUpForm = ({ onSubmit, loading = false }: SignUpFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const submitting = loading || isSubmitting;

  const submitForm: SubmitHandler<SignUpFormValues> = async (values) => {
    await onSubmit(values);
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
    >
      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                style={[
                  styles.input,
                  errors.email ? styles.inputError : undefined,
                ]}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email.message}</Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.passwordContainer,
                  errors.password ? styles.inputError : undefined,
                ]}
              >
                <TextInput
                  ref={passwordRef}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="At least 8 characters"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  style={styles.passwordInput}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                />
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.iconButton}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} color="#64748b" /> : <Eye size={18} color="#64748b" />}
                </Pressable>
              </View>
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password.message}</Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Confirm Password</Text>
              <View
                style={[
                  styles.passwordContainer,
                  errors.confirmPassword ? styles.inputError : undefined,
                ]}
              >
                <TextInput
                  ref={confirmPasswordRef}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Repeat password"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  style={styles.passwordInput}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(submitForm)}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  style={styles.iconButton}
                  accessibilityRole="button"
                  accessibilityLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} color="#64748b" /> : <Eye size={18} color="#64748b" />}
                </Pressable>
              </View>
              {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
              ) : null}
            </View>
          )}
        />

        <Pressable
          onPress={handleSubmit(submitForm)}
          style={[styles.submitButton, submitting ? styles.submitButtonDisabled : undefined]}
          disabled={submitting}
          accessibilityRole="button"
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitText}>Create Account</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  form: {
    gap: 14,
  },
  fieldWrap: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  passwordContainer: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingLeft: 12,
    paddingRight: 6,
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: "#ffffff",
  },
  passwordInput: {
    flex: 1,
    height: 46,
    fontSize: 16,
    color: "#0f172a",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  inputError: {
    borderColor: "#dc2626",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "500",
  },
  submitButton: {
    marginTop: 4,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
