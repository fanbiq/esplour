import { useState } from "react";
import { View, FlatList, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Text, TextInput } from "@/components/Typography";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { SearchIcon } from "lucide-react-native";
import { searchApi } from "@/api/media";
import { useDebounce } from "@/hooks/useDebounce";

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 350);

  const { data: users, isFetching } = useQuery({
    queryKey: ["search-users", debouncedQuery],
    queryFn: () => searchApi.searchUsers(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.searchBar}>
        <SearchIcon color="#71717a" size={18} />
        <TextInput
          style={styles.input}
          placeholder="Search people..."
          placeholderTextColor="#71717a"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </View>

      {isFetching && <ActivityIndicator color="#171717" style={{ marginTop: 20 }} />}

      <FlatList
        data={users}
        keyExtractor={(item: any) => item.username ?? item.id}
        contentContainerStyle={{ paddingTop: 8 }}
        renderItem={({ item }: { item: any }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/user/${item.username}`)}>
            <Text style={styles.rowTitle}>{item.displayName || item.username}</Text>
            <Text style={styles.rowSubtitle}>@{item.username}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          debouncedQuery.length > 0 && !isFetching ? (
            <Text style={styles.emptyText}>No results for "{debouncedQuery}"</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff", paddingHorizontal: 16 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4f4f5",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginTop: 8,
    gap: 8,
  },
  input: { flex: 1, color: "#171717", paddingVertical: 12, fontSize: 15 },
  row: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e4e4e7" },
  rowTitle: { color: "#171717", fontSize: 15, fontWeight: "700" },
  rowSubtitle: { color: "#71717a", fontSize: 13, marginTop: 2 },
  emptyText: { color: "#71717a", textAlign: "center", marginTop: 40 },
});
