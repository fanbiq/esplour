import { useState } from "react";
import { View, Pressable, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Text, TextInput } from "@/components/Typography";
import { useRouter } from "expo-router";
import { authApi } from "@/api/auth";
import { getApiErrorMessage } from "@/api/errors";

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || !username || password.length < 8) {
      Alert.alert("Check your details", "Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const { userId } = await authApi.register(email, username, password);
      router.push({ pathname: "/(auth)/verify", params: { userId } });
    } catch (err: any) {
      Alert.alert("Registration failed", getApiErrorMessage(err, "Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create your account</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#71717a"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Username"
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

      <Pressable style={styles.primaryButton} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Sign up</Text>}
      </Pressable>

      <Pressable style={styles.link} onPress={() => router.back()}>
        <Text style={styles.linkText}>Already have an account? Log in</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#ffffff" },
  title: { fontSize: 26, fontWeight: "800", color: "#171717", textAlign: "center", marginBottom: 32 },
  input: { backgroundColor: "#f4f4f5", borderRadius: 12, padding: 16, color: "#171717", marginBottom: 12, fontSize: 16 },
  primaryButton: { backgroundColor: "#171717", borderRadius: 999, padding: 16, alignItems: "center", marginTop: 8 },
  primaryButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  link: { marginTop: 24, alignItems: "center" },
  linkText: { color: "#171717", fontWeight: "600" },
});
