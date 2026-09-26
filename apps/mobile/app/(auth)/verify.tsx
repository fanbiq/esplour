import { useState } from "react";
import { View, Pressable, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Text, TextInput } from "@/components/Typography";
import { useLocalSearchParams, useRouter } from "expo-router";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "@/api/errors";

export default function VerifyScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const setUser = useAuthStore((s) => s.setUser);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleVerify() {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const user = await authApi.verifyOtp(userId, otp);
      setUser(user);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Verification failed", getApiErrorMessage(err, "Check the code and try again."));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await authApi.resendVerification(userId);
      Alert.alert("Code sent", "Check your inbox for a fresh code.");
    } catch {
      Alert.alert("Couldn't resend", "Please try again in a moment.");
    } finally {
      setResending(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify your email</Text>
      <Text style={styles.subtitle}>Enter the 6-digit code we sent you.</Text>

      <TextInput
        style={styles.otpInput}
        placeholder="000000"
        placeholderTextColor="#71717a"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
      />

      <Pressable style={styles.primaryButton} onPress={handleVerify} disabled={loading}>
        {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Verify</Text>}
      </Pressable>

      <Pressable style={styles.link} onPress={handleResend} disabled={resending}>
        <Text style={styles.linkText}>{resending ? "Sending..." : "Resend code"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#ffffff" },
  title: { fontSize: 26, fontWeight: "800", color: "#171717", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#71717a", textAlign: "center", marginTop: 8, marginBottom: 32 },
  otpInput: {
    backgroundColor: "#f4f4f5",
    borderRadius: 12,
    padding: 16,
    color: "#171717",
    fontSize: 28,
    letterSpacing: 12,
    textAlign: "center",
    marginBottom: 20,
  },
  primaryButton: { backgroundColor: "#171717", borderRadius: 999, padding: 16, alignItems: "center" },
  primaryButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  link: { marginTop: 24, alignItems: "center" },
  linkText: { color: "#171717", fontWeight: "600" },
});
