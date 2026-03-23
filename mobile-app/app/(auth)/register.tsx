// src/screens/RegisterScreen.tsx
import React, { useState } from "react";
import { View, TextInput, Button, Text, StyleSheet } from "react-native";
import { useAuth } from "@/features/auth/auth.hook";
import { useRouter } from "expo-router";

export default function RegisterScreen() {
  const router = useRouter();
  const { handleRegister, loadingRegister, error } = useAuth();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number>(0);
  const [longitude, setLongitude] = useState<number>(0);
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
const [dateOfBirth, setDateOfBirth] = useState(""); // store as string and convert to ISO if needed

  const [password, setPassword] = useState("");
  const onRegister = async () => {
    const result = await handleRegister({ email, phone, password,
        fullName, 
        address,
        latitude,
        longitude,
        gender,
        dateOfBirth
    });

    if (!email || !phone || !password || !fullName) {

  return;
}
    if (result.success) {
      router.replace("/home");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        placeholder="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <TextInput
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
        style={styles.input}
      />
      <TextInput
        placeholder="Address"
        value={address}
        onChangeText={setAddress}
        style={styles.input}
      />
      <TextInput
  placeholder="Date of Birth (YYYY-MM-DD)"
  value={dateOfBirth}
  onChangeText={setDateOfBirth}
  style={styles.input}
/>

<TextInput
  placeholder="Gender (MALE/FEMALE/OTHER)"
  value={gender}
  onChangeText={(v) => setGender(v as "MALE" | "FEMALE" | "OTHER")}
  style={styles.input}
/>
     <TextInput
  placeholder="Latitude"
  value={latitude.toString()}
  onChangeText={(text) => setLatitude(Number(text))}
  keyboardType="decimal-pad"
  style={styles.input}
/>

<TextInput
  placeholder="Longitude"
  value={longitude.toString()}
  onChangeText={(text) => setLongitude(Number(text))}
  keyboardType="decimal-pad"
  style={styles.input}
/>
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title={loadingRegister ? "Registering..." : "Register"} onPress={onRegister} />
      <Text
        style={styles.link}
        onPress={() => router.push("/login")}
      >
        Already have an account? Login
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 15, borderRadius: 8 },
  error: { color: "red", marginBottom: 10 },
  link: { color: "blue", marginTop: 15, textAlign: "center" },
});