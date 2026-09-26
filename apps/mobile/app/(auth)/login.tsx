import { useState } from "react";
import { View, Pressable, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Text, TextInput } from "@/components/Typography";
import { Link, useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "@/api/errors";

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username || !password) return;
    setLoading(true);
    try {
      await login(username, password);
      router.replace("/(tabs)");
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.needsVerification) {
        router.push({ pathname: "/(auth)/verify", params: { userId: data.userId } });
        return;
      }
      Alert.alert("Login failed", getApiErrorMessage(err, "Check your credentials and try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>esplour</Text>
      <Text style={styles.subtitle}>Swipe on what to watch next.</Text>

      <TextInput
        style={styles.input}
        placeholder="Username or email"
        placeholderTextColor="#71717a"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#71717a"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Log in</Text>}
      </Pressable>

      <Link href="/(auth)/guest" style={styles.link}>
        <Text style={styles.linkText}>Continue as guest</Text>
      </Link>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <Link href="/(auth)/register">
          <Text style={styles.linkText}>Sign up</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#ffffff" },
  title: { fontSize: 40, fontWeight: "800", color: "#171717", textAlign: "center" },
  subtitle: { fontSize: 15, color: "#71717a", textAlign: "center", marginTop: 8, marginBottom: 40 },
  input: {
    backgroundColor: "#f4f4f5",
    borderRadius: 12,
    padding: 16,
    color: "#171717",
    marginBottom: 12,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: "#171717",
    borderRadius: 999,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  link: { marginTop: 20, alignItems: "center" },
  linkText: { color: "#171717", fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 28 },
  footerText: { color: "#71717a" },
});
