import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/features/auth/auth.store";
import { useEffect } from "react";
import { logoutUser } from "@/features/auth/auth.service";

export default function Home() {
  const router = useRouter();
  const {token} = useAuthStore();
 useEffect(() => {
    if (!token) router.replace("/login");  // Redirect if not authenticated
  }, [token, router]);
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Welcome Home!</Text>
<Button title="Logout" onPress={() => logoutUser().then(() => router.replace("/login"))} />
    </View>
  );
}