import React from "react";
import { View, Text, StyleSheet } from "react-native";

const ChatEmptyState: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.text}>No messages yet.</Text>
    <Text style={styles.subtext}>Say hello to start the conversation!</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  text: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  subtext: { color: "#666" },
});

export default ChatEmptyState;
