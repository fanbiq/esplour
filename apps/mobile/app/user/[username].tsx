import { View, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Text } from "@/components/Typography";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi, followApi } from "@/api/profile";

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", username],
    queryFn: () => profileApi.getUserProfile(username),
  });

  const followMutation = useMutation({
    mutationFn: () => (profile?.isFollowing ? followApi.unfollow(username) : followApi.follow(username)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-profile", username] }),
  });

  if (isLoading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#171717" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarInitial}>{(profile.displayName || profile.username).charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.displayName}>{profile.displayName || profile.username}</Text>
      <Text style={styles.username}>@{profile.username}</Text>
      {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

      <Pressable style={styles.followButton} onPress={() => followMutation.mutate()} disabled={followMutation.isPending}>
        <Text style={styles.followButtonText}>{profile.isFollowing ? "Unfollow" : "Follow"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff", alignItems: "center", paddingTop: 32 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff" },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#f4f4f5", alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: "#171717", fontSize: 32, fontWeight: "800" },
  displayName: { color: "#171717", fontSize: 20, fontWeight: "800", marginTop: 12 },
  username: { color: "#71717a", fontSize: 14, marginTop: 2 },
  bio: { color: "#52525b", fontSize: 13, marginTop: 10, textAlign: "center", paddingHorizontal: 32 },
  followButton: { backgroundColor: "#171717", borderRadius: 999, paddingHorizontal: 32, paddingVertical: 12, marginTop: 20 },
  followButtonText: { color: "#ffffff", fontWeight: "700" },
});
