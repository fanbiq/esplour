import { View, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Text } from "@/components/Typography";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Bell } from "lucide-react-native";
import { useRouter } from "expo-router";
import { profileApi, notificationsApi } from "@/api/profile";
import { useAuthStore } from "@/store/authStore";

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => profileApi.getMyProfile(),
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getAll(),
  });

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color="#171717" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{(profile?.displayName || user?.Name || "?").charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.displayName}>{profile?.displayName || user?.Name}</Text>
        <Text style={styles.username}>@{profile?.username || user?.Name}</Text>
        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
      </View>

      <View style={styles.menu}>
        <Pressable style={styles.menuItem}>
          <Bell color="#171717" size={20} />
          <Text style={styles.menuText}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </Pressable>

        <Pressable style={styles.menuItem} onPress={handleLogout}>
          <LogOut color="#f87171" size={20} />
          <Text style={[styles.menuText, { color: "#f87171" }]}>Log out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff" },
  header: { alignItems: "center", paddingTop: 24, paddingBottom: 32 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#f4f4f5", alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: "#171717", fontSize: 32, fontWeight: "800" },
  displayName: { color: "#171717", fontSize: 20, fontWeight: "800", marginTop: 12 },
  username: { color: "#71717a", fontSize: 14, marginTop: 2 },
  bio: { color: "#52525b", fontSize: 13, marginTop: 10, textAlign: "center", paddingHorizontal: 32 },
  menu: { paddingHorizontal: 20, gap: 4 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e4e4e7",
  },
  menuText: { color: "#171717", fontSize: 15, fontWeight: "600", flex: 1 },
  badge: { backgroundColor: "#f87171", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
});
