import { useState } from "react";
import { View, Pressable, FlatList, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Text, TextInput } from "@/components/Typography";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionApi } from "@/api/session";
import { tokenStorage } from "@/api/tokenStorage";
import { MediaImage } from "@/components/MediaImage";
import type { MediaItem } from "@/types/media";
import { useMovieDetail } from "@/components/movie/MovieDetailProvider";
import { MovieListItem, type MovieListItemData } from "@/components/movie/MovieListItem";

export default function SessionScreen() {
  const queryClient = useQueryClient();
  const { openMovie } = useMovieDetail();
  const [joinCode, setJoinCode] = useState("");

  const { data: sessionCode } = useQuery({
    queryKey: ["active-session-code"],
    queryFn: () => tokenStorage.getSessionCode(),
  });

  const { data: members } = useQuery({
    queryKey: ["session-members", sessionCode],
    queryFn: () => sessionApi.getMembers(),
    enabled: !!sessionCode,
  });

  const { data: matches } = useQuery({
    queryKey: ["session-matches", sessionCode],
    queryFn: () => sessionApi.getMatches(),
    enabled: !!sessionCode,
  });

  const createMutation = useMutation({
    mutationFn: () => sessionApi.create(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["active-session-code"] }),
    onError: () => Alert.alert("Couldn't create a session", "Please try again."),
  });

  const joinMutation = useMutation({
    mutationFn: () => sessionApi.join(joinCode.trim().toUpperCase()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["active-session-code"] }),
    onError: (err: any) => Alert.alert("Couldn't join", err?.response?.data?.error ?? "Check the code and try again."),
  });

  const leaveMutation = useMutation({
    mutationFn: () => sessionApi.leave(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["active-session-code"] }),
  });

  if (!sessionCode) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={styles.title}>Watch together</Text>
        <Text style={styles.subtitle}>Create a session and share the code, or join one someone sent you.</Text>

        <Pressable style={styles.primaryButton} onPress={() => createMutation.mutate()} disabled={createMutation.isPending}>
          {createMutation.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Create a session</Text>}
        </Pressable>

        <View style={styles.divider}>
          <Text style={styles.dividerText}>or</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Enter session code"
          placeholderTextColor="#888"
          autoCapitalize="characters"
          value={joinCode}
          onChangeText={setJoinCode}
        />
        <Pressable
          style={[styles.secondaryButton, !joinCode && styles.disabledButton]}
          onPress={() => joinMutation.mutate()}
          disabled={!joinCode || joinMutation.isPending}
        >
          {joinMutation.isPending ? <ActivityIndicator color="#171717" /> : <Text style={styles.secondaryButtonText}>Join session</Text>}
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.codeHeader}>
        <View>
          <Text style={styles.subtitle}>Session code</Text>
          <Text style={styles.codeText}>{sessionCode}</Text>
        </View>
        <Pressable style={styles.leaveButton} onPress={() => leaveMutation.mutate()}>
          <Text style={styles.leaveButtonText}>Leave</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>Members ({members?.length ?? 0})</Text>
      <View style={styles.memberRow}>
        {members?.map((m) => (
          <View key={m.externalUserId} style={styles.memberChip}>
            <Text style={styles.memberChipText}>{m.externalUserName}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Matches</Text>
      <FlatList
        data={matches as MediaItem[] | undefined}
        keyExtractor={(item) => item.Id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No matches yet — everyone needs to like the same title.</Text>}
        renderItem={({ item }) => (
          <MovieListItem
            movie={{ ...item, isMatch: true, sessionCode } as MovieListItemData}
            variant="condensed"
            onPress={() => openMovie(item.Id, { sessionCode, mediaType: item.mediaType })}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff", paddingHorizontal: 20 },
  title: { color: "#171717", fontSize: 26, fontWeight: "800", marginTop: 16 },
  subtitle: { color: "#71717a", fontSize: 14, marginTop: 8 },
  primaryButton: { backgroundColor: "#171717", borderRadius: 999, padding: 16, alignItems: "center", marginTop: 28 },
  primaryButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  divider: { alignItems: "center", marginVertical: 20 },
  dividerText: { color: "#71717a" },
  input: { backgroundColor: "#f4f4f5", borderRadius: 12, padding: 16, color: "#171717", fontSize: 16, textAlign: "center", letterSpacing: 4 },
  secondaryButton: { backgroundColor: "#f4f4f5", borderRadius: 999, padding: 16, alignItems: "center", marginTop: 12 },
  secondaryButtonText: { color: "#171717", fontWeight: "700", fontSize: 16 },
  disabledButton: { opacity: 0.5 },
  codeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 24 },
  codeText: { color: "#171717", fontSize: 32, fontWeight: "900", letterSpacing: 6 },
  leaveButton: { backgroundColor: "#f4f4f5", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  leaveButtonText: { color: "#f87171", fontWeight: "700" },
  sectionLabel: { color: "#71717a", fontWeight: "700", fontSize: 13, textTransform: "uppercase", marginBottom: 10, marginTop: 8 },
  memberRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  memberChip: { backgroundColor: "#f4f4f5", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  memberChipText: { color: "#171717", fontSize: 13, fontWeight: "600" },
  matchPoster: { flex: 1, aspectRatio: 2 / 3, borderRadius: 8, backgroundColor: "#f4f4f5" },
  emptyText: { color: "#71717a", textAlign: "center", marginTop: 20 },
});
