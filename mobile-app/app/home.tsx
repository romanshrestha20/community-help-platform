import { Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { logoutUser } from "@/features/auth/service/auth.service";

import { Card, Screen, Stack, theme } from "@/design-system";
import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";

export default function Home() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  // Mark component as mounted
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (isMounted && !token) {
      router.replace("/login"); // Safe redirect after mount
    }
  }, [token, router, isMounted]);

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/login");
  };

  const goToProfile = () => {
    router.push("/profile");
  };

  if (!token) return null; // Prevent rendering while redirecting

  return (
    <Screen>
      <Card style={styles.card}>
        <AppHeader title="Welcome Home" subtitle="Community Help Platform" />
        <Text style={styles.body}>You are logged in and ready to manage your account.</Text>

        <Stack gap="sm">
          <AppButton title="Go to Profile" onPress={goToProfile} />
          <AppButton title="Logout" onPress={handleLogout} variant="danger" />
        </Stack>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: theme.spacing.lg,
  },
  body: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    marginBottom: theme.spacing.md,
  },
});