import { useState } from "react";
import { View, Pressable, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Text, TextInput } from "@/components/Typography";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "@/api/errors";

export default function GuestScreen() {
  const router = useRouter();
  const joinAsGuest = useAuthStore((s) => s.joinAsGuest);
  const [username, setUsername] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (!username) return;
    setLoading(true);
    try {
      await joinAsGuest(username, sessionCode || undefined);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Couldn't join", getApiErrorMessage(err, "Check the session code and try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join as a guest</Text>
      <Text style={styles.subtitle}>No account needed — just for this session.</Text>

      <TextInput
        style={styles.input}
        placeholder="Display name"
        placeholderTextColor="#71717a"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Session code (optional)"
        placeholderTextColor="#71717a"
        autoCapitalize="characters"
        value={sessionCode}
        onChangeText={setSessionCode}
      />

      <Pressable style={styles.primaryButton} onPress={handleJoin} disabled={loading}>
        {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Continue</Text>}
      </Pressable>

      <Pressable style={styles.link} onPress={() => router.back()}>
        <Text style={styles.linkText}>Back to login</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#ffffff" },
  title: { fontSize: 26, fontWeight: "800", color: "#171717", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#71717a", textAlign: "center", marginTop: 8, marginBottom: 32 },
  input: { backgroundColor: "#f4f4f5", borderRadius: 12, padding: 16, color: "#171717", marginBottom: 12, fontSize: 16 },
  primaryButton: { backgroundColor: "#171717", borderRadius: 999, padding: 16, alignItems: "center", marginTop: 8 },
  primaryButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  link: { marginTop: 24, alignItems: "center" },
  linkText: { color: "#171717", fontWeight: "600" },
});
